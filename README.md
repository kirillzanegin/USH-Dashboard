# USH Dashboard

Admin analytics dashboard for a Telegram Wheel of Fortune bot. Built with Next.js 15, Supabase, and Vercel.

## Features

- **Обзор** — KPIs, charts, top players, fairness summary
- **Игроки** — Searchable table, leaderboards, player detail
- **Призы** — Prize analytics, wheel fairness (expected vs actual)
- **Использование призов** — Redemption/expiration analytics
- **Поведение** — Activity heatmap, gaps, behavioral patterns
- **Аномалии** — Configurable anomaly detection
- **Диагностика** — Data quality and integrity checks

## Prerequisites

- Node.js 18+
- Supabase project with the schema (users, spins, prizes)

## Setup

1. Clone and install:

```bash
npm install
```

2. Copy env example and configure:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret
```

3. Run dev server:

```bash
npm run dev
```

4. Open http://localhost:3000

## Supabase RLS and Access

**Important:** RLS is enabled on all tables. With no policies, the anon key returns no rows.

This app uses `SUPABASE_SERVICE_ROLE_KEY` server-side to bypass RLS. The service role key:

- Must **never** be exposed to the browser
- Is only used in Server Components and API routes
- Must be set in Vercel environment variables (not `NEXT_PUBLIC_*`)

Do not disable RLS. The dashboard is designed for authenticated admin access via server-side Supabase client.

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

## GitHub Pages (Alternative)

**GitHub Pages is not the recommended main deployment** because:

- GitHub Pages serves only static files — no server-side code runs
- The `SUPABASE_SERVICE_ROLE_KEY` cannot be used safely in client-side code (it would be publicly visible)
- Without the service role key and with RLS enabled, all reads return empty

**To support GitHub Pages later**, you would need to:

1. Create RLS read policies scoped to an authenticated admin role
2. Implement admin authentication (e.g. Supabase Auth)
3. Use `next export` for static generation
4. Use a separate API proxy (e.g. Vercel serverless) or Supabase Edge Functions to fetch data without exposing the service role key

## Database Schema

- `users` — id, telegram_id, first_name, last_name, username, phone, invited_by, created_at, coins, admin
- `spins` — id, user_id, prize_id, created_at, meta, promo_code, valid_until, is_active, used_at
- `prizes` — id, name, description, weight, stock, promo_code, is_active, created_at

## Scripts

- `npm run dev` — Start dev server (Turbopack)
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
- `npm run typecheck` — Run TypeScript check

## License

Private
