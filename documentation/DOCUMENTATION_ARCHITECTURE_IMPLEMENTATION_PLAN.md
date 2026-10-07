# Documentation and Architecture Reference Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every maintained guide under `documentation/` accurate, complete, and navigable while leaving application code and `backend/planned-architecture.md` unchanged.

**Architecture:** Keep `documentation/README.md` as the canonical documentation hub. Align architecture, application, API, security, setup, deployment, and folder-structure guides with the implemented backend modular monolith, frontend Feature-Sliced Design tree, and Capacitor/offline boundary. Use only repository-relative links within `documentation/` and verify the existing documentation gate at the end.

**Tech Stack:** Markdown, Node.js documentation checker (`scripts/check-documentation.mjs`), React/Vite/Capacitor frontend, Express/TypeScript backend, Supabase.

## Global Constraints

- Modify or add files only under `documentation/`.
- Keep `backend/planned-architecture.md` unchanged and do not link to it.
- Document implemented behavior and current source paths, not aspirational architecture.
- Preserve current privacy, security, deployment, legal, and licensing requirements.
- Use repository-relative Markdown links for local documentation.
- Do not invent unsupported services, endpoints, environment variables, or deployment steps.
- Run `npm.cmd run test:documentation` before completion.
- Preserve the pre-existing modification in `frontend/src/widgets/legal/terms-and-conditions-dialog.tsx`; do not stage or edit it.

---

### Task 1: Refresh the documentation hub and navigation

**Files:**
- Modify: `documentation/README.md`

**Interfaces:**
- Consumes: the maintained Markdown files currently present under `documentation/`.
- Produces: a canonical hub whose local links resolve to files under `documentation/` and whose sections distinguish onboarding, architecture, operational references, and product/policy references.

- [ ] **Step 1: Replace the hub’s application-guide section with grouped navigation.**

Use these groups and links:

```markdown
## Start here

- [Getting started](GETTING_STARTED.md)
- [Project overview](PROJECT_OVERVIEW.md)
- [Architecture](ARCHITECTURE.md)
- [API reference](API_REFERENCE.md)
- [Security](SECURITY.md)
- [Deployment](DEPLOYMENT.md)

## Application architecture

- [Backend documentation](application/backend_documentation.md)
- [Frontend documentation](application/frontend_documentation.md)
- [Backend folder structure](backend/folder-structure.md)
- [Frontend folder structure](frontend/folder-structure.md)

## Runtime and feature references

- [Biometric login](BIOMETRIC_LOGIN.md)
- [Biometric login verification](BIOMETRIC_LOGIN_VERIFICATION.md)
- [Model ensemble formula](model-ensemble-formula.md)
- [Image access control](../IMAGE_ACCESS_CONTROL.md)
- [Storage setup](../STORAGE_SETUP.md)
- [Android SQLite migrations](../android/sql/migrations/README.md)

## Product and policy references

- [Manual content](manual-content.md)
- [Terms and conditions](NEW-Terms%20and%20Conditions.md)
- [Manual assets](manual-assets/README.md)
```

Do not add a link to `backend/planned-architecture.md`. Keep the hub’s scope/source-of-truth section explicit: this documentation describes the current code under `backend/src`, `frontend/src`, and the supported deployment services.

- [ ] **Step 2: Run the documentation checker.**

Run: `npm.cmd run test:documentation`

Expected: `documentation validation passed`.

- [ ] **Step 3: Commit the hub update.**

```powershell
git add documentation/README.md
git commit -m "docs: make documentation hub complete"
```

### Task 2: Correct architecture and project-overview references

**Files:**
- Modify: `documentation/ARCHITECTURE.md`
- Modify: `documentation/PROJECT_OVERVIEW.md`

**Interfaces:**
- Consumes: `backend/src/app.ts`, `backend/src/bootstrap/routes.ts`, `backend/src/bootstrap/modules.ts`, `backend/src/modules/`, `frontend/src/`, and the existing architecture claims.
- Produces: an architecture reference that names only implemented modules and explains actual backend, frontend, mobile, persistence, transport, auth, chat, and model-accuracy flows.

- [ ] **Step 1: Rewrite the system-boundary diagram and narrative.**

Use the implemented boundary: React/Vite/Capacitor client → Express app and middleware → bootstrap route registry → module presentation routers → application use cases → domain ports → infrastructure adapters → Supabase Auth/PostgreSQL/Storage and optional SMTP. State that transport encryption is an application-envelope boundary and that Redis, queues, Grafana, and external metrics are not supported deployment requirements.

- [ ] **Step 2: Replace the backend module list with the actual module inventory.**

