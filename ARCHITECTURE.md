# 🏗️ System Architecture & API Reference

Technical documentation for developers and advanced users.

---

## System Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────┐
│                  WORKER (CLI)                           │
│              tradingWorker.js                           │
│         (Runs every 60 minutes)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│            CORE FUND MANAGER                            │
│           fundManagerV2.js                              │
│                                                         │
│  ├─ runAutonomousFundManager()                         │
│  ├─ discoverTopCryptoAssets()                          │
│  ├─ selectOptimalAssets()                             │
│  ├─ generateBenchmarkCentricRecommendations()         │
│  ├─ executeBuy()                                       │
│  ├─ executeSell()                                      │
│  └─ comparePerformance()                              │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐ ┌──────────┐ ┌─────────────┐
   │ Binance │ │AI Engine │ │  Benchmarks │
   │   API   │ │(OpenClaw/│ │(Yahoo/      │
   │         │ │ OpenAI)  │ │ CoinGecko)  │
   └─────────┘ └──────────┘ └─────────────┘
```

### Trading Cycle (60 minutes)

```
START
 │
 ├─ [1] Discover Assets (50 top crypto)
 │   └─ Binance: allBookTickers() → filter → sort by volume
 │
 ├─ [2] Fetch Market Data
 │   └─ Binance: prices(), dailyStats(), 24h data
 │
 ├─ [3] Get Portfolio
 │   ├─ Binance: accountInfo()
 │   └─ Calculate holdings + value
 │
 ├─ [4] Fetch Benchmarks
 │   ├─ Yahoo Finance: IHSG, S&P500, Gold, BTC, USD/IDR
 │   └─ CoinGecko: Top 100 Crypto Index
 │
 ├─ [5] Screen Assets (filter by benchmark beat)
 │   └─ Keep only assets outperforming benchmarks
 │
 ├─ [6] AI Analysis
 │   ├─ OpenClaw/OpenAI: Generate recommendations
 │   └─ Get: BUY/SELL/HOLD, conviction, allocation %
 │
 ├─ [7] Execute Trades
 │   ├─ Loop through recommendations
 │   ├─ HIGH/MEDIUM conviction only
 │   ├─ Binance: place BUY/SELL orders
 │   └─ Log results
 │
 ├─ [8] Record & Store
 │   ├─ Save to fund_manager_history.json
 │   ├─ Update latest_portfolio.json
 │   └─ Calculate performance metrics
 │
 └─ END (wait 60 min, repeat)
```

---

## Core Functions

### `runAutonomousFundManager()`

**Location:** `lib/fundManagerV2.js`

**Purpose:** Main orchestration function for entire trading cycle

**Signature:**
```javascript
async function runAutonomousFundManager() {
  // Returns: cycleRecord with all cycle data
}
```

**Flow:**
1. Discover top 50 crypto assets
2. Fetch 24h market stats
3. Get portfolio value
4. Fetch benchmark data
5. Screen optimal assets
6. Generate AI recommendations
7. Execute trades
8. Record cycle data

**Returns:**
```javascript
{
  timestamp: "2024-01-15T10:30:00.000Z",
  duration: 2500,  // milliseconds
  portfolio: {
    totalUsd: 1000,
    holdings: { BTC: {...}, ETH: {...}, USDT: {...} }
  },
  performance: {
    comparison: {
      vsIHSG: 5.2,
      vsSP500: 2.1,
      // ...
    }
  },
  stats: {
    assetsDiscovered: 50,
    assetsScreened: 15,
    tradesExecuted: 3,
    totalBought: 150.00,
    totalSold: 50.00
  }
}
```

### `discoverTopCryptoAssets(limit = 50)`

**Purpose:** Dynamically find top crypto trading pairs

**Implementation:**
```javascript
async function discoverTopCryptoAssets(limit = 50) {
  // 1. Fetch all trading pairs from Binance
  const tickers = await binance.allBookTickers();
  
  // 2. Filter USDT pairs only
  // 3. Filter by liquidity (bid/ask available)
  // 4. Sort by volume (descending)
  // 5. Return top N
  
  return ['BTCUSDT', 'ETHUSDT', ...];
}
```

**Returns:**
```javascript
[
  'BTCUSDT',   // Bitcoin
  'ETHUSDT',   // Ethereum
  'BNBUSDT',   // Binance Coin
  // ... up to limit
]
```

### `selectOptimalAssets(marketStats, benchmarks, targetCount = 15)`

**Purpose:** Screen assets that beat benchmarks

**Algorithm:**
```javascript
// For each asset, calculate score:
// score = beatsBenchmark(+20) + momentum(%) + liquidity(log)

