# MeatLens project overview

MeatLens is an AI-assisted meat-freshness inspection system for wet-market
workflows. Inspectors capture an image, receive computer-vision decision
support, and save a traceable inspection record. Administrators manage users,
access codes, markets, audit events, and aggregate reporting. Developers manage
datasets, model versions, calibration data, and training artifacts.

## Product capabilities

- Client-side MobileNetV3Small and other supported ONNX runtimes for primary
  freshness decision support.
- Developer-only model selection, model-version history, and calibration
  analytics.
- Authenticated inspection capture, upload, classification, dispute, and
  history workflows.
- Role-aware administration for inspectors, administrators, and developers.
- Access-code onboarding and market-location management.
- Encrypted audit events and bounded user-to-user chat with realtime updates.
- Developer dataset export, manual classification, and training-run import.
- Offline-friendly capture and sync boundaries backed by local SQLite adapters.

AI output is decision support. Inspectors remain responsible for field
judgment, compliance decisions, and handling conditions that are outside the
model’s training or image-quality assumptions.

## Technology and deployment

| Area | Technology |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind, Capacitor, ONNX Runtime Web |
| Backend | Node.js 22, Express, TypeScript |
| Database | PostgreSQL through Supabase |
| Auth | Supabase Auth plus an application-signed session cookie |
| Storage | Supabase Storage and bounded local upload staging |
| Realtime | Supabase Realtime, backend bounded hub, and SSE |
| Testing | Node test runner/tsx, frontend component/integration tests, Playwright, Gradle |
| Deployment | Netlify frontend, Render backend, Supabase managed services |

No Redis, queue server, cache server, Grafana, Prometheus, or external metrics
stack is part of the supported deployment.

## Repository map

```text
botchabuster/
├── backend/
│   ├── src/
│   │   ├── bootstrap/       # dependency setup and route composition
│   │   ├── modules/         # bounded backend contexts
│   │   ├── middleware/      # cross-cutting HTTP/security middleware
│   │   ├── config/          # validated environment and runtime policy
│   │   ├── integrations/    # Supabase and external adapters
│   │   ├── shared/          # reusable application/domain/HTTP primitives
│   │   └── types/           # shared transport and domain types
│   ├── supabase/migrations/ # append-only database migrations
│   └── tests/               # unit, integration, and architecture tests
├── frontend/
│   ├── src/app/             # providers, routing, layouts, and composition
│   ├── src/pages/           # route-level screens
│   ├── src/widgets/         # page-scale composition
│   ├── src/features/        # workflows and user operations
│   ├── src/entities/        # business concepts and API/cache contracts
│   └── src/shared/          # generic UI and cross-cutting adapters
├── android/                 # Capacitor Android shell and local migrations
├── ios/                     # Capacitor iOS shell
├── documentation/           # current product, architecture, and operations docs
├── docs/                    # design/specification and research artifacts
└── scripts/                 # monorepo build, CI, model, and documentation checks
```

## Backend modules

The current bounded contexts are:

- `access-codes` — onboarding-code lifecycle.
- `analysis` — upload/storage boundary and retired server-analysis compatibility.
- `analytics` — landing-page and inspection aggregates.
- `audit` — encrypted audit-log persistence and reads.
- `auth` — credentials, passkeys, sessions, CSRF, email, and cookie policy.
- `chat` — assistant chat, user-chat conversations, and realtime events.
- `developer` — datasets, training runs, developer options, and unlock tokens.
- `inspections` — inspection records, statistics, scope, and result disputes.
- `markets` — market-location administration.
- `model-accuracy` — model versions, snapshots, and calibration analytics.
- `transport` — public-key discovery and encrypted application envelopes.
- `users` — profiles, roles, administration, and user statistics.

See [Architecture](ARCHITECTURE.md) for layer boundaries and request flow.

## Backend route namespaces

The application mounts module routers through
`backend/src/bootstrap/routes.ts`:

`/api/transport`, `/api/analysis`, `/api/profiles`, `/api/inspections`,
`/api/access-codes`, `/api/stats`, `/api/upload`, `/api/auth`, `/api/chat`,
`/api/market-locations`, `/api/audit-logs`, `/api/developer-options`,
`/api/developer-dashboard`, `/api/user-chat`, and `/api/model-accuracy`.

See [API reference](API_REFERENCE.md) for the route-level catalog and security
requirements.

## Data, privacy, and scale posture

Supabase is the system of record for authenticated application data. High-volume
reads use explicit projections, deterministic ordering, bounded limits, indexes,
and aggregate RPCs. New database changes are forward-only migration files;
existing migrations are not edited in place.

The frontend keeps only the local state required for offline capture, queued
sync, model execution, and native credential unlock. Protected application
requests use the documented cookie/bearer and transport-envelope boundaries.
See [Security](SECURITY.md) for trust boundaries and
[Getting started](GETTING_STARTED.md) for configuration requirements.

## Development commands

From the repository root:

```bash
npm install
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test:documentation
npm run test:fast
```

For setup and the complete CI-equivalent command list, see
[Getting started](GETTING_STARTED.md). For release configuration, see
[Deployment](DEPLOYMENT.md).