Document exactly: `access-codes`, `analysis`, `analytics`, `audit`, `auth`, `chat`, `developer`, `inspections`, `markets`, `model-accuracy`, `transport`, and `users`. Explain that each module exposes an `index.ts` composition surface and normally contains presentation, application, domain, and infrastructure responsibilities where those layers exist.

- [ ] **Step 3: Document actual middleware and request flow.**

Describe the implemented order from `backend/src/app.ts`: security headers, origin rejection, CORS, JSON parsing, transport middleware, mounted route registry, and global error handling. Include cookie/bearer authentication, CSRF/origin rules for unsafe cookie requests, role resolution, session limits, multipart upload staging, SSE chat events, and bounded rate limits.

- [ ] **Step 4: Document frontend and mobile boundaries.**

Describe `app`, `pages`, `widgets`, `features`, `entities`, and `shared` using the actual Feature-Sliced Design rules. Add the Capacitor/Android boundary, client-side ONNX inference, offline SQLite queue/cache behavior, and explicit synchronization with the backend. Keep architecture claims tied to current source paths.

- [ ] **Step 5: Reconcile the project overview.**

Update capabilities, technology, repository map, module list, route namespace summary, persistence/scaling posture, and development commands. Add links to the architecture, API, security, getting-started, and deployment guides using paths relative to `documentation/`.

- [ ] **Step 6: Run architecture-focused documentation verification.**

Run: `npm.cmd run test:documentation`

Expected: `documentation validation passed`.

- [ ] **Step 7: Commit the architecture references.**

```powershell
git add documentation/ARCHITECTURE.md documentation/PROJECT_OVERVIEW.md
git commit -m "docs: align architecture references with implementation"
```

### Task 3: Reconcile application and folder-structure guides

**Files:**
- Modify: `documentation/application/backend_documentation.md`
- Modify: `documentation/application/frontend_documentation.md`
- Modify: `documentation/backend/folder-structure.md`
- Modify: `documentation/frontend/folder-structure.md`

**Interfaces:**
- Consumes: the current backend and frontend directory trees and the architecture definitions from Task 2.
- Produces: detailed contributor references with no removed top-level backend layers or obsolete frontend ownership model.

- [ ] **Step 1: Rewrite the backend application guide’s source layout.**

Describe `backend/src/server.ts`, `app.ts`, `bootstrap/`, `config/`, `middleware/`, `integrations/`, `shared/`, `types/`, and `modules/`. Inside `modules/`, explain the bounded-context layout and route/controller/use-case/adapter responsibilities. Remove claims about top-level `controllers/`, `services/`, `models/`, or `routes/` directories.

- [ ] **Step 2: Update the frontend application guide.**

Describe the actual FSD layer roots, public APIs, API/cache ownership in entities, workflow ownership in features, page composition, shared transport/crypto, offline runtime, model catalog/runtime adapters, local commands, and verification commands. Mark server-side analysis as retired wherever it is mentioned and identify client-side inference as the primary inspection path.

- [ ] **Step 3: Replace stale backend folder listings.**

Make `documentation/backend/folder-structure.md` describe the current module tree, bootstrap files, middleware, shared primitives, tests, migrations, templates, and query inventory. Remove the old `src/controllers`, `src/services`, `src/models`, and `src/routes` listing.

- [ ] **Step 4: Replace stale frontend folder listings.**

Make `documentation/frontend/folder-structure.md` describe the current `src/app`, `src/pages`, `src/widgets`, `src/features`, `src/entities`, `src/shared`, `src/test`, `tests`, `scripts`, and `public` ownership. Preserve the existing FSD rules and source-size thresholds.

- [ ] **Step 5: Add cross-links between detailed guides.**

Link backend details to `../ARCHITECTURE.md`, `../API_REFERENCE.md`, `../SECURITY.md`, and `../GETTING_STARTED.md`. Link frontend details to `../ARCHITECTURE.md`, `../API_REFERENCE.md`, `../SECURITY.md`, and `../DEPLOYMENT.md`. Use URL-safe paths for filenames containing spaces.

- [ ] **Step 6: Run the documentation checker.**

Run: `npm.cmd run test:documentation`

Expected: `documentation validation passed`.

- [ ] **Step 7: Commit the application references.**

```powershell
git add documentation/application documentation/backend/folder-structure.md documentation/frontend/folder-structure.md
git commit -m "docs: update application architecture guides"
```

### Task 4: Complete operational, API, and security references

**Files:**
- Modify: `documentation/API_REFERENCE.md`
- Modify: `documentation/SECURITY.md`
- Modify: `documentation/GETTING_STARTED.md`
- Modify: `documentation/DEPLOYMENT.md`

**Interfaces:**
- Consumes: `backend/src/bootstrap/routes.ts`, route modules, environment/config docs, deployment files, and existing security/deployment guides.
- Produces: operator and contributor guides that cover all current route groups, trust boundaries, setup requirements, release steps, and verification commands.

