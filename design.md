# Catstac — Design System

This document describes the visual and interaction vocabulary used across the Catstac front-end. Every page reuses these primitives; if a new screen needs something new, add it here first.

## Brand palette

Defined as CSS variables in `app/globals.css:7-16`:

| Variable | Hex | Used for |
|---|---|---|
| `--color-bg` | `#DFDCCD` | Page background (warm khaki); modal fill on Intro / VoteConfirmation / VoteUsed |
| `--color-pink` | `#C60053` | Primary accent: CTAs, dividers, price labels, "Copy this link" button, package borders |
| `--color-gold` | `#847000` | Default text color; outline buttons; input borders |
| `--color-gold-bright` | `#E3C000` | Reserved for highlight moments (currently unused) |
| `--color-placeholder` | `#D6D2C4` | Upload-area / input borders in neutral state |

Never hardcode hex values — always reference the variables. Overlay scrims use `rgba(100, 97, 88, 0.78)` (see *Modal pattern* below).

## Typography

All three fonts are loaded via `next/font/google` in `app/layout.js` and exposed as CSS variables.

| Font | Variable | Role |
|---|---|---|
| Nunito | `--font-nunito` | Body, nav, most headings, inputs, buttons. The default. |
| Ballet | `--font-ballet` | Script styling for cat names on the large winner sash only. |
| Modak | `--font-modak` | Reserved — declared but not yet used in any rendered page. |

### Headings

- **Page titles** — Nunito, weight 400, 38px desktop / 28–30px mobile, color gold, centered.
- **Modal titles** — same scale as page titles (38px desktop / 30px mobile), Nunito. Exception: `IntroModal` uses Ballet script (52px) for "Welcome to Catstac."
- **Cat name on winner sash** (`app/winners/[id]/page.module.css`) — Ballet, `9.5cqi` desktop / `14cqi` mobile. `cqi` makes it scale with the image width.

### Body text

- **Default body** — Nunito, weight 400, 14.5–15px, color gold, line-height 1.5–1.65.
- **Emphasis / italics** — use `<em>` or the dedicated `.aside` / `.bodyItalic` classes; they remain gold and italic.
- **Links** — pink (`var(--color-pink)`) with `text-underline-offset: 2px`. See `.link` in `app/submit/page.module.css:326-330`.

## Layout & spacing

- **Root:** `html/body` inherits `var(--color-bg)` and `var(--font-nunito)` (see `globals.css:18-23`).
- **Page shell:** each page defines its own `.main` / `.page` wrapper with `min-height: 100vh` (or `calc(100vh - 88px)` below the navbar) and custom padding. Standard desktop padding is roughly `56px 20px 96px`; mobile shrinks to `40px 16px 80px`.
- **Content container:** most form-like pages wrap in an `.inner` div with `max-width: 720px; margin: 0 auto;`. Grid/detail pages use `max-width: 1200px`.
- **Reset:** `globals.css:1-5` zeroes `margin`, `padding`, and sets `box-sizing: border-box` globally. Anchor tags inherit color and drop the default underline.

## Responsive breakpoints

Breakpoints are intentionally not unified — each page declares its own based on the content. Common values:

| Breakpoint | Used on |
|---|---|
| `max-width: 640px` | Catestant detail, winner detail, winners grid, submit, submit/confirmation |
| `max-width: 480px` | `IntroModal`, `VoteConfirmationModal`, `VoteUsedModal` |
| `max-width: 768px` | Modal tablet step (only shrinks padding/font) |
| `min-width: 641px and max-width: 1024px` | Tablet on catestant / winner detail (arrow size only) |

Asset-based toggling: components with `_large` / `_small` image pairs (wordmark, arrows, vote button, sash gradient) render both as `<img>` and flip visibility with `display: none` / `display: block` at the breakpoint.

## Container queries

The winner detail sash (`app/winners/[id]/page.module.css`) uses container-query units (`cqi`) for fluid scaling. `.frame` declares `container-type: inline-size` so each `cqi` inside resolves to 1% of the image's rendered inline size. This keeps the sash, name, and meta text proportional across every viewport size without breakpoint tweaks.

If you add similar image-anchored overlays, follow the same pattern: mark the image's immediate wrapper `container-type: inline-size` and express sizes in `cqi`.

## Modal pattern

