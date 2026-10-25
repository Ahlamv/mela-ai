# Onboarding illustration assets

Generated with the built-in image generation tool on 25 October 2026, inspected as local images, then copied into the project. Original generated files were preserved. No CLI fallback was used.

## Saved assets

- `public/onboarding/stock.png`: grocery shelves, food bags, cooking oil and an incoming stock box. Used on the first tour page and account-entry screen.
- `public/onboarding/sale.png`: retail counter, cooking oil, a bag, receipt and confirmation token. Used on the sale tour page.
- `public/onboarding/forecast.png`: restock cartons and a seven-column demand chart. Used on the planning tour page.

## Final prompt set

Each prompt used this shared template, substituting the corresponding subject below:

> Use case: stylized-concept. Asset type: square onboarding illustration for the Mela AI mobile retailer app. Primary request: [SUBJECT] Style: premium minimal 3D clay product illustration with precise soft bevels, ceramic matte materials, understated editorial composition, soft ambient occlusion. Palette limited to off-white #f9f8f5, warm gray #c7c5c0, dark charcoal #34332f and restrained burnt orange #de6645. Absolutely no blues, purples or greens. Background perfectly solid light gray #eaeaea, matching the app background edge to edge. Center the composition in the middle 75% of a square image, leave generous breathing room on every side. Orthographic isometric three-quarter viewpoint, elevated slightly, soft studio light from top left, delicate grounded shadow, quietly sophisticated rather than toy-like. No people, faces, logos, screen frames, lettering, watermark or surrounding UI. Make this one complete illustration, not a sheet or collage. All objects comfortably inside frame. Save the generated asset for use in the app.

### Stock subject

> A small beautifully organized neighborhood grocery shelf, two short warm-gray shelves with ivory paper food bags, clear orange-tinted cooking oil bottles and a coffee pouch. A single grocery box floats gently beside the shelves, hinting at goods being added. One restrained burnt-orange stock tag with an abstract mark, no words. Show shelves as the main object.

### Sale subject

> A small elegant ivory point-of-sale receipt curling above a warm-gray retail counter, a single cooking oil bottle and paper grocery bag, and one small burnt-orange circular confirmation token. Tiny abstract embossed lines on the receipt, absolutely no legible words or numbers. Show a completed neighborhood grocery sale.

### Forecast subject

> Three ivory and warm-gray grocery restock cartons, one open box with neat paper bags, alongside a freestanding small sculptural seven-column bar chart in warm gray with the last two bars burnt orange. A subtle orange curved upward arrow suggests planning future stock. No written labels, no words or numbers.

## Consumption

Images are square rasters rendered with `next/image` and `object-fit: contain`. The gray backdrop blends into the existing app material. Labels, counts and controls remain accessible HTML rather than baked into the pictures. These assets illustrate capabilities; they are not the app's actual inventory or forecast data.
