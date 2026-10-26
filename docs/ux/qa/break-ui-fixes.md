# break-ui fixes and verification — 25 October 2026

## Status and evidence

The installed Emil Kowalski **break-ui** skill and its full worst-case catalog were used. The user requested fixes to the prior findings. The existing review switch remains development-only, changes data at the `ShopData` boundary, and isolates temporary edits from the saved shop.

**Source changes, data behavior, TypeScript and production compilation are verified. Current browser appearance and interactions are not verified.** The browser tool previously denied access to localhost; no alternate browser, HTTP capture or screenshot workaround was used. Therefore the 320px, 394px, 500px, desktop and 200% zoom checks remain pending. No current visual or low-end-device performance pass is claimed.

## Part 1 — What broke and what changed

1. **Broken, layout predicted: large numbers crowded or split.** Worst values: stock `1,234,567`, price `12,345,678.9`, quantity `1,284`; persisted integers can reach the safe-integer limit. Product rows now give metadata its own grid row; exact currency spans stay together. Detail and form grids use a full-width column, the quantity input gets a full row, and the stock equation stacks vertically. Large Home sales totals span both summary columns. Featured quantities reduce their type size for longer numbers and use separate unit labels. Fix: `app/globals.css:93`, `app/globals.css:263`. The layout rationale is source-based; screenshots are still required.

2. **Broken, layout predicted: selected product text displaced the status/action.** Worst value: `LaundryDetergentConcentratedProfessionalRefillPack5Litres`. The selected text column now has `min-width: 0` and wrapping; badges cannot shrink and can move below the text. Product names use `dir="auto"` in lists, selected cards, history, detail and receipts. Fix: `app/globals.css:177`.

3. **Fragile, source verified: essential labels were 8–11px, and desktop scaling shrank them further.** All explicit functional font sizes in the app and entry-flow styles are now at least 12px. Product names are 14px and form/search input text is 16px. Narrow rules no longer shrink those labels. Following the user’s mobile-structure correction on 26 October, desktop preserves the original 394 × 846 canvas and scales the entire preview proportionally to fit. This reduces the displayed text size in the desktop mockup; native mobile text sizes are unchanged. Phone container queries compact actual short mobile viewports, and long forms remain internally scrollable. Quick actions use two columns at ≤360px. Fix: `app/globals.css:389`; CSS-size regression check in `tests/ui-data.test.mjs`. These size checks do not prove visual readability or accessibility compliance.

4. **Ugly, execution verified: singular counts and imported units were wrong.** `1 products`, `1 sales recorded`, `1 records`, and `2 boxs` are corrected using shared count and unit helpers. Counts are grouped, such as `1,284`; known stock units have explicit plurals. Unknown imported labels are preserved rather than guessed. Fix: `lib/demo-data.ts:53`. Tests exercise zero, one, large counts, boxes, invariant `kg`, imported labels and floating-point money tails.

5. **Fragile, source verified: 1,284 rows mounted together.** Products, sale selection, sales history and product outlooks now render pages of 40 rows, with Previous/Next controls and a visible result range. Changing a search/filter resets to page one. Page changes move focus to the labelled list region. History uses a product map rather than one product search per sale. Fix: `components/paginated-list.tsx:8`. Pagination arithmetic passes tests for 0, 1, 40, 41 and 1,284 rows; concatenating every page yields all records exactly once. Browser interaction and scrolling performance are pending.

6. **Fragile, source verified: name limits disagreed without a legacy policy.** Shared constants define 80 characters for new/renamed product and account names, 60 for new shop names, and 254 for email inputs. Product submit and the app save boundary use the same name validator. Existing persisted longer names remain loadable and editable without silent truncation; an unchanged old name may be retained, while a replacement must meet the current limit. Fix: `lib/demo-data.ts:47`. This is a deliberate compatibility policy, not a stricter storage validator. There is no backend/import API in the prototype.

7. **Ugly, source verified: zero stock still painted progress.** The progress fill no longer has a 12px minimum width. A computed 0% is empty. Fix: `app/globals.css:67`. Needs visual confirmation.

8. **Fragile, source verified: empty Forecasts offered a dead-end sale action.** A zero-product shop now gets one Add first product state before banners, summaries and search. No-history and no-search-match states remain distinct for nonempty shops. Fix: `components/mela-app.tsx:371`.

9. **Broken, execution verified: an undated snapshot invented current calendar dates.** Chart series without a snapshot use Day 1–Day 7. Chart captions, accessible descriptions and expanded explanations match that distinction. Dated snapshots preserve their period, including month rollover. Axis labels are at least 12px; compact axis ticks are accompanied by exact quantities in the tooltip and accessible chart description. Fix: `lib/demo-data.ts:68`.

10. **Broken, execution verified: combined sales totals could exceed safe cents.** Aggregates now sum integer cents and stop at the safe-integer boundary. Unsupported totals show Unavailable with explanatory copy; individual saved sales remain listed. Fix: `lib/demo-data.ts:59`. Tests cover 0.1 + 0.2 and overflowing aggregates.

