# Wei Dai personal site

This repository hosts the Astro-based source for [wdai0.github.io](https://wdai0.github.io).

## Local development

```bash
npm install
npm run dev
```

## Site shape

- `src/pages/` contains the public routes.
- `src/content/projects/` stores curated project entries.
- `src/content/lab/` stores metadata for the interactive explainer pages.
- `src/scripts/` contains the client-side code for the Gaussian-process demos.

## Slides index

The `/slides/` page is backed by `src/data/slides.generated.json`.

- Run `npm run update-slides` to refresh the manifest from GitHub.
- Run `npm run test:slides` for the local generator smoke tests.
- Run `npm run build && npm run sync-dist` to rebuild the Astro site and sync publishable output back to the branch root.

The generator requires `SLIDES_INDEX_TOKEN`, a fine-grained personal access token with read-only `Metadata` and `Pages` permissions for the relevant repositories.
