# RAYLIX TRADER™ (Personal AI Trading Bot)

RAYLIX TRADER™ is a **private, personal-use** AI-assisted trading system built with a paper-first safety model.

## Important Safety Statement

- This project does **not** guarantee profits.
- This project does **not** assume it can beat the market every day.
- This project is designed to **protect capital first**.
- Live trading is intentionally hard to unlock and should start with tiny sizes.
- You are fully responsible for your own trading decisions and compliance obligations.

---

## What this project includes

### Core capabilities

- Paper trading mode (default)
- Live trading mode (gated by strict checks)
- AI market analysis engine
- Risk engine with hard constraints
- Modular strategy engine
- Backtesting engine
- Self-correction + paper fallback logic
- Trade journaling and lesson tracking
- Tax reserve planning tracker
- Emergency stop (kill switch)
- Real-time dashboard (Next.js + React + Tailwind + Recharts + Framer Motion)

### Supported market roadmap

- Current implementation: Crypto-focused simulation flow
- Planned extensions:
  - Binance testnet / Coinbase sandbox
  - OANDA (forex)
  - Alpaca (stocks/ETF)
  - Interactive Brokers (advanced)

---

## Tech stack

- **Frontend/UI**: Next.js App Router, React, Tailwind CSS, Recharts, Framer Motion
- **Backend/API**: Next.js Route Handlers (Node runtime)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Security utility**: AES-256-GCM encryption helper for API secrets

---

## Capital protection rules (hard rules)

The bot enforces these principles:

1. Protect capital first
2. Control risk before any entry
3. Avoid overtrading
4. Only trade validated setups
5. Log every trade
6. Learn from losses
7. Scale only after consistency

Hard safety checks include:

- stop loss required
- take profit required
- max risk per trade (default 1%)
- max daily loss (default 3%)
- max drawdown (default 10%)
- max open trades
- max trades per day
- spread/slippage filters
- confidence threshold
- no-trade in dangerous regime
- no martingale, no doubling down, no revenge trading

---

## Live mode unlock policy

Live mode remains blocked unless all are true:

- user confirmation is completed
- API keys are configured
- risk settings are configured
- emergency kill switch is armed
- paper trading history has at least 100 closed trades
- paper win rate and drawdown meet thresholds
- recent loss pattern does not fail self-correction checks

If performance degrades, the system can:

- force switch back to paper mode
- apply cooldown
- require re-validation

---

## Project structure

```text
.
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── backtest/run/route.ts
│   │   │   ├── bot/emergency-stop/route.ts
│   │   │   ├── bot/mode/route.ts
│   │   │   ├── bot/tick/route.ts
│   │   │   └── dashboard/summary/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/dashboard/
│   │   ├── dashboard-charts.tsx
│   │   ├── emergency-stop-button.tsx
│   │   ├── metric-card.tsx
│   │   ├── mode-toggle.tsx
│   │   ├── section-card.tsx
│   │   └── trade-table.tsx
│   └── lib/
│       ├── constants.ts
│       ├── data/mock-market.ts
│       ├── engines/
│       │   ├── ai-market-brain.ts
│       │   ├── backtest-engine.ts
│       │   ├── live-gate-engine.ts
│       │   ├── paper-trading-engine.ts
│       │   ├── profit-manager.ts
│       │   ├── risk-engine.ts
│       │   ├── self-correction-engine.ts
│       │   ├── strategy-engine.ts
│       │   └── trade-journal-engine.ts
│       ├── prisma.ts
│       ├── security/encryption.ts
│       ├── services/bot-orchestrator.ts
│       ├── state/runtime-store.ts
│       ├── types.ts
│       └── utils/format.ts
├── .env.example
├── DEPLOYMENT.md
└── README.md
```

---

## Database tables (Prisma models)

- users
- accounts
- trades
- strategies
- signals
- backtests
- paper_trades
- live_trades
- risk_settings
- tax_reserves
- bot_logs
- market_snapshots

---

## Getting started (beginner-friendly)

### 1) Install Node.js and npm

Use Node 20+.

### 2) Install dependencies

```bash
npm install
```

### 3) Configure environment variables

```bash
cp .env.example .env
```

Set:

- `DATABASE_URL` (PostgreSQL connection string)
- `ENCRYPTION_KEY` (long random secret)
- exchange keys (optional; live mode stays blocked without keys anyway)

### 4) Run Prisma generation and migration

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5) Start the app

```bash
npm run dev
```

Open: `http://localhost:3000`

---

## How to operate safely

1. Start in paper mode (default).
2. Run many bot cycles and journal outcomes.
3. Run backtests and compare strategy behavior.
4. Do not optimize based on tiny samples.
5. Require at least 100 paper trades before considering live mode.
6. Start live mode with tiny size only.
7. Keep emergency stop ready.

---

## Strategy modules implemented

- Trend Following
- Breakout
- Mean Reversion
- Scalping
- No Trade (safety refusal strategy)

The system selects strategies only when confidence + risk + execution conditions align.

---

## Notes on taxes

The tax reserve module tracks **estimated reserve amounts only** for planning:

- tax reserve %
- reinvest %
- withdrawal %

It does not file taxes or produce legal tax reports.

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guidance.
