# Mela AI font and break-ui review

Reviewed 25 October 2026 using Emil Kowalski's [break-ui skill](https://github.com/emilkowalski/skills/tree/main/skills/break-ui).

## Evidence and scope

This is a source review and executable fixture handoff, not a completed visual audit. Browser access to localhost was denied by the browser tool's URL policy earlier in this chat. No alternate capture route was used. Current screenshots, 320px rendering, 200% browser zoom, keyboard interactions and performance measurements remain pending. Layout failures below are **predicted from CSS**, while copy, schema limits and formatting behavior are verified from code or direct execution.

Reviewed Home, Products, product details, add/edit forms, Sales, history, Receive stock, Forecasts, settings and setup. Existing screenshots in this directory predate this review.

## Font visibility

Manrope is correctly loaded locally with weights 200–800 in `app/layout.tsx:5`, and applied through the body in `app/globals.css:21`.

The hierarchy is readable in principle, but many functional labels are too small for a comfortable phone experience. This is a design assessment, not a claim that font size alone fails an accessibility standard.

- Body: 14px. Keep 14px as the minimum for product names and normal reading; consider 16px for longer explanatory paragraphs.
- Product names: 13px, reduced to 12px at ≤360px. Recommend 14px at every phone width, allowing another line.
- Quick actions: 10px, reduced to 9px at ≤360px. Recommend 12px, wrapping the label when needed.
- Stock badges: 10px, reduced to 9px at ≤360px. Recommend 12px.
- Active navigation labels: 11px, reduced to 10px at ≤360px. Recommend 12px with enough width for “Forecasts”.
- Shop name: 11px, reduced to 10px at ≤360px; “Demo shop” is 9px. Recommend 12px for both, retaining full shop name in settings.
- Forecast source badge, legend and chart date: 9px; quantity-equation labels: 9px; recovery/storage notice: 10px; subpage demo badge: 8px. Recommend 12px, especially for information that qualifies forecasts or explains recovery.
- Form/search controls: 14px; recommend 16px for comfortable entry. Form field labels are 12px; recommend 13–14px.
- Large headings: 30–39px, with 67px for suggested restock. Their priority should remain secondary to showing full amounts on narrow screens.

Desktop preview scaling is a separate issue: at a 768px viewport height, `(768 - 130) / 846 ≈ 0.754`. A nominal 10px label appears about 7.5px high before device scaling. Mobile widths ≤500px disable that transform. Inspect at native scale before judging phone readability.

## Data surface and limits

All fixtures use the same `ShopData` boundary as the saved demo. `lib/demo-data.ts:53` validates records; there is no backend schema in this prototype.

- Shop name → `ShopData.shopName`, optional with fallback; setup input allows 60 characters (`components/mela-app.tsx:407`), persisted validator has no maximum. Displayed in header and settings.
- Product id → required, nonempty, unique string; unbounded. Used for keys, selection and links, not visibly printed.
- Product name → required nonempty string; add/edit input allows 80 characters (`components/mela-app.tsx:332`), persisted validator is unbounded. Displayed in lists, selected item, detail, success receipt and history.
- Product category/icon/kind → validated enums (`lib/demo-data.ts:63`); no missing icon accepted, plus a defensive Cube fallback. Category shown in form/detail; icon is rendered from the shared family; kind qualifies forecast source.
- Unit → required nonempty string, persisted length unbounded. New products choose one of five units; existing records may supply others. Appears with stock, quantity, demand, threshold, price and receipt text.
- Price / sale total → finite nonnegative numbers with safe rounded cents; form price is capped at 1 billion, persisted validator permits more. `money()` formats to at most two decimal places. Summary totals are derived sums, with no separate sum limit.
- Stock / threshold → safe nonnegative integers; no smaller business cap. Rendered in rows, counts, details, forms, alerts and receipt arithmetic.
- Forecast → optional/null, otherwise exactly seven safe nonnegative integers with a safe sum. Total demand, suggested restock, coverage, chart ticks, tooltip, accessible chart description and equation are derived from it. Restock is clamped to zero; percent rings are clamped to 0–100.
- Sale → required id, product id, historical product name, unit, positive whole quantity, total and parseable timestamp; strings have no maximum. Dates/times display in Africa/Addis_Ababa; historical names survive edits and missing products have an icon fallback.
- Receipt → required id, product id, positive whole quantity, parseable timestamp; visible as receipt counts and derived stock changes. Arrays are unbounded.
- Snapshot date → optional parseable timestamp. Missing value has an explicit unavailable-date message. The chart still synthesizes dates from today when absent; see finding 9.
- Collections → products, sales, receipts; no count cap or pagination contract. Counts feed shelf summary, notification label, overview, filters and record count. Zero, one and 1,284 records are separate fixtures.
- User-entered search, quantities and form drafts → local state. Product/shop strings have the limits above; search has no maximum; numeric entry is checked on submission. Search no-results, invalid input, failed writes, reset confirmation and dirty drafts have explicit UI states.
- Dynamic UI copy → save/error/toast strings, selected tab/page title, status badges, form summaries and success totals. Fixed English labels/statuses are not translated from data. They can still expand with quantities, units or product names.
- Logo → local fixed asset with a clipped clear-space frame; no remote product images, avatar, email, URL, attachment, API loading state or permission field exists. Those catalog rows are not applicable.

