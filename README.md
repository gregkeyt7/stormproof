# PERSONAL CREDIT TITAN AI™ — Private Intelligence System

Private, self-hosted financial intelligence platform for personal use:

- forensic credit analysis
- dispute workflow intelligence
- utilization and account sequencing optimization
- lender-perception simulation
- business credit readiness and funding strategy
- decision coaching with lawful, factual guardrails

> This software is educational workflow tooling and not legal, tax, or financial advice.
> It must not be used to fabricate evidence, submit fraudulent claims, or misrepresent facts.

---

## 1) Architecture

### Monorepo structure

```text
.
├─ frontend/                 # Next.js + Tailwind + Framer Motion + Recharts UI
│  ├─ src/app/page.tsx       # Main elite dashboard
│  ├─ src/lib/api.ts         # API client + typed contracts
│  └─ ...
├─ backend/                  # Node.js + Express + Prisma API
│  ├─ prisma/schema.prisma   # PostgreSQL schema
│  ├─ src/index.ts           # API server + route registration
│  ├─ src/routes/            # auth, uploads, forensics, disputes, simulator, business, admin
│  ├─ src/services/          # OCR, AI, forensics, dispute, simulation, business engines
│  ├─ src/lib/               # jwt, encryption, prisma, audit logging
│  └─ ...
└─ package.json              # workspace + orchestration scripts
```

### Core engines implemented

1. **AI Credit Forensics Engine**
   - Upload docs (`PDF`, `PNG/JPG`, `CSV`, text-like)
   - OCR extraction + entity parsing
   - score suppression breakdown
   - lender perception narrative
   - prioritized tactical action stack

2. **Advanced Dispute Intelligence Engine**
   - Issue classification and workflow data model
   - Draft generation for:
     - bureau disputes
     - creditor disputes
     - debt validation
     - goodwill letters
     - CFPB complaint drafts
     - method-of-verification requests
     - cease communication
     - settlement negotiation
     - inquiry challenge
   - Includes mandatory user-review and factual-use language

3. **Business Credit Domination System**
   - Foundation checks (EIN, D-U-N-S, bank)
   - Fundability scoring
   - lender risk scoring
   - phased net-30 and revolving sequencing map

4. **Millionaire Decision Engine**
   - leverage guardrails
   - debt-service discipline
   - approval-sequencing recommendations
   - behavior coaching logic tied to profile context

5. **Credit Simulator**
   - Simulates utilization shifts, payoff, inquiries, limit increases, new accounts
   - Produces score delta estimate, approval odds shift, and lender perception change

6. **Security + Audit Layer**
   - JWT auth
   - password hashing
   - encrypted local document storage
   - upload limits
   - request rate-limits
   - audit logs for critical actions

---

## 2) Tech stack

### Frontend
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Framer Motion
- Recharts

### Backend
- Node.js
- Express 5
- Prisma + PostgreSQL
- OpenAI + LangChain
- Tesseract OCR + PDF parser + CSV parser
- JWT / encryption / structured logging

---

## 3) API surface (implemented)

Base path: `/api`

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /uploads/documents` (multipart form upload)
- `POST /forensics/analyze`
- `POST /disputes/letters/generate`
- `PATCH /disputes/cases/:caseId/status`
- `POST /simulator/run`
- `POST /business/evaluate`
- `GET /admin/audit-logs` (admin only)
- `GET /admin/overview` (admin only)

---

## 4) Database schema highlights

Models include:
- `User`, `UploadedDocument`, `CreditProfile`, `ForensicAnalysis`
- `DisputeCase`, `DisputeLetter`
- `BusinessProfile`, `BusinessPlan`
- `SimulationRun`
- `AuditLog`

Enums include:
- user roles
- document source/status
- dispute types/status

See: `backend/prisma/schema.prisma`

---

## 5) Local setup

### Prerequisites
- Node.js 20+
- PostgreSQL running locally or remotely

### Environment files

Create:
- `backend/.env` from `backend/.env.example`
- `frontend/.env.local` from `frontend/.env.example`

Minimum backend env values:
- `DATABASE_URL`
- `JWT_SECRET`
- `ENCRYPTION_SECRET`

Optional for AI:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

### Install dependencies

From repo root:

```bash
npm install
```

### Generate Prisma client + migrate

```bash
npm run prisma:generate --workspace backend
npm run prisma:migrate --workspace backend -- --name init
```

### Run development

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`

---

## 6) Deployment outline

1. Provision PostgreSQL
2. Set environment variables for frontend/backend
3. Run migrations in deployment pipeline
4. Build backend (`npm run build --workspace backend`)
5. Build frontend (`npm run build --workspace frontend`)
6. Start backend + frontend services behind TLS proxy
7. Restrict admin endpoints by role and IP where possible

---

## 7) Guardrails and legal constraints

This system is intentionally built with safety constraints:

- factual drafting only
- no fabricated evidence
- no false representations
- user review required before sending any correspondence
- educational strategic modeling, not guaranteed score outcomes

Use responsibly and in compliance with all applicable laws and bureau/creditor procedures.