// Keep only HIGH-scoring assets
// Return top 15 by score
```

**Returns:**
```javascript
[
  {
    symbol: 'ETHUSDT',
    change24h: 5.2,
    volume: 1000000,
    beatsBenchmark: true,
    score: 45.3
  },
  // ...
]
```

### `generateBenchmarkCentricRecommendations(portfolio, selectedAssets, benchmarks, settings)`

**Purpose:** AI-powered trading recommendations

**AI Prompt Template:**
```
You are BAZ Fund Manager - autonomous asset selector.

MANDATE: Beat these benchmarks
- IHSG: 1.2% (24h)
- S&P500: 0.8% (24h)
- Gold: -0.3% (24h)
- Bitcoin: 2.1% (24h)
- Top100Crypto: 1.9% (24h)
- USD: 0.1% (24h)

CURRENT PORTFOLIO: $1000 (30% trading, 70% USDT)
- USDT: $700
- BTC: $200
- ETH: $100

TOP OPPORTUNITIES:
- ETHUSDT: $1800 (24h: +5%, Vol: $2B)
- SOLUSDT: $180 (24h: +3%, Vol: $500M)
- ADAUSDT: $0.75 (24h: +2%, Vol: $400M)

RETURN JSON:
{
  "SYMBOL": {
    "action": "BUY" | "SELL" | "HOLD",
    "conviction": "High" | "Medium" | "Low",
    "allocation_percent": 1-30,
    "reason": "Why this beats benchmarks"
  }
}
```

**Returns:**
```javascript
{
  recommendation: {
    "ETHUSDT": {
      action: "BUY",
      conviction: "High",
      allocation_percent: 15,
      reason: "Strong uptrend beating benchmarks"
    },
    "SOLUSDT": {
      action: "HOLD",
      conviction: "Medium",
      allocation_percent: 0,
      reason: "Good performance but lower conviction"
    }
  },
  source: "openclaw",  // or "openai"
  timestamp: "2024-01-15T10:30:00Z"
}
```

### `executeBuy(symbol, usdtAmount, maxSlippage = 1)`

**Purpose:** Place BUY order on Binance

**Implementation:**
```javascript
async function executeBuy(symbol, usdtAmount, maxSlippage = 1) {
  // 1. Get current price
  const price = await binance.price(symbol);
  
  // 2. Calculate quantity with slippage protection
  const quantity = (usdtAmount / price) * (1 - maxSlippage/100);
  
  // 3. Place market order
  const order = await binance.order({
    symbol,
    side: 'BUY',
    type: 'MARKET',
    quantity
  });
  
  return { success: true, orderId, quantity, price, ... };
}
```

**Returns:**
```javascript
{
  success: true,
  orderId: 123456789,
  symbol: 'ETHUSDT',
  side: 'BUY',
  quantity: 0.5,
  price: 2000,
  totalUsd: 1000,
  timestamp: "2024-01-15T10:30:00Z"
}
```

### `executeSell(symbol, quantity, maxSlippage = 1)`

**Purpose:** Place SELL order on Binance

**Similar to executeBuy, but:**
```javascript
// SELL side instead of BUY
// Takes quantity instead of USDT amount
```

### `comparePerformance(portfolioValue, initialValue = 0)`

**Purpose:** Calculate performance vs benchmarks

**Returns:**
```javascript
{
  portfolio: {
    value: 1050,
    return: 5.0,  // % return
    baselineValue: 1000
  },
  benchmarks: {
    IHSG: { change24h: 1.2, change7d: 2.1, ... },
    "S&P500": { change24h: 0.8, ... },
    // ...
  },
  comparison: {
    vsIHSG: 3.8,        // 5.0% - 1.2% = 3.8%
    vsSP500: 4.2,
    vsGold: 5.3,
    vsBTC: 2.9,
    vsTop100Crypto: 3.1,
    vsUSD: 4.9
  },
  beatsAll: false  // true only if beats ALL 6 benchmarks
}
```

---

## API Endpoints

### GET `/api/status`

Get current portfolio and performance

**Response:**
```javascript
{
  success: true,
  portfolio: {
    totalUsd: 1050,
    holdings: {
      USDT: { quantity: 700, price: 1, value: 700, ... },
      ETHUSDT: { quantity: 0.5, price: 2000, value: 1000, ... }
    }
  },
  performance: {
    comparison: { vsIHSG: 3.8, vsSP500: 4.2, ... },
    beatsAll: false
  },
  benchmarks: { IHSG: {...}, ... }
}
```

### POST `/api/trade`

Manually trigger trading cycle

**Request:**
```bash
curl -X POST http://localhost:3000/api/trade
```

**Response:**
```javascript
{
  success: true,
  cycle: {
    timestamp: "2024-01-15T10:30:00Z",
    stats: { tradesExecuted: 2, totalBought: 150, ... },
    trades: [ ... ]
  }
}
```

### GET `/api/fund-manager?section=history`

Get trading cycle history

**Response:**
```javascript
{
  success: true,
  latest: [
    {
      timestamp: "2024-01-15T10:30:00Z",
      stats: { tradesExecuted: 2, ... },
      trades: [ ... ]
    },
    // ... up to 50 cycles
  ]
}
```

### GET `/api/settings`

Get current configuration

**Response:**
```javascript
{
  allocationPercent: 30,
  stablePercent: 70,
  riskProfile: "conservative",
  engine: "openclaw",
  maxAllocationPerAsset: 30,
  minUsdtReserve: 10
}
```

### POST `/api/settings`

Update configuration (future enhancement)

---

## Data Structures

### Portfolio Object
```javascript
{
  totalUsd: 1000,
  holdings: {
    "USDT": {
      asset: "USDT",
      quantity: 700,
      price: 1.0,
      value: 700,
      percentOfPortfolio: 70
    },
    "ETHUSDT": {
      asset: "ETH",
      quantity: 0.5,
      price: 2000,
      value: 1000,
      percentOfPortfolio: 50
    }
  },
  lastUpdated: "2024-01-15T10:30:00Z"
}
```

### Trade Object
```javascript
{
  success: true,
  orderId: 123456789,
  symbol: "ETHUSDT",
  side: "BUY",
  quantity: 0.5,
  price: 2000,
  totalUsd: 1000,
  timestamp: "2024-01-15T10:30:00Z"
}
```

### Benchmark Object
```javascript
{
  name: "Indonesian Stock Index",
  symbol: "^JKSE",
  currentPrice: 7500,
  change24h: 1.2,
  change7d: 3.5,
  change30d: 5.2,
  change1y: 15.3
}
```

---

## Error Handling

### Common Errors

**Binance API Error:**
```
Error: Insufficient Balance
```
Solutions:
- Fund account with USDT
- Reduce allocation percentage
- Wait for previous trades to settle

**AI Engine Error:**
```
Error: OpenClaw not found
```
Solutions:
- Install: `npm install -g openclaw`
- Or set `ENGINE=openai` with OPENAI_API_KEY

**Network Error:**
```
Error: Cannot reach Binance API
```
Solutions:
- Check internet connection
- Verify firewall/proxy settings
- Check Binance status

---

## Performance Optimization

### Reduce API Calls
```javascript
// Bad: Multiple price fetches
for (let i = 0; i < 50; i++) {
  const price = await binance.price(symbols[i]);  // 50 calls!
}

