# EIRA — frontend MVP

An atmospheric, accessible Next.js prototype for a calmer way to understand what changed. All story material, statuses, and sources are deliberately labelled as illustrative demo content.

## Run locally

This project includes a local Node.js 20.19.6 runtime in `.tools/node`. To install and run without a global Node installation:

```bash
./.tools/node/bin/node .tools/node/lib/node_modules/npm/bin/npm-cli.js install
./.tools/node/bin/node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3000
```

Open `http://localhost:3000`.

## Architecture

- `app/` contains the Home, Living Story, Catch Me Up, Explore, Ask, and Library routes.
- `components/eira.tsx` holds shared navigation, status, provenance, and interaction primitives.
- `data/content.ts` holds typed, replaceable demo story, timeline, source, and verification data.
- `app/globals.css` supplies the contextual visual system, responsive/reduced-motion treatment, and editorial typography.

Review the Home hero and `/story/ocean-current` first: they demonstrate the central living-story hierarchy, uncertainty state, provenance, timeline, and “Start from zero” path.
