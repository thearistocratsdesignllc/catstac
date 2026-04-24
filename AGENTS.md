<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Catstac

A Next.js 16 / React 19 front-end for a daily cat-photo contest. Users browse a grid of "Catestants," view per-cat detail pages, cast one free vote per day, purchase extra votes, submit their own cats, and browse past winners.

The login and payment flows are **not** built yet — everything else is.

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
| `/submit` | `app/submit/page.js` | Multi-catestant submission form (up to 10 cats, per-cat upload + name + sex, plus "About You" card). |
| `/submit/confirmation` | `app/submit/confirmation/page.js` | Post-submit thank-you with one share card per submitted cat. Mock data lives at the top of the file. |
| `/rules` | `app/rules/page.js` | Static rules content. |
| `/why` | `app/why/page.js` | Founder letter. |

Routes referenced in the UI but not yet implemented: `/signin` (linked from hamburger menu), `/terms` (linked from submit checkbox).

## Shared components

Rendered by `app/layout.js` on every page:

- **`NavBar`** (`app/NavBar.js`) — hamburger button (left), wordmark (center), "Add a Cat" button (right). Opens `HamburgerMenu`.
- **`HamburgerMenu`** (`app/HamburgerMenu.js`) — slide-in panel with Home / Winners / Rules / Why, Catstac? / Sign In-Out.

Page-scoped components:

- **`IntroModal`** (`app/IntroModal.js`) — first-visit welcome modal. Dismissed via `localStorage.catstac_intro_dismissed = 'true'` when the user checks "Never ever ever show me this message again."
- **`VoteButton`** (`app/catestant/[id]/VoteButton.js`) — client component that persists the user's daily vote in `localStorage` and conditionally opens one of two modals (see *State & persistence* below).
- **`VoteConfirmationModal`** (`app/catestant/[id]/VoteConfirmationModal.js`) — opens after recording a vote; shows the direct link and a copy button.
- **`VoteUsedModal`** (`app/catestant/[id]/VoteUsedModal.js`) — opens when the user tries to vote after already using today's free vote; shows two purchase packages ($1 / 3 votes, $5 / 10 votes) and a back link. `onPurchase` prop is a no-op stub — wire it up to the real payment flow once it exists.

## Data layer (mock)

There is no backend. All page data comes from in-repo JS modules:

- `app/catsData.js` — today's Catestants + `getCatNeighbors(id)` for prev/next on the detail page. Uses Unsplash URLs.
- `app/winnersData.js` — past winners + `getWinnerById(id)` / `getWinnerNeighbors(id)`.

The submit and confirmation pages use `useState` / mock constants for their data — no persistence.

When a backend is introduced, swap these mock modules for real fetchers; route handlers should keep the same shape (`{ cat/winner, prev, next }`) so existing pages don't need refactors.

## State & persistence

- **`localStorage.catstac_intro_dismissed`** — `'true'` suppresses `IntroModal` permanently.
- **`localStorage.catstac_daily_vote`** — `{ catId, date: 'YYYYMMDD' }`. `VoteButton` reads this on mount to determine whether *this* page's cat was voted for (show the confirmed-vote asset), or a *different* cat was voted for today (clicking vote opens `VoteUsedModal` instead of recording a new vote). Date stamp expires naturally when the calendar day rolls over.

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

- **Auth** — `/signin` route, session handling, user-scoped vote storage.
- **Payments** — wiring `VoteUsedModal`'s `onPurchase` prop to a checkout flow; persisting purchased vote balances.
- **Backend** — replacing `catsData.js` / `winnersData.js` with real data sources; persisting submissions from `/submit`.
- **Terms page** — linked from the submit form's agreement checkbox.
