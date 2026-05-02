<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Catstac

A Next.js 16 / React 19 front-end for a daily cat-photo contest. Users browse a grid of "Catestants," view per-cat detail pages, cast one free vote per day, purchase extra votes, submit their own cats, and browse past winners.

Built and wired to Supabase: Google OAuth sign-in (`/signin` + `/auth/callback`) and the submission pipeline (`/submit` → `/api/submit` → `submissions` + `catestants` + the `catestants` storage bucket, with OpenAI photo validation). Still mock or local-only: the cat grid, catestant detail, vote button (writes to `localStorage`), and winners pages. Payments are not built — see *Things not yet built*.

For visual conventions (colors, typography, modal pattern, card pattern, responsive rules), read `design.md`.

## Stack & scripts

- **Framework:** Next.js `16.2.3`, React `19.2.4`, App Router (all routes under `app/`).
- **Styling:** CSS Modules (one `.module.css` per route/component). Global vars live in `app/globals.css`. Tailwind v4 is installed but currently unused — CSS Modules are the convention.
- **Fonts:** Nunito (body + most headings), Ballet (decorative cat names on the winner sash), Modak (reserved). Loaded via `next/font/google` in `app/layout.js` and exposed as CSS variables (`--font-nunito`, `--font-ballet`, `--font-modak`).
- **Scripts:** `npm run dev` / `npm run build` / `npm run start` / `npm run lint`.

## Routes

| Path | File | Notes |
|---|---|---|
| `/` | `app/page.js` | Home: Cat of the Day banner + today's Catestant grid. Renders `IntroModal`. |
| `/catestant/[id]` | `app/catestant/[id]/page.js` | Cat detail w/ prev/next arrows + `VoteButton`. |
| `/winners` | `app/winners/page.js` | Grid of past winners with inline name/date sash. |
| `/winners/[id]` | `app/winners/[id]/page.js` | Winner detail with large sash (name in Ballet) and prev/next arrows. |
| `/submit` | `app/submit/page.js` | Multi-catestant submission form (up to 10 cats, per-cat upload + name + sex, plus "About You" card). Gated — `proxy.js` redirects unauthenticated users to `/signin?redirectTo=/submit`. POSTs `FormData` to `/api/submit` and shows a "Validating your cats…" overlay while the request is in flight. |
| `/submit/confirmation` | `app/submit/confirmation/page.js` | Post-submit thank-you with one share card per *passing* cat plus an inline callout for any that failed AI validation. Reads the result from `sessionStorage.catstac_submission_result` (written by `/submit` immediately before `router.push`). Renders an empty state if the storage key is absent (e.g. direct-URL navigation). |
| `/rules` | `app/rules/page.js` | Static rules content. |
| `/why` | `app/why/page.js` | Founder letter. |
| `/signin` | `app/signin/page.js` + `app/signin/SignInClient.js` | Google OAuth sign-in. Reads `redirectTo` from the query string and threads it through the callback. |
| `/auth/callback` | `app/auth/callback/route.js` | OAuth code-exchange handler. Calls `supabase.auth.exchangeCodeForSession(code)` then redirects to `redirectTo` (must start with `/`). |
| `/api/submit` | `app/api/submit/route.js` | Auth-gated POST handler for the submission form. Creates the `submissions` row, uploads each photo to the `catestants` storage bucket, inserts a `pending` `catestants` row, runs OpenAI validation, then updates each row with `ai_status = 'passed' \| 'failed'`. Returns `{ submission_id, voting_date, cotd_date, passed, failed }`. |

Routes referenced in the UI but not yet implemented: `/terms` (linked from submit checkbox).

## Shared components

Rendered by `app/layout.js` on every page:

- **`NavBar`** (`app/NavBar.js`) — hamburger button (left), wordmark (center), "Add a Cat" button (right). Opens `HamburgerMenu`.
- **`HamburgerMenu`** (`app/HamburgerMenu.js`) — slide-in panel with Home / Winners / Rules / Why, Catstac? / Sign In-Out.

