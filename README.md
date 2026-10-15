# RAINY PropTech AI Studio

Mongolian / English architectural visualization workspace built with Next.js 15 App Router, TypeScript, Tailwind, Radix/shadcn-compatible UI, react-compare-slider, Supabase and Fal.ai. This repository was empty before this implementation; there was no existing interior application or database to migrate.

## Features

- Interior and Exterior / Master Plan workspaces, facade / master plan / townhouse / commercial project cards.
- Four bilingual exterior styles plus a warm minimal interior style.
- PNG, JPEG, WebP source upload (15 MB), local preview and Before / After slider. Export CAD, vector, SVG or SketchUp drawings to raster first; native DWG, DXF, PDF and 3D model files are not accepted.
- FLUX General image-to-image with guidance 4.0 and spatial Canny EasyControl. Server-composed prompts prioritize massing, floor count, windows, balconies and site boundaries.
- Veo 2 image-to-video, 5 seconds, with pull back / elevate, orbit and facade pan direction.
- Company text overlay in the video player, generation history, private inputs and outputs, email/password Supabase Auth.
- Images cost 2 credits, video costs 6 credits. Transactions lock the balance, reserve once per request UUID and refund definitive failed jobs once. Clients cannot change balances or write generation rows.

## Run

Node 20.9+ (Node 22 recommended).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Populate all four variables in `.env.local`. The publishable Supabase key is browser-safe; `SUPABASE_SERVICE_ROLE_KEY` and `FAL_KEY` must remain server-only. Public env variables must also be present at build time. Without credentials the workspace renders, but sign in and real generation remain unavailable; there are no fake generated results or simulated credits.

## Supabase setup

Use a new Supabase project. Review and apply `supabase/migrations/20261015034911_initial_proptech.sql` in the SQL editor, or link the CLI to the intended project and run `supabase db push`. The migration creates profiles, generations, credit transaction functions, RLS and private `sources` / `outputs` buckets. Do not apply this initial schema blindly to an existing database.

Enable email/password Auth and configure your Site URL / allowed redirect URL in Supabase. New accounts start with **zero credits**. First authenticated account load initializes the profile. Grant credits from a trusted administrator session, never from browser code:

```sql
update public.profiles set credits = credits + 20
where id = 'USER_UUID_FROM_SUPABASE_AUTH';
```

No payment gateway / automatic credit purchases are implemented. Set bucket file limits and account quotas for your deployment; generated media can be up to 25 MB per image or 100 MB per video. Inputs remain private and short-lived signed URLs are sent to Fal for processing. Generated provider media is copied into private Supabase Storage and returned as signed URLs.

## API flow

All API calls require `Authorization: Bearer <Supabase access token>`. The server validates the token using `auth.getUser`.

1. `GET /api/account`: create own profile if absent, return credits and own recent jobs.
2. `POST /api/upload`: multipart `file`, validates raster signature / size, stores under the authenticated user.
3. `POST /api/generations`: UUID `id`, `kind`, `project`, `style`, `motion`, optional `notes`, plus `source_path` for images or completed own image `parent_id` for video. Server chooses prompts, models and prices.
4. `GET /api/generations/:id`: owner-only queue status, stores completed media, returns signed source / output URLs. Page polls every five seconds and resumes pending jobs after sign in / reload.

A request UUID is an idempotency key. A conditional database claim prevents duplicate concurrent provider submissions. Transient provider errors do not refund a job that might still complete. **Ambiguous submit timeouts** or a failure saving the provider request ID need operator reconciliation: find the accepted request in Fal history, set `provider_request_id`, `model` and `status='queued'` on that owned job; refund only after confirming no billable job exists. Do not blindly resubmit or refund stale processing rows. Definitive provider 400/422 failures refund through the locked `fail_generation` function.

## Output scope and limits

These outputs are images and videos, **not downloadable geometric 3D meshes or BIM models**. “8K” in a preset describes the desired aesthetic, not a guaranteed output size. No 8K upscaler is included. Timing varies by provider queue and model; 15 seconds is not guaranteed. Image-to-video may infer unseen surfaces; a single source image cannot establish a geometrically accurate 360-degree building reconstruction. The orbit preset uses a short restrained arc. Check each render against architectural drawings before commercial use.

Branding is a **player overlay**, not burned into downloaded MP4 files. Generated links expire after an hour; reload from history for fresh links. Account data and media are persistent in Supabase; backups, retention, billing and paid credit provisioning remain deployment responsibilities.

## Models and official references

Checked 2026-10-15. The requested FLUX Pro v1 Depth and Kling v1.6 Pro endpoints are marked deprecated in Fal's docs, so this implementation uses the alternatives below. Validate availability, pricing, safety behavior and example renders with your own Fal account before selling access.

- [FLUX General image-to-image schema](https://fal.ai/models/fal-ai/flux-general/image-to-image/api)
- [Veo 2 image-to-video schema](https://fal.ai/models/fal-ai/veo2/image-to-video/api)
- [Deprecated FLUX Depth](https://fal.ai/models/fal-ai/flux-pro/v1/depth/api)
- [Deprecated Kling 1.6](https://fal.ai/models/fal-ai/kling-video/v1.6/pro/image-to-video/api)
- [Supabase Next.js Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)

The prices above are **application credit units**, not a statement of provider cost or profitability.

## Verification and deployment

```sh
npm test
npm run typecheck
npm run build
npm start
```

Tests execute the migration against PGlite/PostgreSQL with Auth/Storage schemas stubbed, exercising charges, idempotent retries, insufficient balance, refund-once, completed-job protection and function access. Other tests cover project mapping, validation, pricing and provider request control. They do not replace hosted Supabase RLS / Storage integration tests or paid Fal generation tests.

GitHub Actions runs tests and production build. Docker uses Next standalone output; `railway.json` supports Railway deployment. Supply public Supabase values as build args/environment and server secrets at runtime. No production project, database, provider credentials or domain were provisioned by this code change.
