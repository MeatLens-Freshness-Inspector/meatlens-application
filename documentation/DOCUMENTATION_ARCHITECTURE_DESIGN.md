# Documentation and Architecture Reference Design

**Date:** 2026-10-07  
**Status:** Approved for implementation planning

## Goal

Make the documentation under `documentation/` a complete, navigable, and
accurate description of the current MeatLens system without changing runtime
code or treating the separate `backend/planned-architecture.md` example as a
project source of truth.

## Scope and constraints

- Modify or add files only under `documentation/`.
- Keep `backend/planned-architecture.md` unchanged and do not link to it.
- Describe implemented behavior and current source paths, not aspirational
  architecture.
- Preserve specialized documentation where it is still accurate, while adding
  stable links from the documentation hub.
- Use repository-relative Markdown links for local documentation.
- Keep existing privacy, security, deployment, and legal requirements intact.

## Documentation information architecture

`documentation/README.md` becomes the navigation hub with four groups:

1. **Start here:** getting started, project overview, architecture, security,
   API reference, and deployment.
2. **Application architecture:** backend guide, frontend guide, backend folder
   structure, and frontend folder structure.
3. **Runtime and feature references:** biometric login, biometric verification,
   model ensemble behavior, model calibration, storage/image access control,
   and offline/Android migration guidance where those guides exist.
4. **Product and policy references:** manual content, terms and conditions,
   and asset guidance.

Every guide linked from the hub must exist under `documentation/`, and every
relative link in the documentation tree must resolve to an existing file.
Links to `backend/planned-architecture.md` are explicitly excluded.

## Architecture reference corrections

### System boundary

The architecture guide will describe the implemented boundary as:

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

The guide will explain that the backend is a modular monolith, that module
composition and route registration live under `backend/src/bootstrap`, and
that the supported deployment does not require Redis, a queue, Grafana, or an
external metrics service.

### Backend module inventory

The canonical module list will match `backend/src/modules` and
`backend/src/bootstrap/routes.ts`, including:

- access-codes
- analysis
- analytics
- audit
- auth
- chat
- developer
- inspections
- markets
- model-accuracy
- transport
- users

The guide will distinguish the transport module and public-key endpoint from
ordinary business modules and will document both chat route groups and model
accuracy routes.

### Request and data-flow documentation

The architecture guide will document:

- security headers, origin rejection, CORS, JSON parsing, transport handling,
  route registration, and error serialization in their actual order;
- cookie-session and bearer authentication, CSRF/origin requirements, role
  resolution, and device-session limits;
- multipart upload staging, storage access, inspection persistence, and the
  retired server-analysis endpoint;
- bounded realtime chat through Supabase Realtime, SSE, and the backend hub;
- model accuracy history/calibration workflows and developer-only access;
- explicit projections, bounded reads, deterministic ordering, indexes, and
  forward-only migrations as the persistence rules.

### Frontend and mobile architecture

The frontend guide and architecture guide will use the actual Feature-Sliced
Design roots:

- `app` for application composition, providers, routing, and layouts;
- `pages` for route-level screens;
- `widgets` for page-scale composition;
- `features` for user workflows and operations;
- `entities` for business concepts and their API/cache contracts;
- `shared` for generic primitives and cross-cutting adapters.

They will also document the Capacitor/Android boundary, client-side ONNX
inference, offline SQLite queue/cache behavior, and the explicit sync boundary
with the backend.

## Guide updates

The implementation will update the following existing guides where needed:

- `README.md`: canonical navigation and scope/source-of-truth rules;
- `ARCHITECTURE.md`: corrected backend/frontend/mobile architecture and flows;
- `PROJECT_OVERVIEW.md`: current capabilities, module inventory, route
  namespaces, and repository map;
- `API_REFERENCE.md`: current route namespaces, common request rules, model
  accuracy, developer endpoints, and route authority;
- `SECURITY.md`: current trust boundaries, transport encryption, sessions,
  CSRF, authorization, uploads, realtime, headers, and verification;
- `GETTING_STARTED.md`: current setup, environment variables, migrations,
  storage, local run commands, and verification;
- `DEPLOYMENT.md`: current Netlify/Render/Supabase release and smoke-check flow;
- `application/backend_documentation.md`: current backend layout and commands;
- `application/frontend_documentation.md`: current frontend layout, FSD rules,
  model/offline behavior, and verification;
- `backend/folder-structure.md` and `frontend/folder-structure.md`: remove
  stale paths and describe the current tracked structure;
- specialized guides as required to add cross-links and correct references.

The separate example file `backend/planned-architecture.md` is not part of
this update.

## Link and completeness policy

The documentation hub will link all maintained guides that are useful to
contributors or operators. Cross-links will use paths relative to the file
containing the link, including URL-safe link targets for filenames containing
spaces where needed.

The documentation update will not invent unsupported services, endpoints,
environment variables, or deployment steps. If a feature is incomplete or
retired, the relevant guide will label it explicitly instead of presenting it
as active behavior.

## Verification

Before completion:

1. Run `npm.cmd run test:documentation` from the repository root.
2. Inspect the complete diff and confirm every changed file is under
   `documentation/`.
3. Re-scan all Markdown links under `documentation/` and manually verify the
   architecture claims against `backend/src/bootstrap/routes.ts`, the module
   tree, frontend layer roots, and the relevant feature files.
4. Confirm `backend/planned-architecture.md` was not modified and is not linked
   from the documentation tree.

