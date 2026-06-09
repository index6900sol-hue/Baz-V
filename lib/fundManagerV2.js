/**
 * BAZ Fund Manager V2
 * Professional autonomous asset manager for beating benchmarks:
 * IHSG, S&P 500, Gold, Top 100 Crypto, Bitcoin, USD
 */

const fs = require('fs').promises;
const path = require('path');
const { getBinanceClient } = require('./binance');
const { getOpenAIClient } = require('./openai');
const { getOpenClawResponse } = require('./openclaw');

const dataRoot = path.join(process.cwd(), 'data');

// ============================================================================
// PORTFOLIO MANAGEMENT
// ============================================================================

async function readJSON(file, fallback = {}) {
  try {
    const raw = await fs.readFile(path.join(dataRoot, file), 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

async function writeJSON(file, data) {
  await fs.mkdir(dataRoot, { recursive: true });
  await fs.writeFile(path.join(dataRoot, file), JSON.stringify(data, null, 2), 'utf8');
}

async function getPortfolioState() {
  try {
    const binance = getBinanceClient();
    const account = await binance.accountInfo();
    
    const balances = account.balances
      .filter((item) => Number(item.free) + Number(item.locked) > 0)
      .map((item) => ({
        asset: item.asset,
        free: Number(item.free),
        locked: Number(item.locked),
        total: Number(item.free) + Number(item.locked),
      }));

    return { balances, account };
  } catch (error) {
    console.error('Error getting portfolio state:', error.message);
    return { balances: [], account: null };
  }
}

async function calculatePortfolioValue(balances, priceMap = {}) {
  let totalUsd = 0;
  const holdings = {};

  for (const balance of balances) {
    const symbol = balance.asset === 'USDT' ? 'USDT' : balance.asset + 'USDT';
    const price = priceMap[symbol] || (balance.asset === 'USDT' ? 1 : 0);
    const value = balance.total * price;
    
    if (value > 0) {
      totalUsd += value;
      holdings[symbol] = {
        asset: balance.asset,
        quantity: balance.total,
        price,
        value: Number(value.toFixed(2)),
        percentOfPortfolio: 0, // Will be calculated later
      };
    }
  }

  // Calculate percentages
  Object.values(holdings).forEach(h => {
    h.percentOfPortfolio = totalUsd > 0 ? Number((h.value / totalUsd * 100).toFixed(2)) : 0;
  });

  return {
    totalUsd: Number(totalUsd.toFixed(2)),
    holdings,
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// MARKET DATA FETCHING
// ============================================================================

async function fetchMarketData(symbols) {
  try {
    const binance = getBinanceClient();
    const prices = await binance.prices({ symbols });
    
    const results = {};
    for (const symbol of symbols) {
      results[symbol] = Number(prices[symbol] || 0);
    }
    return results;
  } catch (error) {
    console.error('Error fetching market data:', error.message);
    return {};
  }
}

async function fetch24HourStats(symbols) {
  try {
    const binance = getBinanceClient();
    const stats = await Promise.all(
      symbols.map(symbol => binance.dailyStats({ symbol }))
    );
    
    const result = {};
    stats.forEach((stat, idx) => {
      result[symbols[idx]] = {
        currentPrice: Number(stat.lastPrice),
        high24h: Number(stat.high),
        low24h: Number(stat.low),
        volume24h: Number(stat.volume),
        volumeUsd24h: Number(stat.quoteAssetVolume),
        priceChangePercent24h: Number(stat.priceChangePercent),
      };
    });
    return result;
  } catch (error) {
    console.error('Error fetching 24h stats:', error.message);
    return {};
  }
}

async function fetchYahooFinanceQuotes(symbols) {
  try {
    const endpoint = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
    const response = await fetch(endpoint);
    const data = await response.json();
    const result = {};

    (data.quoteResponse?.result || []).forEach((quote) => {
      result[quote.symbol] = {
        currentPrice: quote.regularMarketPrice || 0,
        change24h: quote.regularMarketChangePercent || 0,
        change7d: quote.priceChangePercent || 0,
        change1y: quote.fiftyTwoWeekChange || 0,
        currency: quote.currency || 'USD',
        name: quote.shortName || quote.longName || quote.symbol,
      };
    });

    return result;
  } catch (error) {
    console.error('Error fetching Yahoo Finance quotes:', error.message);
    return {};
  }
}

async function fetchCoingeckoTop100Index() {
  try {
    const url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h,7d,30d';
    const response = await fetch(url);
    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Invalid CoinGecko response');
    }

    let totalMarketCap = 0;
    let weightedChange24h = 0;
    let weightedChange7d = 0;
    let weightedChange30d = 0;

    data.forEach((item) => {
      const cap = item.market_cap || 0;
      totalMarketCap += cap;
      weightedChange24h += (item.price_change_percentage_24h_in_currency || 0) * cap;
      weightedChange7d += (item.price_change_percentage_7d_in_currency || 0) * cap;
      weightedChange30d += (item.price_change_percentage_30d_in_currency || 0) * cap;
    });

    return {
      currentPrice: Number((totalMarketCap / 1_000_000_000).toFixed(2)),
      marketCapUsd: Number(totalMarketCap.toFixed(2)),
      change24h: totalMarketCap > 0 ? Number((weightedChange24h / totalMarketCap).toFixed(2)) : 0,
      change7d: totalMarketCap > 0 ? Number((weightedChange7d / totalMarketCap).toFixed(2)) : 0,
      change30d: totalMarketCap > 0 ? Number((weightedChange30d / totalMarketCap).toFixed(2)) : 0,
      change1y: 0,
      name: 'Top 100 Crypto Index',
      symbol: 'TOP100',
    };
  } catch (error) {
    console.error('Error fetching CoinGecko top 100 index:', error.message);
    return {
      currentPrice: 0,
      marketCapUsd: 0,
      change24h: 0,
      change7d: 0,
      change30d: 0,
      change1y: 0,
      name: 'Top 100 Crypto Index',
      symbol: 'TOP100',
    };
  }
}

// ============================================================================
// BENCHMARK PERFORMANCE
// ============================================================================

async function fetchBenchmarkData() {
  const yahooSymbols = ['^JKSE', '^GSPC', 'GC=F', 'BTC-USD', 'IDR=X'];
  const yahooData = await fetchYahooFinanceQuotes(yahooSymbols);
  const top100Data = await fetchCoingeckoTop100Index();

  return {
    IHSG: {
      name: 'Indonesian Stock Index',
      symbol: '^JKSE',
      currentPrice: yahooData['^JKSE']?.currentPrice || 0,
      change24h: yahooData['^JKSE']?.change24h || 0,
      change7d: yahooData['^JKSE']?.change7d || 0,
      change30d: yahooData['^JKSE']?.change30d || 0,
      change1y: yahooData['^JKSE']?.change1y || 0,
    },
    'S&P500': {
      name: 'US Stock Index',
      symbol: '^GSPC',
      currentPrice: yahooData['^GSPC']?.currentPrice || 0,
      change24h: yahooData['^GSPC']?.change24h || 0,
      change7d: yahooData['^GSPC']?.change7d || 0,
      change30d: yahooData['^GSPC']?.change30d || 0,
      change1y: yahooData['^GSPC']?.change1y || 0,
    },
    GOLD: {
      name: 'Gold (XAUUSD)',
      symbol: 'GC=F',
      currentPrice: yahooData['GC=F']?.currentPrice || 0,
      change24h: yahooData['GC=F']?.change24h || 0,
      change7d: yahooData['GC=F']?.change7d || 0,
      change30d: yahooData['GC=F']?.change30d || 0,
      change1y: yahooData['GC=F']?.change1y || 0,
    },
    BTC: {
      name: 'Bitcoin',
      symbol: 'BTC-USD',
      currentPrice: yahooData['BTC-USD']?.currentPrice || 0,
      change24h: yahooData['BTC-USD']?.change24h || 0,
      change7d: yahooData['BTC-USD']?.change7d || 0,
      change30d: yahooData['BTC-USD']?.change30d || 0,
      change1y: yahooData['BTC-USD']?.change1y || 0,
    },
    TOP100CRYPTO: {
      name: top100Data.name,
      symbol: top100Data.symbol,
      currentPrice: top100Data.currentPrice,
      marketCapUsd: top100Data.marketCapUsd,
      change24h: top100Data.change24h,
      change7d: top100Data.change7d,
      change30d: top100Data.change30d,
      change1y: top100Data.change1y,
    },
    USD: {
      name: 'USD/IDR Parity',
      symbol: 'IDR=X',
      currentPrice: yahooData['IDR=X']?.currentPrice || 0,
      change24h: yahooData['IDR=X']?.change24h || 0,
      change7d: yahooData['IDR=X']?.change7d || 0,
      change30d: yahooData['IDR=X']?.change30d || 0,
      change1y: yahooData['IDR=X']?.change1y || 0,
    },
  };
}

async function getBaselinePortfolioValue() {
  const history = await readJSON('fund_manager_history.json', []);
  if (Array.isArray(history) && history.length > 0) {
    const baselineRecord = history[history.length - 1];
    return Number(baselineRecord?.portfolio?.totalUsd || 0);
  }
  return 0;
}

async function comparePerformance(portfolioValue, initialValue = 0) {
  const benchmarks = await fetchBenchmarkData();
  let baseline = initialValue;
  if (baseline <= 0) {
    baseline = await getBaselinePortfolioValue();
  }

  const portfolioReturn = baseline > 0
    ? ((portfolioValue - baseline) / baseline * 100).toFixed(2)
    : 0;

  return {
    portfolio: {
      value: portfolioValue,
      return: portfolioReturn,
      symbol: 'BAZ_FUND',
      baselineValue: baseline,
    },
    benchmarks,
    comparison: {
      vsIHSG: (Number(portfolioReturn) - benchmarks.IHSG.change24h).toFixed(2),
      vsSP500: (Number(portfolioReturn) - benchmarks['S&P500'].change24h).toFixed(2),
      vsGold: (Number(portfolioReturn) - benchmarks.GOLD.change24h).toFixed(2),
      vsBTC: (Number(portfolioReturn) - benchmarks.BTC.change24h).toFixed(2),
      vsTop100Crypto: (Number(portfolioReturn) - benchmarks.TOP100CRYPTO.change24h).toFixed(2),
      vsUSD: (Number(portfolioReturn) - benchmarks.USD.change24h).toFixed(2),
    },
    beatsAll: [
      Number(portfolioReturn) > benchmarks.IHSG.change24h,
      Number(portfolioReturn) > benchmarks['S&P500'].change24h,
      Number(portfolioReturn) > benchmarks.GOLD.change24h,
      Number(portfolioReturn) > benchmarks.BTC.change24h,
      Number(portfolioReturn) > benchmarks.TOP100CRYPTO.change24h,
      Number(portfolioReturn) > benchmarks.USD.change24h,
    ].every(b => b),
  };
}

// ============================================================================
// DYNAMIC ASSET DISCOVERY (TOP CRYPTO COINS)
// ============================================================================

async function discoverTopCryptoAssets(limit = 50) {
  /**
   * Dynamically fetch top crypto assets from Binance by volume
   * Returns symbols of most tradeable pairs
   */
  try {
    const binance = getBinanceClient();
    const tickers = await binance.allBookTickers();
    
    // Filter USDT pairs only, sort by volume
    const usdtPairs = tickers
      .filter(t => t.symbol && t.symbol.endsWith('USDT'))
      .filter(t => Number(t.bidQty) > 0 && Number(t.askQty) > 0)  // Has liquidity
      .sort((a, b) => Number(b.quoteAssetVolume || 0) - Number(a.quoteAssetVolume || 0))
      .slice(0, limit);
    
    return usdtPairs.map(p => p.symbol);
  } catch (error) {
    console.error('Error discovering top assets:', error.message);
    // Fallback to default watchlist
    return ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'XRPUSDT', 'DOGEUSDT', 'AVAXUSDT', 'MATICUSDT', 'LINKUSDT'];
  }
}

// ============================================================================
// DYNAMIC ASSET SELECTION
// ============================================================================

async function selectOptimalAssets(marketStats, benchmarks, targetCount = 15) {
  /**
   * Select assets that beat or likely beat benchmarks
   * Conservative: Only pick high-conviction opportunities
   */

  const symbols = Object.keys(marketStats).filter(s => s.endsWith('USDT'));
  
  // Get benchmark baseline
  const benchmarkAverage = (
    (benchmarks.IHSG?.change24h || 0) +
    (benchmarks['S&P500']?.change24h || 0) +
    (benchmarks.GOLD?.change24h || 0) +
    (benchmarks.BTC?.change24h || 0) +
    (benchmarks.TOP100CRYPTO?.change24h || 0)
  ) / 5;

  const scored = symbols.map(symbol => {
    const stat = marketStats[symbol];
    const change24h = stat.priceChangePercent24h || 0;
    const volume = stat.volumeUsd24h || 1;
    
    // Score factors
    const beatsBenchmark = change24h > benchmarkAverage ? 20 : 0;
    const momentumScore = Math.max(0, change24h) * 0.5;
    const liquidityScore = Math.log(volume / 1_000_000) * 3;  // Log-normalized liquidity
    
    const totalScore = beatsBenchmark + momentumScore + liquidityScore;

    return { 
      symbol, 
      score: totalScore,
      change24h,
      volume,
      beatsBenchmark: change24h > benchmarkAverage,
      ...stat 
    };
  });

  const sorted = scored.sort((a, b) => b.score - a.score);
  return sorted.slice(0, Math.min(targetCount, sorted.length));
}

// ============================================================================
// FUND MANAGER AI STRATEGY (BENCHMARK-CENTRIC)
// ============================================================================

function buildBenchmarkCentricPrompt(portfolio, selectedAssets, benchmarks, settings) {
  /**
   * AI prompt focused on beating benchmarks
   * Conservative: Only recommend BUY if high conviction
   */
  
  const holdingsText = Object.entries(portfolio.holdings)
    .map(([sym, h]) => `${sym}: ${h.quantity} units @ $${h.price} = $${h.value} (${h.percentOfPortfolio}%)`)
    .join('\n') || 'USDT only (fresh funding)';

  const opportunitiesText = selectedAssets
    .slice(0, 20)
    .map(asset => `${asset.symbol}: $${asset.currentPrice} (24h: ${asset.change24h.toFixed(2)}%, Vol: $${(asset.volumeUsd24h / 1e6).toFixed(1)}M, Beats Benchmark: ${asset.beatsBenchmark ? 'YES' : 'NO'})`)
    .join('\n');

  const benchmarkText = Object.entries(benchmarks)
    .map(([key, b]) => `${b.name}: 24h ${b.change24h}%, 7d ${b.change7d}%`)
    .join('\n');

  return `You are BAZ FUND MANAGER - AI asset selector for beating institutional benchmarks.

🎯 MANDATE: BEAT these benchmarks
${benchmarkText}

💰 CURRENT PORTFOLIO (Total: $${portfolio.totalUsd}):
${holdingsText}

📊 ALLOCATION CONSTRAINTS:
- MAX 30% in trading assets (Conservative)
- MIN 70% held as USDT (Dry powder)
- Risk Profile: ${settings.riskProfile}

🔝 TOP OPPORTUNITIES (Pre-screened for benchmark potential):
${opportunitiesText}

⚠️ DECISION RULES:
1. ONLY recommend BUY if conviction it BEATS benchmarks
2. Sell if underperforming benchmarks
3. Keep majority in USDT for emerging opportunities
4. Diversify to reduce risk while beating benchmarks

📋 RETURN JSON with HIGH CONFIDENCE recommendations:
{
  "SYMBOL": {
    "action": "BUY" | "SELL" | "HOLD",
    "reason": "Specific reason why this beats IHSG/S&P500/BTC/Gold/Top100Crypto",
    "conviction": "High" | "Medium" | "Low",
    "allocation_percent": 1-30,
    "expected_return_vs_benchmark": "positive number or null",
    "timeline": "hours" | "days" | "weeks"
  }
}

⚡ CRITICAL: Only BUY with HIGH conviction. Conservative beats reckless.`;
}

async function generateBenchmarkCentricRecommendations(portfolio, selectedAssets, benchmarks, settings) {
  const prompt = buildBenchmarkCentricPrompt(portfolio, selectedAssets, benchmarks, settings);

  let recommendation = null;
  let source = 'fund-manager-internal';
  let rawResponse = '';

  const useOpenClaw = settings.engine === 'openclaw' && process.env.USE_OPENCLAW !== 'false';
  const useOpenAI = settings.engine === 'openai' && process.env.OPENAI_API_KEY;

  // Try OpenClaw first
  if (useOpenClaw) {
    try {
      const response = await getOpenClawResponse(prompt);
      recommendation = response;
      source = 'openclaw';
      rawResponse = JSON.stringify(response);
    } catch (error) {
      console.error('OpenClaw failed:', error.message);
    }
  }

  // Fallback to OpenAI
  if (!recommendation && useOpenAI) {
    try {
      const openai = getOpenAIClient();
      const response = await openai.messages.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.5,  // Lower temperature for conservative decisions
      });
      rawResponse = response.content[0]?.text || '';
      
      // Try to extract JSON from response
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendation = JSON.parse(jsonMatch[0]);
      }
      source = 'openai';
    } catch (error) {
      console.error('OpenAI failed:', error.message);
    }
  }

  // Fallback to internal conservative logic
  if (!recommendation) {
    recommendation = buildConservativeRecommendation(portfolio, selectedAssets, benchmarks, settings);
    source = 'fund-manager-internal';
    rawResponse = JSON.stringify(recommendation);
  }

  return {
    recommendation,
    source,
    rawResponse,
    timestamp: new Date().toISOString(),
  };
}

