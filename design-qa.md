# Mela AI refinement review — updated 26 October 2026

## Status

The requested break-ui follow-up has been implemented. See [current findings, fixes and evidence](docs/ux/qa/break-ui-fixes.md). Changes cover font sizes, long names, exact numeric layouts, count/unit copy, pagination, empty Forecasts, undated charts, legacy name compatibility, safe sales aggregates and development preview spacing/export isolation. Fifteen automated checks, TypeScript and production compilation pass.

The illustrated Storyset tour and account UI remain a prototype; no identity/session service is connected. The complete supplied logo is rendered proportionally without cropping. Existing saved shops are preserved.

**Current browser visual, keyboard and performance verification is pending.** The browser tool denied access to localhost earlier in this chat. No alternate browser or indirect page capture was used to bypass that restriction. The 320px/394px/500px and 200% zoom checks have not been completed visually.

The earlier [break-ui report](docs/ux/qa/break-ui-review.md) and [design review](docs/ux/qa/design-qa-before-refinement.md) are retained as history. Their screenshots describe earlier implementations.

## Preview fit follow-up — 26 October

Following the user’s correction, desktop again uses the original 394 × 846 mobile canvas. A ResizeObserver scales the entire phone proportionally into the available preview space, preserving its portrait structure. It does not shorten the phone or trigger compact onboarding merely because the desktop window is short. Actual mobile viewports use their full available size without preview scaling. Long forms remain scrollable inside the frame, and development toolbar space stays reserved. The supplied logo and Storyset attribution are preserved. Visual verification remains pending.

## Onboarding spacing follow-up — 26 October

The tour artwork region is now 330px on the original portrait canvas, with a 28px separation between the explanatory copy and footer controls. Text and actions are now grouped beneath the compact header, followed by the enlarged illustration, with no vertical centering that pushes the controls down the screen. The account-entry artwork is larger too. The Storyset credit label has moved off the onboarding/account-entry screens into a visible Settings credits section with source links. Short native viewports keep scrolling available. Browser verification remains pending.

## Profile and header follow-up — 26 October

- Replaced the two-line shop identity in the main header with the complete logo at left and notification/profile controls at right. The circular profile control uses the saved photo or a matching outline User icon. The header is 56px instead of its previous 82px minimum; heading/action spacing is tighter too.
- Dismiss now has white text and a white outline. A darker orange fill preserves contrast with the small white label.
- Added an editable profile screen for photo, name, email, phone, shop name and address. The settings screen remains accessible from Profile. Saves use the existing local shop persistence boundary and remain isolated in review-fixture mode.
- Profile metadata is optional, so old saved shops still load. Its persisted structure and photo format/size are validated. Photos accept JPG/PNG/WebP up to 1 MB; failed previews fall back to the User icon. Form errors are associated with fields, and failed storage writes preserve the draft.
- The existing unsaved-navigation/refresh guard is shared by profile and transaction forms. Personal fields are optional, the shop name is required, and existing long shop names can be kept unchanged.
- Email is editable contact information; this does not change an authenticated account. Account/password services remain unconnected. Profiles are included in local backups and follow the existing explicit demo-reset behavior.

TypeScript and production compilation passed. Browser rendering, avatar upload, reload persistence and keyboard interactions still require verification in an allowed browser; no new automated tests were run for this revision.

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
5. **History:** saved product names, units and totals remain historical after edits. Long names wrap; monetary amounts use a separate line and stay intact.
6. **Receipts:** unsaved quantities are guarded; duplicate requests cannot apply stock twice; quantities and resulting stock are validated. Success waits for storage to succeed.
7. **Forecasts:** no-history products cannot produce an all-covered banner. Covered products say no restock needed. Search persists when returning from details. Arithmetic explicitly clamps negative results to zero. New sample datasets have creation timestamps; old data states when the date is unavailable. Sample periods are not presented as freshly generated predictions.
8. **Settings/recovery:** JSON backup export and explicit reset confirmation. Invalid records cannot silently be overwritten by transactions. Failed browser writes retain entries and do not produce success confirmation.

## Required design surfaces

- **Typography:** uses locally bundled Manrope and the reference hierarchy; earlier work increased form/product/helper text sizes and wrapping. Functional styles now use at least 12px text, 14px product names and 16px form/search input text; full-width numeric layouts avoid splitting amounts.
- **Spacing:** primary controls at least 48 CSS pixels; enlarged clear/dismiss/header controls; safe-area clearance for scrolling content.
- **Color:** retained gray, white and burnt orange; replaced category rainbow tiles with neutral surfaces and restrained accent use.
- **Icons/assets:** one regular-weight Phosphor family through shared context, with 24 px shortcuts, 22 px navigation, and 18–20 px action indicators. Product and forecast symbols replace generic lightning imagery. No new raster or handmade SVG icons.
- **Copy:** explicit demo labels; concrete save, stock, error, and next-step language.

These are implementation changes, pending visual confirmation.

## Checks

- TypeScript passed during the revision; final production build also runs TypeScript validation.
- Eight domain tests and seven additional data/UI-source checks passed: sale/stock updates, retry safety, overselling/invalid quantities, numeric overflow, historical sales, product retry/no-history behavior, malformed storage, and nonnegative restock.
- Browser rendering, keyboard focus, narrow layouts, screen-reader announcements, forms, and console logs remain unverified for this revision. No full accessibility compliance claim is made.

## Remaining acceptance checks

Capture Home, Products, add/edit, sale review/success, history, receipt, forecast/no-history, welcome/setup, and settings in the working browser. Compare icon sizing, hierarchy and navigation against the supplied reference. Complete add → sell → receive → forecast through the UI, including unsaved-change recovery and responsive checks. Record screenshots and console results before marking the review passed.

final result: blocked
