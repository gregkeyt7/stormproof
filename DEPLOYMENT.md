# Deployment Guide (Personal Use)

## 1) Provision infrastructure

- PostgreSQL database (managed recommended)
- Private environment variable store
- Node 20+ runtime

## 2) Environment variables

Set all required variables from `.env.example`:

- `DATABASE_URL`
- `ENCRYPTION_KEY`
- optional broker keys

Never commit real API secrets.

## 3) Build + migrate

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run build
```

## 4) Start

```bash
npm run start
```

## 5) Security checklist

- Keep API keys server-side only
- Rotate API keys periodically
- Use restricted API scopes at broker
- Enforce HTTPS
- Keep emergency stop reachable
- Set monitoring/alerts on API failures

## 6) Rollout policy

1. Deploy in paper-only mode.
2. Validate behavior and logs.
3. Confirm risk settings and kill switch.
4. Unlock live mode only after paper qualification.
5. Start with tiny positions.

