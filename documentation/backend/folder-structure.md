# Backend folder structure

This map describes maintained backend source and test ownership. Generated
folders such as `dist/`, `uploads/`, and `node_modules/` are runtime/build
outputs and are not architectural source locations.

## Backend root

```text
backend/
├── Dockerfile
├── package.json
├── tsconfig.json
├── README.md
├── src/
├── tests/
├── supabase/
│   ├── migrations/
│   └── templates/
└── docs/
    └── query-inventory.md
```

Runtime secrets belong in the local or hosted environment, not in tracked
source. `uploads/` is a bounded local staging directory when enabled.

## `src/` — runtime source

```text
src/
├── app.ts                         # Express app and middleware order
├── server.ts                      # process entry point
├── bootstrap/
│   ├── dependencies.ts            # root dependency inputs
│   ├── modules.ts                 # module registry
│   └── routes.ts                  # API namespace mounting
├── config/
│   ├── index.ts                   # runtime configuration facade
│   ├── env.ts                     # environment parsing/validation
│   ├── cors.ts                    # allowed-origin policy
│   └── app.config.ts              # application defaults
├── integrations/
│   ├── supabase.ts                # Supabase client boundary
│   └── supabaseConfig.ts          # Supabase configuration boundary
├── middleware/
│   ├── auth.ts                    # auth context, CSRF, role checks
│   ├── developerPackageUpload.ts  # developer archive constraints
│   ├── errorHandler.ts            # safe error responses
│   ├── rateLimit.ts               # bounded in-process limits
│   ├── securityHeaders.ts         # browser security headers
│   ├── transport.ts               # encrypted envelope handling
│   └── upload.ts                  # multipart constraints/staging
├── modules/
│   └── <bounded-context>/
│       ├── domain/                # IDs, value objects, policies, ports
│       ├── application/           # one-operation use cases
│       ├── infrastructure/       # concrete service/adapter implementations
│       ├── presentation/          # routes, controllers, views
│       └── index.ts               # public module surface
├── shared/
│   ├── application/               # Result, pagination, request limits
│   ├── domain/                    # shared errors/primitives
│   ├── infrastructure/           # shared Supabase client helpers
│   └── presentation/http/         # response helpers
└── types/                         # Express, inspection, report, and transport types
```

### Current module directories

```text
modules/
├── access-codes/
├── analysis/
├── analytics/
├── audit/
├── auth/
├── chat/
├── developer/
├── inspections/
├── markets/
├── model-accuracy/
├── transport/
└── users/
```

Every module exposes `index.ts`. Application classes expose one public
`execute` operation. Presentation and application layers do not import the
Supabase SDK directly; database and storage operations stay in infrastructure.

## `tests/` — backend verification

```text
tests/
├── unit/          # value objects, use cases, services, adapters, and policies
├── integration/   # Express routes, auth flows, storage, and security behavior
├── architecture/  # module boundaries, route composition, query shape, exports
├── infrastructure/# external-service and migration-oriented checks
└── fixtures/      # deterministic test data and helpers
```

Run `npm run test -w backend` for the complete backend suite. See
[Backend documentation](../application/backend_documentation.md) for setup and
[Architecture](../ARCHITECTURE.md) for dependency rules.

## `supabase/` — database and email assets

- `migrations/` contains forward-only SQL changes and indexes/RPCs.
- `templates/` contains local/hosted Supabase Auth email templates.

Apply migrations in filename order and do not edit an already-applied
migration. See [Getting started](../GETTING_STARTED.md) and
[Deployment](../DEPLOYMENT.md) for environment-specific release steps.

## Architectural rules

1. Keep route registration in `src/bootstrap/routes.ts` and cross-cutting HTTP
   behavior in `src/middleware`.
2. Keep feature-specific code in its owning module.
3. Keep persistence and external service calls in infrastructure adapters.
4. Keep use cases narrow and expose one public `execute` operation.
5. Use explicit query projections, bounded reads, deterministic ordering, and
   user/role scoping.
6. Do not recreate the removed top-level `routes`, `controllers`, `services`,
   or `models` source directories.