11. **Fragile, source verified: review chrome assumed a fixed toolbar height.** The development toolbar now reports its actual height with a ResizeObserver; the phone stage reserves that space at desktop and mobile widths. The toolbar has a maximum height and can scroll, so wrapped controls do not hide navigation. Fix: `components/dev-data-preview.tsx:33`. This is development chrome; production has none. Browser reflow verification is pending.

12. **Broken, source verified: exporting a fixture could read the owner's saved shop.** Settings export now skips saved local storage in fixture mode and exports the current temporary data. Normal recovery export still preserves raw unreadable saved data. Fix: `components/mela-app.tsx:397`.

The supplied PNG logo also retains the earlier complete-image fix: no zoom, negative offset or cropped frame; it uses its original 3:1 canvas ratio. Source: `app/globals.css:450`. Its animated appearance remains visually unverified.

## Part 2 — Decisions applied

- Wrap identifying product names and put quantities/statuses below them. The shop header may truncate its name but exposes the complete name in settings and a title.
- Preserve exact amounts and safe integer quantities; use full-width layouts rather than compact financial rounding. Chart axes alone may use compact ticks; exact values remain available.
- Use 40-row pages rather than virtualization to keep the Flutter handoff straightforward. Searches and filters operate on the full collection before slicing.
- Preserve old saved names losslessly; validate new names and replacements. Unknown imported unit labels remain literal.
- Keep the existing light, English UI. `dir="auto"` supports mixed-direction values; a complete RTL layout and dark theme are outside the implemented product scope.

## Part 3 — What held up

- The Demo/Worst case/Empty/One/1,284-row fixtures pass the real persisted-data validator. Product and shop names in the fixtures now all fit current entry limits, including generated batch suffixes.
- React still escapes literal markup, while single-letter names, diacritics, Amharic, Arabic and emoji remain valid text. Browser font fallback/glyph checks remain pending.
- Missing forecasts, zero demand, zero prices, duplicate display names with distinct IDs, future/recent/old timestamps, out-of-stock actions and guarded drafts have explicit data/UI paths.
- Eight existing domain tests still pass: stock transactions, idempotent retries, invalid/unsafe values, historical sale preservation, product creation, invalid storage and nonnegative restock.
- Seven new checks pass: all fixtures/limits, count/unit formatting, pagination boundaries, forecast periods, legacy name policy, safe monetary aggregates and CSS minimum sizes. TypeScript and production build pass.
- The production page excludes development fixtures and the review toolbar. Review records do not overwrite saved shop data, and export is isolated too.

## Repeat the review

- `http://localhost:3000/?data=worst`: switch among Saved shop, Demo data, Worst case, Empty, One and 1,284 rows.
- `http://localhost:3000/?data=worst&onboarding=1`: replay the tour, then open signup/recovery to inspect the long example name and email. Passwords are never prefilled or persisted. Account services remain UI-only.
- `http://localhost:3000/onboarding`: clean tour/account preview without the review toolbar.
- `npm run typecheck`, `npm test`, `npm run build`. Native direct runs of the two test files report 15 passing tests.

## Still pending in an allowed browser

Capture Demo and Worst case at 320px, 394px and 500px, then the desktop canvas, and repeat at 200% zoom. Flip every fixture and all four tabs, select long product names, enter large sale/receipt quantities, traverse pagination across a search change, inspect the full logo and all three illustrations, test account errors and keyboard focus, check safe-area clearance, and measure 1,284-row filtering/scrolling on a target phone. The code checks above do not replace those checks.

## 26 October — preview fit follow-up

The user reported that the fixed 846px phone was too large for the screen after automatic scaling was removed. The preview now uses a viewport-height grid, caps the phone at 846px, and reserves the actual development toolbar height. Short desktop windows omit the outer caption and note. Mobile fills the available viewport without the decorative frame.

The phone is a named size container. Onboarding responds to its actual height, including on desktop: smaller illustration regions, tighter spacing, a shared footer row for Sign in and Storyset attribution, and less whitespace on account screens. The supplied logo remains complete and proportional; its entrance travel responds to the phone height. Text stays at native scale, inputs remain 16px, and action targets retain their existing sizes. Very short windows, large text and long forms can scroll inside the phone.

TypeScript and the production build passed for this revision. Browser screenshots, animation playback and viewport/zoom interaction checks remain pending under the previously reported browser restriction.

## 26 October — restore the original mobile structure

The user rejected the shortened phone shape. Desktop now retains the original 394 × 846 portrait canvas. A ResizeObserver measures the available stage and applies the smaller of its width/height fit ratios, capped at 1. The whole preview scales together, so the mobile hierarchy and illustration proportions are preserved. The frame is centered and its unscaled bounds cannot create page overflow. Native mobile viewports fill the available screen without that transform. Earlier notes about shortening the desktop frame are superseded by this correction.

Desktop preview scaling also scales text and touch targets visually. This is a prototype presentation choice requested to preserve the first version’s mobile structure; actual mobile CSS font and target sizes are unchanged. Browser appearance remains unverified under the previously reported restriction.