Three modals share one skeleton: `IntroModal`, `VoteConfirmationModal`, `VoteUsedModal`. Duplicate this pattern (don't refactor into a generic base) — each one needs small variations in padding, title typography, and dismissal behavior.

### Shell

```css
.overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(100, 97, 88, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background-color: var(--color-bg);
  border: 1.5px solid rgba(132, 112, 0, 0.25–0.35);
  border-radius: 20px;
  padding: 48px 56px 44px;  /* ~44–56px top/side, slightly less bottom */
  max-width: 520–580px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
```

### Internal rhythm

1. **Title** — gold, centered, no bottom margin beyond 18px.
2. **Divider** — pink, 80px wide, 2.5px thick (`border-top`), 24–28px margin-bottom.
3. **Body paragraphs** — centered gold Nunito, 14.5–15px, 1.5 line-height, 12–20px gap.
4. **Action zone** — single pink-pill primary (IntroModal "Got it!"), or outline-pill + text link (VoteConfirmation), or package grid + text link (VoteUsed).

### Dismissal

| Modal | ESC | Overlay click | Primary action |
|---|---|---|---|
| `IntroModal` | ❌ | ❌ | "Got it!" button only |
| `VoteConfirmationModal` | ✅ | ✅ | "Back to the Catstac" (navigates to `/`) |
| `VoteUsedModal` | ✅ | ✅ | Package button (stub) or "Back to the Catstac" link |

ESC handlers live inside each modal's `useEffect` with a `keydown` listener. Overlay click uses `onClick={onClose}` on the overlay with `e.stopPropagation()` on the modal body.

## Button styles

| Style | Example | Recipe |
|---|---|---|
| **Solid pink pill** | IntroModal "Got it!" | `background: var(--color-pink); color: #fff; border-radius: 100px; padding: 14px 52px; font-weight: 700` |
| **Outline gold pill** | VoteConfirmation "Back to the Catstac" | `background: transparent; border: 1.5px solid var(--color-gold); color: var(--color-gold); border-radius: 100px; padding: 12px 44px` |
| **Outline gold (rectangular)** | Submit "Cancel" / "Add another Catestant" | `border-radius: 8–24px` rectangle, otherwise same as above |
| **Solid pink (rectangular)** | Submit "Submit to the Catstac" | `border-radius: 8px; padding: 12px 28px; color: #fff` |
| **Pink text button** | "Copy this link", "Copy that link!" | `background: transparent; border: none; color: var(--color-pink); font-weight: 700` — swaps to "Copied!" for 1.8s after clipboard success |
| **Gold text link** | VoteUsed "Back to the Catstac" | Plain Nunito 15px, gold, underline-on-hover |
| **Package button** | VoteUsed `$1 / 3 votes` | `120×120` square, `border: 2px solid var(--color-pink)`, pink price (34px) over pink votes label (14px), subtle pink tint on hover |

All buttons use `transition: opacity 0.15s ease` (or background-color for package buttons) for hover. Active state is typically `transform: scale(0.97)`.

## Cards

Every form- or data-block on a page uses the same card chrome, duplicated across CSS Modules:

```css
.card {
  background: #fff;
  border-radius: 14px;
  padding: 24px 32px 28px;    /* 20px 18px 24px on mobile */
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07);
}
```

Found on: submit (per-cat + About You), submit/confirmation (per-submission), rules (per rule section), why (founder letter), winners grid (per winner with a sash overlay).

Cards stack vertically with `gap: 16px` (submit / confirmation) or `gap: 24px` (rules).

### Card header row

```
[cardLabel (pink, bold)]                 [actionBtn (gold outline pill)]
—————————————————————————————————— 0.75px gold horizontal rule
```

Used for: "Catestant #1" with "Remove" button, "About You" card header. See `app/submit/page.module.css:47-79`.

## Inputs

- **Text/email inputs** — full-width, `1.5px solid var(--color-placeholder)` border, `border-radius: 8px`, `padding: 10px 14px`, Nunito 14.5px gold. Focus ring: `border-color: var(--color-gold)`. Placeholders: gold at `opacity: 0.4`.
- **Read-only link inputs** (confirmation page, vote modal) — same as above but `border-color: var(--color-gold)` and `text-align: center` on the vote modal variant.
- **Radio (tom/queen)** — custom `18×18` circle, 2px gold border; checked state fills pink with matching border. The native input is absolutely-positioned and hidden; a sibling `<span class="radioCustom">` provides the visual.
- **Checkbox** — `18×18` 2px pink border, `border-radius: 4px`. Checked state fills pink and renders a white check via `::after` (rotated `border-left`/`border-bottom` trick). See `app/submit/page.module.css:290-316`.

## Image-anchored overlays

### Winner sash (large, `/winners/[id]`)

- Two-image gradient (`winner_gradient_large.png` / `_small.png`) layered behind text.
- Cat name in Ballet at `9.5cqi` (desktop) / `14cqi` (mobile).
- Meta block ("Official Catstac Cat of the Day" + date) stacks right-aligned desktop, centered mobile.
- Positioned `bottom: -10cqi` desktop, `bottom: -33cqi` mobile so the sash overhangs the image. On mobile, `.stage` needs `row-gap: calc(33vw + 24px)` to keep prev/next arrows from sliding behind the overhang.

### Winner sash (small, `/winners` grid)

- Same gradient assets but compact; name + date on a single line at the bottom of each card.

### Cat of the Day banner (home)

- Same gradient + rosette badge. Uses both `_large` and `_small` asset pairs swapped by media query.

## Prev / next navigation

Any detail page (catestant, winner) uses a three-column grid:

```
grid-template-columns: auto minmax(0, 1006px) auto
grid-template-areas: "prev image/frame next"
```

Arrow assets: `previous_arrow_large.png` / `next_arrow_large.png` (64px high desktop, 48px tablet) + `_small.png` (40px mobile). Mobile collapses to:

```
"image image"       (or "frame frame")
"prev  next"
```

with spacing pushed below any overhanging sash via `row-gap`.

## Vote button

Lives inside `.voteCell` on the catestant detail page. Renders one of four images depending on state × viewport:

| State | Desktop | Mobile |
|---|---|---|
| Unvoted | `vote_button_large.png` | `vote_button_small.png` |
| Voted | `vote_confirmed_button_large.png` | `vote_confirmed_button_small.png` |

Hover `scale(1.04)`, active `scale(0.97)`. Aria state via `aria-pressed` + `aria-label`.

## Navbar

Three-column flex:

- **Left** — `menu_large.png` / `menu_small.png` hamburger → toggles `HamburgerMenu` slide-in. When open, the icon swaps to an inline SVG X.
- **Center** — `wordmark_large.png` / `wordmark_small.png`.
- **Right** — `button_cat_top_large.png` / `button_cat_top_small.png` "Add a Cat" link to `/submit`.

Navbar is rendered by `app/layout.js` on every page. Detail pages subtract `88px` from `100vh` to account for it.

## Hamburger menu

Slide-in right panel (see `app/HamburgerMenu.module.css`). Link list: Home, Winners, Rules, Why Catstac?, and (bottom-anchored) Sign In / Sign Out. Backdrop is a translucent overlay that closes the menu on click.

## Assets

All raster assets live under `public/assets/`. Naming is consistent: paired assets share a stem with `_large` / `_small` suffixes.

| Asset group | Files |
|---|---|
| Wordmark | `wordmark_large.png` / `_small.png` |
| Nav icons | `menu_large.png` / `_small.png`, `button_cat_top_large.png` / `_small.png`, `button_cat_bottom.png` |
| Arrows | `previous_arrow_large.png` / `_small.png`, `next_arrow_large.png` / `_small.png` |
| Vote buttons | `vote_button_large.png` / `_small.png`, `vote_confirmed_button_large.png` / `_small.png` |
| Winner sash | `winner_gradient_large.png` / `_small.png`, `winner_text_large.png` / `_small.png`, `rosette_large.png` / `_small.png` |
| Cat of the Day banner | `banner_cotd_large.png` / `_small.png` |

`reference_designs/` holds PNG mocks used during build. Consult these before implementing a new screen — filenames map to pages (e.g. `submit_default.png`, `submit_two_cats.png`, `winner_detail.png`, `vote_confirmation.png`, `vote_used.png`).

## Interaction patterns

- **Clipboard copy** — both "Copy this link" (submit/confirmation) and "Copy that link!" (vote confirmation) use `navigator.clipboard.writeText(url)`, set a local `copied` flag, and swap the label to "Copied!" for 1.8s. Failure is silent.
- **Optimistic state** — the vote button immediately flips visuals (no network wait); future backend integration should preserve this feel.
- **Daily vote semantics** — `localStorage.catstac_daily_vote = { catId, date: YYYYMMDD }`. Revisiting the voted cat shows the confirmed asset; voting on a different cat shows `VoteUsedModal` instead of registering a new vote. Storage expires naturally at midnight.
- **One-time intro** — `localStorage.catstac_intro_dismissed = 'true'` when the user opts out of the welcome modal.

## Open design questions

Flows below are visually speced (see `reference_designs/`) but not implemented because they require auth and/or payments. When adding, pattern them on the existing modal + card vocabulary described above.

- **Sign in / sign out** — `/signin` route linked from the hamburger menu.
- **Purchase flow** — `VoteUsedModal`'s package buttons take an `onPurchase(pkg)` callback that's currently unused.
- **Terms page** — `/terms` linked from the submit-form agreement checkbox.
