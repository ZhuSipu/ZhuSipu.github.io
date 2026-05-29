# ZhuSipu.github.io

This repository is a Jekyll site.

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

## GitHub Pages Deployment

The repository now includes a GitHub Actions workflow at `.github/workflows/pages.yml`.

To publish the latest site:

1. Push your changes to `main`.
2. In GitHub, open `Settings -> Pages`.
3. Set **Source** to **GitHub Actions** if it is not already selected.
4. Wait for the `Deploy GitHub Pages` workflow to finish.

The site will be published at `https://zhusipu.github.io/`.
