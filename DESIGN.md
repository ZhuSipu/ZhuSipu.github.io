# Site presentation

Reading continuity guides the presentation of about, projects, photography,
both blog languages, articles, CV, error pages, and future pages using the default
layout. Text, photographs, and navigation should be clear and stable as readers
move through the site.

## Initial composition

- Reserve image space using intrinsic dimensions before downloading the image.
- Embed a small image preview in the HTML so every photograph has a complete
  composition from its first appearance.
- Give the first visible image high download priority. Prepare and decode visible
  images and fonts during the initial soft-focus phase, with an 850ms waiting cap.
- Resolve the composition from a subtle 4px blur over 320ms. Use the same short
  transition across the main content and footer; keep the header immediately usable.
- Finish the introduction immediately when the reader scrolls, focuses a control,
  presses a key, or opens a photo. Restore cached pages and scroll positions clearly.
- Keep an 1800ms safety deadline from script initialization so stalled resources
  cannot hold the presentation. Respect reduced motion and printing.

## Continuous reading

Body text and below-the-fold sections remain fully visible at their final position.
Scrolling reveals clear, stable content. Prepare images 1600px ahead of the viewport,
then warm the remainder of the page after the introductory phase with two low-priority
jobs at a time. Honor Save-Data and very slow connections with a smaller 200px margin
and only prepare images near the reader.

Decode images before displaying them. Images prepared offscreen or during the initial
soft-focus phase display immediately; a late image blends into its existing preview
over 180ms. Keep layout and text stable throughout resource preparation.

## Responsive image assets

Profile, project, and blog images use WebP variants up to 480, 800, 1280, and 1920px
wide. The browser selects the appropriate size using the actual layout and screen
density. Preserve fine detail in project diagrams with higher encoding quality.
Original files remain available for full-resolution zoom and direct links.

`scripts/generate_image_previews.py` generates the embedded previews, dimensions,
and responsive content variants in `materials/data/image_previews.json` and
`assets/img/generated/content/`. Generated filenames include content hashes;
unchanged sources reuse their outputs. Run this script when content images change.

## Navigation and photographs

The primary navigation stays usable throughout presentation and while viewing an
individual photograph. The photo viewer is nonmodal: links, theme controls, the
mobile menu, and keyboard navigation remain available in the header. Inactive
slides and the covered overview are inert; closing returns focus to the opener.

Photo navigation uses opacity and translation for its 360ms slide transition.
The selected photo takes high download priority while adjacent photos prepare
concurrently at low priority. After the overview is ready, prepare its first likely
selections during idle time. Hover and keyboard focus also prepare a photo in advance.
Keep at most three detail images decoded, including across closing and reopening.
Honor reduced data preferences and share image decoding promises.

When a thumbnail is ready, show it clearly as the detail preview while the larger
image prepares. Blend in any late detail over 180ms. Preserve full originals, retry,
rapid navigation, touch swipes, focus return, and scroll restoration.

## Shared implementation

- `_layouts/default.liquid` and `_includes/loading.liquid` install the presentation
  on every page. Staging runs after page markup and before footer scripts.
- `assets/js/loading.js` owns initial presentation, advance loading, and image
  readiness. `window.siteImageLoading` shares decoding, page readiness, and
  immediate presentation completion with the photo viewer.
- `_includes/figure.liquid` supplies responsive content sources, previews, and
  dimensions. `_includes/photography_image.liquid` supplies gallery equivalents.
- `scripts/optimize_photography.py` builds responsive gallery assets and also
  refreshes the shared content image outputs.
- Theme transitions respect page presentation and the gallery's animation.

New layouts should inherit `default` and use the shared figure include for images.
Implement presentation through these shared components to keep resource preparation,
readability, accessibility, and navigation consistent sitewide.

## Verification

Build with `bundle exec jekyll build --config _config.yml --destination _site`.
Check desktop and mobile pages with cold and warm caches, delayed and streamed images,
a blocked footer script, reduced motion, reduced data, JavaScript disabled, print,
and browser back navigation. Verify that distant article images prepare before
scrolling and text is immediately clear after scrolling. Measure actual responsive
image requests. Confirm header links, fast photo navigation, retry, touch swipes,
scroll/focus restoration, and decoded photo reuse when closing and reopening.
