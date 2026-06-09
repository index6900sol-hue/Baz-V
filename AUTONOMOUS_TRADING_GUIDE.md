# 🚀 Autonomous Trading System - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Trading Strategy](#trading-strategy)
4. [Configuration](#configuration)
5. [Monitoring](#monitoring)
6. [Troubleshooting](#troubleshooting)

---

## Overview

### What is Autonomous Trading?

Your role: **Fund the account with USDT**  
System's role: **Autonomously trade to beat benchmarks**

The BAZ Autonomous Fund Manager is an AI-driven system that:
- Continuously scans crypto markets
- Identifies high-probability trading opportunities
- Executes trades based on AI analysis
- Monitors performance vs 6 global benchmarks
- Reports real-time results

### Target Benchmarks

The system aims to outperform:

| Benchmark | Type | Purpose |
|-----------|------|---------|
| **IHSG** | Indonesian Stock Index | Local equity market |
| **S&P 500** | US Large-Cap | Global equity market |
| **Gold (XAUUSD)** | Precious Metal | Safe haven asset |
| **Bitcoin** | Crypto King | Crypto market indicator |
| **Top 100 Crypto** | Weighted Index | Crypto market average |
| **USD/IDR** | Currency Pair | Inflation indicator |

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│            BAZ Autonomous Fund Manager                  │
└─────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌───▼───┐        ┌─────▼──────┐   ┌────▼────┐
    │Worker │        │ Dashboard  │   │API      │
    │(CLI)  │        │ (Web UI)   │   │Endpoints│
    └───┬───┘        └─────┬──────┘   └────┬────┘
        │                  │               │
        └──────────────────┼───────────────┘
                           │
                ┌──────────▼──────────┐
                │ fundManagerV2.js    │
                │ (Core Logic)        │
                └──────────┬──────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    ┌───▼────┐    ┌───────▼────┐    ┌──────▼──┐
    │Binance │    │ AI Engine  │    │Benchmark│
    │API     │    │(OpenClaw/  │    │Data     │
    │        │    │ OpenAI)    │    │(Yahoo/  │
    └────────┘    └────────────┘    │CoinGecko│
                                    └─────────┘
```

### Key Functions

#### `discoverTopCryptoAssets(limit = 50)`
- Scans Binance for USDT trading pairs
- Filters by liquidity (bid-ask spread)
- Returns top N assets by volume
- **Called every cycle** to ensure dynamic asset discovery

#### `selectOptimalAssets(marketStats, benchmarks, targetCount = 15)`
- Scores each asset against benchmark performance
- Filters only assets beating benchmarks
- Considers: momentum, volume, trend
- Returns conservative pre-screened opportunities

#### `generateBenchmarkCentricRecommendations(portfolio, selectedAssets, benchmarks, settings)`
- Analyzes each asset via AI
- Generates BUY/SELL/HOLD signals
- Rates conviction: High/Medium/Low
- Only executes HIGH/MEDIUM trades
- Calculates allocation percentages

#### `runAutonomousFundManager()`
- Orchestrates entire trading cycle
- Discovers → Screens → Analyzes → Executes → Records
- Runs every 60 minutes (configurable)

---

## Trading Strategy

### Conservative Risk Framework

```
Total Portfolio: $1,000
├─ Trading Allocation (30%): $300
│  ├─ Asset 1: $90 (MAX 30% per asset)
│  ├─ Asset 2: $60
│  ├─ Asset 3: $50
│  ├─ Asset 4: $40
│  └─ Asset 5: $60
│
└─ USDT Reserve (70%): $700
   └─ Available for new opportunities
```

### Decision Framework

For each discovered asset, AI evaluates:

**1. Benchmark Comparison (Required)**
- Does asset's 24h change beat average benchmark?
- Is momentum positive vs benchmarks?
- ✅ PASS: Asset shows promise
- ❌ FAIL: Skip this asset

**2. Technical Analysis**
- 24-hour price change percentage
- Trading volume (liquidity check)
- Bid-ask spread efficiency
- Market momentum indicators

**3. Risk Assessment**
- Volatility score
- Liquidity rating
- Correlation with existing holdings
- Max drawdown potential

**4. Conviction Rating**
- **HIGH:** Strong signals, good liquidity, clear trend
- **MEDIUM:** Moderate confidence, decent volume
- **LOW:** Speculative, skip execution

**5. Execution**
- Only buy if HIGH or MEDIUM conviction
- Allocate 1-30% of portfolio max
- Place market orders with slippage protection
- Log all trade details

### Trade Execution Rules

```javascript
if (conviction === 'HIGH' || conviction === 'MEDIUM') {
  
  // 1. Calculate allocation
  let allocation = recommendedAllocationPercent;
  allocation = Math.min(allocation, MAX_ALLOCATION_PER_ASSET);  // Cap at 30%
  
  // 2. Calculate buy amount
  const buyAmount = (portfolio.totalUsd * allocation) / 100;
  
  // 3. Check USDT reserve
  const usdtAvailable = portfolio.holdings['USDT'].value;
  const reserveNeeded = settings.minUsdtReserve;
  
  if (buyAmount >= 10 && (usdtAvailable - buyAmount) >= reserveNeeded) {
    // 4. Execute BUY
    await executeBuy(symbol, buyAmount);
  }
}
```

---

## Configuration

### Environment Variables

```bash
# .env.local

# === BINANCE (REQUIRED) ===
BINANCE_API_KEY=your_key_here
BINANCE_API_SECRET=your_secret_here

# === AI ENGINE ===
OPENAI_API_KEY=sk-xxx  # Optional: for GPT-4
OPENCLAW_CLI_PATH=npx  # Optional: for OpenClaw
ENGINE=openclaw        # Default AI engine

# === WORKER ===
WORKER_INTERVAL_MINUTES=60  # Trading frequency
```

### Settings File

Edit `data/settings.json`:

```json
{
  "allocationPercent": 30,           # % to allocate to risky assets
  "stablePercent": 70,               # % to keep in USDT
  "riskProfile": "conservative",     # Risk level
  "engine": "openclaw",              # AI engine: openclaw|openai
  "autoTrade": true,                 # Auto-execute trades
  "maxAllocationPerAsset": 30,       # Max % per asset
  "minUsdtReserve": 10,              # Min USDT to maintain
  "targetBenchmarks": [
    "IHSG", "S&P 500", "Gold", "Bitcoin", 
    "Top 100 Crypto", "USD"
  ],
  "refreshMinutes": 60,              # Update frequency
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

## Monitoring

### Dashboard Tabs

#### 1. Overview
- Current portfolio value
- Performance vs all benchmarks
- Current holdings with allocation %

#### 2. Performance
- Real-time benchmark prices
- 24h changes for all benchmarks
- Fund performance metrics
- Average trades per cycle

#### 3. History
- Last 50 trading cycles
- Trades executed per cycle
- AI engine used
- Cycle duration

#### 4. How It Works
- System explanation
- Getting started guide
- Risk management details

### API Monitoring

```bash
# Check status
curl http://localhost:3000/api/status | jq

# Trigger manual cycle
curl -X POST http://localhost:3000/api/trade | jq

# View history
curl http://localhost:3000/api/fund-manager?section=history | jq

# Get settings
curl http://localhost:3000/api/settings | jq
```

### Logs

```bash
# Dashboard logs (terminal 1)
npm run dev
# Watch for: Trading cycle start/end, trades executed

# Worker logs (terminal 2)
npm run worker 2>&1 | tee worker.log
# Watch for: Cycle completions, asset discovery, trades

# Historical data
cat data/fund_manager_history.json | jq '.[] | {
  timestamp, 
  stats: .stats,
  portfolio: .portfolio.totalUsd,
  trades: (.stats.tradesExecuted)
}'
```

---

## Troubleshooting

### Issue: Worker not trading

**Check 1: Environment Variables**
```bash
echo $BINANCE_API_KEY
echo $ENGINE
```

**Check 2: Binance API Keys**
- Log in to Binance
- Settings → API Management
- Verify key has trade permissions
- Check IP whitelist

**Check 3: USDT Balance**
```bash
# Curl Binance API directly
curl -X GET "https://api.binance.com/api/v3/account" \
  -H "X-MBX-APIKEY: YOUR_KEY" \
  -d "timestamp=UNIX_TIMESTAMP&signature=SIGNATURE"
```

**Check 4: Worker Logs**
```bash
npm run worker 2>&1 | grep -i error
```

### Issue: Dashboard shows no data

**Check 1: API endpoints**
```bash
curl http://localhost:3000/api/status
```

**Check 2: Data files**
```bash
ls -la data/
cat data/fund_manager_history.json | head
```

**Check 3: Browser console**
- Open DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

### Issue: Slow performance

**Solutions:**
1. Reduce `WORKER_INTERVAL_MINUTES` (more frequent = more load)
2. Reduce asset discovery limit in `discoverTopCryptoAssets()`
3. Check Binance API rate limits
4. Monitor system resources: `top`, `free`, `df`

### Issue: High USDT not being used

**Reasons:**
1. No assets beat benchmarks (market downturn)
2. Conviction level too low (AI uncertain)
3. All trades failing (API issues)
4. Reserve protection active

**Check:**
```bash
# View last cycle details
cat data/fund_manager_history.json | jq '.[0] | {
  assetsScreened: .stats.assetsScreened,
  tradesExecuted: .stats.tradesExecuted,
  aiRecommendation: .aiRecommendation.source,
  portfolio: .portfolio.holdings
}'
```

---

## Advanced Configuration

### Custom Risk Profiles

Edit allocation percentages:
```json
{
  "conservative": {
    "allocationPercent": 20,
    "stablePercent": 80,
    "maxAllocationPerAsset": 20
  },
  "balanced": {
    "allocationPercent": 50,
    "stablePercent": 50,
    "maxAllocationPerAsset": 30
  },
  "aggressive": {
    "allocationPercent": 80,
    "stablePercent": 20,
    "maxAllocationPerAsset": 40
  }
}
```

### Changing Update Frequency

```bash
# Every 30 minutes
WORKER_INTERVAL_MINUTES=30 npm run worker

# Every 4 hours
WORKER_INTERVAL_MINUTES=240 npm run worker

# Every day
WORKER_INTERVAL_MINUTES=1440 npm run worker
```

### Switching AI Engine

```bash
# Use OpenAI instead of OpenClaw
ENGINE=openai OPENAI_API_KEY=sk-xxx npm run worker

# Use OpenClaw
ENGINE=openclaw npm run worker
```

---

## Performance Tips

1. **Start Conservative** - Test with 30% allocation first
2. **Monitor Closely** - Check dashboard daily for first week
3. **Gradual Increase** - Increase allocation as confidence grows
4. **Adjust Benchmarks** - Focus on benchmarks matching your goals
5. **Regular Reviews** - Analyze performance weekly
6. **Take Profits** - Lock in gains when significantly ahead
7. **Rebalance** - Manual rebalance if major imbalances develop

---

## FAQ

**Q: Will AI always beat benchmarks?**  
A: No. Markets are unpredictable. AI makes smart decisions but market conditions can change suddenly.

**Q: How much should I start with?**  
A: Start small (e.g., $100-500) to test the system. Scale up only when comfortable.

**Q: Can I trade manually alongside AI?**  
A: Not recommended. Manual trades conflict with AI strategy. Keep account dedicated.

**Q: What if AI makes a bad trade?**  
A: All trades are logged. You can analyze and adjust strategy. High losses trigger review.

**Q: How often should I check?**  
A: Daily reviews are fine. The system handles execution autonomously hourly.

---

**Questions? Check the main [README.md](README.md) for more info.**
