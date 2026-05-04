<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Catstac

A Next.js 16 / React 19 front-end for a daily cat-photo contest. Users browse a grid of "Catestants," view per-cat detail pages, cast one free vote per day, purchase extra votes, submit their own cats, and browse past winners.

Built and wired to Supabase end-to-end:
- Google OAuth sign-in (`/signin` + `/auth/callback`).
- Submission pipeline (`/submit` → `/api/submit` → `submissions` + `catestants` + `catestants` storage bucket, with OpenAI photo validation; auto-approves on AI pass).
- Home grid + catestant detail + winner detail all read from Supabase.
- Vote casting (`VoteButton` → `/api/vote`), with free-vote-per-day + purchased-credit fallback enforced server-side and backed by DB unique indexes.
- Nightly cron (`/api/cron/nightly`) tallies yesterday's votes into `winners` and idempotently backfills today's grid from `stock_cats`.

Not built yet: payments to top up `vote_credits`, admin queue UI for failed-AI cats, and the `/terms` page. See *Things not yet built*.

For visual conventions (colors, typography, modal pattern, card pattern, responsive rules), read `design.md`.

## Stack & scripts

- **Framework:** Next.js `16.2.3`, React `19.2.4`, App Router (all routes under `app/`).
- **Styling:** CSS Modules (one `.module.css` per route/component). Global vars live in `app/globals.css`. Tailwind v4 is installed but currently unused — CSS Modules are the convention.
- **Fonts:** Nunito (body + most headings), Ballet (decorative cat names on the winner sash), Modak (reserved). Loaded via `next/font/google` in `app/layout.js` and exposed as CSS variables (`--font-nunito`, `--font-ballet`, `--font-modak`).
- **Scripts:** `npm run dev` / `npm run build` / `npm run start` / `npm run lint`.

## Routes

