# Onboarding illustration assets

The current onboarding uses three illustrations from **Storyset’s Amico collection**, downloaded on 25 October 2026. All three use the same isometric style, orange accent and warm charcoal palette. They replace the earlier generated clay illustrations.

## Sources and local files

- `public/onboarding/stock.svg`: [Logistics — Amico](https://storyset.com/illustration/logistics/amico). Used for stock and the account-entry screen. Original SVG: https://stories.freepiklabs.com/storage/6289/Logistics_Mesa-de-trabajo-1.svg
- `public/onboarding/sale.svg`: [Cash payment — Amico](https://storyset.com/illustration/cash-payment/amico). Used for recording sales. Original SVG: https://stories.freepiklabs.com/storage/28221/Cash-payment-01.svg
- `public/onboarding/forecast.svg`: [Data report — Amico](https://storyset.com/illustration/data-report/amico). Used for demand and restock planning. Original SVG: https://stories.freepiklabs.com/storage/1894/Data-Report_Mesa-de-trabajo-1.svg

## License and credit

Copyright Freepik Company. These assets use the Freepik license offered on the source pages, which permits personal and commercial project use with attribution, including modifications. See [Storyset terms](https://storyset.com/terms) and [attribution FAQ](https://storyset.com/faqs). This project does not claim ownership of the illustrations.

At the user’s request, the onboarding and account-entry screens no longer show the credit line. Attribution and links to all three sources are now collected in the visible **Illustration credits** section in shop Settings, implemented by `components/illustration-credits.tsx`. Preserve this in-app credit when porting to Flutter unless the project obtains an appropriate license permitting use without attribution. The terms and FAQ were checked again on 26 October 2026; credit has been relocated, not removed from the app. The illustrations are incorporated in this app; they are not offered as a standalone asset pack.

## Adaptations

- Replaced the collection’s purple `#BA68C8` with Mela orange `#de6645`.
- Warmed cool charcoal colors to `#625f59`, `#46433e`, and `#302e2a`, keeping the original skin colors and shading.
- Removed the cloud and plant layers from Logistics and the plants and sign layers from Cash payment to reduce detail.
- Kept transparent SVG backgrounds, a consistent 500 × 500 viewBox, and the original proportions.
- Inspected the downloaded vector structure for script elements, foreign objects, external references, and event handlers; none are used in the saved assets.

## Consumption

Local SVGs are rendered with `next/image`, `unoptimized`, and `object-fit: contain`. No remote image requests are needed at runtime. The stock metric card occupies its own row below the art, avoiding overlap with the illustrations. Decorative tilted tags have been removed. Logo, card, and stock-count transitions remain, with reduced-motion support.

The images are decorative companions to the accessible HTML headings and descriptions. Counts, labels and actions are HTML. Illustrations represent capabilities, not actual shop data. The stock image illustrates a general inventory workflow; the sales image illustrates a checkout; it does not imply that Mela processes payments.

The adapted SVGs were rendered and inspected as local images. Browser layout and animation timing remain unverified because of the existing browser access restriction.

## Previous generated direction

The earlier raster files have been replaced. Their original generation prompts are retained below for provenance.

### Archived prompt set

Each prompt used this shared template, substituting the corresponding subject below:

> Use case: stylized-concept. Asset type: square onboarding illustration for the Mela AI mobile retailer app. Primary request: [SUBJECT] Style: premium minimal 3D clay product illustration with precise soft bevels, ceramic matte materials, understated editorial composition, soft ambient occlusion. Palette limited to off-white #f9f8f5, warm gray #c7c5c0, dark charcoal #34332f and restrained burnt orange #de6645. Absolutely no blues, purples or greens. Background perfectly solid light gray #eaeaea, matching the app background edge to edge. Center the composition in the middle 75% of a square image, leave generous breathing room on every side. Orthographic isometric three-quarter viewpoint, elevated slightly, soft studio light from top left, delicate grounded shadow, quietly sophisticated rather than toy-like. No people, faces, logos, screen frames, lettering, watermark or surrounding UI. Make this one complete illustration, not a sheet or collage. All objects comfortably inside frame. Save the generated asset for use in the app.

#### Stock subject

> A small beautifully organized neighborhood grocery shelf, two short warm-gray shelves with ivory paper food bags, clear orange-tinted cooking oil bottles and a coffee pouch. A single grocery box floats gently beside the shelves, hinting at goods being added. One restrained burnt-orange stock tag with an abstract mark, no words. Show shelves as the main object.

#### Sale subject

> A small elegant ivory point-of-sale receipt curling above a warm-gray retail counter, a single cooking oil bottle and paper grocery bag, and one small burnt-orange circular confirmation token. Tiny abstract embossed lines on the receipt, absolutely no legible words or numbers. Show a completed neighborhood grocery sale.

#### Forecast subject

> Three ivory and warm-gray grocery restock cartons, one open box with neat paper bags, alongside a freestanding small sculptural seven-column bar chart in warm gray with the last two bars burnt orange. A subtle orange curved upward arrow suggests planning future stock. No written labels, no words or numbers.

## 26 October — onboarding layout refinement

The user clarified the desired order: illustration first, then heading and explanation, then Continue. The desktop preview retains its original 394 × 846 portrait canvas and proportional fit. The illustration region remains 330px, with its stock metric card in a separate row. It starts 8px beneath the header. The copy follows with 24px of separation; the primary button follows the description with another 24px gap. Page controls and Sign in share a compact row below Continue, preserving their touch targets and leaving more space at the bottom. Short native viewports use 16–24px gaps and retain scrolling when needed.

The account-entry illustration remains 260px and starts at the top of its content area.

Onboarding credit labels have moved to Settings. Current browser appearance and animation playback remain pending because of the previously reported browser restriction.
