# MeatLens architecture

This document describes the architecture that is implemented in the current
repository. The supported system is a web/mobile client, a stateless Express
backend, and Supabase-managed persistence and authentication.

## System boundary

```text
React/Vite/Capacitor client
        |
        | HTTPS, credentialed cookie or bearer token,
        | encrypted application envelope where enabled
        v
Express application and cross-cutting middleware
        |
        v
Bootstrap route registry -> module presentation routers
        |
        v
Application use cases -> domain ports -> infrastructure adapters
        |
        v
Supabase Auth/PostgreSQL/Storage and optional SMTP
```

The frontend performs the primary meat-freshness inference locally with ONNX
Runtime Web. The backend stores authenticated inspection records, serves
protected application APIs, manages administrative workflows, and provides
storage and realtime boundaries. Capacitor packages the same frontend for
native mobile shells.

The supported deployment does not require Redis, a message broker, BullMQ,
Grafana, Prometheus, or an external metrics platform. Bounded in-process
controls and Supabase services are the supported operational model.

## Backend modular monolith

The backend is one Express process organized into bounded contexts. Bootstrap
files under `backend/src/bootstrap` own dependency setup and route assembly.
Module presentation routers are mounted by
`backend/src/bootstrap/routes.ts`; modules expose public composition surfaces
through `index.ts`, and selected routers also expose factories for injected
stores or handlers.

Each module uses the layers that its responsibilities require:

| Layer | Responsibility | Typical dependencies |
| --- | --- | --- |
| Presentation | Express routers/controllers, HTTP parsing, auth context, status mapping, and views | application, domain types, middleware |
| Application | One-operation use cases and orchestration | domain ports, shared application primitives |
| Domain | IDs, value objects, policies, and repository/gateway ports | shared domain primitives |
| Infrastructure | Supabase, storage, SMTP, encryption, realtime, and concrete adapters | domain/application contracts and integrations |

Presentation and application code do not import the Supabase SDK directly.
Persistence remains behind infrastructure services or adapters, with explicit
projections and bounded reads.

## Backend module inventory

The current module directories under `backend/src/modules` are:

- **access-codes** — onboarding-code validation, creation, deletion, and
  activation state.
- **analysis** — multipart upload handling, storage delegation, and the
  retired server-analysis compatibility endpoint.
- **analytics** — landing-page and inspection aggregate queries.
- **audit** — encrypted audit-log writes and administrative reads.
- **auth** — password flows, passkeys, app sessions, CSRF tokens, email,
  cookies, and device-session limits.
- **chat** — assistant chat plus bounded user-to-user contacts, conversations,
  and realtime events.
- **developer** — dataset export, manual classification, training-run import,
  developer options, and unlock-token policy.
- **inspections** — scoped inspection CRUD, identifiers, statistics, and result
  disputes.
- **markets** — market-location administration.
- **model-accuracy** — model versions, accuracy snapshots, calibration imports,
  and calibration analytics.
- **transport** — public transport-key discovery and application-envelope
  support.
- **users** — profiles, roles, administrative user operations, and statistics.

## Request flow

The application in `backend/src/app.ts` applies cross-cutting behavior in this
order:

1. Security headers are applied.
2. Unsafe requests are rejected when their origin is not allowed.
3. Credentialed CORS rules are applied.
4. JSON bodies are parsed within the configured envelope limit.
5. Transport middleware decrypts and validates protected application envelopes
   within the configured payload limit.
6. The route registry mounts the module routers under `/api/*` prefixes.
7. The global error handler serializes malformed JSON, operational errors, and
   safe internal-error responses.

Within a module, the normal flow is:

```text
HTTP request
    ↓
module presentation router
    ↓
controller: parse request and resolve auth context
    ↓
application use case: execute one operation
    ↓
domain port or gateway
    ↓
infrastructure adapter
    ↓
Supabase, Storage, SMTP, Realtime, or crypto boundary
    ↓
view/shared HTTP response
```

Routes with special streaming or multipart behavior may use a module service
directly where the operation is transport-specific, but their external
storage and database work remains in infrastructure code.

## Authentication and authorization

1. Supabase Auth verifies credentials or passkey assertions.
2. The backend issues a signed `meatlens_session` application token for
   cookie-capable clients.
3. Unsafe cookie requests carry a CSRF token and pass origin validation.
4. Native or bearer clients may send `Authorization: Bearer ...`.
5. The session-limit component tracks bounded active-device slots using hashed
   tokens and prunes expired entries.
