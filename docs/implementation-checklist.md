# USH Dashboard Implementation Checklist

## PHASE 0 — Analysis and Implementation Plan
- [x] Architecture summary
- [x] Data logic summary
- [x] Page plan
- [x] Risk notes
- [x] Access notes regarding RLS
- [x] Acceptance: all business rules reflected, no invented schema

## PHASE 1 — Project Bootstrap
- [x] Next.js 15 app scaffold
- [x] Tailwind CSS
- [x] shadcn/ui base components
- [x] Sidebar layout
- [x] Russian navigation labels
- [x] Page shells (7 pages)
- [x] Acceptance: app runs, sidebar works, page shells exist
- **Validation**: typecheck passed, lint passed

## PHASE 2 — Supabase Data Layer
- [x] Server-side Supabase client helpers
- [x] Env placeholders
- [x] Typed models
- [x] Central query services
- [x] Acceptance: code compiles, connection layer isolated from UI

## PHASE 3 — Global Filters
- [x] Preset filters
- [x] Custom date range
- [x] Shared filter state (URL-synced)
- [x] Acceptance: selected period updates current page data

## PHASE 4 — Overview Page
- [x] KPI cards
- [x] Overview charts
- [x] Summary blocks
- [x] Acceptance: metrics respect filters, Russian labels correct

## PHASE 5 — Players Page
- [ ] Players table
- [ ] Search
- [ ] Leaderboards
- [ ] Player details
- [ ] Acceptance: player metrics accurate, admins excluded

## PHASE 6 — Prizes Page
- [ ] Prize analytics table
- [ ] Fairness logic
- [ ] Expected vs actual charts
- [ ] Acceptance: prize 14 marked as system welcome

## PHASE 7 — Redemptions Page
- [ ] Used / unused / expired analytics
- [ ] Acceptance: redemption logic matches business rules

## PHASE 8 — Behavior Page
- [ ] Timing, delay, gaps, heatmap
- [ ] Acceptance: UTC handling consistent

## PHASE 9 — Anomalies Page
- [ ] Anomaly engine
- [ ] Configurable thresholds
- [ ] Russian explanations
- [ ] Acceptance: rules transparent and configurable

## PHASE 10 — Diagnostics Page
- [x] Data health checks
- [x] Acceptance: key integrity checks shown

## PHASE 11 — Polish and Docs
- [x] Loading / empty / error states
- [x] README
- [x] Deployment notes
- [x] RLS/security notes
- [x] GitHub Pages explanation
- [x] Acceptance: app understandable and deployable
