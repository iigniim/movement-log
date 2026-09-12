# Movement.log — Project Instructions for Claude Code

## Project summary
Movement.log is a PT (personal training) member management web app, built solo for
the Wanted AI Championship 2026 hackathon (submission deadline: Sept 20, 2026).
Two user roles: **trainer** (manages members, runs assessments, generates/edits
routines, checks off sessions) and **member** (fills out a PAR-Q-style
questionnaire, reviews past sessions and body composition).

Full product spec and running implementation log live in Notion (single source of
truth for decisions): page ID `3cc42b8c3bc181bba32ae02c9858e178`.

## Tech stack
- Next.js 16 (App Router, Server Actions), TypeScript, Tailwind CSS
- UI components: shadcn/ui (base-ui) — Button uses `nativeButton={false} render={<Link .../>}`
  when it needs to act as a link, not `<Button><Link>...</Link></Button>` (causes an
  accessibility console warning).
- Supabase (Postgres + RLS + Auth) — project ref `kkwlfrmrtatfmozewzxa`, Singapore region
- Claude API (`@anthropic-ai/sdk`) for AI features:
  - Risk classification, assessment recommendation, routine generation → `claude-sonnet-5`
  - InBody photo value extraction (vision) → `claude-haiku-4-5-20251001`
- Deployed on Vercel, team `iigniim`

## Hard rules — do not violate
1. **AI never makes a final medical/exercise decision.** Every AI-generated
   recommendation (risk level, assessment picks, routine) is a *draft* the trainer
   must review/confirm before it's persisted as final. Don't remove or weaken this
   confirm step.
2. Routine edits during a session ("운동 추가/수정") only mutate **local client
   state**. They become permanent only when the trainer presses "수업 완료", which
   creates a brand-new `routines` row (archiving the old one) — never mutate an
   existing `routine_items` row that a past `session_log_item` snapshot depends on.
3. Don't reintroduce name-based heuristics for exercise behavior (e.g. checking if
   a name contains "플랭크"). Use the `unit_type` / `equipment` columns instead.
4. When checking GitHub sync state, use `git fetch origin && git reset --hard origin/main`,
   not plain `git pull` (local edits can otherwise mask what's actually on remote).

## Known patterns / gotchas
- Next.js 16 renamed `middleware.ts` → `proxy.ts`.
- `params` and `searchParams` in App Router pages are `Promise`s — always `await` them.
- `/auth/*` paths must stay excluded from auth-redirect logic in `proxy.ts`, or
  invite-link flows break.
- Admin-only Supabase operations (inviting users, `auth.admin.*`) go through
  `lib/supabase/admin.ts` (service role key, server-only, RLS bypassed intentionally).
- Resend SMTP is connected but **not domain-verified** — it can currently only send
  to the trainer's own address. Don't rely on invite emails for testing; create test
  members directly via Supabase Dashboard → Authentication → Users → Add user
  (check "Auto Confirm User"), then manually link the row in `members`.
