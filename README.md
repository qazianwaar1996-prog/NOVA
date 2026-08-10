# NOVA — JARVIS AI Operations Command Center

A futuristic AI operations command center UI built with React + Vite + PWA.

## 🌐 Live Deployment

**GitHub Pages:** https://qazianwaar1996-prog.github.io/NOVA/

## 🚀 Auto-Deploy with GitHub Actions

This repo is configured to auto-deploy to GitHub Pages via GitHub Actions on every push to `main` (or the arena working branch), plus manual `workflow_dispatch` triggers.

### Workflow file
The deploy workflow lives at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). It:

1. Checks out the repo
2. Sets up Node 20 (with npm cache)
3. Installs dependencies with `npm ci`
4. Runs `npm run build` (Vite outputs to `dist/`)
5. Uploads `dist/` as a Pages artifact
6. Deploys the artifact to GitHub Pages using `actions/deploy-pages`

### One-time repo setup (already done)
- GitHub Pages is enabled for this repo at https://github.com/qazianwaar1996-prog/NOVA/settings/pages
- Public URL: https://qazianwaar1996-prog.github.io/NOVA/
- `vite.config.js` already sets `base: '/NOVA/'` so assets resolve correctly under the project subpath.
- A `public/.nojekyll` file is included to disable Jekyll processing (required for Vite's `_…` prefixed files and PWA service worker).

### Switching Pages source to GitHub Actions
If you want the Actions workflow to be the source of truth instead of the `gh-pages` branch, go to
**Settings → Pages** and set **Source** to **GitHub Actions**. The current deployment uses the
`gh-pages` branch (via the `npm run deploy` script which uses the `gh-pages` npm package) until that
switch is flipped.

## 📦 Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build into `dist/`
- `npm run preview` — preview the production build locally
- `npm run deploy` — one-shot deploy from local `dist/` to the `gh-pages` branch (manual fallback)

## 🎨 Features

- JARVIS-inspired futuristic dark UI
- Orbitron / Rajdhani / Share Tech Mono typography
- Animated dots / particle background
- PWA (installable, offline-capable via Workbox)
- Mobile-first, touch-friendly layout
