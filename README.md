# Command Deck

An animated track map of every project on this machine — one line per category, one pulsing station per project. Started life as a Claude Artifact (backed by the `db` capability); this is the standalone version, hosted on Vercel with Postgres (Neon) as the data store so it works outside claude.ai.

## How it works

- `index.html` — the whole UI: stat strip, filters, an SVG track map (one lane per category, animated for live/blocked projects), and add/edit/detail modals. No build step, no framework.
- `api/projects.js` — a single Vercel serverless function doing CRUD against a `command_deck.projects` table in Postgres (`@neondatabase/serverless`). `GET` is open (anyone with the link can view the board); `POST`/`PUT`/`DELETE` require an `X-Api-Key` header matching the `PROJECTS_API_KEY` environment variable set on the Vercel project.
- The frontend prompts for that key the first time you try to add, edit, or delete something, then remembers it in `localStorage` on that device.

## Local dev

```bash
npm install
vercel dev
```

## Deploy

```bash
vercel --prod
```

Or push to `main` — if the Vercel project is linked to this GitHub repo, every push redeploys automatically.

Required environment variables (set on the Vercel project): `DATABASE_URL` (Postgres/Neon connection string), `PROJECTS_API_KEY` (shared edit key).

## Data model

Each project is a row in `command_deck.projects`:

```
id, name, category, status (live | shipped | blocked | paused | idea),
description, next_step, blocker, live_url, repo_url, updated_at
```
