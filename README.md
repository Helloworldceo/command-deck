# Command Deck

An animated track map of every project on this machine — one line per category, one pulsing station per project. Started life as a Claude Artifact (backed by the `db` capability); this is the standalone version, hosted on Netlify with [Netlify Blobs](https://docs.netlify.com/blobs/overview/) as the data store so it works outside claude.ai.

## How it works

- `index.html` — the whole UI: stat strip, filters, an SVG track map (one lane per category, animated for live/blocked projects), and add/edit/detail modals. No build step, no framework.
- `netlify/functions/projects.js` — a single Netlify Function doing CRUD against a Netlify Blobs store called `projects`. `GET` is open (anyone with the link can view the board); `POST`/`PUT`/`DELETE` require an `X-Api-Key` header matching the `PROJECTS_API_KEY` environment variable set on the Netlify site.
- The frontend prompts for that key the first time you try to add, edit, or delete something, then remembers it in `localStorage` on that device.

## Local dev

```bash
npm install
netlify dev
```

`netlify dev` serves `index.html` and runs the function locally with Netlify Blobs emulated.

## Deploy

Already deployed via `netlify deploy --prod`. Push to `main` and re-run that (or connect the repo in the Netlify UI under Site settings → Build & deploy → Link repository for automatic deploys on every push).

## Data model

Each project is a Blob keyed by a generated id, with fields:

```
name, category, status (live | shipped | blocked | paused | idea),
description, nextStep, blocker, liveUrl, repoUrl, updatedAt
```
