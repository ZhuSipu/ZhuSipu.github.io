# ZhuSipu.github.io

This repository is a Jekyll site.

The sitewide presentation and interaction principles are defined in
[DESIGN.md](DESIGN.md). All page layouts share a short initial soft-focus
transition, responsive images, and advance image preparation for continuous reading.

## Edit Only `materials/`

If you want to update the website content, only edit files inside `materials/`.

- `materials/site.yml`: visual style settings such as fonts, sizes, weights, spacing, and element dimensions
- `materials/pages/about.md`: homepage text and profile block
- `materials/pages/cv.md`: CV page options
- `materials/pages/projects.md`: projects page options
- `materials/pages/photography.md`: photography landing page
- `materials/pages/blog.md`: blog landing page
- `materials/pages/blog/*.md`: individual blog articles
- `materials/data/cv.yml`: CV content
- `materials/data/projects.yml`: project records used by the homepage, projects page, and CV
- `materials/data/photography.yml`: photography works shown on the photography page
- `materials/data/socials.yml`: email and social links
- `materials/publications/papers.bib`: publications
- `materials/images/prof_pic.jpg`: profile photo

## Repository Structure

The repository is split into two roles:

- `materials/` is user-facing content: text, data, publications, projects, and images
- root Jekyll folders such as `_includes/`, `_layouts/`, `_plugins/`, `_sass/`, and most of `assets/` are code/runtime structure
- Jekyll pages, data, and bibliography are read directly from `materials/pages/`, `materials/data/`, and `materials/publications/`; there are no duplicate `_pages/`, `_data/`, or `_bibliography/` copies
- `assets/img/user/` remains the runtime image path used by templates and page content
- root `_config.yml` is runtime/build configuration for Jekyll and is no longer edited for normal content or style changes

There should be only one real copy of editable content, and it lives in `materials/`.

## Source Of Truth

- CV structure and experience data: `materials/data/cv.yml`
- Publications: `materials/publications/papers.bib`
- Projects: `materials/data/projects.yml`
- Photography: `materials/data/photography.yml`
- Blog articles: `materials/pages/blog/*.md`

The CV page reads `materials/data/cv.yml` for CV-specific sections, and pulls publications and projects from their canonical sources instead of duplicating them inside the CV data.

## Local Preview

Install dependencies once from the repository root:

```bash
bundle install
```

Start the development server with one command:

```bash
./scripts/dev
```

`./scripts/dev` runs `bundle exec jekyll serve` and lightly watches `materials/` so edits there trigger a rebuild without needing a second terminal command.

After adding or replacing photography originals in `materials/images/photography/`, run
`python3 scripts/optimize_photography.py` (requires Pillow with WebP support). This creates
responsive WebP files in `assets/img/generated/photography/` and the generated
`materials/data/photography_images.json` manifest, and refreshes the embedded previews in
`materials/data/image_previews.json`. Commit these outputs. Original photos
remain available; the gallery uses smaller thumbnails and prepares likely detail images
in the background, with the selected photo taking priority.
Unchanged source images are reused, and generated filenames include content hashes for caching.

After updating content images, run `python3 scripts/generate_image_previews.py` and commit
`materials/data/image_previews.json` together with `assets/img/generated/content/`.
It supplies embedded previews, intrinsic dimensions, and responsive WebP versions for
profile, project, and blog images. It requires Pillow with WebP support and reuses
unchanged outputs. Original images remain available for full-resolution zoom.

## GitHub Pages Deployment

The repository now includes a GitHub Actions workflow at `.github/workflows/pages.yml`.

To publish the latest site:

1. Push your changes to `main`.
2. In GitHub, open `Settings -> Pages`.
3. Set **Source** to **GitHub Actions** if it is not already selected.
4. Wait for the `Deploy GitHub Pages` workflow to finish.

The site will be published at `https://zhusipu.github.io/`.