## What broke / remains fragile

1. **Broken, predicted — large quantities lose readable space.** Worst input: stock `1234567`, price `12345678.9`, received quantity `1284`. Product rows keep the right column on one line; detail cards use two automatic minimum grid columns; the stock equation places three large numbers on one flex row; sale quantity has a fixed 110px input at 45px font size. At 320px these can crowd names, split amounts or clip content. Fix locations: `app/globals.css:106`, `app/globals.css:183`, `app/globals.css:220`, `app/globals.css:259`, `app/globals.css:407`. Give numbers a full line; use `minmax(0, 1fr)` grids, stack cards/equation when space is insufficient, and enlarge the quantity input's available width. Never ellipsize or arbitrarily split money digits.

2. **Broken, predicted — selected product can push its status outside the card.** Worst input: `LaundryDetergentConcentratedProfessionalRefillPack5Litres`. List text has `min-width: 0` and `overflow-wrap: anywhere`, but selected sale/receipt/forecast cards do not apply the same rules. Fix: `app/globals.css:174` and `app/globals.css:289`; set `min-width: 0` and `overflow-wrap: anywhere` on the text child, prevent badge shrinking and allow the badge to move to another row. Actual clipping still needs screenshots.

3. **Fragile, source verified — essential labels are 8–11px.** The source badge, error-recovery notice, quick actions and navigation sizes are listed above. Worst environment: ≤360px phone width, or scaled desktop preview. Fix: `app/globals.css:71`, `app/globals.css:169`, `app/globals.css:261`, `app/globals.css:267`, `app/globals.css:281`, `app/globals.css:307`, `app/globals.css:453`, `app/globals.css:492`, `app/globals.css:513`. Consolidate type tokens and remove the mobile rules that reduce labels below 12px. Preserve heading hierarchy while increasing functional text.

4. **Ugly, execution/source verified — singular counts and imported unit plurals.** `?data=one` produces “1 products”, “1 sales recorded” and “1 records” on different screens. `units(2, "box")` returns “2 boxs”. Large stock counts also render raw `1234567` instead of grouped numbers. Fix: `components/mela-app.tsx:214`, `components/mela-app.tsx:217`, `components/mela-app.tsx:226`, `components/mela-app.tsx:308`, `components/mela-app.tsx:356`, `lib/demo-data.ts:47`. Use a shared count formatter and explicit singular/plural unit labels, with an appropriate fallback for imported units.

5. **Fragile, source verified — 1,284 rows mount together.** Products, sales picker, history and forecasts map every matching row. History additionally performs a product search for each sale. No performance failure has been measured. Fix: `components/mela-app.tsx:265`, `components/mela-app.tsx:294`, `components/mela-app.tsx:308`, `components/mela-app.tsx:358`. Recommend pages of 40–50 rows and a product lookup map; benchmark on a target low-end phone. Pagination must preserve search and expose how many matches remain.

