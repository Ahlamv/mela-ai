# Mela AI browser prototype

An interactive Next.js reference for the Flutter team. The [app flow](docs/ux/mela-ai-app-flow.pdf) defines behavior and the [supplied app screenshot](docs/ux/visual-reference.png) defines the visual direction. See [UX guidance](docs/ux/README.md).

## Run locally

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Node.js 20.9 or newer is required. No Flutter or Dart installation is needed.

## Prototype features

- Home, products, sales and forecasts with floating pill navigation.
- First-use welcome, sample-shop exploration, or an empty local demo with a shop name.
- Illustrated onboarding for stock, sales and restocking, with logo, product-card and stock-count motion; reduced-motion support.
- Sign-in, account creation, demo email verification, password recovery and shop setup screens. These are UI flows; credentials are never stored or sent, and no authenticated session is created.
- A consistent outlined icon family, neutral icon tiles and orange active accents.
- Locally bundled Manrope, the supplied Mela AI logo, and animated pill navigation with reduced-motion support.
- Search and filter by low-stock or out-of-stock status.
- Add and edit products with input validation and unsaved-change handling.
- Record sales and reduce stock together, reject excess quantities, and prevent duplicate confirmations.
- Review sales history and current stock.
- View labelled sample seven-day estimates, transparent restock arithmetic, and insufficient-history states.
- Record incoming stock separately from buying decisions. This flow remains a proposed backend addition in the PDF.
- Keep sample records in local browser storage and reset them from the demo-shop settings.
- Export a JSON backup; preserve entries on failed storage writes; guard unsaved product, sale and receipt forms.

## Scope

All products, sales and estimates are sample data. Forecast charts are not trained model output. The prototype has no production authentication, API connection, payment processing, supplier ordering or offline synchronization.

Safety stock is zero for the demo recommendation. Low-stock levels are editable prototype defaults, not a finalized stock policy. Forecast recommendations update immediately when local stock changes; daily demand remains the labelled sample series.

## Project structure

- `app/`: Next.js App Router entry, metadata and CSS design tokens.
- `components/mela-app.tsx`: reusable UI and the main task flows.
- `lib/demo-data.ts`: typed sample data, stock helpers and data validation.
- `lib/shop-actions.ts`: stock and sale transactions with request identity checks.
- `tests/shop-actions.test.mjs`: domain regression checks.
- `docs/ux/`: agreed flow, visual reference and implementation guidance.

Use `npm run typecheck` for TypeScript and `npm run build` for the production build. Flutter developers can recreate the UI and interactions against the same flow; this web code does not automatically compile to Flutter.

Run `npm test` with Node.js 22.18 or newer. See `design-qa.md` for current verification status; the latest visual review is blocked by browser access policy.

## Development edge case review

`npm run dev` shows a development-only data switch below the phone. Use `/?data=worst` for long names, non-Latin text, zero prices, large amounts and mixed stock states. Other values are `demo`, `empty`, `one` and `huge` (1,284 products and sales). Choose **Saved shop** to return to normal storage.

Fixture edits are temporary and never overwrite the saved shop. The selected dataset survives a page reload in the URL; switching datasets resets temporary edits. The switch and fixture module are excluded from the production page. See [the font and break-ui review](docs/ux/qa/break-ui-review.md) for findings and proposed fixes. Browser verification remains pending.

## Onboarding and account preview

Open `/onboarding` to replay the introduction, use the **Onboarding & sign in** preview link, or choose **Welcome tour & account screens** in shop settings. The earlier `/?onboarding=1` link also works on page load. New visitors see the tour automatically; existing saved shops see it once after this update. Completing the tour stores a preference separately from shop data. It is not an authentication session.

The account screens use example details and the visibly labelled verification code `123456`. Sign-in opens an existing local demo, or continues to shop setup when none exists. Creating an account or resetting a password previews those interactions without sending email or creating credentials. Existing shop records are preserved throughout. Provider choice, email/phone identity and shop access control still need backend agreement.

The three [Storyset Amico illustrations, source links and attribution details](docs/ux/onboarding-assets.md) are included in the repository. Browser rendering and animation timing remain unverified because of the existing browser access restriction.