Page-scoped components:

- **`IntroModal`** (`app/IntroModal.js`) — first-visit welcome modal. Dismissed via `localStorage.catstac_intro_dismissed = 'true'` when the user checks "Never ever ever show me this message again."
- **`VoteButton`** (`app/catestant/[id]/VoteButton.js`) — client component that persists the user's daily vote in `localStorage` and conditionally opens one of two modals (see *State & persistence* below).
- **`VoteConfirmationModal`** (`app/catestant/[id]/VoteConfirmationModal.js`) — opens after recording a vote; shows the direct link and a copy button.
- **`VoteUsedModal`** (`app/catestant/[id]/VoteUsedModal.js`) — opens when the user tries to vote after already using today's free vote; shows two purchase packages ($1 / 3 votes, $5 / 10 votes) and a back link. `onPurchase` prop is a no-op stub — wire it up to the real payment flow once it exists.

## Data layer

The `/submit` flow is wired to Supabase end-to-end (see *Submit pipeline* below). The browse/detail pages are still mock — they read from in-repo JS modules:

- `app/catsData.js` — today's Catestants + `getCatNeighbors(id)` for prev/next on the detail page. Uses Unsplash URLs.
- `app/winnersData.js` — past winners + `getWinnerById(id)` / `getWinnerNeighbors(id)`.

When swapping these for real fetchers, keep the return shape (`{ cat/winner, prev, next }`) so the existing pages don't need refactors.

## State & persistence

- **`localStorage.catstac_intro_dismissed`** — `'true'` suppresses `IntroModal` permanently.
- **`localStorage.catstac_daily_vote`** — `{ catId, date: 'YYYYMMDD' }`. `VoteButton` reads this on mount to determine whether *this* page's cat was voted for (show the confirmed-vote asset), or a *different* cat was voted for today (clicking vote opens `VoteUsedModal` instead of recording a new vote). Date stamp expires naturally when the calendar day rolls over.
- **`sessionStorage.catstac_submission_result`** — `{ submission_id, voting_date, cotd_date, passed: [{ id, name, photo_url }], failed: [{ name, reason }] }`. Written by `/submit` after `/api/submit` returns and a passing cat exists; read by `/submit/confirmation` on mount to render the share cards and any "didn't pass validation" callout. Lives for the tab session only — refresh-safe within the tab, but a direct hit to `/submit/confirmation` shows the empty state.

## Styling conventions

- **One CSS Module per page/component**, colocated with its `.js` file. No cross-importing of class names between modules — duplicate the small set of styles you need.
- **Colors / fonts** come from CSS variables defined in `app/globals.css`. Never hardcode hex values; use `var(--color-…)` and `var(--font-…)`.
- **Container queries (`cqi`)** are used for fluid typography on the winner sash (`app/winners/[id]/page.module.css`). `.frame` declares `container-type: inline-size` so every `cqi` measurement scales with the image's rendered width.
- **Mobile breakpoints** vary by page and are intentional — don't unify them:
  - `@media (max-width: 640px)` — submit, catestant, winner detail, winners grid
  - `@media (max-width: 480px)` — intro & vote modals
  - `@media (max-width: 768px)` — intro & vote modal tablet step-down
  - Home page has its own spacing rules
- See `design.md` for the shared modal layout and card patterns that repeat across pages.

## Asset conventions

All raster assets live in `public/assets/`. Many have paired `_large` / `_small` variants — the `.js` renders both as `<img>` tags and CSS toggles visibility at the breakpoint. Example: `vote_button_large.png` shows at `>640px`, `vote_button_small.png` below.

`reference_designs/` holds PNG mocks used while building new screens. Cross-reference these before styling; the filenames map directly to pages (e.g. `submit_default.png`, `vote_confirmation.png`, `winner_detail.png`).

## Things not yet built

