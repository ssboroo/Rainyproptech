# RAINY VISTA — Architectural AI Studio

Mongolian / English architectural visualization workspace built with Next.js 15 App Router, TypeScript, Tailwind, Radix/shadcn-compatible UI, react-compare-slider, Supabase and Fal.ai. This repository was empty before this implementation; there was no existing interior application or database to migrate.

## Features

- Interior and Exterior / Master Plan workspaces with 31 bilingual building and room typologies.
- Searchable architectural library with 30 bilingual styles, grouped material languages and original vector motifs.
- Native DWG, ASCII DXF and SketchUp import (25 MB), local geometry preview, confirmed view capture, plus PNG/JPEG/WebP upload (15 MB) and Before / After slider. PDF, RVT, IFC and other native formats are not accepted.
- Nano Banana Pro reference-image editing with native 4K output requested, original aspect ratio and one output. No separate ControlNet setup. Server-composed photorealistic prompts prioritize massing, floor count, windows, balconies, site boundaries and physically plausible materials.
- Kling 3.0 Pro image-to-video, 5 seconds, with pull back / elevate, orbit and facade pan direction.
- Company text overlay in the video player, generation history, private inputs and outputs, email/password Supabase Auth.
- Model-aware credits use 1 credit = 100 MNT. Prices include a 200% cost markup, 3,700 MNT/USD planning FX, a 5% provider cost reserve, a planned 3% collection fee and 50 MNT/job operating allocation; see docs/pricing.md. The reviewed default 4K render is 38 credits, a 5s Kling Pro video 69 credits. Transactions lock the balance, reserve once per request UUID and refund definitive failed jobs once. Clients cannot change balances or write generation rows.

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

No payment gateway / automatic credit purchases are implemented. Set bucket file limits and account quotas for your deployment; generated media can be up to 50 MB per image or 100 MB per video. Inputs remain private and short-lived signed URLs are sent to Fal for processing. Generated provider media is copied into private Supabase Storage and returned as signed URLs.

## API flow

All API calls require `Authorization: Bearer <Supabase access token>`. The server validates the token using `auth.getUser`.

1. `GET /api/account`: create own profile if absent, return credits and own recent jobs.
2. `POST /api/upload`: multipart `file`, validates raster signature / size, stores under the authenticated user.
3. `POST /api/generations`: UUID `id`, `kind`, `project`, `style`, `motion`, optional `notes`, plus `source_path` for images or completed own image `parent_id` for video. Server chooses prompts, models and prices.
4. `GET /api/generations/:id`: owner-only queue status, stores completed media, returns signed source / output URLs. Page polls every five seconds and resumes pending jobs after sign in / reload.

A request UUID is an idempotency key. A conditional database claim prevents duplicate concurrent provider submissions. Transient provider errors do not refund a job that might still complete. **Ambiguous submit timeouts** or a failure saving the provider request ID need operator reconciliation: find the accepted request in Fal history, set `provider_request_id`, `model` and `status='queued'` on that owned job; refund only after confirming no billable job exists. Do not blindly resubmit or refund stale processing rows. Definitive provider 400/422 failures refund through the locked `fail_generation` function.

## Output scope and limits

These outputs are images and videos, **not downloadable geometric 3D meshes or BIM models**. Renders request native 4K output. No 8K generation or upscaler is included. Timing varies by provider queue and model; 15 seconds is not guaranteed. Image-to-video may infer unseen surfaces; a single source image cannot establish a geometrically accurate 360-degree building reconstruction. The orbit preset uses a short restrained arc. Check each render against architectural drawings before commercial use.

Branding is a **player overlay**, not burned into downloaded MP4 files. Generated links expire after an hour; reload from history for fresh links. Account data and media are persistent in Supabase; backups, retention, billing and paid credit provisioning remain deployment responsibilities.

## Models and official references

Checked 2026-10-15. The requested FLUX Pro v1 Depth, Kling v1.6 Pro and Veo 2 endpoints are marked deprecated in Fal's docs, so this implementation uses the alternatives below. Validate availability, pricing, safety behavior and example renders with your own Fal account before selling access.

