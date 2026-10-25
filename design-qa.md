# Mela AI refinement review — 25 October 2026

## Status

Latest follow-up: Manrope replaces Inter, the generated logo is now applied, and navigation uses a persistent animated pill with fading labels and short screen entrances. Reduced-motion settings disable these transitions. Production build validation covers the changes; their visual appearance and animation timing still require browser inspection.

Code refinements and domain checks are complete. Final browser visual and interaction verification is blocked. The browser tool refused authority to inspect the open localhost page because its URL policy did not allow the current protocol. No alternate browser or indirect page capture was used to bypass that decision.

Earlier QA is preserved at `docs/ux/qa/design-qa-before-refinement.md`. Its screenshots describe the previous implementation, not this revision.

## Sources and evidence

- Flow: `docs/ux/mela-ai-app-flow.pdf`.
- Visual authority: `docs/ux/visual-reference.png` (1024 × 768).
- Latest direction: consistent premium icons, complete flow review, and UI/UX fixes.
- Preview: http://localhost:3000/.
- New screenshot, viewport and density: unavailable because browser access was blocked. No current full-view or focused comparison can be claimed.

## Changes from source review

1. **Welcome/setup:** first-visit sample-shop exploration and an empty demo with shop name and ETB. Existing saved shops continue directly into the app. Real accounts remain a backend integration.
2. **Home/navigation:** consistent regular-weight icons, neutral tiles, opaque gray pill navigation, larger touch targets, and a first-product empty state. Low-stock shortcuts clear stale search terms.
3. **Products:** field-associated errors; saved product details with Add another / Record sale actions; optional Uncategorized category. Editing cannot reinterpret stock units or alter historic sales.
4. **Sales:** unsaved selection and quantity are guarded when changing tabs or opening history. In-flight saves block navigation. Out-of-stock selection offers Receive stock. Unsafe totals are rejected.
5. **History:** saved product names, units and totals remain historical after edits. Long names and large amounts wrap.
6. **Receipts:** unsaved quantities are guarded; duplicate requests cannot apply stock twice; quantities and resulting stock are validated. Success waits for storage to succeed.
7. **Forecasts:** no-history products cannot produce an all-covered banner. Covered products say no restock needed. Search persists when returning from details. Arithmetic explicitly clamps negative results to zero. New sample datasets have creation timestamps; old data states when the date is unavailable. Sample periods are not presented as freshly generated predictions.
8. **Settings/recovery:** JSON backup export and explicit reset confirmation. Invalid records cannot silently be overwritten by transactions. Failed browser writes retain entries and do not produce success confirmation.

## Required design surfaces

- **Typography:** retained Inter and reference hierarchy; increased form/product/helper text sizes; wrapping for long names and amounts.
- **Spacing:** primary controls at least 48 CSS pixels; enlarged clear/dismiss/header controls; safe-area clearance for scrolling content.
- **Color:** retained gray, white and burnt orange; replaced category rainbow tiles with neutral surfaces and restrained accent use.
- **Icons/assets:** one regular-weight Phosphor family through shared context, with 24 px shortcuts, 22 px navigation, and 18–20 px action indicators. Product and forecast symbols replace generic lightning imagery. No new raster or handmade SVG icons.
- **Copy:** explicit demo labels; concrete save, stock, error, and next-step language.

These are implementation changes, pending visual confirmation.

## Checks

- TypeScript passed during the revision; final production build also runs TypeScript validation.
- Eight domain tests passed: sale/stock updates, retry safety, overselling/invalid quantities, numeric overflow, historical sales, product retry/no-history behavior, malformed storage, and nonnegative restock.
- Browser rendering, keyboard focus, narrow layouts, screen-reader announcements, forms, and console logs remain unverified for this revision. No full accessibility compliance claim is made.

## Remaining acceptance checks

Capture Home, Products, add/edit, sale review/success, history, receipt, forecast/no-history, welcome/setup, and settings in the working browser. Compare icon sizing, hierarchy and navigation against the supplied reference. Complete add → sell → receive → forecast through the UI, including unsaved-change recovery and responsive checks. Record screenshots and console results before marking the review passed.

final result: blocked
