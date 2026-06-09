# 🤖 BAZ Autonomous Fund Manager

> **AI-powered autonomous trading system that beats institutional benchmarks**

An advanced, autonomous fund manager that uses AI to automatically select and trade crypto assets on Binance, with the goal of outperforming:
- IHSG (Indonesian Stock Index)
- S&P 500 (US Stock Index)  
- Gold (XAUUSD)
- Bitcoin
- Top 100 Crypto Index
- USD/IDR Parity

## 🎯 Core Concept

**Your Role:** Fund the account with USDT  
**AI's Role:** Autonomously manages your portfolio through trading  
**Goal:** Beat all 6 target benchmarks

The system runs **hourly autonomous trading cycles** where AI:
1. 🔍 Scans top 50 crypto assets on Binance
2. 📊 Screens assets beating benchmark performance
3. 🧠 Analyzes risk-reward and market conditions
4. 💹 Executes trades autonomously
5. 📈 Tracks performance vs all benchmarks

## ⚡ Features

- **Autonomous Trading:** AI decides all buy/sell decisions
- **Dynamic Asset Discovery:** Not limited to a fixed watchlist
- **Benchmark-Centric:** Only trades assets likely to beat benchmarks
- **Conservative Risk:** 30% allocation to trading, 70% USDT reserve
- **Real-Time Monitoring:** Live dashboard with performance tracking
- **AI Engines:** Supports OpenClaw and OpenAI
- **Trade History:** Last 500 cycles stored automatically
- **Hourly Cycles:** Continuous autonomous trading operations

## 📋 Prerequisites

- Node.js 18+
- Binance account with funding
- API keys (trade + read permissions)
- OpenAI API key (for GPT recommendations) OR OpenClaw CLI
- USDT balance on Binance to fund trades

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cat > .env.local << EOF
# Binance Configuration
BINANCE_API_KEY=your_binance_key
BINANCE_API_SECRET=your_binance_secret

# AI Configuration (choose one)
OPENAI_API_KEY=your_openai_key
# OR
OPENCLAW_CLI_PATH=npx

# Engine Selection
ENGINE=openclaw  # or 'openai'

# Worker Configuration
WORKER_INTERVAL_MINUTES=60  # Hourly trading cycles
EOF
```

### 3. Start the Dashboard
```bash
npm run dev
# Dashboard available at http://localhost:3000
```

### 4. Start the Autonomous Worker
In a separate terminal:
```bash
npm run worker
# Worker will execute hourly trading cycles
```

### 5. Fund Your Account
- Send USDT to your Binance account
- AI will autonomously start trading within the hour

## 📊 How It Works

### Trading Cycle Flow

```
Every 60 Minutes:
  ├─ 🔍 Discover top 50 crypto assets (by volume)
  ├─ 📈 Fetch 24h stats and prices
  ├─ 📊 Calculate current portfolio value
  ├─ 🎯 Compare vs 6 benchmarks
  ├─ 🔝 Screen assets beating benchmarks
  ├─ 🧠 AI generates trading recommendations
  ├─ 💹 Execute HIGH/MEDIUM conviction trades only
  ├─ 📝 Log all trades and performance
  └─ 💾 Save cycle data to history
```

### Decision Framework

AI analyzes each asset:
1. **Does it beat benchmarks?** (Required)
2. **What's the risk-reward ratio?**
3. **Is liquidity sufficient?** (Volume check)
4. **Market momentum** (24h change analysis)
5. **Conviction level** (High/Medium/Low)

### Allocation Strategy

- **Primary Trading:** 30% of portfolio
  - Diversified across multiple high-conviction assets
  - Max 30% per asset
  
- **Stable Reserve:** 70% in USDT
  - Available for emerging opportunities
  - Protects against downturns
  - Minimum $10 reserve maintained

## 🎮 Dashboard

Live monitoring dashboard at `http://localhost:3000`:

### Overview Tab
- 💰 Current portfolio value
- 📈 Performance vs all 6 benchmarks
- 💼 Current holdings (AI-selected)
- 🚀 Trading statistics

### Performance Tab
- 📊 Real-time benchmark data
- 💹 Fund performance metrics
- 📈 Average trades per cycle

### History Tab
- ⏰ Recent trading cycles
- 📝 Trade execution logs
- 🧠 AI engine used
- ⏱️ Cycle durations

### How It Works Tab
- 📖 System explanation
- 🚀 Getting started guide
- ⚠️ Risk management info

## 📈 API Endpoints

### GET `/api/status`
Current portfolio and performance snapshot

### POST `/api/trade`
Manually trigger autonomous trading cycle

### GET `/api/fund-manager?section=history`
Get trading cycle history

### GET `/api/settings`
Get current settings

## 🔧 Configuration

Edit `data/settings.json`:
```json
{
  "allocationPercent": 30,
  "stablePercent": 70,
  "riskProfile": "conservative",
  "engine": "openclaw",
  "maxAllocationPerAsset": 30,
  "minUsdtReserve": 10,
  "autoTrade": true
}
```

## 📚 Project Structure

```
.
├── app/
│   ├── page.js                 # Main dashboard
│   ├── layout.js               # App layout
│   ├── globals.css             # Styling
│   └── api/
│       ├── trade/route.js      # Trading endpoint
│       ├── status/route.js     # Status endpoint
│       ├── fund-manager/route.js # History endpoint
│       └── settings/route.js   # Settings endpoint
├── lib/
│   ├── fundManagerV2.js        # Core autonomous fund manager
│   ├── binance.js              # Binance API client
│   ├── openai.js               # OpenAI integration
│   └── openclaw.js             # OpenClaw integration
├── worker/
│   └── tradingWorker.js        # Hourly autonomous worker
├── data/                       # Data storage
│   ├── settings.json          # Configuration
│   ├── fund_manager_history.json  # Trading history
│   └── latest_portfolio.json  # Current state
└── public/
    └── ...                      # Static assets
```

## 🔑 Key Functions

### `runAutonomousFundManager()`
Main trading cycle orchestrator

### `discoverTopCryptoAssets(limit)`
Dynamically finds top crypto pairs by volume

### `selectOptimalAssets(marketStats, benchmarks)`
Conservative asset screening

### `generateBenchmarkCentricRecommendations()`
AI-powered trading decisions

## ⚠️ Risk Disclosure

**This is experimental software. Use at your own risk.**

- Markets are unpredictable
- Start with small amounts to test
- Never trade with money you can't afford to lose
- Monitor performance regularly
- Adjust settings based on results

## 🤝 Contributing

Contributions welcome!

## 📄 License

MIT License

---

**Built with ❤️ for autonomous trading excellence**
