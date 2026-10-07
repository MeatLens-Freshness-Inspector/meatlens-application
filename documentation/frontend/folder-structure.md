# Frontend folder structure

This map describes maintained frontend ownership. Generated build output,
Playwright reports, and installed dependencies are not application layers.

## Frontend root

```text
frontend/
├── Dockerfile
├── package.json
├── tsconfig.json
├── vite.config.ts
├── playwright.config.ts
├── public/                 # runtime models, ONNX assets, fonts, letterheads, icons
├── src/                    # React application source
├── tests/                  # unit, component, integration, and E2E tests
└── scripts/                # architecture, source-size, packaging, and CI checks
```

The browser environment contains only public configuration such as
`VITE_API_BASE_URL`. Backend service keys and transport private keys never
belong under `frontend/`.

## `src/` — Feature-Sliced Design layers

```text
src/
├── app/
│   ├── config/             # app-level configuration
│   ├── layouts/            # public/protected/admin layouts
│   ├── providers/          # auth, network, query, notification, theme providers
│   ├── router/             # route registration and guards
│   └── styles/             # global styles and theme
├── pages/                  # route-level screens
├── widgets/                # page-scale compositions and shells
├── features/               # user workflows and operations
├── entities/               # business concepts and API/cache contracts
├── shared/
│   ├── api/                # request/transport clients and error contracts
│   ├── config/             # shared runtime configuration
│   ├── lib/                # generic utilities and platform adapters
│   ├── model/              # generic shared state helpers
│   ├── storage/            # browser/native storage adapters
│   └── ui/                 # reusable visual primitives
├── test/                   # shared test setup
├── main.tsx                # browser entry point
└── vite-env.d.ts
```

### Feature ownership

The largest maintained features include:

- `auth`, `passkeys`, `native-biometric`, and `onboarding` for identity and
  access flows;
- `inspection-capture`, `offline-analysis`, `inspection-submission`,
  `inspection-history`, `inspection-disputes`, and `offline-sync` for the
  inspection lifecycle;
- `developer-tools` for model selection, calibration, datasets, API Docs, and
  training workflows;
- `admin-management` and `reports` for administrative operations and exports;
- `messaging`, `assistant`, `profile-editing`, `tutorials`, and
  `public-landing` for supporting product workflows.

Entities own stable business concepts such as inspections, users, messages,
access codes, market locations, audit logs, landing statistics, and model
accuracy. Widgets compose page-scale UI such as the admin dashboard,
inspection workspace, history, navigation, profile, messages, and landing
sections.

## `tests/` — frontend verification

```text
tests/
├── unit/         # app, entities, features, hooks, pages, state, utilities, widgets
├── component/    # rendered component contracts
├── integration/  # API clients, camera adapters, and offline behavior
├── e2e/
│   ├── journeys/ # administrator, developer, and inspector journeys
│   ├── offline/  # offline analysis and passkey unlock
│   ├── security/ # security-sensitive browser flows
│   └── smoke/    # route and not-found smoke checks
└── support/      # fixtures, factories, page-object seams, and test helpers
```

Run the focused suites with the scripts in `frontend/package.json`; the root
CI-equivalent commands are listed in [Frontend documentation](../application/frontend_documentation.md).

## `scripts/` — architecture and build checks

```text
scripts/
├── check-fsd-boundaries.mjs        # layer direction and legacy-owner rules
├── check-fsd-boundaries.test.mjs   # boundary-check tests
├── check-source-size.mjs            # source-size policy
├── check-source-size.test.mjs       # source-size tests
├── package-validation.test.mjs      # command/package contracts
└── run-unit-tests-ci.mjs            # deterministic unit-test sharding
```

The FSD checker rejects lower-to-higher layer imports, deep cross-slice private
imports, and retired root ownership. The source-size checker has a 600-line
hard limit and a 450-line split-review threshold for maintained source files.

## `public/` — runtime assets

```text
public/
├── models/                 # current ONNX model families and metadata
├── model-old/              # retained historical model assets
├── model/                  # compatibility model assets
├── ort/                    # ONNX Runtime Web loader assets
├── letterheads/            # report letterheads and rendered pages
├── *.png / *.ico           # browser and mobile icons
└── robots.txt
```

Models and ONNX runtime files are runtime inputs, not application modules.
Access them through the owning offline-analysis/model adapters rather than
importing assets into unrelated slices.

## Architectural rules

1. Keep providers and route registration in `src/app`; keep route screens in
   `src/pages`.
2. Keep page-scale composition in `src/widgets` and user workflows in
   `src/features`.
3. Keep business concepts and API/cache contracts in `src/entities`.
4. Keep generic primitives and cross-cutting adapters in `src/shared`; do not
   use it as a business-specific dumping ground.
5. Import across slices through public APIs where one exists.
6. Do not recreate retired root-level `components`, `contexts`, `hooks`,
   `integrations`, `lib`, `types`, or monolithic `App.tsx` ownership.
7. Use React composition and hooks for UI; use classes only when an explicit
   lifecycle or invariant requires one.
8. Split maintained files before they exceed the 600-line hard limit; review
   files at the 450-line threshold.

See [Architecture](../ARCHITECTURE.md), [Security](../SECURITY.md), and
[Deployment](../DEPLOYMENT.md) for cross-stack boundaries.