- **Auth UI polish** — sign-out wiring in `HamburgerMenu`, user-scoped daily-vote storage (currently still in `localStorage`). Sign-in itself is implemented; see *Auth* below.
- **Payments** — wiring `VoteUsedModal`'s `onPurchase` prop to a checkout flow; persisting purchased vote balances.
- **Read-side backend** — replacing `catsData.js` / `winnersData.js` with real fetchers against the `catestants` / `winners` tables. Submit-side persistence is wired (see *Submit pipeline* below).
- **Vote API** — `VoteButton` still writes to `localStorage` only; needs a route handler that inserts into `votes` (with credit-aware logic per *Database* rules).
- **Admin queue UI** — failed-AI and pending-review catestants pile up in the DB; no UI surfaces them yet.
- **Terms page** — linked from the submit form's agreement checkbox.

## Auth

Google OAuth via Supabase, using the `@supabase/ssr` cookie-based session model.

### Files

| File | Role |
|---|---|
| `app/signin/page.js` | Server Component shell for `/signin`. |
| `app/signin/SignInClient.js` | Client Component with the "Continue with Google" button. Builds `${origin}/auth/callback?redirectTo=…` and passes it as `options.redirectTo` to `supabase.auth.signInWithOAuth({ provider: 'google' })`. |
| `app/auth/callback/route.js` | Route Handler that runs after Google redirects back. Reads `?code=…`, calls `exchangeCodeForSession`, then redirects to the original `redirectTo` (must start with `/`; on error redirects to `/signin?error=auth`). |
| `proxy.js` | Next 16 proxy (the renamed `middleware` convention — see below). Refreshes Supabase auth cookies on every matched request and gates `PROTECTED_PATHS` (currently `['/submit']`), redirecting unauthenticated users to `/signin?redirectTo=<path>`. |
| `lib/supabase/server.js` | Used by the callback handler to write session cookies. |
| `lib/supabase/client.js` | Used by `SignInClient.js` to kick off the OAuth flow. |

### Flow

1. User clicks "Continue with Google" on `/signin`. The client builds `https://<host>/auth/callback?redirectTo=<original-path>` and asks Supabase to start OAuth with that as the post-auth redirect.
2. Supabase sends the user to Google; Google bounces back to `https://<project>.supabase.co/auth/v1/callback`; Supabase then 302s the browser to the `redirectTo` we provided **only if it's on the project's Redirect URL allowlist** — otherwise it silently falls back to the project's Site URL.
3. `app/auth/callback/route.js` exchanges the `code` for a session (which sets the `sb-*` cookies via `server.js`) and redirects to the original target.
4. On every subsequent request, `proxy.js` calls `supabase.auth.getUser()` so the session cookie stays fresh.

### Supabase project

- Project URL: `https://thqqsqqbnusinzlqisss.supabase.co` (this is the value of `NEXT_PUBLIC_SUPABASE_URL`).
- Dashboard → **Authentication → URL Configuration**:
  - **Site URL** must be the canonical production host (see canonical-host note below).
  - **Redirect URLs** allowlist must include `<canonical>/auth/callback` plus any preview / dev origins (`http://localhost:3000/auth/callback`, Vercel preview URLs). Anything not on this list is dropped and the user is bounced to the Site URL with `?code=…` stuck on `/`.

### Canonical host (www vs non-www)

Pick **one** canonical origin and use it everywhere. Auth cookies are scoped to the host that set them, so `www.catstac.com` and `catstac.com` are two separate sessions; an OAuth code exchanged on one host produces cookies the other host can't read.

The canonical host for Catstac is the apex: `https://catstac.com`. To keep this consistent:

- Supabase **Site URL** = `https://catstac.com`.
- Supabase **Redirect URLs** allowlist contains `https://catstac.com/auth/callback` (not the www variant).
- DNS / Vercel must permanently redirect `www.catstac.com` → `catstac.com` **before** the OAuth flow starts, so users never reach `/signin` on the wrong host.
- Any local copy-paste of the production URL into env vars or test scripts should drop the `www.`.

If you ever flip the canonical to `www.catstac.com`, all four bullets above must change together.

