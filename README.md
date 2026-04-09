# ZhuSipu.github.io

This repository is a Jekyll site.

## Edit Only `materials/`

If you want to update the website content, only edit files inside `materials/`.

- `materials/site.yml`: visual style settings such as fonts, sizes, weights, spacing, and element dimensions
- `materials/pages/about.md`: homepage text and profile block
- `materials/pages/cv.md`: CV page options
- `materials/pages/projects.md`: projects page options
- `materials/data/cv.yml`: CV content
- `materials/data/socials.yml`: email and social links
- `materials/publications/papers.bib`: publications
- `materials/projects/*.md`: project records used by the homepage, projects page, and CV
- `materials/images/prof_pic.jpg`: profile photo

## Repository Structure

The repository is split into two roles:

- `materials/` is user-facing content: text, data, publications, projects, and images
- root Jekyll folders such as `_includes/`, `_layouts/`, `_plugins/`, `_sass/`, and most of `assets/` are code/runtime structure
- root content entry points such as `_pages/`, `_data/`, `_bibliography/`, `_projects/`, and `assets/img/user/` are symlinks into `materials/`
- root `_config.yml` is runtime/build configuration for Jekyll and is no longer edited for normal content or style changes

There should be only one real copy of editable content, and it lives in `materials/`.

## Source Of Truth

- CV structure and experience data: `materials/data/cv.yml`
- Publications: `materials/publications/papers.bib`
- Projects: `materials/projects/*.md`

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
