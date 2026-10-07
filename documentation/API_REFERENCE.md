# API reference

The backend mounts the module routers listed below under `/api`. Unless noted
otherwise, protected operations accept either the `meatlens_session` cookie or
`Authorization: Bearer <token>`. Request and response bodies use the transport
envelope rules described in [Security](SECURITY.md).

The source of truth is `backend/src/bootstrap/routes.ts` plus the presentation
route files under `backend/src/modules/*/presentation`.

## Route namespaces

| Namespace | Representative operations | Access |
| --- | --- | --- |
| `/transport` | `GET /public-key` | Public key discovery; plaintext by design |
| `/auth` | sign-in/sign-up, session, sign-out, passkeys, password recovery, email/password updates | Sign-in/sign-up/reset/passkey authentication are public and rate-limited; session and account mutations require authentication/self scope |
| `/analysis` | `POST /analyze`, `GET /health` | Health is public; `/analyze` is a retired server-analysis compatibility endpoint |
| `/upload` | inspection-image upload and public/protected image access | Authenticated multipart upload; image access is scope-controlled |
| `/profiles` | profile reads/updates, admin users, roles, stats | Self or admin; role changes require developer access |
| `/inspections` | list, detail, create, delete, stats, disputes | Authenticated and scope-controlled; admin/developer access is policy-gated |
| `/access-codes` | list, create, validate, delete, toggle | Administrative lifecycle operations |
| `/stats` | `GET /landing-page` | Public aggregate landing statistics |
| `/chat` | assistant chat | Authenticated and rate-limited |
| `/user-chat` | contacts, conversation messages, SSE events, send message | Authenticated; contacts and messages are participant-scoped |
| `/market-locations` | list, create, delete | Reads may be public to the app; mutations require admin access |
| `/audit-logs` | list and create | Authenticated; writes are encrypted and actor-attributed |
| `/developer-options` | unlock and verify | Developer-option policy and token checks |
| `/developer-dashboard` | overview, datasets, disputes, exports, classifications, training runs/import | Developer-only except explicitly admin-gated dispute review operations |
| `/model-accuracy` | history, versions, snapshots, calibration, calibration import | History requires authentication; registration/capture require developer access; calibration reads/imports require developer or admin access |

## Authentication routes

The `/auth` router includes:

- `POST /sign-in` and `POST /sign-up`;
- `GET /session` and `POST /sign-out`;
- passkey registration options/verification and authentication options/verification;
- `GET /passkeys` and `DELETE /passkeys/:credentialId`;
- `POST /reset-password` and `POST /recovery/password`;
- `PATCH /users/:id/email` and `PATCH /users/:id/password` for self-service
  account mutations.

Cookie-authenticated unsafe requests also require a valid CSRF token and
allowed origin. Native clients may use the supported bearer transport.

## Inspection and upload routes

The inspection lifecycle includes:

- `GET /api/inspections` with bounded pagination and actor/role scope;
- `GET /api/inspections/:id`;
- `POST /api/inspections`;
- `DELETE /api/inspections/:id`;
- `GET /api/inspections/stats`;
- `GET /api/inspections/disputes`;
- `POST /api/inspections/:id/disputes`;
- `POST /api/upload/inspection-image` for bounded multipart uploads.

The supported user workflow performs primary image inference in the frontend
and submits the classification and evidence to these APIs. `POST
/api/analysis/analyze` remains available only as a retired compatibility path;
it is not the primary model runtime.

## User, administration, and developer routes

The users router provides profile reads/updates, administrative user creation,
updates, deletion, role changes, statistics, and role checks. Access-code and
market-location routers provide their respective administrative lifecycles.

The developer dashboard supports owner-scoped dataset reads/exports, manual
classification, training-run imports, inspection-result dispute workflows, and
progress-aware ZIP exports. Developer exports are bounded to 10,000 matching
records, use explicit manifest fields, and return an error instead of a
partial archive when a required existing image cannot be downloaded.

## Model accuracy and calibration

Register a model version before deploying it:

- `POST /api/model-accuracy/versions` with `versionKey`, `displayName`,
  `expectedAccuracy`, and `activeFrom`;
- `GET /api/model-accuracy/history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`;
- `POST /api/model-accuracy/snapshots` with an optional `snapshotDate`;
- `GET /api/model-accuracy/calibration` for authorized calibration analytics;
- `POST /api/model-accuracy/calibration/import` for authorized calibration
  packages.

Expected accuracy is immutable for a version key. A changed model or benchmark
gets a new key. Snapshot writes are append-only and idempotent per model
version/date. Observed accuracy uses inspections with a non-null official
classification and is null when no eligible labels exist.

## Common request rules

- JSON bodies are parsed by Express; malformed JSON returns a JSON `400`.
- Multipart image and developer-package uploads are bounded by backend
  middleware; the default image maximum is 10 MB.
- The browser obtains public-key metadata from `GET /api/transport/public-key`
  and sends a fresh RSA-wrapped AES key in `X-Transport-Key` for encrypted
  application requests.
- `GET /api/analysis/health` and `GET /api/transport/public-key` are the
  intentionally plaintext application endpoints. Paths, queries, auth
  headers, CSRF headers, and `X-Transport-Key` remain visible by design.
- Unsafe cookie-authenticated requests (`POST`, `PUT`, `PATCH`, `DELETE`)
  require a valid `X-CSRF-Token` and an allowed `Origin`.
- Public auth and chat operations use bounded in-process rate limits; Redis is
  not required.
- Unexpected failures omit internal stack traces and database details.
- Reads use explicit projections, bounded limits, deterministic ordering, and
  user/role scoping.

## Realtime user chat

`GET /api/user-chat/events` exposes authenticated SSE events for visible,
online messaging screens. Tokens do not appear in the stream URL. The backend
validates origin/session state before committing SSE headers, bounds concurrent
streams and per-response buffering, and reconnects to Supabase Realtime with
bounded backoff. See [Security](SECURITY.md) for stream limits and
[Architecture](ARCHITECTURE.md) for the data flow.

## Health check

```bash
curl http://localhost:3001/api/analysis/health
```

Expected response:

```json
{ "status": "ok" }
```

## Contract and maintenance rules

When a route changes, update the presentation route, frontend API catalog, and
repository contract tests together. Run `npm run test:documentation`, the
relevant backend/frontend test lane, and `npm run test:contract` before
merging. See [Getting started](GETTING_STARTED.md) for the local verification
sequence.