function buildConservativeRecommendation(portfolio, selectedAssets, benchmarks, settings) {
  /**
   * Conservative internal logic: Only buy what likely beats benchmarks
   */
  const recommendation = {};

  // Get benchmark average
  const benchmarkAvg = (
    (benchmarks.IHSG?.change24h || 0) +
    (benchmarks['S&P500']?.change24h || 0) +
    (benchmarks.GOLD?.change24h || 0) +
    (benchmarks.BTC?.change24h || 0)
  ) / 4;

  // Only pick top performers that beat benchmarks
  const strongCandidates = selectedAssets
    .filter(a => a.change24h > benchmarkAvg && a.beatsBenchmark)
    .slice(0, 5);

  strongCandidates.forEach((asset, idx) => {
    // Conservative allocation: lower per-asset percentage
    const allocation = 5 + (idx * 2);  // 5%, 7%, 9%, 11%, 13%

    recommendation[asset.symbol] = {
      action: 'BUY',
      reason: `Strong momentum (${asset.change24h.toFixed(2)}%) beating benchmark avg (${benchmarkAvg.toFixed(2)}%) with high liquidity`,
      conviction: idx < 2 ? 'High' : 'Medium',
      allocation_percent: allocation,
      expected_return_vs_benchmark: (asset.change24h - benchmarkAvg).toFixed(2),
      timeline: 'hours',
    };
  });

  return recommendation;
}


