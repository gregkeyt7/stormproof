# RAYLIX TRADER™ Architecture

## System layers

1. **UI Layer (Next.js + React)**
   - Dashboard cards, charts, mode controls, kill switch
   - Calls backend route handlers

2. **API Layer (Next.js Route Handlers)**
   - `/api/dashboard/summary`
   - `/api/bot/tick`
   - `/api/bot/mode`
   - `/api/bot/emergency-stop`
   - `/api/backtest/run`

3. **Execution Orchestration Layer**
   - `bot-orchestrator.ts` coordinates one cycle:
     - snapshot
     - AI analysis
     - strategy signals
     - risk evaluation
     - execution simulation
     - journal + self-correction

4. **Trading Engine Layer**
   - AI Market Brain
   - Strategy Engine
   - Risk Engine
   - Paper Trading Engine
   - Backtesting Engine
   - Self-Correction Engine
   - Profit Manager
   - Trade Journal Engine

5. **State & Persistence Layer**
   - Runtime in-memory store for immediate local operation
   - Prisma schema prepared for PostgreSQL persistence

6. **Security Layer**
   - Server-side secret handling
   - AES-256-GCM helper for API key encryption

## Bot cycle (high-level)

1. Pull/construct latest market snapshot
2. Classify market regime and confidence
3. Refuse trading in dangerous conditions
4. Generate strategy candidates
5. Select best validated setup
6. Apply risk checks and position sizing
7. Execute simulated order (paper or gated live)
8. Manage open trades (stop/take-profit)
9. Journal outcomes and lessons
10. Run self-correction logic (cooldown / fallback)

## Safety-first design rules

- No stop-loss, no trade
- No take-profit, no trade
- No 2:1 reward:risk, no trade
- High spread/slippage, no trade
- Dangerous market regime, no trade
- Max daily loss reached, no trade
- Max drawdown reached, no trade
- Emergency stop active, no trade
- Poor performance drift, fallback to paper
