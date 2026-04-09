# Website Content

`materials/` is the user-facing content folder and the only folder you should edit for normal website updates.

## Main Files

- `site.yml`: visual style settings such as fonts, sizes, weights, spacing, and element dimensions
- `pages/about.md`: homepage text and profile block
- `pages/cv.md`: CV page options
- `pages/projects.md`: projects page options
- `data/cv.yml`: CV content
- `data/socials.yml`: email and social links
- `publications/papers.bib`: publications
- `projects/*.md`: project records used throughout the site
- `images/prof_pic.jpg`: profile photo

These files are wired into the live site through root-level Jekyll entry-point symlinks.

Canonical content sources:

- CV-specific sections come from `data/cv.yml`
- Publications come from `publications/papers.bib`
- Projects come from `projects/*.md`