| Path | File | Notes |
|---|---|---|
| `/` | `app/page.js` | Home: Cat of the Day banner + today's Catestant grid (queries `catestants` via `getTodaysCats` in `app/catsData.js`). Renders `IntroModal`. |
| `/catestant/[id]` | `app/catestant/[id]/page.js` | Cat detail. Photo via `<CatImage>` (orientation-aware, tap-to-open-fullsize). Prev/next via arrows + `<SwipeNav>` mobile gesture, both routing through ids returned by `getCatNeighbors` so the sequence matches the grid. Initial vote state seeded server-side and passed to `<VoteButton>`. 404 if the row is missing or not `admin_status='approved'`. |
| `/winners` | `app/winners/page.js` | Grid of past winners with inline name/date sash (queries `winners` via `getWinners` in `app/winnersData.js`). |
| `/winners/[id]` | `app/winners/[id]/page.js` | Winner detail. Photo + sash via `<WinnerFrame>` (orientation-aware, tap-to-open-fullsize). Prev/next via arrows + `<SwipeNav>` over the wraparound list from `getWinnerNeighbors`. |
| `/submit` | `app/submit/page.js` | Multi-catestant submission form (up to 10 cats, per-cat upload + name + sex, plus "About You" card). Gated — `proxy.js` redirects unauthenticated users to `/signin?redirectTo=/submit`. Uploads each photo directly to the `catestants` Storage bucket from the browser (sidesteps Vercel's 4.5MB API body limit), then POSTs JSON `{ email, instagram, agreed, cats: [{ id, name, sex, photo_url, photo_storage_path }] }` to `/api/submit` and shows a "Validating your cats…" overlay while the request is in flight. |
| `/submit/confirmation` | `app/submit/confirmation/page.js` | Post-submit thank-you with one share card per *passing* cat plus an inline callout for any that failed AI validation. Reads the result from `sessionStorage.catstac_submission_result` (written by `/submit` immediately before `router.push`). Renders an empty state if the storage key is absent (e.g. direct-URL navigation). |
| `/rules` | `app/rules/page.js` | Static rules content. |
| `/why` | `app/why/page.js` | Founder letter. |
| `/signin` | `app/signin/page.js` + `app/signin/SignInClient.js` | Google OAuth sign-in. Reads `redirectTo` from the query string and threads it through the callback. |
| `/auth/callback` | `app/auth/callback/route.js` | OAuth code-exchange handler. Calls `supabase.auth.exchangeCodeForSession(code)` then redirects to `redirectTo` (must start with `/`). |
| `/api/submit` | `app/api/submit/route.js` | Auth-gated POST handler for the submission form. Accepts JSON (photos are already in Storage from the browser upload). Creates the `submissions` row, inserts a `pending_review` `catestants` row per cat, runs OpenAI validation against the public photo URL, then updates each row — pass auto-promotes to `admin_status='approved'` (cat is in the grid immediately), fail leaves it at `pending_review` for the manual queue. Returns `{ submission_id, voting_date, cotd_date, passed, failed }`. |
| `/api/vote` | `app/api/vote/route.js` | Auth-gated POST handler for `<VoteButton>`. Body: `{ catestant_id }`. Enforces "one vote per cat per user" + "one free vote per voting_date"; falls back to a purchased credit if the free vote is spent. See *Vote API* below. |
| `/api/cron/nightly` | `app/api/cron/nightly/route.js` | Vercel-cron-only GET handler, gated by `Authorization: Bearer ${CRON_SECRET}`. Tallies yesterday's votes into `winners` and idempotently backfills today's `catestants` grid from `stock_cats` up to 100. See *Nightly cron* below. |

Routes referenced in the UI but not yet implemented: `/terms` (linked from submit checkbox).

## Shared components

Rendered by `app/layout.js` on every page:

- **`NavBar`** (`app/NavBar.js`) — hamburger button (left), wordmark (center), "Add a Cat" button (right). Opens `HamburgerMenu`.
- **`HamburgerMenu`** (`app/HamburgerMenu.js`) — slide-in panel with Home / Winners / Rules / Why, Catstac? / Sign In-Out.

Shared client component:

- **`SwipeNav`** (`app/SwipeNav.js`) — wraps detail-page stages and translates left/right touch swipes into `router.push(prevHref|nextHref)`. Triggers only when `|dx| ≥ 50px` AND `|dy| < 80px`, so vertical scrolling stays unaffected. Single-finger only — multi-touch (pinch-zoom) is ignored.

Page-scoped components:

- **`IntroModal`** (`app/IntroModal.js`) — first-visit welcome modal. Dismissed via `localStorage.catstac_intro_dismissed = 'true'` when the user checks "Never ever ever show me this message again."
- **`CatImage`** (`app/catestant/[id]/CatImage.js`) — client component for the catestant photo. Detects landscape vs portrait on `onLoad` (via `naturalWidth`/`naturalHeight`) and applies the matching orientation class so portrait photos render tall instead of being cropped to a fixed landscape frame. Wraps the `<img>` in `<a target="_blank">` so a tap on mobile opens the raw image in a new tab where the browser's native pinch-zoom works. Pass `key={cat.id}` from the parent so prev/next navigation remounts and orientation state resets.
- **`WinnerFrame`** (`app/winners/[id]/WinnerFrame.js`) — same orientation/tap-to-zoom pattern as `CatImage`, but owns the entire frame (image + sash) so the orientation class lives on the sash's container. Pass `key={winner.id}`.
- **`VoteButton`** (`app/catestant/[id]/VoteButton.js`) — client component. POSTs to `/api/vote` with `{ catestant_id }`. Outcomes: `200` → flip to confirmed asset and open `VoteConfirmationModal`; `409 already_voted` → flip to confirmed (no modal); `402 no_credits` → open `VoteUsedModal`; `401` → `router.push('/signin?redirectTo=…')`. The `initialVoted` prop is hydrated server-side from a `votes` lookup in the detail page, so the confirmed asset shows immediately on a re-visit without flicker.
- **`VoteConfirmationModal`** (`app/catestant/[id]/VoteConfirmationModal.js`) — opens after recording a vote; shows the direct link and a copy button.
- **`VoteUsedModal`** (`app/catestant/[id]/VoteUsedModal.js`) — opens when the vote API rejects with `no_credits`; shows two purchase packages ($1 / 3 votes, $5 / 10 votes) and a back link. `onPurchase` prop is a no-op stub — wire it up to the real payment flow once it exists.

## Data layer

Read-side helpers wrap Supabase queries so pages stay declarative.

- `app/catsData.js` — `getTodaysCats()` returns today's approved `catestants` for the home grid; `getCatNeighbors(id)` returns `{ prev, next }` for the detail page. Both go through one private `fetchTodayCatestants` helper that orders by `(created_at asc, id asc)` and filters `admin_status='approved'`. `getCatNeighbors` fetches the entire day, finds the current id by index, and returns the wraparound prev/next — guaranteeing the detail-page sequence is exactly the grid sequence. Voting_date is Pacific-time via `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' })`.
- `app/winnersData.js` — `getWinners()` returns all past winners (most recent `cotd_date` first, ties ordered by `tie_sequence`); `getWinnerById(id)` and `getWinnerNeighbors(id)` use the same fetch + index pattern as the catestant helpers.

## State & persistence

The vote state lives in Supabase (`votes` + `vote_credits`); the catestant detail page hydrates `initialVoted` server-side so the UI reflects DB truth on every navigation. Only two browser-storage keys remain, both for UI ergonomics (not source of truth):

- **`localStorage.catstac_intro_dismissed`** — `'true'` suppresses `IntroModal` permanently.
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

- **Sign-out wiring** in `HamburgerMenu`. Sign-in itself is implemented; see *Auth* below.
- **Payments** — wiring `VoteUsedModal`'s `onPurchase` prop to a Stripe checkout flow and inserting `vote_credits` rows on successful payment intent.
- **Admin queue UI** — failed-AI and pending-review catestants pile up in the DB; no UI surfaces them yet.
- **Winner portrait + email** — `winners.portrait_url` and `winner_email_sent_at` are still null after the cron writes a winner row; the cron currently only does the tally + stock backfill.
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
| `app/submit/page.js` | Client form. Stores the `File` object alongside the preview URL. On submit, generates a UUID per cat, uploads each photo directly to `catestants/<user_id>/<catestant_id>.<ext>` via the browser Supabase client (`Promise.all` over the cat list), then POSTs JSON `{ email, instagram, agreed, cats: [{ id, name, sex, photo_url, photo_storage_path }] }` to `/api/submit`. Renders a full-screen "Validating your cats…" overlay (modal-style, see `design.md`) while the upload + validation are in flight, plus inline error / "didn't pass" banners. Validation errors scroll the banner into view. |
| `app/api/submit/route.js` | Auth-gated POST handler. Parses JSON, verifies each `photo_storage_path` starts with `<user.id>/` (defense in depth — RLS already enforces this on upload). All DB writes use `supabaseAdmin`; only `auth.getUser()` uses the cookie SSR client. |
| `app/submit/confirmation/page.js` | Reads `sessionStorage.catstac_submission_result` on mount; renders one share card per passing cat plus a "didn't pass validation" callout for failed cats. Direct-link URLs are `https://www.catstac.com/catestant/<id>`. |
| `supabase/migrations/002_storage_buckets.sql` | Creates the public `catestants` bucket and the `select` policy on `storage.objects` for it. |
| `supabase/migrations/003_storage_uploads.sql` | Adds the `insert` policy on `storage.objects` that lets authenticated users upload to their own folder (`<user_id>/...`) within the `catestants` bucket. Required for the browser-direct upload flow. |

