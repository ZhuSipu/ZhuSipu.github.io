# Site presentation

The whole site uses one presentation system: a complete composition takes shape
through soft focus, then resolves into clear typography and photographs. This
applies to about, projects, photography, both blog languages, articles, CV, error
pages, and future pages using the default layout.

## Composition and rhythm

- Reserve image space using intrinsic dimensions before downloading the image.
- Supply a small embedded image preview with the HTML so a photograph has a
  recognizable composition from its first appearance.
- Reveal headings, paragraphs, list entries, cards, and photographs as meaningful
  blocks. Preserve real text, semantic markup, links, and selection.
- Use one short spatial sequence across the page: blocks near one another share
  a similar delay, capped at 180ms. Text and imagery start forming together.
- Form the blocks over 650ms, holding a subtle soft focus until the shared
  refinement phase. Refine text over 600ms and blend decoded images over 1.1s.
- Start within 240ms of preparing the composition. Refinement begins after a
  minimum of 820ms, waiting at most 1.1s for visible images and fonts. A resource
  arriving later blends into its existing preview.
- Reveal offscreen blocks once as they enter the viewport. Restore cached pages
  immediately, keep focus visible, and honor reduced motion and printing.

## Navigation and photographs

The primary navigation stays usable during page presentation and while viewing
an individual photograph. The photo viewer is nonmodal: links, theme controls,
the mobile menu, and keyboard navigation remain available in the header. Inactive
slides and the covered overview are inert; closing returns focus to the opener.

Photo navigation uses opacity and translation for its 360ms slide transition.
Image resolution changes use a separate opacity blend over the existing preview.
The current image has download priority; adjacent images prepare afterward at
low priority. Keep only the current and adjacent image jobs, share their decoding
promises, and honor reduced data preferences. Preserve full originals.

## Shared implementation

- `_layouts/default.liquid` and `_includes/loading.liquid` install the presentation
  on every page. Staging runs after the page markup and before footer scripts.
- `assets/js/loading.js` owns composition, visibility, resource preparation, and
  image readiness. `window.siteImageLoading` shares the image lifecycle with the
  photo viewer.
- Semantic content blocks and existing components inherit the entrance. Add
  `data-arrival-group` to make a custom component one block; use
  `data-arrival-skip` for a component that manages its own presentation. Nested
  blocks animate only at the outermost selected level.
- `_includes/figure.liquid` supplies previews and dimensions for content images.
  `_includes/photography_image.liquid` supplies the gallery equivalents.
- `scripts/generate_image_previews.py` builds
  `materials/data/image_previews.json`. Run it when content images change.
  `scripts/optimize_photography.py` also refreshes these previews while building
  responsive gallery assets.
- Theme transitions respect page presentation and the gallery's animation.

New page layouts should inherit `default` and use the shared figure include for
images. Add presentation behavior through these shared components so timing,
accessibility, resource handling, and navigation stay consistent sitewide.

## Verification

Build with `bundle exec jekyll build --config _config.yml --destination _site`.
Check the desktop and mobile pages with cold and warm caches, delayed and streamed
images, a blocked footer script, reduced motion, JavaScript disabled, print, and
browser back navigation. Inspect the forming, refining, and finished composition.
Confirm all primary links work while a photograph is open and that fast photo
navigation, retry, touch swipes, and scroll/focus restoration remain correct.
