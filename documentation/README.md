# MeatLens documentation

This directory documents the current MeatLens monorepo. The backend is a
modular monolith, the frontend is a Vite/React/Capacitor application, and
Supabase provides PostgreSQL, authentication, and storage.

## Start here

- [Getting started](GETTING_STARTED.md) — local setup, environment variables,
  migrations, storage, and verification.
- [Project overview](PROJECT_OVERVIEW.md) — product scope, stack, repository
  map, route namespaces, and supported capabilities.
- [Architecture](ARCHITECTURE.md) — backend modules, frontend boundaries,
  request flow, persistence, transport, and mobile/offline boundaries.
- [API reference](API_REFERENCE.md) — registered route namespaces,
  authentication requirements, and representative operations.
- [Security](SECURITY.md) — trust boundaries, sessions, transport encryption,
  CSRF, CORS, rate limits, uploads, and secrets.
- [Deployment](DEPLOYMENT.md) — Netlify frontend, Render backend, Supabase
  release steps, and smoke checks.

## Application architecture

- [Backend documentation](application/backend_documentation.md) — backend
  runtime, modules, configuration, persistence, and commands.
- [Frontend documentation](application/frontend_documentation.md) — frontend
  Feature-Sliced Design layers, model runtime, offline behavior, and commands.
- [Backend folder structure](backend/folder-structure.md) — backend source,
  tests, migrations, and module ownership.
- [Frontend folder structure](frontend/folder-structure.md) — frontend source,
  tests, scripts, runtime assets, and layer rules.

## Runtime and feature references

- [Biometric login](BIOMETRIC_LOGIN.md) — passkeys, native biometric vaults,
  and reconnect behavior.
- [Biometric login verification](BIOMETRIC_LOGIN_VERIFICATION.md) — verified
  coverage and fresh checks for biometric flows.
- [Model ensemble formula](model-ensemble-formula.md) — ensemble scoring and
  interpretation.
- [Image access control](../IMAGE_ACCESS_CONTROL.md) — inspection image and
  storage access rules.
- [Storage setup](../STORAGE_SETUP.md) — Supabase storage bucket setup and
  policy verification.
- [Android SQLite migrations](../android/sql/migrations/README.md) — Android
  local schema, queue/cache mapping, and migration rules.

## Product and policy references

- [Manual content](manual-content.md) — maintained field/manual content.
- [Terms and conditions](NEW-Terms and Conditions.md) — field-use terms,
  limitations, and acknowledgments.
- [Manual assets](manual-assets/README.md) — asset inventory and maintenance
  guidance.

## Scope and source of truth

Documentation describes the code currently under `backend/src`, especially
`backend/src/modules`, `backend/src/bootstrap`, and `backend/src/middleware`,
as well as the Feature-Sliced Design tree under `frontend/src`. Route
documentation follows the module presentation routers and
`backend/src/bootstrap/routes.ts`. The removed top-level backend
`src/routes`, `src/controllers`, `src/services`, and `src/models` directories
are not valid import locations.

The separate `backend/planned-architecture.md` file is an example and is not a
source of truth for this documentation set. The supported deployment uses only
the services already present in the repository and Supabase; Redis, Grafana,
BullMQ, Prometheus, and other additional infrastructure are not required.