### Client flow (`app/submit/page.js`)

The browser does the upload itself so the API request stays small (Vercel limits API route bodies to 4.5MB):

1. **Validate locally.** Email, terms, per-cat photo + name. On any miss, `showError(...)` sets the banner and `scrollIntoView` brings it into view.
2. **Get the session.** `createClient()` (browser) → `supabase.auth.getUser()`. If no user, error out (the proxy normally prevents this, but defend anyway).
3. **Upload all photos in parallel.** For each cat: generate `crypto.randomUUID()`, derive `<ext>` from the file (jpg/png), upload to `catestants/<user_id>/<catestant_id>.<ext>`, then resolve `getPublicUrl(...)`. Storage RLS (migration 003) enforces that the path's first folder matches `auth.uid()`. If any upload fails, abort the whole submit with an error.
4. **POST JSON to `/api/submit`.** Body: `{ email, instagram, agreed, cats: [{ id, name, sex, photo_url, photo_storage_path }] }`.

### Server flow (`app/api/submit/route.js`)

1. **Auth gate.** `await createClient()` → `supabase.auth.getUser()`. If no user, return 401. (The route isn't in `proxy.js`'s `PROTECTED_PATHS`, so the proxy doesn't redirect — the route enforces auth itself.)
2. **Parse + validate.** Read JSON. Check `email`, `instagram` (strip leading `@`), `agreed`, and the `cats` array. For each cat: require a valid UUID `id`, non-empty `name`, `sex` ∈ `{tom, queen}`, `photo_url`, and `photo_storage_path`. Reject with 400 + human-readable message on any miss.
3. **Authorize photo paths.** Each `photo_storage_path` must start with `<user.id>/`. Storage RLS already prevents writing outside that prefix on upload, but a malicious client could still POST a URL pointing at someone else's photo — the server rejects with 403.
4. **Compute `voting_date`.** Pacific-time `YYYY-MM-DD` via `Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' })`. `cotd_date` is `voting_date + 1 day`, returned to the client for display only — the row in `winners` is the source of truth, written by the nightly cron.
5. **Insert `submissions` row.** `supabaseAdmin.from('submissions').insert({...}).select().single()`. If this fails, return 500 — no per-cat work happens.
6. **Per-cat loop.** For each cat, in order:
   1. Insert the `catestants` row using the client-supplied `id`, `photo_url`, `photo_storage_path`, with `ai_status = 'pending'`, `admin_status = 'pending_review'`, `is_stock = false`. The catestant primary key matching the storage path's UUID is what keeps row and object aligned.
   2. Call OpenAI vision (`gpt-4o-mini`, JSON-schema response format with `contains_cat` / `has_humans` / `is_ai_generated` / `reason`) against `photo_url`. Pass = `contains_cat && !has_humans && !is_ai_generated`.
   3. **Update — never delete.** Pass → `ai_status = 'passed'`, `admin_status = 'approved'`, `admin_reviewed_at = now()`, full result in `ai_result`, `ai_validated_at = now()` — the cat goes straight into today's grid with no human in the loop. Fail → `ai_status = 'failed'`, full result in `ai_result`, `admin_status` stays `pending_review` so the failed row lands in the manual-review queue. If OpenAI itself errors out, the row is left at `ai_status = 'pending'` (and `admin_status = 'pending_review'`) and the cat is reported to the client as "will be reviewed manually." If the API call fails entirely after the photo is in Storage, the orphaned object is left for an admin sweep — same trade-off as before.
7. **Response.** `{ submission_id, voting_date, cotd_date, passed: [{ id, name, photo_url }], failed: [{ name, reason }] }`. Failure reasons are pre-formatted human-readable strings composed from the boolean flags (e.g. "No cat detected. A human is visible.").

### Client outcomes (`app/submit/page.js`)

| Server result | Client behavior |
|---|---|
| `passed.length > 0` (all or partial) | Write the full response to `sessionStorage.catstac_submission_result`, then `router.push('/submit/confirmation')`. Confirmation renders share cards for `passed` + an inline callout for `failed`. |
| `passed.length === 0` | Stay on the form. Render the error banner + the per-cat failure list so the user can fix and retry. **No navigation.** |
| Network or non-200 error | Stay on form, render the error banner. The submit button re-enables. |

### Storage bucket

Bucket name: `catestants`, public. RLS on `storage.objects`:
- `select` policy scoped to `bucket_id = 'catestants'` (migration 002) — anyone can read the public URLs.
- `insert` policy scoped to `bucket_id = 'catestants' AND (storage.foldername(name))[1] = auth.uid()::text` (migration 003) — authenticated users can upload, but only into a folder named after their own UID. No public update or delete policy. The service-role client still bypasses RLS for any admin housekeeping.

Stock cats use a separate `stock-cats` bucket (mentioned in `001`'s comments; bucket creation is out of scope for this migration since the cron job manages it).

Storage path convention: `<user_id>/<catestant_id>.<ext>`. Both IDs are UUIDs, so paths are inherently unique. The catestant_id in the path matches the `catestants.id` of the corresponding row (the browser generates it before the upload and the API route inserts the row with that same id). The same path is stored on the `catestants` row as `photo_storage_path`, and the corresponding `getPublicUrl(...)` result is stored as `photo_url`.

## Vote API

End-to-end path from `<VoteButton>` to a row in `votes`.

### Server flow (`app/api/vote/route.js`)

1. **Auth gate.** `await createClient()` → `supabase.auth.getUser()`. If no user, return `401 unauthorized`.
2. **Look up the catestant.** Read `voting_date` and `admin_status`. If missing or not approved, return `404 not_found` — defends against voting on non-public cats.
3. **Rule 1 check** (one vote per user per catestant). If a `votes` row already exists for `(user.id, catestant_id)`, return `409 already_voted` with the user's current credit balance.
4. **Rule 2 check** (one free vote per user per voting_date). Look for a `votes` row at `(user.id, catestant.voting_date, vote_type='free')`.
   - **If absent** — insert with `vote_type='free'`, return `{ vote_type: 'free', credit_balance }`. A unique-violation race (`23505`) collapses to `409 already_voted`.
   - **If present** — fall through to the credit path.
5. **Credit path.** Compute `SUM(delta)` from `vote_credits` for the user. If `≤ 0`, return `402 no_credits`. Otherwise insert the vote with `vote_type='purchased'` first (the unique index is the source of truth), then append a `delta=-1, source='spent', catestant_id=…` row to `vote_credits`. Vote-insert failures `23505` collapse to `409 already_voted`. If the credit-debit insert fails *after* the vote was recorded, the vote stands and the ledger is logged for manual reconciliation — the index of truth is `votes`, not `vote_credits`.

All writes use `supabaseAdmin`; only `auth.getUser()` uses the cookie SSR client. The route is not in `proxy.js`'s `PROTECTED_PATHS`, so the route enforces auth itself.

### Client outcomes (`<VoteButton>`)

| Server result | Client behavior |
|---|---|
| `200` (`vote_type=free`) | Set `voted=true`, open `VoteConfirmationModal`. |
| `200` (`vote_type=purchased`) | Same as free for now — `credit_balance` is in the response if/when we surface it. |
| `409 already_voted` | Set `voted=true` (idempotent UX); no modal. |
| `402 no_credits` | Open `VoteUsedModal` (purchase prompt). |
| `401` | `router.push('/signin?redirectTo=/catestant/<id>')`. |
| `404 not_found` / `400 invalid_body` / 5xx | Stay on the page, log; no modal. |

## Nightly cron

`app/api/cron/nightly/route.js` is a `GET` handler scheduled by `vercel.json` at `0 8 * * *` (08:00 UTC = midnight Pacific in PST, 1am in PDT).

### Auth

Header: `Authorization: Bearer ${CRON_SECRET}`. The route returns `401 unauthorized` if `CRON_SECRET` is unset or the header doesn't match. **Set `CRON_SECRET` in the Vercel project env before the first scheduled run** — Vercel sends this header automatically when the env var is configured. Locally you can hit it manually with `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/nightly`.

### What it does each run

1. **Compute dates.** `today = pacificDateString()`, `yesterday = today - 1`. `cotd_date = today` (publicly displayed Cat-of-the-Day date is always `voting_date + 1`).
2. **Tally yesterday's winners.** Pull `votes.catestant_id` for `voting_date = yesterday`. Group + count in JS. Filter joined catestants to `is_stock=false AND admin_status='approved'` (stock cats can't win by design). Find max vote count, sort tied catestants by `created_at` ascending, then insert one `winners` row per tied cat with `tie_sequence = 1..N` and `cotd_date = today`.
3. **Backfill today's grid.** Idempotent: count *all* approved catestants (real + already-inserted stock) for `voting_date = today`. If `< 100`, Fisher-Yates over `stock_cats`, take the deficit, and insert into `catestants` with `voting_date = today`, `is_stock = true`, `ai_status = 'passed'`, `admin_status = 'approved'`. **Counting only `is_stock=false` would re-fill the grid every run and create duplicates** — don't.
4. **Response.** `{ ok, voting_date_tallied, cotd_date, winners: { inserted, vote_count }, stock: { added, real_count, total } }`.

### Manual cleanup of pre-fix duplicates

Older grids may contain duplicate stock-cat rows from a `backfillStockCats` that counted only `is_stock=false`. The fix prevents new duplicates but doesn't clean up existing ones. Run this in the Supabase SQL editor to remove them, keeping the earliest-inserted row per `(voting_date, photo_storage_path)` — which is the same row the new grid order picks anyway:

```sql
with ranked as (
  select id, row_number() over (
    partition by voting_date, photo_storage_path
    order by created_at asc, id asc
  ) as rn
  from public.catestants
  where is_stock = true
)
delete from public.catestants where id in (select id from ranked where rn > 1);
```

`votes.catestant_id` is `on delete cascade`, so phantom votes attached to duplicates go with them. `winners.catestant_id` is `on delete restrict` — but stock cats can't be winners, so the delete is safe in practice.

## Database (Supabase)

Schema lives in `supabase/migrations/`:
- `001_initial_schema.sql` — tables, enums, indexes, RLS policies.
- `002_storage_buckets.sql` — creates the public `catestants` storage bucket and a `select` policy on `storage.objects` for it. Run this once in the Supabase SQL editor after `001`.
- `003_storage_uploads.sql` — adds the `insert` policy on `storage.objects` that lets authenticated users upload to `catestants/<user_id>/...`. Required for the browser-direct upload flow. Run this once after `002`.

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
- `CRON_SECRET` — server-only. Bearer secret the nightly cron checks before tallying votes / backfilling stock. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when this env var is set on the project.

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

- **Grid order is deterministic** — `created_at` ascending with `id` as a tie-breaker. Both `getTodaysCats` (the home grid) and `getCatNeighbors` (detail-page prev/next) share the same ordering helper, so swiping/clicking through the detail page traverses cats in the exact sequence the grid renders. The id tie-breaker matters because the cron's batched stock-cat insert can land multiple rows on an identical `created_at`.
- **Vote enforcement is two-layered.** The API route checks eligibility first (returning a clear error); the DB unique indexes are the hard backstop.
- **Nightly cron** (Vercel Cron Job, 08:00 UTC = Pacific midnight in PST / 1am in PDT): tallies yesterday's votes per non-stock catestant → writes winner rows with `cotd_date = voting_date + 1` → backfills today's grid up to 100 cats from `stock_cats` if real submissions are short. The stock-cat backfill is **idempotent**: it counts every approved catestant for the day (real + stock) before deciding how many to add, so a re-run inserts nothing if the grid is already at 100.