6. The users module resolves roles and scopes requests to the authenticated
   user, administrator, or developer capabilities.

Developer routes are separate from ordinary administrator routes. A developer
may receive administrator data access where the application policy allows it,
but developer-only datasets, training, unlock, and model-management actions
remain protected by their own checks.

## Transport encryption

The shared frontend request wrapper discovers a browser-visible RSA public key
from `/api/transport/public-key`, creates a fresh per-request AES-256-GCM key,
and sends an application envelope when the request path requires it. The RSA
private key is backend-only and is provided through backend configuration.

Transport encryption does not replace HTTPS, authentication, authorization, or
database/storage policies. Public health and key-discovery behavior is kept
separate from protected application payloads.

## Upload, inspection, and analysis flow

The inspection flow is primarily local inference:

1. The frontend captures and validates an image.
2. The offline-analysis feature loads the selected ONNX model and performs
   preprocessing and inference on the client.
3. The inspection-submission feature sends the classification, metadata, and
   permitted evidence to the backend.
4. The backend validates the request, applies user/role scope, and persists the
   inspection through the inspections module.
5. Image uploads use bounded multipart staging and storage adapters.

The `/api/analysis/analyze` compatibility endpoint is retired server-side
analysis behavior; it remains documented as retired so it is not mistaken for
the primary inference path.

## Chat and realtime flow

Assistant chat and user-to-user chat are separate route groups. User chat
contacts and conversations are scoped to authenticated participants. Inserts
are observed through the Supabase Realtime adapter, distributed through the
bounded backend realtime hub, and exposed to authorized clients through an SSE
endpoint. The hub bounds connections and buffered events; clients reconnect
and reconcile snapshots deterministically.

## Model-accuracy flow

The model-accuracy module records model versions, captures accuracy snapshots,
and supports controlled calibration imports and analytics. Developer or admin
authorization is enforced by the route handlers according to the operation.
Frontend developer tools consume these APIs for model comparison and
calibration views; the offline-analysis feature remains the runtime owner of
local inference.

## Frontend Feature-Sliced Design

The frontend uses these source roots:

| Layer | Responsibility |
| --- | --- |
| `src/app` | Application composition, providers, routing, layouts, and global styles |
| `src/pages` | Route-level screens |
| `src/widgets` | Page-scale composition and reusable screen sections |
| `src/features` | User workflows and operations, such as auth, capture, sync, reports, and developer tools |
| `src/entities` | Business concepts and their API/cache contracts |
| `src/shared` | Generic UI primitives, transport, storage, and cross-cutting adapters |

Cross-slice imports use public APIs where a slice exposes one. Business logic
does not move into `shared` merely because it is reused. The frontend
architecture checks enforce layer direction, legacy-owner removal, public API
rules, and source-size thresholds.

## Mobile and offline boundary

Capacitor supplies the native shell while React remains the application UI.
Android SQLite migrations under `android/sql/migrations` define the local
schema used by offline queue/cache adapters. Offline sync stores bounded
pending operations, retries them when connectivity returns, and keeps the
server as the authority for authenticated shared records. Native biometric
storage is a local credential-unlock boundary; it does not replace backend
session validation.

## Persistence and scale posture

Supabase is the only supported database service. Persistence code uses:

- explicit column lists instead of wildcard projections;
- bounded limits/ranges and deterministic ordering;
- indexes for user, timestamp, role, session, passkey, audit, inspection, and
  chat lookups;
- aggregate RPCs for landing, classification, model, and chat-contact metrics;
- user and role scoping before data is returned;
- forward-only migration files that are not edited after application.

This stateless backend posture is intended for the project’s approximate
1,000–2,000 simultaneous-user target without a separate cache or queue.

## Testing architecture

```text
backend/tests/unit          # value objects, use cases, adapters, and policies
backend/tests/integration   # Express routes and auth/security flows
backend/tests/architecture  # boundaries, route composition, query shape, and module contracts
frontend/tests/unit         # app, entity, feature, widget, and utility behavior
frontend/tests/component    # rendered component contracts
frontend/tests/integration  # cross-feature/browser-adapter behavior
frontend/tests/e2e          # critical journeys and security/offline flows
```

Relevant repository gates include documentation validation, linting,
typechecking, frontend/backend unit and integration suites, architecture
checks, contract tests, bounded Playwright journeys, and Android JVM/
instrumentation compilation when Android paths change. See
[Getting started](GETTING_STARTED.md) and the root [README](../README.md) for
the commands used by CI.

