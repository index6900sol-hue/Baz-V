# 📋 Setup Checklist & Configuration Guide

Complete this checklist before starting autonomous trading.

## ✅ Pre-Setup Checklist

- [ ] Node.js 18+ installed
- [ ] npm or yarn available
- [ ] Git (for cloning)
- [ ] Binance account active
- [ ] Binance account verified (Level 2+)
- [ ] USDT available in Binance wallet
- [ ] OpenAI account (optional, if using OpenAI engine)
- [ ] Text editor or IDE ready

---

## 🔐 Binance API Setup

### Step 1: Generate API Key

1. Go to [Binance.com](https://www.binance.com)
2. Login to your account
3. Navigate to **Account** → **API Management**
4. Click **Create API** (or **Create New Key**)
5. Enter a label: `BAZ Fund Manager`
6. Accept the terms

### Step 2: Configure Permissions

**Enable:**
- ✅ Spot & Margin Trading
- ✅ Enable Spot Trading Sub-account Transfer
- ✅ Allow viewing account trade history

**Disable:**
- ❌ Withdrawals (for security)
- ❌ IP Restriction (optional, recommended if on stable IP)

### Step 3: Save Credentials

You'll see:
- API Key (copy this)
- API Secret (copy this - you'll only see it once!)

Never share these credentials!

### Step 4: Test API Connection

```bash
# Test if API keys work
curl -X GET "https://api.binance.com/api/v3/account" \
  -H "X-MBX-APIKEY: YOUR_API_KEY"
```

---

## 🛠️ Project Setup

### Step 1: Clone/Navigate

```bash
# If cloning from GitHub
git clone https://github.com/baz1201/Baz-V.git
cd Baz-V

# Or navigate if already local
cd /workspaces/Baz-V
```

### Step 2: Install Dependencies

```bash
npm install
# This installs all required packages
```

### Step 3: Create Environment File

Create `.env.local` in the root directory:

```bash
cat > .env.local << 'EOF'
# === BINANCE CREDENTIALS ===
BINANCE_API_KEY=your_api_key_from_step_3
BINANCE_API_SECRET=your_api_secret_from_step_3

# === AI ENGINE CONFIGURATION ===
# Option A: Use OpenClaw (recommended, free)
ENGINE=openclaw
OPENCLAW_CLI_PATH=npx

# Option B: Use OpenAI (requires API key)
# ENGINE=openai
# OPENAI_API_KEY=sk-your_openai_key_here

# === WORKER CONFIGURATION ===
WORKER_INTERVAL_MINUTES=60        # Trading cycle frequency (60 = hourly)

# === OPTIONAL ===
USE_OPENCLAW=true                  # Enable OpenClaw engine
EOF
```

### Step 4: Verify Build

```bash
npm run build
```

You should see: **✓ Compiled successfully**

If there are errors, check:
- Node version: `node --version` (should be 18+)
- npm: `npm --version`
- Dependencies: `npm install` again

---

## 📊 Configuration Files

### `data/settings.json`

This file stores trading parameters:

```json
{
  "allocationPercent": 30,
  "stablePercent": 70,
  "riskProfile": "conservative",
  "engine": "openclaw",
  "autoTrade": true,
  "maxAllocationPerAsset": 30,
  "minUsdtReserve": 10,
  "targetBenchmarks": [
    "IHSG",
    "S&P 500",
    "Gold",
    "Bitcoin",
    "Top 100 Crypto",
    "USD"
  ],
  "refreshMinutes": 60,
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Key Parameters:**

| Parameter | Default | Meaning |
|-----------|---------|---------|
| `allocationPercent` | 30 | % of portfolio for trading |
| `stablePercent` | 70 | % to keep as USDT |
| `riskProfile` | conservative | Trading aggressiveness |
| `engine` | openclaw | AI engine: openclaw or openai |
| `maxAllocationPerAsset` | 30 | Max % per single asset |
| `minUsdtReserve` | 10 | Minimum USDT to maintain ($) |

### `data/fund_manager_history.json`

Automatically created, stores:
- All trading cycles
- Executed trades
- Performance metrics
- Portfolio snapshots

### `data/latest_portfolio.json`

Automatically created, stores:
- Current portfolio state
- Latest cycle result
- Performance snapshot

---

## 🚀 Running the System

### Terminal 1: Dashboard

```bash
npm run dev
```

Expected output:
```
> next dev

  ▲ Next.js 14.2.5
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 1.2s
```

Access at: **http://localhost:3000**

### Terminal 2: Autonomous Worker

```bash
npm run worker
```

Expected output:
```
═══════════════════════════════════════════
🤖 BAZ AUTONOMOUS FUND MANAGER WORKER
═══════════════════════════════════════════
🚀 Worker started at 2024-01-15T10:30:00.000Z
⏱️  Trading cycle interval: 60 minutes
📍 Running mode: AUTONOMOUS TRADING
═══════════════════════════════════════════

────────────────────────────────────────────
📊 CYCLE #1 | 2024-01-15T10:31:00.000Z
────────────────────────────────────────────
```

---

## 💰 Funding Your Account

### Step 1: Get Deposit Address

1. Open Binance → Wallet → Spot Wallet
2. Click "Deposit" for USDT
3. Select network: **TRON (TRC20)** or **Ethereum (ERC20)**
4. Copy deposit address

### Step 2: Send USDT

From your external wallet/exchange:
- Send USDT to the address above
- Use correct network!
- Recommended amount to start: $100-500

### Step 3: Wait for Confirmation

- Usually takes 1-5 minutes
- You can see pending balance in Binance
- Full confirmation takes up to 30 minutes

### Step 4: Verify Receipt

```bash
# Dashboard: Check "Portfolio Value"
# Should show > $0
```

---

## 🧪 Testing Mode

Before running with real trading:

### Manual Test Cycle

1. Dashboard: Click "Execute Trading Cycle Now"
2. Watch for:
   - ✅ No errors in terminal
   - ✅ Trades appear in History
   - ✅ Portfolio value updates

### Small Amount Test

1. Fund with $50-100 only
2. Run for 24-48 hours
3. Monitor dashboard closely
4. Review [AUTONOMOUS_TRADING_GUIDE.md](AUTONOMOUS_TRADING_GUIDE.md)
5. Only then increase funding

---

## 📈 Scaling Up

### Week 1-2: Conservative
- Funding: $100-500
- Allocation: 20% (80% USDT)
- Monitor: Daily
- Review: Check trades, understand decisions

### Week 3-4: Balanced
- Funding: $500-2,000
- Allocation: 30% (70% USDT)
- Monitor: 3-4x per week
- Review: Performance vs benchmarks

### Month 2+: Growth
- Funding: $2,000+
- Allocation: 30-50% (50-70% USDT)
- Monitor: Weekly
- Review: Long-term trends

---

## 🔍 Verification Checklist

Before first trading cycle, verify:

- [ ] `.env.local` file exists with correct keys
- [ ] `npm install` completed successfully
- [ ] `npm run build` shows no errors
- [ ] Dashboard loads at `http://localhost:3000`
- [ ] Worker starts without errors: `npm run worker`
- [ ] Binance balance shows in Portfolio Value
- [ ] Can click "Execute Trading Cycle Now" (test)
- [ ] Settings.json is readable: `cat data/settings.json`
- [ ] Network connectivity to Binance/Yahoo/CoinGecko working
- [ ] No other process using port 3000

---

## ⚠️ Important Notes

### Do NOT Share:
- BINANCE_API_KEY
- BINANCE_API_SECRET
- OPENAI_API_KEY
- .env.local file

### Recommended Security:
- Use API keys with trade permissions only
- Enable IP whitelist if possible
- Monitor account for suspicious activity
- Regular backups of data/ folder
- Use strong Binance 2FA

### Common Issues:
- **"Cannot connect to Binance"** → Check internet, API keys
- **"No trades executing"** → Check USDT balance, conviction levels
- **"Dashboard not loading"** → Check port 3000, npm install
- **"Worker crashes"** → Check logs, verify API keys

---

## 📚 Next Steps

1. ✅ Complete this checklist
2. 📖 Read [QUICK_START.md](QUICK_START.md)
3. 🚀 Run dashboard and worker
4. 💰 Fund with test amount
5. 📊 Monitor for first cycle
6. 📚 Read [AUTONOMOUS_TRADING_GUIDE.md](AUTONOMOUS_TRADING_GUIDE.md)
7. 💹 Gradually increase funding as confident

---

**Questions? Check the [README.md](README.md) for full documentation.**
