# Containerizing iso-display-bcb94b66 (Vite + React SPA)

This repository is a React app built with Vite. The app uses `@base44/sdk` from the browser.
The container build produces a static site and serves it via Nginx with SPA routing.

## Quick start (local)

```bash
# 1) Ensure Docker and Docker Compose are installed
# 2) Copy env template and edit
cp .env.example .env
# 3) Build and run
docker compose up --build
# 4) Open http://localhost:8080
```

## Environment variables

Vite exposes only variables prefixed with `VITE_` to the frontend at **build time**. We've introduced:
- `VITE_BASE44_APP_ID` — used by the Base44 SDK client.

> If your code currently hard-codes the appId in `src/api/base44Client.js`, update it to read from `import.meta.env`:
>
> ```js
> // src/api/base44Client.js
> import { createClient } from '@base44/sdk';
> const appId = import.meta.env.VITE_BASE44_APP_ID ?? "CHANGE_ME";
> export const base44 = createClient({ appId, requiresAuth: true });
> ```
>
> Then rebuild the image.

## Development vs Production

- **This container** serves the built `dist/` assets with Nginx. There is no Node.js server at runtime.
- If you need SSR or server APIs, we’d switch to a Node runtime container instead of Nginx.

## Notes on missing backend functions

The export references Base44 integrations via `@base44/sdk`. Those run on Base44 services. If we need to replicate
server-side functionality off-platform, we can:
1) Stand up a minimal API (e.g., Node/Express or Python/FastAPI) that proxies or re-implements required endpoints.
2) Update the frontend to call that API instead of SDK calls that require Base44 infrastructure.
3) Extend `docker-compose.yml` with that API service (plus Postgres/Redis if needed).

## Troubleshooting

- **Blank page or 404 on refresh**: The included `nginx.conf` has SPA fallback. Verify it’s in the image.
- **CORS/auth issues**: Calls to Base44 domains from localhost may require specific allowed origins or credentials.
  We can add a dev proxy or backend if needed.
- **Env changes not taking effect**: Vite inlines vars at build time; rebuild the image after editing `.env`.
