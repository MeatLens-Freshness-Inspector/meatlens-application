# Backend documentation

## Runtime

The backend is a Node.js 22+ TypeScript Express application in `backend/`.
`src/server.ts` starts the process, `src/app.ts` creates the Express
application, and `src/bootstrap/routes.ts` mounts the API namespaces under
`/api`.

The backend is a modular monolith. Feature code belongs under a bounded module;
cross-cutting HTTP and security behavior belongs under `src/middleware`,
configuration under `src/config`, and reusable primitives under `src/shared`.
The removed top-level `routes`, `controllers`, `services`, and `models`
directories are not valid import locations.

See [Architecture](../ARCHITECTURE.md) for the complete request flow and
[API reference](../API_REFERENCE.md) for route behavior.

## Source layout

```text
backend/src/
├── app.ts                         # Express application composition
├── server.ts                      # process entry point
├── bootstrap/
│   ├── dependencies.ts            # root dependency inputs
│   ├── modules.ts                 # module registry
│   └── routes.ts                  # API namespace mounting
├── config/                        # environment and runtime policy
├── integrations/                  # Supabase and external adapter boundaries
├── middleware/                    # auth, CORS, transport, uploads, errors
├── modules/
│   └── <bounded-context>/
│       ├── domain/                # ports, IDs, value objects, policies
│       ├── application/           # one-operation use cases
│       ├── infrastructure/       # Supabase/storage/email/realtime adapters
│       ├── presentation/          # routers, controllers, views
│       └── index.ts               # public module surface
├── shared/                        # application, domain, HTTP, and Supabase primitives
└── types/                         # transport and domain types shared across modules
```

Current bounded contexts are `access-codes`, `analysis`, `analytics`, `audit`,
`auth`, `chat`, `developer`, `inspections`, `markets`, `model-accuracy`,
`transport`, and `users`.

The normal module flow is:

```text
HTTP route
  → controller
  → application use case (`execute`)
  → domain port or gateway
  → infrastructure adapter
  → shared view/HTTP response
```

Application classes expose one public `execute` operation. Controllers parse
HTTP input, resolve authentication context, map status/error responses, and
do not query Supabase directly. Infrastructure owns persistence and uses
explicit projections, bounded reads, deterministic ordering, and parameterized
Supabase calls.

## Composition and middleware

`src/app.ts` applies the following cross-cutting order:

1. Security headers.
2. Origin rejection for unsafe requests.
3. Credentialed CORS.
4. JSON parsing within the configured envelope limit.
5. Transport envelope handling.
6. Module route registration.
7. Global error serialization.

`middleware/auth.ts` resolves app-session cookies or bearer tokens, validates
CSRF/origin conditions for unsafe cookie requests, and attaches role context.
`upload.ts` constrains inspection multipart files. 
`developerPackageUpload.ts` constrains training-run packages. `rateLimit.ts`
provides bounded in-process limits for public auth and chat; it does not
require Redis.

## Configuration

Copy `backend/.env.example` to `backend/.env`. The main values are:

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
APP_SESSION_SECRET=replace-with-a-long-random-secret
CSRF_TOKEN_SECRET=replace-with-a-second-long-random-secret
TRANSPORT_KEY_ID=v1
TRANSPORT_RSA_PRIVATE_KEY=replace-with-a-3072-bit-rsa-private-key
ALLOWED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
UPLOAD_DIR=./uploads
```

`TRANSPORT_RSA_PRIVATE_KEY`, `SUPABASE_SERVICE_KEY`, session secrets, audit
keys, developer-option secrets, SMTP credentials, and model/provider secrets
are backend-only. The frontend receives only its public API base URL and never
receives a service key or reusable transport secret. See [Security](../SECURITY.md)
for the full trust-boundary rules.

Optional settings include session/cookie names and TTLs, CSRF TTL, audit-key
identifiers, developer-token TTL, `SESSION_LIMIT`, `WEBAUTHN_ORIGIN`,
`WEBAUTHN_RP_NAME`, `GROQ_API_KEY`, and SMTP credentials.

## Database and storage

Apply `backend/supabase/migrations/` in filename order using the project’s
Supabase workflow. Migrations are append-only; existing migration files are
not edited in place. Index and aggregate-RPC migrations support bounded
inspection, session, passkey, audit, role, model, and chat workloads.

Supabase Storage holds inspection images and developer artifacts. `UPLOAD_DIR`
is only a bounded local staging directory for multipart uploads and temporary
export/import work. Storage policies and inspection-image access are described
in [Image access control](../../IMAGE_ACCESS_CONTROL.md) and [Storage setup](../../STORAGE_SETUP.md).

## Commands

From the repository root:

```bash
npm install
npm run dev:backend
npm run typecheck -w backend
npm run test -w backend
npm run build -w backend
npm run test:contract
```

The backend test command runs unit, integration, and architecture suites.
Architecture tests verify module boundaries, query shape, final-class
conventions, route registration, module exports, and absence of the removed
legacy directories. The root contract suite checks shared frontend/backend
response schemas.

## API authority

The registered API is defined by the module presentation routers and mounted by
`src/bootstrap/routes.ts`. Keep frontend API clients and contract fixtures in
sync with that route registry. See [API reference](../API_REFERENCE.md) for the
current route catalog and [Getting started](../GETTING_STARTED.md) for local
verification.