- [ ] **Step 1: Complete the API route catalog.**

Document the route namespaces registered by `backend/src/bootstrap/routes.ts`: `/api/transport`, `/api/analysis`, `/api/profiles`, `/api/inspections`, `/api/access-codes`, `/api/stats`, `/api/upload`, `/api/auth`, `/api/chat`, `/api/market-locations`, `/api/audit-logs`, `/api/developer-options`, `/api/developer-dashboard`, `/api/user-chat`, and `/api/model-accuracy`. Include authentication/role expectations and identify retired or compatibility endpoints clearly.

- [ ] **Step 2: Complete security and trust-boundary guidance.**

Document backend-only transport RSA private keys, browser public-key bootstrap, per-request AES-256-GCM envelopes, cookie/bearer authentication, CSRF and origin checks, role authorization, upload limits, rate limits, SSE lifecycle, safe error responses, storage access control, and secret handling. Link to the API, deployment, and setup guides.

- [ ] **Step 3: Complete local setup and verification.**

Ensure `GETTING_STARTED.md` has Node 22 prerequisites, root install, backend/frontend environment variables, Supabase migrations/storage, local commands, Android prerequisites, verification commands, and troubleshooting for origin/CSRF, upload, transport, and mobile fetch failures.

- [ ] **Step 4: Complete deployment guidance.**

Ensure `DEPLOYMENT.md` covers Netlify frontend, Render backend, Supabase release order, environment variables, CORS/allowed origins, transport-key configuration, smoke checks, CI/preview behavior, and bounded request-budget considerations. Link back to setup, security, and API references.

- [ ] **Step 5: Run the documentation checker.**

Run: `npm.cmd run test:documentation`

Expected: `documentation validation passed`.

- [ ] **Step 6: Commit operational references.**

```powershell
git add documentation/API_REFERENCE.md documentation/SECURITY.md documentation/GETTING_STARTED.md documentation/DEPLOYMENT.md
git commit -m "docs: complete operational and security references"
```

### Task 5: Cross-link specialized references and perform the final audit

**Files:**
- Modify as needed: `documentation/BIOMETRIC_LOGIN.md`
- Modify as needed: `documentation/BIOMETRIC_LOGIN_VERIFICATION.md`
- Modify as needed: `documentation/model-ensemble-formula.md`
- Modify as needed: `documentation/manual-content.md`
- Modify as needed: `documentation/NEW-Terms and Conditions.md`
- Modify as needed: `documentation/manual-assets/README.md`
- Modify as needed: `documentation/backend/folder-structure.md`
- Modify as needed: `documentation/frontend/folder-structure.md`

**Interfaces:**
- Consumes: the completed documentation hub and operational references from Tasks 1–4.
- Produces: a specialized reference set with valid cross-links and no unsupported claims.

- [ ] **Step 1: Add only necessary cross-links.**

Link biometric documents to security, getting started, and verification guidance. Link model documents to architecture and application/frontend guidance. Link manual and terms documents to the project overview and legal/security context. Avoid rewriting specialized content unless a source path, command, or behavior is stale.

- [ ] **Step 2: Verify the planned-architecture exclusion.**

Run:

```powershell
Select-String -Path (Get-ChildItem documentation -Recurse -Filter *.md).FullName -Pattern 'planned-architecture\.md'
```

Expected: no matches. Confirm `backend/planned-architecture.md` has no diff.

- [ ] **Step 3: Verify all maintained Markdown links.**

Run: `npm.cmd run test:documentation`

Expected: `documentation validation passed`.

- [ ] **Step 4: Review the complete scoped diff.**

Run: `git diff -- documentation` and `git status --short`

Confirm every implementation change is under `documentation/`, the pre-existing frontend modification remains unstaged, and no generated or unrelated files changed.

- [ ] **Step 5: Run the full documentation gate once more.**

Run: `npm.cmd run test:documentation`

Expected: exit code `0` with `documentation validation passed`.

- [ ] **Step 6: Commit the final specialized-reference and audit changes.**

```powershell
git add documentation
git commit -m "docs: finish documentation cross-links and audit"
```

## Plan self-review

- **Spec coverage:** Tasks 1–5 cover the approved hub, architecture, backend/frontend/mobile boundaries, operational references, specialized cross-links, link verification, and planned-architecture exclusion.
- **Scope:** All listed implementation paths are under `documentation/`; the separate example architecture file and runtime code are excluded.
- **Placeholder scan:** The plan contains no unfinished placeholder markers or unspecified validation steps.
- **Consistency:** The module names, route namespaces, frontend layer names, and commands match the current repository inspected during design.