### Proxy file naming

In Next.js 16 the `middleware.js` convention was renamed to `proxy.js` (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). The file lives at the project root, exports a function named `proxy` (or default), and declares `config.matcher`. Renaming it to `middleware.js` will silently break it.

## Submit pipeline

End-to-end path from the `/submit` form to a row in `catestants`.

### Files

| File | Role |
|---|---|
| `app/submit/page.js` | Client form. Stores the `File` object alongside the preview URL. On submit, builds a `FormData` (parallel `catNames` / `catSexes` / `catPhotos` keys, plus `email` / `instagram` / `agreed`) and `fetch`es `/api/submit`. Renders a full-screen "Validating your cats…" overlay (modal-style, see `design.md`) while the request is in flight, plus inline error / "didn't pass" banners. |
| `app/api/submit/route.js` | Auth-gated POST handler. All DB writes use `supabaseAdmin`; only `auth.getUser()` uses the cookie SSR client. |
| `app/submit/confirmation/page.js` | Reads `sessionStorage.catstac_submission_result` on mount; renders one share card per passing cat plus a "didn't pass validation" callout for failed cats. Direct-link URLs are `https://www.catstac.com/catestant/<id>`. |
| `supabase/migrations/002_storage_buckets.sql` | Creates the `catestants` bucket. |

### Server flow (`app/api/submit/route.js`)

