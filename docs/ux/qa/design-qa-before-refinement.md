# Mela AI design QA

Date: 25 October 2026

## Comparison target and evidence

- Visual authority: `docs/ux/visual-reference.png` (1024 × 768), supplied by the user. Flow authority: `docs/ux/mela-ai-app-flow.pdf`.
- Implementation: browser-rendered Next.js production preview at http://localhost:3000/.
- Final complete captures: `docs/ux/qa/home-desktop-final.png` and `docs/ux/qa/forecasts-desktop-final.png` (1280 × 697 screenshot pixels). The browser reported 1280 × 720 CSS pixels and devicePixelRatio 2; native capture output is already reduced and differs from the DOM viewport. Comparison uses the visibly captured phone boundaries rather than assuming a device-pixel multiplier.
- Final comparison boards, opened together for review: `docs/ux/qa/home-comparison-final.png`, `docs/ux/qa/forecasts-comparison-final.png`, and `docs/ux/qa/navigation-comparison-final.png`.
- Normalization: reference phone crops are 258 × 560 and 259 × 560 pixels; implementation phone crop is 283 × 605 pixels. Both are resized to approximately 280 × 605 for composition comparison. These source crops have nearly identical aspect ratios. This is a visual-system comparison, not a claim of pixel-perfect screen duplication.
- State: clean sample shop, 8 products, 8 sales, no entered form data; Home and Forecasts selected respectively. Fitness content in the source becomes retailer content in Mela AI. No fitness chat feature is implied by the reference.
- Earlier mobile evidence: `docs/ux/qa/home-mobile-normalized.png`, `docs/ux/qa/forecasts-mobile-normalized.png`, and `docs/ux/qa/products-mobile-normalized.png` (390 × 844 content pixels). Final mobile captures named `*-mobile-final.png` are vertically clipped by the native capture surface and are not used to approve persistent navigation. Final complete phone captures above are the acceptance evidence.

## Findings and comparison history

No actionable P0, P1, or P2 issues remain within the local prototype scope.

1. **[P2, fixed] Navigation outside a short desktop panel.** Earlier fixed-height phone framing could hide the persistent navigation. Added viewport-aware scaling to the desktop phone stage. Final complete captures show the entire navigation inside the phone; DOM checks also confirm its bounds lie inside the viewport. Mobile remains full width.
2. **[P2, fixed] Content visible through navigation.** The earlier gray navigation allowed product text to compete with the icons. Increased its background opacity and retained the soft inset shadow. `navigation-comparison-final.png` shows readable white icons and an opaque white active pill.
3. **[P2, fixed] Forecast banner too tall.** Extra introductory copy inflated the orange card relative to the source. Removed redundant eyebrow/supporting copy. The final Forecasts comparison shows a compact orange recommendation card with a centered circular icon and paired actions.
4. **[P2, fixed] Estimate coverage included products without history.** Changed the coverage denominator to the seven products with estimates. The final forecast state reads 3 of 7 estimated and provides a separate insufficient-history state for Pasta.

## Required fidelity surfaces

- **Fonts and typography:** locally bundled Inter provides the source's compact sans serif character, dark display headings, tight heading line spacing, and lightweight captions. Reference font identity is unknown. Exact glyph matching is a P3 follow-up if the original design file becomes available. Shop identification and retailer content intentionally alter heading positions and information density.
- **Spacing and layout rhythm:** rounded gray summary panel, four circular quick actions inside gray capsules, white metric cards, soft shadows, orange recommendation card, and a floating navigation pill follow the supplied reference. Complete phone captures show usable persistent controls. Additional stock rows scroll below the summary; they are needed for the retailer flow.
- **Colors and tokens:** light gray outer stage, pale gray app surface, white cards, near-black type, and burnt-orange accents match the reference palette. Small text/button contrast was increased where needed. No unrelated brand palette was introduced.
- **Image quality and assets:** the reference contains interface controls and charts rather than photographic assets. Phosphor library icons and functional Recharts graphics remain sharp; no raster screenshot is used as the working interface. Product icons change to relevant shop categories. The source's decorative contour motif is omitted; this is a minor P3 fidelity refinement.
- **Copy and content:** fitness copy is replaced with product, sales, stock, and seven-day demand language. Currency is ETB. Sample records and illustrative estimates are labelled. Insufficient history does not produce an invented forecast. Forecast advice does not itself increase stock.

## Interaction and responsive checks

Completed in the browser during this build:

- Add a product, required-field validation, dirty-form navigation warning, preserve entries when keeping edits, and edit saved details.
- Reject a sale above available stock; record a valid sale; verify updated stock, total, and history; preserve historic sale value after a price edit.
- Check a seven-day recommendation, receive stock, and verify the suggestion decreases by the received quantity.
- Reload and confirm browser persistence; verify product search, empty state, and out-of-stock filtering.
- Reset all temporary test records through the demo settings; final preview contains the clean sample shop.
- At 320 × 844 CSS pixels, document width equals viewport width and navigation spans x18–302, y765–830. At 390 × 844, navigation was also within the viewport. Desktop phone scales to fit short panels.
- Production-tab warning/error console query returned no entries.
- TypeScript check and production build passed. No automated test suite was added.

## Scope and open decisions

This is an interactive Next.js UI reference for the Flutter team. Authentication, shop assignment, backend services, real ML forecasts, network conflict handling, and offline synchronization are not connected. The PDF's proposed stock receipt behavior is demonstrated locally. Production threshold, forecasting-history, and safety-stock policy still need team agreement.

## Follow-up polish

- P3: confirm the original font and decorative motif if the source design file is available.
- P3: review final typography on physical Android and iOS devices during the Flutter implementation.

## Implementation checklist

- [x] Preserve the user-supplied flow and visual references in the project.
- [x] Implement the primary retailer journey and navigation.
- [x] Compare source and rendered screens together.
- [x] Fix P0/P1/P2 findings and recapture complete views.
- [x] Check responsive bounds and browser errors.
- [x] Keep the local production preview open for inspection.

final result: passed
