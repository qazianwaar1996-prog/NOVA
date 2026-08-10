# CI Fix: inject VITE_* secrets into the Build step

> **Why this file exists:** The Arena GitHub App token in this sandbox lacks the `workflows` permission, so it cannot directly push edits to `.github/workflows/deploy.yml`. Apply the patch below to `.github/workflows/deploy.yml` when merging this PR to fix the 401 / "connection interrupted" errors.

## Root cause

Vite replaces `import.meta.env.VITE_*` **at build time**, not at runtime. The previous `deploy.yml` ran `npm run build` with no environment set, so every API key in the shipped bundle was `undefined` → every provider returned 401.

## Required edit to `.github/workflows/deploy.yml`

Replace the line:

```yaml
      - run: npm run build
```

with:

```yaml
      - name: Build
        run: npm run build
        env:
          VITE_GEMINI_KEY: ${{ secrets.VITE_GEMINI_KEY }}
          VITE_GROQ_KEY: ${{ secrets.VITE_GROQ_KEY }}
          VITE_DEEPSEEK_KEY: ${{ secrets.VITE_DEEPSEEK_KEY }}
          VITE_MISTRAL_KEY: ${{ secrets.VITE_MISTRAL_KEY }}
          VITE_COHERE_KEY: ${{ secrets.VITE_COHERE_KEY }}
          VITE_OPENROUTER_KEY: ${{ secrets.VITE_OPENROUTER_KEY }}
          VITE_CEREBRAS_KEY: ${{ secrets.VITE_CEREBRAS_KEY }}
          VITE_HUGGINGFACE_KEY: ${{ secrets.VITE_HUGGINGFACE_KEY }}
          VITE_REPLICATE_KEY: ${{ secrets.VITE_REPLICATE_KEY }}
          VITE_STABILITY_KEY: ${{ secrets.VITE_STABILITY_KEY }}
          VITE_ELEVENLABS_KEY: ${{ secrets.VITE_ELEVENLABS_KEY }}
          VITE_TAVILY_KEY: ${{ secrets.VITE_TAVILY_KEY }}
```

## Also already on `main` from this session

- `src/App.jsx` → `sendToNOVA()` rewritten so **Gemini is always primary** (most generous free tier). Groq is the only fallback. IMAGE stays on Pollinations (free, keyless).
- `NOVAOutputModal` shows a temporary red `⚠ RAW API ERROR (debug)` panel when the response contains `Error:`, so you can see exactly which provider is failing and why. Remove it once the keys are confirmed working.

## Verify

1. Confirm the 12 secrets exist in **Settings → Secrets and variables → Actions** with the exact names above (the `VITE_` prefix is required — Vite only inlines vars that start with it).
2. Push to `main` to trigger the Deploy workflow.
3. After deploy, send a test command. If keys are wired correctly NOVA replies via Gemini; if not, the red debug panel in the modal shows the raw HTTP error.