6. **Fragile, source verified — field limits disagree between entry and storage.** Product name 80 / shop name 60 in forms, but any nonempty persisted length is accepted. Worst fixture stays within entry limits (79-character product, 56-character shop); imports/older records can be longer. Fix: `lib/demo-data.ts:57`, `components/mela-app.tsx:321`, `components/mela-app.tsx:332`, `components/mela-app.tsx:407`. Define shared limits at validation and entry boundaries, with a deliberate migration/recovery policy for existing longer names.

7. **Ugly, source verified — zero stock still leaves a filled progress sliver.** Empty or all-out-of-stock data sets width to 0%, but `.shelf-track > div` has `min-width: 12px`. Fix: `app/globals.css:65`. Permit zero width at 0%; apply the visible minimum only to a nonzero amount.

8. **Fragile, source verified — empty Forecasts suggests actions that cannot resolve the state.** With zero products, it renders both a no-history panel with “Record a sale” and “No matching products” with “Clear search”, despite no search being entered. Fix: `components/mela-app.tsx:350`. Return one dedicated zero-products state linking to Add first product before rendering search/forecast summaries. Keep no-history and no-search-match states distinct.

9. **Broken, source verified — missing snapshot invents chart dates.** Worst fixture omits optional `forecastCreatedAt`. The page states the sample date is unavailable, yet the day-by-day chart derives a new date range from the current day on every load. Fix: `components/mela-app.tsx:364`. Require a snapshot date for a dated chart or label the series “Day 1–Day 7” when it is absent. Do not imply a fresh forecast period for undated estimates.

## Decisions for you

- Product names: recommend wrapping in lists and selected cards; always show the full name in details. A two-line clamp needs a way to reveal the full value.
- Large amounts: recommend a full-width stacked value at narrow widths; preserve exact ETB amounts rather than compact rounding.
- Large lists: recommend pagination over virtualization for this prototype because it is simpler to transfer to Flutter and keeps keyboard navigation predictable.
- Imported units: recommend storing singular and plural labels. English “append s” does not generalize to every unit or language.
- Current visual scope is light mode and English; dark mode and a full RTL layout are not implemented. Arabic, Amharic, Vietnamese and emoji fixtures still need direction/glyph checks in the browser. Manrope's bundled file is Latin-only, so other scripts use the system fallback.

## What held up

- List product text already has a zero minimum width, wrap opportunities and nonshrinking icons; detail titles wrap too. Long-name protection is inconsistent across surfaces, rather than absent everywhere.
- Shop header has a separate logo row and ellipsis; settings retains the full shop name. No overlap has been visually re-verified in this pass.
- Money formatting suppresses floating-point tails such as `0.30000000000000004`; history amounts already permit wrapping and use tabular figures.
- Zero prices, single-letter names, Unicode and literal `<b>` text pass the same data schema as demo records. React renders text without injecting markup.
- Missing forecast and missing snapshot have explicit explanatory copy, although the undated chart issue remains.
- Empty inventory and sales history have actions. Zero denominators are guarded, rings are clamped and restock never goes negative.
- Existing transaction tests pass: overselling/invalid numbers are rejected, repeat requests cannot double-apply stock changes, historical sales survive edits, malformed records are rejected and stock receipts update restock consistently.

## Repeatable handoff

Run `npm run dev`, then open `http://localhost:3000/?data=worst`.

The bottom control includes Saved shop, Demo data, Worst case, Empty, One and 1,284 rows. Fixtures are in `lib/review-data.ts`; they are selected at the `ShopData` boundary and checked against `isShopData`. Fixture edits stay in memory, URL selection survives reload, and switching fixtures resets temporary edits. Production renders the normal app without this control or fixture module.

Checks completed: TypeScript, production compilation, all eight existing transaction tests, and all five fixture datasets passing the real data validator. Base worst-case names fit the actual 80/60-character input limits. Production output was searched for fixture identifiers and toolbar text; none were present.

Still required in an allowed browser: capture Demo and Worst case at 394px, 320px, 500px and the 2560px desktop canvas; repeat at 200% browser zoom, inspect non-Latin glyphs, select the long product, enter large receipt/sale quantities, and switch all four tabs. Measure scrolling/rendering for 1,284 rows. No visual or performance pass is claimed.

No design fixes were applied during this review, following break-ui's report-before-fix rule. Say `fix all` or `fix 1, 3` to apply the findings.