- [Nano Banana Pro edit schema](https://fal.ai/models/fal-ai/nano-banana-pro/edit/api)
- [Kling 3.0 Pro image-to-video schema](https://fal.ai/models/fal-ai/veo2/image-to-video/api)
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

Tests execute the migration against PGlite/PostgreSQL with Auth/Storage schemas stubbed, exercising charges, idempotent retries, insufficient balance, refund-once, completed-job protection and function access. Other tests cover project mapping, validation, pricing and 4K reference input, project-aware camera direction and video controls. They do not replace hosted Supabase RLS / Storage integration tests or paid Fal generation tests.

GitHub Actions runs tests and production build. Docker uses Next standalone output; `railway.json` supports Railway deployment. Supply public Supabase values as build args/environment and server secrets at runtime. No production project, database, provider credentials or domain were provisioned by this code change.

## Simple premium connection

Both render and video use one provider and the same server-only `FAL_KEY`; no Google API key, separate Kling key, GPU, ControlNet installation or custom LoRA is required. Default render is Nano Banana Pro at 4K, default video is Kling 3.0 Pro at 5 seconds with audio off. The app requests documented resolution settings, but does not certify measured quality or structural accuracy without live reference tests. The image model does not expose FLUX guidance / ControlNet fields, so those parameters are deliberately not sent. This is a photo-quality editing workflow; exact CAD geometry remains a review responsibility.

Existing jobs retain their stored model ID, so status checks continue using the model that originally created the job. Credit prices remain 2 / 6 app units; validate your provider costs before enabling paid sales.

## 100-model workspace and routing

`lib/model-catalog.json` contains 100 unique active Fal endpoints (50 image-to-image and 50 image-to-video), with their official OpenAPI input schemas and retrieval time. The sync script filters out models requiring unrelated audio, masks, segmentation or avatar tasks. These are **100 schema-compatible adapters**, not a claim that 100 paid outputs have been tested. Native 3D, audio-only, training and text-only models are outside this source-image architectural workflow.

The default **Auto** policy selects by generation type, project type and camera motion. Quality / Speed / Structure change the preference policy. These are transparent rules, not an AI vision analysis or measured benchmark. A manual catalog picker exposes every included adapter. Some image adapters enhance or upscale an existing image; they are available manually, but automatic rendering prefers generative architecture-capable image editors. The selected model ID is stored on the generation and displayed beside the result.

Each adapter constructs the correct image field, supported resolution/duration and safe single-output controls. AJV validates against the provider schema **before any credits are reserved**. There is no automatic paid retry with another provider after submission, since a timeout may already represent a billable job. Existing jobs keep their original model ID. Media extraction supports both singular and plural file responses; downloaded content still passes host, MIME and size checks.

Refresh the compatible model snapshot from Fal's public catalog with Python 3:

```sh
python scripts/sync-model-catalog.py
npm test
npm run build
```

The refresh script preserves the prior snapshot unless exactly 100 compatible entries are collected; it retries bounded catalog rate limits. Commit and deploy a refreshed snapshot after validation. The runtime validates against this versioned snapshot; catalog additions are not silently enabled without that validation. Generation credits are calculated server-side from reviewed provider tariffs, resolution, duration and the pricing policy. See docs/pricing.md. Published tariffs are available for all 100 entries; 51 models have prepaid quote adapters, while metered models remain unavailable until their quantities can be quoted reliably.

Video duration and resolution are selectable from each adapter’s schema. The server submits and quotes the same supported settings.

## Brand and workspace design

RAINY VISTA uses a native SVG perspective mark, a cream / navy / teal workspace, responsive project controls, an expandable comparison canvas and a private completed-results gallery. Brand assets live in `public/brand/`. The gallery displays only completed authenticated outputs; it never substitutes stock imagery for generated results.

Workflow references: [Chaos Veras](https://www.chaos.com/veras), [REimagineHome exterior](https://www.reimaginehome.ai/render-exterior-structures), and [Formas](https://www.formas.ai/). No competitor assets are included.

## Native CAD and SketchUp import

Upload `.dxf`, `.dwg`, or `.skp` up to **25 MB**. A cancellable browser worker reads the geometry locally; the original design is never uploaded. Review the model-space CAD preview or orbit the SketchUp model (3D/front/top), then confirm the view. The app captures a PNG reference and sends that image through the existing private upload and generation flow. Import itself does not consume AI credits. Originals and editable geometry are not retained across sessions.

The importer is a visualization tool, not an authoritative CAD/BIM editor. ASCII DXF geometry is supported; binary DXF must be exported as ASCII. Xrefs, some solid/proxy entities, annotation, textures and older SKP variants may not reproduce fully. Every import requires visual review; unreadable/empty files fail without consuming credits. A 60-second timeout terminates parsing. WebGL renders textures where available; browsers without WebGL use a software SVG 3D preview with material colors and a 150,000-triangle limit. Large models may require simplification, especially on mobile. DXF and SKP source examples can be opened directly from the uploader; they are original synthetic source geometry, not AI output examples.

The catalog now includes **31 project typologies** and **30 styles**, including interiors, residential, commercial, civic, industrial and site planning. API validation and database subtype constraints share the catalog's exact supported identifiers. Apply `20261015060828_expand_architecture_typologies.sql` after the initial migration for existing installations.

`npm run dev` and `npm run build` prepare the locally served DWG JS/WASM and example files from pinned packages. Generated assets are excluded from git and included in the Docker runtime's public directory. See `public/cad/NOTICE.txt` and `public/cad/COPYING` for the separate DWG worker's open-source notices and corresponding source.

## Photographic design library

Thirty original AI architectural concept photographs now illustrate the welcome canvas, project and style libraries, visual journal and cinematic section. These are clearly labelled inspiration assets, never inserted into the private results gallery or used as proof of a customer generation. Controls and CAD source previews remain accurate to the selected file. Each concept has a full-size optimized WebP and a 640px thumbnail under `public/visuals/`; library images load lazily. The prompt briefs and generation provenance are in `docs/visual-assets.json`. Repeated material families share relevant concept references.


### Mongolia workflow and credit packs

`/guide` explains uploading, Mongolia/season context, reference checks, video length, credits and failure handling. `/pricing` starts at Starter ₮50,000 / 500 credits, then Studio ₮150,000 / 1,500 and Business ₮500,000 / 5,000. There is no connected online checkout. All inference uses the server-owned FAL_KEY: internal site credits and the owner’s Fal provider balance are separate ledgers. See docs/pricing.md for the full charge/refund flow.
