# Frontend documentation

## Overview

The frontend is a React 18 + TypeScript application built with Vite and
packaged for browser and Capacitor environments. It performs the primary
meat-freshness inference locally with ONNX Runtime Web, supports offline
capture/sync workflows, and communicates with the Express backend through
typed API clients.

The frontend follows Feature-Sliced Design (FSD). The migration is structural:
existing product behavior remains owned by the current app, page, widget,
feature, entity, and shared implementations. There is no supported legacy
root-level architecture.

For the tracked source/configuration inventory, see
[Frontend folder structure](../frontend/folder-structure.md). For cross-stack
boundaries, see [Architecture](../ARCHITECTURE.md).

## Source layout

```text
frontend/src/
├── app/       # composition, providers, layouts, routing, guards, global styles
├── pages/     # route-level screens
├── widgets/   # reusable page-scale compositions
├── features/  # user-facing workflows and interactions
├── entities/  # business concepts, API clients, caches, and domain types
├── shared/    # reusable UI, platform adapters, transport, and utilities
├── test/      # shared test setup
├── main.tsx   # browser entry point
└── vite-env.d.ts
```

### Layer responsibilities

- **app** composes the application and owns route registration, providers,
  layouts, guards, and global styles.
- **pages** represent route-level screens and assemble widgets and features for
  a route.
- **widgets** represent reusable page-scale sections, shells, and dashboard
  compositions.
- **features** represent user intent and workflows, such as signing in,
  capturing an inspection, submitting analysis, editing a profile, syncing
  offline work, or using developer tools.
- **entities** represent business concepts and stable data contracts, including
  typed clients, query keys, caches, and domain types.
- **shared** contains generic UI primitives, transport/platform integrations,
  storage, and utilities that do not own product-specific behavior.

Use a slice’s public `index.ts` when one exists. Do not import private
implementation files across slices. Lower layers must not import pages or
widgets, and business-specific behavior must not be moved into `shared` merely
because it is reused.

## Security and transport

The client does not contain the Supabase service key or backend transport
private key. Browser requests use `VITE_API_BASE_URL`, credentialed cookies,
and CSRF handling from the backend auth flow. Native/bearer clients use the
supported application session transport. The client-side request wrapper can
bootstrap the backend public transport key and create a fresh per-request
encrypted envelope where required.

Capacitor Android serves the bundled app from a native localhost origin, so the
backend `ALLOWED_ORIGINS` setting must include the configured native origin.
Keep credentials, authorization headers, CSRF tokens, and sensitive response
data out of API Docs cURL/history output; developer-tools redaction is covered
by tests.

See [Security](../SECURITY.md) and [API reference](../API_REFERENCE.md) for
cross-stack request rules.

## Local development

From the repository root:

```powershell
npm install
Copy-Item frontend/.env.example frontend/.env
npm run dev:frontend
```

Set:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

The default Vite URL is `http://localhost:8080`.

## Model and offline pipeline

The frontend build synchronizes the ONNX model before Vite starts. The normal
inspection flow is:

```text
capture/select image
  -> quality checks and preprocessing
  -> local ONNX model inference
  -> freshness score and recommendation
  -> authenticated image upload
  -> inspection record persistence
```

The model catalog and runtime adapters live under
`frontend/src/features/offline-analysis`. Model-specific preprocessing,
segmentation, metadata, and fallback paths stay inside that feature rather
than spreading across pages or entities.

Offline analysis and sync are isolated in their owning features. Local SQLite
queue/cache adapters keep bounded pending work and reconcile it when
connectivity returns. The backend remains authoritative for users, roles,
inspections, audit data, shared chat, and server-side policy checks.

## API Docs workspace

Developer accounts have an API Docs tab in the developer settings workspace.
Its typed catalog is owned by:

```text
frontend/src/features/developer-tools/model/api-docs-catalog.ts
```

When a backend route changes, update the catalog and its route-audit tests. The
editor must not expose authorization or CSRF secrets in cURL/history output.

## Verification commands

From the repository root:

```powershell
npm run typecheck -w frontend
npm run lint -w frontend
npm run test:unit -w frontend
npm run test:component -w frontend
npm run test:integration -w frontend
npm run test:architecture -w frontend
npm run build -w frontend
npm run test:e2e:critical -w frontend
npm run test:contract
```

The frontend `pretest` hook builds the backend first so integration and
end-to-end tests exercise the current API contract. The repository contract
suite checks shared auth-bootstrap, inspection-list, error-envelope, and
analysis-result schemas across both workspaces.

See [Getting started](../GETTING_STARTED.md) for the complete local gate and
[Deployment](../DEPLOYMENT.md) for Netlify configuration.

