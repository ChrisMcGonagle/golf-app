# GOLFAPP

Next.js kiosk-style golf club application with a separate long-running integration worker.

## Local development

```bash
npm install
npm run dev
```

The worker compiles separately and can be built or run with:

```bash
npm run build:worker
npm run worker
```

## Deployment

This repo is intended to run across three services:

- Vercel hosts the Next.js web app.
- Supabase provides the database and storage.
- Render runs the integration worker as a Background Worker.

The worker is a separate long-running process that polls the queue continuously. It is not something Vercel runs in the background for this app.

### Web app on Vercel

Deploy the repository to Vercel as a standard Next.js application. The existing `build` script already includes the worker compile step, so Vercel builds the full repo, but only the web application is served there.

### Database and storage on Supabase

Provision the Supabase project separately and supply the application environment variables in Vercel and Render as appropriate.

### Worker on Render

Use the repo-root `render.yaml` to create a Render Background Worker. It uses:

- `buildCommand`: `npm install && npm run build`
- `startCommand`: `npm run worker`

Required worker environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `INTEGRATION_QUEUE_POLL_INTERVAL_MS`
- `INTEGRATION_WORKER_ID`
- `INTEGRATION_REQUEST_TYPE_ADAPTER_MAP`

Example non-secret values:

```env
INTEGRATION_QUEUE_POLL_INTERVAL_MS=5000
INTEGRATION_WORKER_ID=render-worker-1
INTEGRATION_REQUEST_TYPE_ADAPTER_MAP={"Full Member":"mock"}
```

`SUPABASE_SERVICE_ROLE_KEY` must remain server-only. `INTEGRATION_REQUEST_TYPE_ADAPTER_MAP` must be valid JSON because the worker parses it at startup.
