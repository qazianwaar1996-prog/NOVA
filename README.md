# NOVA — AI Operations Command Center

A futuristic AI operations command center UI built with React + Vite + PWA.

## 🌐 Live Site

**GitHub Pages:** https://qazianwaar1996-prog.github.io/NOVA/

The site is live and served from the `gh-pages` branch. Every release build is
pushed there via `npm run deploy` (which uses the `gh-pages` package).

## 🚀 Auto-Deploy

Two paths are provided — pick whichever fits your workflow.

### 1. GitHub Actions workflow (recommended)

A ready-to-use Actions workflow is at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
It runs on every push to `main` (and on manual `workflow_dispatch`):

1. Checks out the repo
2. Sets up Node 20 with npm cache
3. Installs dependencies (`npm ci`)
4. Builds (`npm run build` → outputs to `dist/`)
5. Uploads the `dist/` artifact to GitHub Pages
6. Deploys via `actions/deploy-pages@v4`

To enable it, in **Settings → Pages** set **Source** to **GitHub Actions**, then
commit and push the workflow file to `main`. (The sandboxed GitHub App token
used in this environment cannot create workflow files via the API — it lacks the
`workflows` scope — so push the file directly or open a PR from a client that
has that permission.)

### 2. `gh-pages` branch deploy (working now)

This is how the live site is currently deployed. The `npm run deploy` script
builds `dist/` (with a `.nojekyll` marker added automatically via the `--nojekyll`
flag) and pushes it to the `gh-pages` branch, which GitHub Pages is configured
to serve.

```bash
npm run deploy
```

This can also be wired to CI by checking the workflow back in and switching
Pages → Source to "GitHub Actions".

## 📦 Scripts

| Command           | What it does                                              |
| ----------------- | --------------------------------------------------------- |
| `npm run dev`     | Start Vite dev server                                     |
| `npm run build`   | Production build into `dist/`                             |
| `npm run preview` | Preview the production build locally                      |
| `npm run deploy`  | Build + push `dist/` to the `gh-pages` branch (live now)  |

## ⚙️ Configuration notes

- `vite.config.js` already sets `base: '/NOVA/'`, so asset URLs resolve correctly
  under the `https://<user>.github.io/NOVA/` project-page path.
- PWA manifest and service worker scope/start_url are also set to `/NOVA/`.
- `.nojekyll` is included in the Pages publish so Jekyll doesn't strip files
  beginning with `_` (needed by Vite's hashed assets and Workbox).

## 🎨 Features

- NOVA-inspired futuristic dark UI
- Orbitron / Rajdhani / Share Tech Mono typography
- Animated dots / particle background
- PWA (installable, offline-capable via Workbox)
- Mobile-first, touch-friendly layout
