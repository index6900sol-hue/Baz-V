# ⚡ 5-Minute Quick Start

Get BAZ Autonomous Fund Manager running in 5 minutes.

## Step 1: Setup (2 min)

```bash
# Clone or navigate to project
cd /workspaces/Baz-V

# Create environment file
cat > .env.local << EOF
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_api_secret
ENGINE=openclaw
WORKER_INTERVAL_MINUTES=60
EOF

# Install dependencies
npm install
```

## Step 2: Start Dashboard (1 min)

```bash
npm run dev
```

Open browser: **http://localhost:3000**

You should see:
- Portfolio value: $0 (needs funding)
- Benchmark comparison
- "Execute Trading Cycle Now" button

## Step 3: Start Worker (1 min)

In a **new terminal**:
```bash
npm run worker
```

You should see:
```
═══════════════════════════════════════════
🤖 BAZ AUTONOMOUS FUND MANAGER WORKER
═══════════════════════════════════════════
🚀 Worker started...
⏱️  Trading cycle interval: 60 minutes
```

## Step 4: Fund Your Account (1 min)

1. Go to [Binance.com](https://binance.com)
2. Send USDT to your wallet address
3. Wait for confirmation

## ✅ Done!

AI will start trading within 60 minutes. Watch the dashboard for:

- 💰 Portfolio value increasing
- 📈 Performance vs benchmarks
- 💹 Executed trades in History tab
- 🧠 AI engine decisions

---

## 🔧 Troubleshooting

### Dashboard not loading?
```bash
# Check port 3000
lsof -i :3000
```

### Worker not running?
Check terminal for errors. Common issues:
- BINANCE_API_KEY not set
- npm not installed
- Port conflict

### No trades executing?
Reasons:
1. No USDT balance
2. No assets beat benchmarks
3. Low conviction (wait for next cycle)
4. API issues

---

## 📊 Next Steps

1. **Monitor Daily** - Check dashboard first week
2. **Review Settings** - Adjust data/settings.json if needed
3. **Increase Funding** - Add more USDT gradually
4. **Read Docs** - See AUTONOMOUS_TRADING_GUIDE.md

---

**Full docs: [README.md](README.md)**