// Good: Batch fetch
const prices = await binance.prices({ symbols });  // 1 call!
```

### Parallel Requests
```javascript
// Bad: Sequential
const stats1 = await binance.dailyStats('BTCUSDT');
const stats2 = await binance.dailyStats('ETHUSDT');

// Good: Parallel
const [stats1, stats2] = await Promise.all([
  binance.dailyStats('BTCUSDT'),
  binance.dailyStats('ETHUSDT')
]);
```

---

## Testing

### Manual Test

```bash
# Trigger one cycle
curl -X POST http://localhost:3000/api/trade

# Check results
curl http://localhost:3000/api/status | jq
```

### Simulate Trading

```bash
# Fund account, then:
npm run dev     # Terminal 1
npm run worker  # Terminal 2

# Monitor for 1 hour
# Check History tab for trades
```

---

## Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .

RUN npm install && npm run build

CMD ["npm", "start"]
```

### Environment Variables (Production)

```bash
# .env.production
BINANCE_API_KEY=xxx
BINANCE_API_SECRET=xxx
OPENAI_API_KEY=xxx
ENGINE=openclaw
WORKER_INTERVAL_MINUTES=60
NODE_ENV=production
```

---

## Monitoring

### Key Metrics

- **Trades per cycle:** Should be 0-5 typically
- **Cycle duration:** Should be 2-10 seconds
- **Portfolio growth:** Track weekly
- **Win rate:** % of profitable trades

### Logging

```bash
# View all logs
tail -f data/fund_manager_history.json | jq '.[]'

# View last cycle
cat data/fund_manager_history.json | jq '.[0]'

# View trades only
cat data/fund_manager_history.json | jq '.[] | .trades'
```

---

**See [README.md](README.md) for user guide.**
