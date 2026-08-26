# ScoutX Production Deployment Guide

## 1. Environment Variables Validation
Ensure all required production keys are set in your environment:
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `RESEND_API_KEY`

## 2. Database Migrations
Run Prisma migrations before starting containers:
```bash
pnpm --filter @scoutx/infrastructure db:push
```

## 3. Stripe & Cloudflare Webhooks
Configure webhook secret targets pointing to:
- Stripe: `https://your-domain.com/api/webhooks/stripe`

## 4. Local Production Stack
Start full stack via Docker Compose:
```bash
docker-compose up -d --build
```

## 5. Health Monitoring & Rollback
Verify application health status:
```bash
curl https://your-domain.com/api/health
```
In case of rollback, re-deploy the previous tagged release commit container tag.
