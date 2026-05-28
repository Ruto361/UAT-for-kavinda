# Kavinda UAT — Netlify Edition

Drop-in **Netlify** deployment of the Kavinda Gunasekara UAT Acceptance Dashboard — everything bundled, zero build step required.

## What's inside

```
kavinda-uat-netlify/
├── netlify.toml                          # Netlify config (publish dir + functions dir)
├── package.json                          # @netlify/blobs dependency
├── public/                               # Static site (served by Netlify CDN)
│   ├── index.html                        # The full dashboard (pre-rendered)
│   └── static/
│       ├── app.js                        # Interactivity
│       ├── sounds.js                     # Web Audio mechanical sounds
│       ├── style.css                     # Design system
│       ├── logo.svg                      # Brand logo
│       ├── logo-mark.svg                 # Brand logo + wordmark
│       └── uat-data.json                 # UAT scenarios
└── netlify/
    └── functions/                        # Serverless API
        ├── uat.mjs                       # GET  /api/uat
        ├── signoff-submit.mjs            # POST /api/signoff
        ├── signoff-latest.mjs            # GET  /api/signoff/latest
        ├── signoffs-list.mjs             # GET  /api/signoffs
        ├── signoff-reset.mjs             # POST /api/signoff/reset?key=...
        ├── admin.mjs                     # GET  /admin  (dev-team view)
        └── uat-data.json                 # bundled with uat.mjs
```

## How to deploy

### Option 1 — Drag & drop (fastest)
1. Log in to **app.netlify.com**.
2. **Sites → Add new site → Deploy manually**.
3. Drag this entire folder (or its zip) into the drop zone.
4. Netlify auto-detects `netlify.toml`, installs `@netlify/blobs`, and deploys both the static site and the functions.

### Option 2 — Netlify CLI
```bash
npm install -g netlify-cli
cd kavinda-uat-netlify
netlify deploy --prod --dir=public --functions=netlify/functions
```

### Option 3 — Git
1. Push this folder to a GitHub / GitLab / Bitbucket repo.
2. In Netlify: **Add new site → Import an existing project → pick the repo**.
3. Build settings: leave **build command empty**. **Publish directory:** `public`. **Functions directory:** `netlify/functions`.

## URLs (once deployed)

| URL | Purpose |
|---|---|
| `/` | The full UAT dashboard for the client |
| `/admin` | Developer view — every client sign-off, signature image included |
| `/api/uat` | Raw UAT scenario JSON |
| `/api/signoff` (POST) | Submit a new sign-off |
| `/api/signoff/latest` | The most recent sign-off (used to lock the page) |
| `/api/signoffs` | All sign-offs (used by /admin) |
| `/api/signoff/reset?key=kavinda-dev-reset-2026` (POST) | Wipe all sign-offs (dev only) |

## Persistence

Sign-offs are stored in **Netlify Blobs** — a free, fast, globally consistent KV store baked into Netlify. No extra setup, no database to provision. Data persists across deploys.

## Notes

- The dashboard works **offline** thanks to `localStorage` fallback — even if the function is briefly unavailable, the client can still sign and the data is preserved locally and pushed when the backend recovers.
- Once any sign-off is recorded, every visitor will see the **locked "Contract Official" screen** on load until you reset via `/api/signoff/reset?key=...`.
- The `admin` page is intentionally not auth-protected — if you need it private, add a Netlify Identity / Basic Auth header rule in `netlify.toml`.

## Tech stack

- **Frontend**: vanilla JS + Tailwind (CDN) + Lenis smooth scroll + Web Audio API
- **Backend**: Netlify Functions (Node 20, ESM)
- **Storage**: Netlify Blobs (`@netlify/blobs`)
- **Fonts**: Inter · Space Grotesk · JetBrains Mono · Caveat