1. **Auth gate.** `await createClient()` → `supabase.auth.getUser()`. If no user, return 401. (The route isn't in `proxy.js`'s `PROTECTED_PATHS`, so the proxy doesn't redirect — the route enforces auth itself.)
2. **Parse + validate.** Pull `email`, `instagram` (strip leading `@`), `agreed`, and parallel `getAll('catNames' / 'catSexes' / 'catPhotos')`. Reject mismatched-length arrays, missing files, missing names, invalid `cat_sex`, missing email, missing consent — each with a 400 + human-readable message.
3. **Compute `voting_date`.** Pacific-time `YYYY-MM-DD` via `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' })`. `cotd_date` is `voting_date + 1 day`, returned to the client for display only — the row in `winners` is the source of truth, written by the nightly cron.
4. **Insert `submissions` row.** `supabaseAdmin.from('submissions').insert({...}).select().single()`. If this fails, return 500 — no per-cat work happens.
5. **Per-cat loop.** For each cat, in order:
   1. Generate a UUID for the catestant up front (`crypto.randomUUID()`) so the storage path can include it.
   2. Upload to `catestants/<submission_id>/<catestant_id>.<ext>` via `supabaseAdmin.storage.from('catestants').upload(...)`. Extension comes from the file name (jpg/png) with a content-type fallback.
   3. Resolve the public URL (`getPublicUrl`) — the bucket is public, so this URL is what gets stored in `catestants.photo_url` and what OpenAI fetches.
   4. Insert the `catestants` row with `ai_status = 'pending'`, `admin_status = 'pending_review'`, `is_stock = false`.
   5. Call OpenAI vision (`gpt-4o-mini`, JSON-schema response format with `contains_cat` / `has_humans` / `is_ai_generated` / `reason`). Pass = `contains_cat && !has_humans && !is_ai_generated`.
   6. **Update — never delete.** Pass → `ai_status = 'passed'`, full result in `ai_result`, `ai_validated_at = now()`. Fail → `ai_status = 'failed'`, full result in `ai_result`. `admin_status` stays `pending_review` either way; the failed row is what populates the manual-review queue. If OpenAI itself errors out, the row is left at `ai_status = 'pending'` and the cat is reported to the client as "will be reviewed manually."
6. **Response.** `{ submission_id, voting_date, cotd_date, passed: [{ id, name, photo_url }], failed: [{ name, reason }] }`. Failure reasons are pre-formatted human-readable strings composed from the boolean flags (e.g. "No cat detected. A human is visible.").

### Client outcomes (`app/submit/page.js`)

| Server result | Client behavior |
|---|---|
| `passed.length > 0` (all or partial) | Write the full response to `sessionStorage.catstac_submission_result`, then `router.push('/submit/confirmation')`. Confirmation renders share cards for `passed` + an inline callout for `failed`. |
| `passed.length === 0` | Stay on the form. Render the error banner + the per-cat failure list so the user can fix and retry. **No navigation.** |
| Network or non-200 error | Stay on form, render the error banner. The submit button re-enables. |

### Storage bucket

Bucket name: `catestants`, public. RLS on `storage.objects`: a `select` policy scoped to `bucket_id = 'catestants'`. Writes happen exclusively through the service-role client (`supabaseAdmin.storage.from('catestants').upload(...)`), which bypasses RLS — there are no public insert/update/delete policies on purpose. Stock cats use a separate `stock-cats` bucket (mentioned in `001`'s comments; bucket creation is out of scope for this migration since the cron job manages it).

Storage path convention: `<submission_id>/<catestant_id>.<ext>`. Both IDs are UUIDs, so paths are inherently unique. The same path is stored on the `catestants` row as `photo_storage_path`, and the corresponding `getPublicUrl(...)` result is stored as `photo_url`.

## Database (Supabase)

Schema lives in `supabase/migrations/`:
- `001_initial_schema.sql` — tables, enums, indexes, RLS policies.
- `002_storage_buckets.sql` — creates the public `catestants` storage bucket and a `select` policy on `storage.objects` for it. Run this once in the Supabase SQL editor after `001`.

All tables use UUID primary keys and `timestamptz` timestamps.

### Connection

Three clients, one per environment. Pick by where the code runs and whether RLS should apply.

| File | Builder | Key | Use it when |
|---|---|---|---|
| `lib/supabase/client.js` | `createBrowserClient` (`@supabase/ssr`) | anon | Client Components (`'use client'`). Reads the session from browser cookies; subject to RLS. |
| `lib/supabase/server.js` | `createServerClient` (`@supabase/ssr`) | anon | Server Components, Route Handlers, Server Actions, `proxy.js`. `async` — returns a per-request client wired to Next's cookie store, so `auth.getUser()` works and RLS sees the logged-in user. |
| `lib/supabase/admin.js` | `createClient` (`@supabase/supabase-js`) | service role | Server-only privileged work that must bypass RLS: writing to tables with no public write policy, the nightly cron, admin moderation. Exported as a singleton `supabaseAdmin`. Never import from a Client Component. |

Env vars:
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe to use in the browser; consumed by `client.js` and `server.js`.
- `SUPABASE_SERVICE_ROLE_KEY` — bypasses RLS, consumed by `admin.js` only. Never expose to the browser.
- `OPENAI_API_KEY` — server-only. Consumed by `app/api/submit/route.js` for per-photo cat/human/AI validation.

`lib/supabase/admin.js` is a module-level singleton, so the service role key is read once at server boot. **If you rotate `SUPABASE_SERVICE_ROLE_KEY` or add it for the first time, restart `next dev`** — otherwise `supabaseAdmin` will keep using the stale (or missing) key and writes will fail with `42501` even though the route source code looks correct.

Session refresh: `proxy.js` (the Next 16 proxy file — formerly called middleware) refreshes Supabase auth cookies on each request so `server.js` can read a fresh session. `server.js`'s `setAll` swallows errors silently, since cookie writes from a Server Component throw — the proxy is responsible for those writes instead. See *Auth* below for the full sign-in flow.

### Date column naming convention

Two distinct dates exist in this system — never conflate them:

- `voting_date` — the Pacific-time day a cat is available for voting (e.g. Monday). Used on `submissions`, `catestants`, `votes`.
- `cotd_date` — the Cat of the Day date displayed publicly on the winners grid and in winner emails (e.g. Tuesday, always `voting_date + 1 day`). Used on `winners` only.

### Tables

| Table | Purpose |
|---|---|
| `submissions` | One row per /submit form submission. Login required — `user_id` is never null. |
| `catestants` | One row per submitted cat. Belongs to a submission. |
| `votes` | One row per vote cast. Login required — `user_id` is never null. |
| `vote_credits` | Append-only ledger for purchased vote credits. Balance = `SUM(delta)` per `user_id`. |
| `winners` | One row per winning cat per day. Ties produce multiple rows. |
| `stock_cats` | Pre-loaded stock cats used to fill the grid during cold start. Pulled from here nightly by the cron job. |

### Key columns and rules

**`submissions`**
- `user_id` — not null. Login required to submit.
- `voting_date` — set server-side at submission time using current Pacific time.
- `submitter_instagram` — stored without @ prefix.

**`catestants`**
- `voting_date` — denormalized from parent submission for fast grid queries.
- `ai_status`: `'pending' | 'passed' | 'failed'`
- `admin_status`: `'pending_review' | 'approved' | 'rejected'`
- Only catestants where `admin_status = 'approved'` are visible to the public.
- `is_stock` — true for pre-loaded stock cats used to fill the grid during the cold start period. Stock cats appear in the grid and are fully voteable but cannot win. The nightly cron only considers `is_stock = false` catestants when tallying winners.

**`stock_cats`**
- Stores pre-loaded cat photos that fill the grid when real submissions are low.
- `cat_name`, `cat_sex`, `photo_url`, `photo_storage_path` — same meaning as on `catestants`.
- Photos live in the `stock-cats` Supabase Storage bucket.
- No `voting_date` or `submission_id` — stock cats don't belong to a submission.
- The nightly cron pulls from this table, copies rows into `catestants` with that day's `voting_date`, `is_stock = true`, and `admin_status = 'approved'`.
- Stock cats are voteable but cannot win. The winner query always filters `is_stock = false`.

**`votes`**
- `user_id` — not null. Login required to vote.
- Two rules enforced by two separate unique indexes:
  1. `votes_one_per_user_per_cat` on `(user_id, catestant_id)` — one vote per user per catestant, free or purchased. Voting for the same cat twice is impossible regardless of credit balance.
  2. `votes_one_free_per_user_per_day` on `(user_id, voting_date) where vote_type = 'free'` — one free vote per user per day. After the free vote is used, further votes must come from purchased credits.
- `vote_type`: `'free' | 'purchased'`
- Catestants belong to one `voting_date` and disappear after that day, so Rule 1 is only ever relevant within a single day.

**`vote_credits`**
- `delta` — positive for purchases (+3 or +10), negative when a purchased vote is spent (-1).
- `source`: `'purchase' | 'spent'`
- `stripe_payment_intent_id` — populated on purchase rows.
- `catestant_id` — populated on spent rows.
- Never update rows. Always append. Balance = `SELECT SUM(delta) FROM vote_credits WHERE user_id = $1`.
- Credits never expire. Unused balance carries forward indefinitely.

**`winners`**
- `cotd_date` — the Cat of the Day date shown publicly. Always `voting_date + 1 day` from the winning catestant. Set by the nightly cron job.
- `tie_sequence` — 1-based ordering within a tie, sorted by `catestants.created_at` ascending.
- `portrait_url` — null until the Dutch Master portrait is generated.
- `winner_email_sent_at` — null until the notification email is sent.

### Row Level Security

RLS is enabled on all tables. Pattern:
- **Public read**: `catestants` (approved only), `votes`, `winners`
- **Own data only**: `submissions`, `vote_credits`
- **Service role only** (no public write policy on any table): all inserts and updates go through Next.js API routes using the service role key.

### Data flow notes

- **Display order is randomized client-side.** The DB returns catestants in insertion order; the page shuffles them on render.
- **Vote enforcement is two-layered.** The API route checks eligibility first (returning a clear error); the DB unique indexes are the hard backstop.
- **Nightly cron** (Vercel Cron Job, Pacific midnight): tallies votes per catestant → writes winner rows with `cotd_date = voting_date + 1` → triggers portrait generation → sends winner emails.