// ============================================================================
// TRADE EXECUTION
// ============================================================================

async function executeBuy(symbol, usdtAmount, maxSlippage = 1) {
  try {
    const binance = getBinanceClient();
    
    // Get current price
    const ticker = await binance.prices({ symbols: [symbol] });
    const price = Number(ticker[symbol]);
    
    if (!price || price <= 0) {
      throw new Error(`Invalid price for ${symbol}: ${price}`);
    }

    // Calculate quantity with slippage protection
    const quantityBefore = usdtAmount / price;
    const slippageAdjusted = quantityBefore * (1 - maxSlippage / 100);
    const quantity = Math.max(0.001, parseFloat(slippageAdjusted.toFixed(4)));

    console.log(`[BUY] ${symbol} - ${quantity} units @ $${price} = $${(quantity * price).toFixed(2)}`);

    // Place order
    const order = await binance.order({
      symbol,
      side: 'BUY',
      type: 'MARKET',
      quantity: quantity.toString(),
    });

    return {
      success: true,
      orderId: order.orderId,
      symbol,
      side: 'BUY',
      quantity,
      price,
      totalUsd: quantity * price,
      timestamp: new Date().toISOString(),
      raw: order,
    };
  } catch (error) {
    console.error(`[BUY ERROR] ${symbol}:`, error.message);
    return {
      success: false,
      symbol,
      side: 'BUY',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

async function executeSell(symbol, quantity, maxSlippage = 1) {
  try {
    const binance = getBinanceClient();
    
    const order = await binance.order({
      symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity: quantity.toString(),
    });

    console.log(`[SELL] ${symbol} - ${quantity} units`);

    return {
      success: true,
      orderId: order.orderId,
      symbol,
      side: 'SELL',
      quantity,
      timestamp: new Date().toISOString(),
      raw: order,
    };
  } catch (error) {
    console.error(`[SELL ERROR] ${symbol}:`, error.message);
    return {
      success: false,
      symbol,
      side: 'SELL',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// MAIN AUTONOMOUS FUND MANAGER LOOP
// ============================================================================

async function runAutonomousFundManager() {
  const startTime = new Date();
  console.log('\n========================================');
  console.log('🤖 BAZ AUTONOMOUS FUND MANAGER');
  console.log('Trading Cycle Start');
  console.log('========================================');

  try {
    // 1. Get current portfolio state
    const { balances } = await getPortfolioState();
    
    // 2. DYNAMIC: Discover top crypto assets (not fixed watchlist)
    console.log('\n🔍 Discovering top crypto assets...');
    const discoveredAssets = await discoverTopCryptoAssets(50);
    console.log(`   Found ${discoveredAssets.length} tradeable pairs`);

    // 3. Fetch market data for discovered assets
    console.log('\n📊 Fetching market data for all assets...');
    const marketStats = await fetch24HourStats(discoveredAssets);
    const prices = await fetchMarketData(discoveredAssets);
    
    // 4. Calculate portfolio value
    const portfolio = await calculatePortfolioValue(balances, prices);
    console.log(`\n💰 Portfolio Value: $${portfolio.totalUsd} USD`);
    console.log(`   Holdings: ${Object.keys(portfolio.holdings).length} assets`);
    console.log(`   USDT Available: $${portfolio.holdings['USDT']?.value || portfolio.totalUsd} (Dry Powder for Trading)`);

    // 5. Fetch benchmark performance
    const benchmarks = await fetchBenchmarkData();
    const performance = await comparePerformance(portfolio.totalUsd);
    
    console.log('\n📈 Performance vs Benchmarks:');
    console.log(`   vs IHSG: ${performance.comparison.vsIHSG}%`);
    console.log(`   vs S&P500: ${performance.comparison.vsSP500}%`);
    console.log(`   vs Gold: ${performance.comparison.vsGold}%`);
    console.log(`   vs Bitcoin: ${performance.comparison.vsBTC}%`);
    console.log(`   vs Top100Crypto: ${performance.comparison.vsTop100Crypto}%`);
    console.log(`   vs USD: ${performance.comparison.vsUSD}%`);

    // 6. Get AI settings
    const settings = await readJSON('settings.json', {
      allocationPercent: 30,
      stablePercent: 70,
      riskProfile: 'conservative',
      engine: process.env.ENGINE || 'openclaw',
      autoTrade: true,
      maxAllocationPerAsset: 30,
      minUsdtReserve: 10,
    });

    // 7. Pre-select optimal assets that beat benchmarks
    console.log('\n🎯 Screening assets for benchmark performance...');
    const optimalAssets = await selectOptimalAssets(marketStats, benchmarks, 20);
    console.log(`   Selected ${optimalAssets.length} assets beating benchmarks`);

    // 8. AI decides: Generate autonomous trading recommendations
    console.log('\n🧠 AI Analyzing for autonomous trading...');
    const rec = await generateBenchmarkCentricRecommendations(portfolio, optimalAssets, benchmarks, settings);
    console.log(`   AI Engine: ${rec.source}`);

    // 9. Execute trades autonomously
    console.log('\n🚀 Executing AI-decided trades...');
    const trades = [];
    let totalBuyAmount = 0;
    let totalSellAmount = 0;
    
    if (rec.recommendation && typeof rec.recommendation === 'object') {
      for (const [symbol, recDetail] of Object.entries(rec.recommendation)) {
        if (!recDetail || typeof recDetail !== 'object') continue;

        const action = String(recDetail.action || '').toUpperCase();
        const conviction = String(recDetail.conviction || 'Low').toUpperCase();
        
        // Only execute HIGH and MEDIUM conviction trades (not speculative)
        if (!['HIGH', 'MEDIUM'].includes(conviction)) {
          console.log(`   ⏭️  ${symbol}: Skipped (Low conviction)`);
          continue;
        }

        if (action === 'BUY') {
          // Conservative: Cap max allocation per asset
          let allocationPercent = recDetail.allocation_percent || 5;
          allocationPercent = Math.min(allocationPercent, settings.maxAllocationPerAsset || 30);
          
          const buyAmount = (portfolio.totalUsd * allocationPercent) / 100;
          const usdtAvailable = portfolio.holdings['USDT']?.value || 0;
          const reserveNeeded = settings.minUsdtReserve || 10;
          
          // Only buy if we have USDT after reserve
          if (buyAmount >= 10 && (usdtAvailable - buyAmount) >= reserveNeeded) {
            console.log(`   📈 BUY: ${symbol} - $${buyAmount.toFixed(2)} (${conviction} conviction)`);
            const result = await executeBuy(symbol, buyAmount);
            trades.push(result);
            if (result.success) totalBuyAmount += result.totalUsd;
          } else {
            console.log(`   ⚠️  ${symbol}: Insufficient USDT (need $${buyAmount}, have $${usdtAvailable})`);
          }
        } 
        else if (action === 'SELL') {
          // Sell existing position if held
          const holding = portfolio.holdings[symbol];
          if (holding && holding.quantity > 0) {
            console.log(`   📉 SELL: ${symbol} - ${holding.quantity} units (${conviction} conviction)`);
            const result = await executeSell(symbol, holding.quantity);
            trades.push(result);
            if (result.success) totalSellAmount += result.totalUsd || (holding.quantity * holding.price);
          }
        }
        // HOLD: No action needed
      }
    }

    const successful = trades.filter(t => t.success).length;
    console.log(`\n✅ Trades executed: ${successful}/${trades.length}`);
    console.log(`   Total bought: $${totalBuyAmount.toFixed(2)}`);
    console.log(`   Total sold: $${totalSellAmount.toFixed(2)}`);

    // 10. Record this autonomous trading cycle
    const cycleRecord = {
      timestamp: new Date().toISOString(),
      duration: new Date() - startTime,
      cycleType: 'autonomous-trading',
      portfolio,
      performance,
      aiRecommendation: rec,
      trades,
      stats: {
        tradesExecuted: successful,
        totalTrades: trades.length,
        totalBought: totalBuyAmount,
        totalSold: totalSellAmount,
        assetsDiscovered: discoveredAssets.length,
        assetsScreened: optimalAssets.length,
      },
    };

    // Save to history
    const history = await readJSON('fund_manager_history.json', []);
    history.unshift(cycleRecord);
    await writeJSON('fund_manager_history.json', history.slice(0, 500));

    // Update latest portfolio snapshot
    const latestPortfolio = await readJSON('latest_portfolio.json', {});
    await writeJSON('latest_portfolio.json', {
      ...cycleRecord,
      lastUpdate: new Date().toISOString(),
    });

    console.log('\n✅ Autonomous trading cycle completed');
    return cycleRecord;

  } catch (error) {
    console.error('\n❌ Autonomous trading cycle failed:', error.message);
    throw error;
  }
}

module.exports = {
  runAutonomousFundManager,
  discoverTopCryptoAssets,
  getPortfolioState,
  calculatePortfolioValue,
  fetchMarketData,
  fetch24HourStats,
  fetchBenchmarkData,
  comparePerformance,
  generateBenchmarkCentricRecommendations,
  selectOptimalAssets,
  executeBuy,
  executeSell,
  readJSON,
  writeJSON,
};
