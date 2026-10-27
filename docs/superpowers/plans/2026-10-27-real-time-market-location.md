# Real-Time Market Location Classification Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

Goal: Add administrator-configured market reference coordinates, automatic 50-metre inspection classification, manual fallback when automatic classification fails, and backend verification for online and offline submissions.

Architecture: Keep market configuration in the existing markets module and expose validated coordinates through its API. Implement the same Haversine rule in the frontend and backend; the frontend resolves immediately for UI feedback, while the backend canonicalizes every inspection before persistence. Preserve the existing offline queue and add only the cache, UI state, and verification needed for this location decision.

Tech Stack: React 18, TypeScript, Vite, Express 5, Supabase PostgreSQL migrations, Capacitor/IndexedDB offline queues, Node test runner, Testing Library, Playwright.

## Global Constraints

- Use a 50-metre inclusive boundary: exactly 50 metres matches.
- Require latitude -90..90, longitude -180..180, and complete coordinate pairs.
- If GPS is unavailable or no configured point matches, enable manual selection both online and offline.
- A nearby configured market always overrides a stale/manual market name during backend verification.
- Preserve existing inspection coordinates and offline queue behavior; do not add background tracking or a map provider.
- Preserve unrelated dirty worktree changes and stage only files belonging to this feature.
- After every code, test, configuration, or migration edit, run the smallest affected local check.
- Never use focused tests, skipped tests, weakened assertions, swallowed failures, or timeout increases.
- Keep each test execution lane below 110 seconds.
- Produce at least 13 coherent implementation commits, in addition to the already committed design and plan documents.

## File and responsibility map

New files:
- frontend/src/entities/market-location/model/resolve.ts — frontend validation, distance, and nearest-market resolution.
- frontend/src/entities/market-location/model/cache.ts — safe local cache for market rows used by offline capture.
- backend/src/modules/markets/domain/market-location-resolver.ts — backend validation and canonical nearest-market resolution.
- backend/src/modules/markets/application/UpdateMarketLocation.ts — explicit update use-case port.
- backend/src/modules/markets/application/ResolveInspectionMarket.ts — backend inspection-location authority.
- backend/supabase/migrations/20261027100000_add_market_location_coordinates.sql — coordinate columns and constraints.
- frontend/src/widgets/admin-dashboard/ui/market-location-editor.tsx — focused coordinate editor for one market.
- frontend/tests/unit/entities/market-location/market-location-resolution.unit.test.ts
- frontend/tests/unit/entities/market-location/market-location-cache.unit.test.ts
- frontend/tests/unit/entities/market-location/market-location-client.unit.test.ts
- backend/tests/unit/markets/market-location-resolver.unit.test.ts
- backend/tests/unit/markets/update-market-location.unit.test.ts
- backend/tests/unit/markets/resolve-inspection-market.unit.test.ts
- backend/tests/unit/infrastructure/market-location-migration.unit.test.ts
- backend/tests/unit/markets/market-location-controller.unit.test.ts
- frontend/tests/unit/features/admin-management/market-coordinate-form.unit.test.ts
- frontend/tests/unit/widgets/inspection-workspace/inspection-location-resolution.unit.test.ts
- frontend/tests/component/inspections/inspection-location-resolution.component.test.tsx
- frontend/tests/unit/features/offline-sync/location-resolution-sync.unit.test.ts
- tests/contracts/schemas/market-location.schema.ts

Existing files to modify:
- frontend/src/entities/market-location/api/market-location-client.ts and index.ts
- frontend/src/widgets/inspection-workspace/model/use-inspection-location.ts, location-memory.ts, types.ts
- frontend/src/widgets/inspection-workspace/model/use-inspection-workspace.ts
- frontend/src/widgets/inspection-workspace/ui/InspectCaptureSection.tsx and inspection-workspace.tsx
- frontend/src/features/admin-management/model/use-market-form.ts
- frontend/src/widgets/admin-dashboard/ui/markets-tab.tsx and model/use-admin-dashboard.ts
- frontend/src/features/offline-sync/ui/offline-sync-manager.tsx
- backend/src/modules/markets/infrastructure/MarketLocationService.ts, application, controller, routes, and index.ts
- backend/src/modules/inspections/presentation/controllers/InspectionController.ts
- backend/src/types/inspection.ts and frontend inspection types
- tests/contracts/api-contract.test.ts
- documentation/manual-content.md, documentation/API_REFERENCE.md, documentation/application/frontend_documentation.md, and documentation/application/backend_documentation.md

---

### Task 1: Add the frontend market coordinate contract and resolver

Files:
- Create frontend/src/entities/market-location/model/resolve.ts
- Modify frontend/src/entities/market-location/api/market-location-client.ts
- Modify frontend/src/entities/market-location/index.ts
- Create frontend/tests/unit/entities/market-location/market-location-resolution.unit.test.ts

Interfaces:
- MarketLocation gains latitude: number | null and longitude: number | null.
- Export MarketLocationResolution and resolveMarketLocation(coordinates, locations, radiusMeters = 50).
- Return { kind: "auto", market, distanceMeters } or { kind: "unresolved", reason: "missing_coordinates" | "no_match" }.

- [ ] Step 1: Write failing tests for the inclusive 50-metre boundary, nearest selection, ignoring null coordinates, missing GPS, and no match.

    test("matches the exact 50 metre boundary", () => {
      const result = resolveMarketLocation(
        { latitude: 14, longitude: 120.00044966 },
        [{ id: "m1", name: "Boundary", latitude: 14, longitude: 120 }],
      );
      assert.equal(result.kind, "auto");
    });

    test("chooses the nearest configured row", () => {
      const result = resolveMarketLocation(
        { latitude: 14, longitude: 120.0001 },
        [
          { id: "far", name: "Far", latitude: 14, longitude: 120.0003 },
          { id: "near", name: "Near", latitude: 14, longitude: 120.0001 },
          { id: "missing", name: "Missing", latitude: null, longitude: null },
        ],
      );
      assert.equal(result.kind, "auto");
      if (result.kind === "auto") assert.equal(result.market.id, "near");
    });

- [ ] Step 2: Run and verify failure.

    Run: npm run test:unit -w frontend -- frontend/tests/unit/entities/market-location/market-location-resolution.unit.test.ts
    Expected: FAIL because resolveMarketLocation is not exported.

- [ ] Step 3: Implement the resolver with EARTH_RADIUS_METRES = 6_371_000, Haversine distance, finite/range checks, <= radius comparison, and name/id tie-breakers. Return unresolved instead of throwing for client-side invalid/missing coordinates.

- [ ] Step 4: Run the focused test and frontend typecheck.

    Run: npm run test:unit -w frontend -- frontend/tests/unit/entities/market-location/market-location-resolution.unit.test.ts
    Expected: PASS.

    Run: npm run typecheck -w frontend
    Expected: exit code 0.

- [ ] Step 5: Commit.

    git add frontend/src/entities/market-location frontend/tests/unit/entities/market-location/market-location-resolution.unit.test.ts
    git commit -m "feat: add frontend market location resolver"

### Task 2: Add the backend resolver and coordinate validation

Files:
- Create backend/src/modules/markets/domain/market-location-resolver.ts
- Create backend/tests/unit/markets/market-location-resolver.unit.test.ts

Interfaces:
- Export MarketCoordinatePair, MarketLocationCandidate, normalizeMarketCoordinates, and resolveNearestMarketLocation.
- normalizeMarketCoordinates rejects partial, non-finite, and out-of-range values.
- resolveNearestMarketLocation returns the nearest configured market or null.

- [ ] Step 1: Write failing tests.

    test("requires latitude and longitude together", () => {
      assert.throws(
        () => normalizeMarketCoordinates({ latitude: 14.5, longitude: undefined }),
        /longitude.*required/i,
      );
      assert.throws(
        () => normalizeMarketCoordinates({ latitude: 91, longitude: 120 }),
        /latitude.*range/i,
      );
    });

    test("selects a deterministic nearest market within 50 metres", () => {
      const result = resolveNearestMarketLocation(
        { latitude: 14, longitude: 120.0001 },
        [
          { id: "b", name: "Beta", latitude: 14, longitude: 120.0001 },
          { id: "a", name: "Alpha", latitude: 14, longitude: 120.0001 },
          { id: "missing", name: "Missing", latitude: null, longitude: null },
        ],
      );
      assert.equal(result?.name, "Alpha");
    });

- [ ] Step 2: Run and verify failure.

    Run: npm run test:unit -w backend -- tests/unit/markets/market-location-resolver.unit.test.ts
    Expected: FAIL because the domain module is absent.

- [ ] Step 3: Implement the backend resolver with the same earth radius, inclusive boundary, validation, and tie-breakers as Task 1. Keep the backend error messages field-specific.

- [ ] Step 4: Run the focused test and backend typecheck.

    Run: npm run test:unit -w backend -- tests/unit/markets/market-location-resolver.unit.test.ts
    Expected: PASS.

    Run: npm run typecheck -w backend
    Expected: exit code 0.

- [ ] Step 5: Commit.

    git add backend/src/modules/markets/domain/market-location-resolver.ts backend/tests/unit/markets/market-location-resolver.unit.test.ts
    git commit -m "feat: add authoritative market distance resolver"

### Task 3: Add the database migration and migration contract test

Files:
- Create backend/supabase/migrations/20261027100000_add_market_location_coordinates.sql
- Create backend/tests/unit/infrastructure/market-location-migration.unit.test.ts

Interfaces:
- market_locations exposes nullable latitude and longitude.
- Database checks allow both null, require a complete pair otherwise, and enforce ranges.

- [ ] Step 1: Write a migration contract test that reads the migration and asserts the two columns, pair check, and -90/-180 range checks.

- [ ] Step 2: Run and verify failure.

    Run: npm run test:unit -w backend -- tests/unit/infrastructure/market-location-migration.unit.test.ts
    Expected: FAIL because the migration file is absent.

- [ ] Step 3: Write this migration:

    ALTER TABLE public.market_locations
      ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

    ALTER TABLE public.market_locations
      DROP CONSTRAINT IF EXISTS market_locations_coordinate_pair_check,
      ADD CONSTRAINT market_locations_coordinate_pair_check
        CHECK ((latitude IS NULL AND longitude IS NULL)
          OR (latitude IS NOT NULL AND longitude IS NOT NULL)),
      DROP CONSTRAINT IF EXISTS market_locations_latitude_range_check,
      ADD CONSTRAINT market_locations_latitude_range_check
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
      DROP CONSTRAINT IF EXISTS market_locations_longitude_range_check,
      ADD CONSTRAINT market_locations_longitude_range_check
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180);

- [ ] Step 4: Run migration and documentation checks.

    Run: npm run test:unit -w backend -- tests/unit/infrastructure/market-location-migration.unit.test.ts
    Expected: PASS.

    Run: npm run test:documentation
    Expected: PASS.

- [ ] Step 5: Commit.

    git add backend/supabase/migrations/20261027100000_add_market_location_coordinates.sql backend/tests/unit/infrastructure/market-location-migration.unit.test.ts
    git commit -m "feat: add market reference coordinates"

### Task 4: Extend backend market persistence, use cases, and routes

Files:
- Modify backend/src/modules/markets/infrastructure/MarketLocationService.ts
- Create backend/src/modules/markets/application/UpdateMarketLocation.ts
- Modify backend/src/modules/markets/presentation/controllers/MarketLocationController.ts
- Modify backend/src/modules/markets/presentation/routes.ts
- Modify backend/src/modules/markets/index.ts
- Modify backend/tests/unit/markets/market-location-use-cases.unit.test.ts
- Create backend/tests/unit/markets/update-market-location.unit.test.ts
- Create backend/tests/unit/markets/market-location-controller.unit.test.ts

Interfaces:
- MarketLocation includes nullable latitude and longitude.
- create(name, coordinates) and update(id, name, coordinates) return the full row.
- PATCH /api/market-locations/:id requires admin access and accepts name, latitude, longitude.

- [ ] Step 1: Write failing use-case and controller tests. The use-case assertion must verify the exact call:

    const port = {
      update: async (...args: unknown[]) => {
        calls.push(args);
        return { id: "m1", name: "Market", latitude: 14, longitude: 120, created_at: "now", updated_at: "now" };
      },
    };
    await new UpdateMarketLocation(port).execute(
      "m1",
      "Market",
      { latitude: 14, longitude: 120 },
    );
    assert.deepEqual(calls, [["m1", "Market", { latitude: 14, longitude: 120 }]]);

    Add controller coverage for HTTP 400 on a partial pair and HTTP 200 on a valid admin PATCH.

- [ ] Step 2: Run and verify failure.

    Run: npm run test:unit -w backend -- tests/unit/markets
    Expected: FAIL because update support does not exist.

- [ ] Step 3: Implement service select/insert/update fields, normalize names, call normalizeMarketCoordinates, add the UpdateMarketLocation port, and add:

    router.patch("/:id", (req, res) => controller.update(req, res));

    Reject missing names, partial pairs, non-finite values, and out-of-range values with HTTP 400 before Supabase access. Keep the existing admin audit pattern.

- [ ] Step 4: Run market tests, lint, and typecheck.

    Run: npm run test:unit -w backend -- tests/unit/markets
    Expected: PASS.

    Run: npm run lint -w backend
    Expected: exit code 0.

    Run: npm run typecheck -w backend
    Expected: exit code 0.

- [ ] Step 5: Commit.

    git add backend/src/modules/markets backend/tests/unit/markets
    git commit -m "feat: expose market coordinate administration"

### Task 5: Extend the frontend market client

Files:
- Modify frontend/src/entities/market-location/api/market-location-client.ts
- Modify frontend/src/entities/market-location/index.ts
- Create frontend/tests/unit/entities/market-location/market-location-client.unit.test.ts

Interfaces:
- MarketLocationCreateInput = { name: string; latitude: number; longitude: number }.
- MarketLocationUpdateInput has the same fields.
- create(input) sends all fields; update(id, input) sends PATCH /market-locations/:id.

- [ ] Step 1: Write failing request tests.

    const request = await captureNextRequest(() => marketLocationClient.update("m1", {
      name: "Old Market",
      latitude: 14.6,
      longitude: 120.98,
    }));
    assert.equal(request.method, "PATCH");
    assert.match(request.url, /market-locations\/m1$/);

- [ ] Step 2: Run and verify failure.

    Run: npm run test:unit -w frontend -- frontend/tests/unit/entities/market-location/market-location-client.unit.test.ts
    Expected: FAIL because update and coordinate-bearing create do not exist.

- [ ] Step 3: Implement typed create/update methods while retaining the current timeout, auth headers, and GET 404 fallback.

- [ ] Step 4: Run the focused test and frontend typecheck.

    Run: npm run test:unit -w frontend -- frontend/tests/unit/entities/market-location/market-location-client.unit.test.ts
    Expected: PASS.

    Run: npm run typecheck -w frontend
    Expected: exit code 0.

- [ ] Step 5: Commit.

    git add frontend/src/entities/market-location frontend/tests/unit/entities/market-location/market-location-client.unit.test.ts
    git commit -m "feat: add coordinate-aware market client"

### Task 6: Add safe offline market-location caching

Files:
- Create frontend/src/entities/market-location/model/cache.ts
- Modify frontend/src/entities/market-location/index.ts
- Modify frontend/src/widgets/inspection-workspace/model/use-inspection-location.ts
- Create frontend/tests/unit/entities/market-location/market-location-cache.unit.test.ts

Interfaces:
- readCachedMarketLocations(storage) returns valid rows or [] on storage/JSON errors.
- writeCachedMarketLocations(storage, locations) uses key meatlens.market-locations.v1.
- useInspectionLocation returns full rows, uses fresh API data first, then cache, then name-only defaults.

- [ ] Step 1: Write failing round-trip and malformed-storage tests.

    test("round-trips coordinate-bearing rows", () => {
      const storage = createStorage();
      const rows = [{
        id: "m1", name: "Market", latitude: 14, longitude: 120,
        created_at: "now", updated_at: "now",
      }];
      writeCachedMarketLocations(storage, rows);
      assert.deepEqual(readCachedMarketLocations(storage), rows);
    });

    test("ignores malformed storage", () => {
      const storage = createStorage({ "meatlens.market-locations.v1": "not-json" });
      assert.deepEqual(readCachedMarketLocations(storage), []);
    });

- [ ] Step 2: Run and verify failure.

    Run: npm run test:unit -w frontend -- frontend/tests/unit/entities/market-location/market-location-cache.unit.test.ts
    Expected: FAIL because cache helpers are absent.

- [ ] Step 3: Implement safe storage helpers and hook fallback. Validate row shape before returning it; use latitude:null and longitude:null for name-only defaults. Never let storage errors block capture.

- [ ] Step 4: Run cache and existing location-memory tests.

    Run: npm run test:unit -w frontend -- frontend/tests/unit/entities/market-location/market-location-cache.unit.test.ts frontend/tests/unit/features/inspection-workspace/location-memory.unit.test.ts
    Expected: PASS.

- [ ] Step 5: Commit.

    git add frontend/src/entities/market-location frontend/src/widgets/inspection-workspace/model/use-inspection-location.ts frontend/tests/unit/entities/market-location/market-location-cache.unit.test.ts
    git commit -m "feat: cache market locations for offline capture"

### Task 7: Add administrator coordinate editing

Files:
- Create frontend/src/widgets/admin-dashboard/ui/market-location-editor.tsx
- Modify frontend/src/features/admin-management/model/use-market-form.ts
- Modify frontend/src/widgets/admin-dashboard/ui/markets-tab.tsx
- Modify frontend/src/widgets/admin-dashboard/model/use-admin-dashboard.ts
- Create frontend/tests/unit/features/admin-management/market-coordinate-form.unit.test.ts

Interfaces:
- Creation requires name, latitude, and longitude.
- Editing exposes startEditingMarket, cancelEditingMarket, and saveMarketCoordinates.
- Each row shows configured/not configured status and numeric coordinate inputs.

- [ ] Step 1: Write failing tests for partial rejection and normalized numeric submission.

    test("rejects a market with one coordinate", async () => {
      const form = createMarketFormHarness();
      form.setNewMarketName("Old Market");
      form.setNewMarketLatitude("14.6");
      form.setNewMarketLongitude("");
      await form.submit();
      assert.equal(form.created, null);
      assert.equal(form.lastToast, "Latitude and longitude are both required");
    });

    test("submits trimmed name and numeric coordinates", async () => {
      const form = createMarketFormHarness();
      form.setNewMarketName(" Old   Market ");
      form.setNewMarketLatitude("14.600000");
      form.setNewMarketLongitude("120.980000");
      await form.submit();
      assert.deepEqual(form.created, {
        name: "Old Market", latitude: 14.6, longitude: 120.98,
      });
    });

- [ ] Step 2: Run and verify failure.

    Run: npm run test:unit -w frontend -- frontend/tests/unit/features/admin-management/market-coordinate-form.unit.test.ts
    Expected: FAIL because coordinate state and update actions do not exist.

- [ ] Step 3: Implement number inputs with step=any, explicit finite/range/pair checks, create reset, sorted row replacement after edit, and “Reference point not configured” for null coordinates.

- [ ] Step 4: Run the focused test and typecheck.

    Run: npm run test:unit -w frontend -- frontend/tests/unit/features/admin-management/market-coordinate-form.unit.test.ts
    Expected: PASS.

    Run: npm run typecheck -w frontend
    Expected: exit code 0.

- [ ] Step 5: Commit.

    git add frontend/src/features/admin-management frontend/src/widgets/admin-dashboard frontend/tests/unit/features/admin-management/market-coordinate-form.unit.test.ts
    git commit -m "feat: let admins configure market reference points"

### Task 8: Add inspection location-resolution state

Files:
- Modify frontend/src/widgets/inspection-workspace/model/types.ts
- Modify frontend/src/widgets/inspection-workspace/model/use-inspection-location.ts
- Modify frontend/src/widgets/inspection-workspace/model/use-inspection-workspace.ts
- Create frontend/tests/unit/widgets/inspection-workspace/inspection-location-resolution.unit.test.ts

Interfaces:
- Add InspectionLocationResolution = "pending" | "automatic" | "manual".
- Expose locationResolution, locationDistanceMeters, and isOnline.
- Retain selectedLocation and remembered-location behavior.

- [ ] Step 1: Write failing tests.

    test("automatic resolution replaces a stale selection", () => {
      const state = resolveInspectionLocationState({
        coordinates: { latitude: 14, longitude: 120.0001 },
        marketLocations: [{
          id: "m1", name: "Old Market", latitude: 14, longitude: 120,
          created_at: "now", updated_at: "now",
        }],
        selectedLocation: "New Market",
        isOnline: true,
      });
      assert.equal(state.selectedLocation, "Old Market");
      assert.equal(state.locationResolution, "automatic");
      assert.equal(typeof state.locationDistanceMeters, "number");
    });

    test("unmatched online GPS clears the selection for manual fallback", () => {
      const state = resolveInspectionLocationState({
        coordinates: { latitude: 10, longitude: 110 },
        marketLocations: [],
        selectedLocation: "Old Market",
        isOnline: true,
      });
      assert.equal(state.selectedLocation, "");
      assert.equal(state.locationResolution, "manual");
    });

- [ ] Step 2: Run and verify failure.

    Run: npm run test:unit -w frontend -- frontend/tests/unit/widgets/inspection-workspace/inspection-location-resolution.unit.test.ts
    Expected: FAIL because the state helper is absent.

- [ ] Step 3: Implement capture-time resolution. Set pending at capture, call the frontend resolver after GPS resolves, set automatic plus distance on match, and set manual on failure. Before capture disable online selection, enable offline selection, and enable the selector after an unresolved result. Do not persist an automatic match as the remembered manual preference.

- [ ] Step 4: Run the focused and existing inspection-location tests.

    Run: npm run test:unit -w frontend -- frontend/tests/unit/widgets/inspection-workspace/inspection-location-resolution.unit.test.ts frontend/tests/unit/domain/inspections/inspection-location.unit.test.ts frontend/tests/unit/features/inspection-workspace/location-memory.unit.test.ts
    Expected: PASS.

- [ ] Step 5: Commit.

    git add frontend/src/widgets/inspection-workspace/model frontend/tests/unit/widgets/inspection-workspace/inspection-location-resolution.unit.test.ts
    git commit -m "feat: resolve inspection markets from captured GPS"

### Task 9: Update the capture UI for automatic and manual states

Files:
- Modify frontend/src/widgets/inspection-workspace/ui/InspectCaptureSection.tsx
- Modify frontend/src/widgets/inspection-workspace/ui/inspection-workspace.tsx
- Modify frontend/src/widgets/inspection-workspace/ui/InspectHeroSection.tsx
- Create frontend/tests/component/inspections/inspection-location-resolution.component.test.tsx

Interfaces:
- InspectCaptureSection receives locationResolution, locationDistanceMeters, isOnline, and coordinate-bearing rows.
- Automatic state renders “Auto-detected: <name> · <rounded> m away” and disables the selector.
- Manual state renders “Select the closest market” and enables the selector.

- [ ] Step 1: Write failing component tests.

    test("locks the selector after automatic matching", () => {
      render(<InspectCaptureSection {...baseProps}
        locationResolution="automatic"
        selectedLocation="Old Market"
        locationDistanceMeters={23.4} />);
      expect(screen.getByText(/Auto-detected: Old Market/i)).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: "Change location" })).toBeDisabled();
    });

    test("enables selection after no automatic match", () => {
      render(<InspectCaptureSection {...baseProps}
        locationResolution="manual"
        selectedLocation="" />);
      expect(screen.getByText(/Select the closest market/i)).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: "Change location" })).not.toBeDisabled();
    });

- [ ] Step 2: Run and verify failure.

    Run: npm run test:component -w frontend -- frontend/tests/component/inspections/inspection-location-resolution.component.test.tsx
    Expected: FAIL because status props and copy are not rendered.

- [ ] Step 3: Implement the states while retaining the existing Radix Select and aria-label. Render rows by market.name, show rounded distance, and keep GPS pending/unavailable text. Update the hero to show the resolved market label.

- [ ] Step 4: Run the component and architecture checks.

    Run: npm run test:component -w frontend -- frontend/tests/component/inspections/inspection-location-resolution.component.test.tsx
    Expected: PASS.

    Run: npm run test:architecture -w frontend
    Expected: PASS with no new FSD boundary or source-size violation.

- [ ] Step 5: Commit.

    git add frontend/src/widgets/inspection-workspace frontend/tests/component/inspections/inspection-location-resolution.component.test.tsx
    git commit -m "feat: show automatic market detection and fallback"

### Task 10: Enforce a resolved market in save and offline paths

Files:
- Modify frontend/src/widgets/inspection-workspace/model/use-inspection-workspace.ts
- Modify frontend/src/widgets/inspection-workspace/model/pending-scan.ts
- Modify frontend/src/features/offline-sync/model/inspection-queue.ts
- Modify frontend/src/features/offline-sync/ui/offline-sync-manager.tsx
- Create frontend/tests/unit/features/offline-sync/location-resolution-sync.unit.test.ts

Interfaces:
- Queue records continue storing location, locationLatitude, and locationLongitude.
- Export resolveQueuedInspectionLocation(scan, marketLocations).
- handleSave rejects an empty selection before upload/queueing with “Select the closest market before saving.”

- [ ] Step 1: Write failing replay tests.

    test("nearby coordinates override a stale queued market", () => {
      const result = resolveQueuedInspectionLocation(
        { location: "New Market", locationLatitude: 14, locationLongitude: 120.0001 },
        [{ id: "m1", name: "Old Market", latitude: 14, longitude: 120,
          created_at: "now", updated_at: "now" }],
      );
      assert.equal(result, "Old Market");
    });

    test("a valid manual fallback survives without GPS", () => {
      const result = resolveQueuedInspectionLocation(
        { location: "Old Market", locationLatitude: null, locationLongitude: null },
        [{ id: "m1", name: "Old Market", latitude: null, longitude: null,
          created_at: "now", updated_at: "now" }],
      );
      assert.equal(result, "Old Market");
    });

- [ ] Step 2: Run and verify failure.

    Run: npm run test:unit -w frontend -- frontend/tests/unit/features/offline-sync/location-resolution-sync.unit.test.ts
    Expected: FAIL because the helper is absent.

- [ ] Step 3: Implement the pure replay helper and save guard. Resolve against the latest cached rows; otherwise validate a non-empty case-insensitive manual name against known market rows and use canonical spelling. Keep queue items on upload or server failure.

- [ ] Step 4: Run sync, offline, and inspection unit tests.

    Run: npm run test:unit -w frontend -- frontend/tests/unit/features/offline-sync/location-resolution-sync.unit.test.ts frontend/tests/unit/entities/inspection/sqlite-cache.unit.test.ts frontend/tests/unit/state/auth-context-offline.unit.test.tsx
    Expected: PASS.

- [ ] Step 5: Commit.

    git add frontend/src/widgets/inspection-workspace frontend/src/features/offline-sync frontend/tests/unit/features/offline-sync/location-resolution-sync.unit.test.ts
    git commit -m "feat: require resolved markets for offline saves"

### Task 11: Canonicalize market location in backend inspection creation

Files:
- Create backend/src/modules/markets/application/ResolveInspectionMarket.ts
- Modify backend/src/modules/markets/index.ts
- Modify backend/src/modules/inspections/presentation/controllers/InspectionController.ts
- Modify backend/src/types/inspection.ts
- Create backend/tests/unit/markets/resolve-inspection-market.unit.test.ts
- Modify backend/tests/unit/inspections/get-inspection-controller.unit.test.ts

Interfaces:
- ResolveInspectionMarket.execute({ location, location_latitude, location_longitude }): Promise<string>.
- A nearby coordinate match overrides the submitted name.
- Without a nearby match, a non-empty name must match an existing market row case-insensitively.
- Missing coordinates plus a valid market name is allowed for manual fallback.

- [ ] Step 1: Write failing use-case tests.

    test("canonicalizes a stale name when coordinates match another market", async () => {
      const result = await new ResolveInspectionMarket({
        getAll: async () => [{
          id: "m1", name: "Old Market", latitude: 14, longitude: 120,
          created_at: "now", updated_at: "now",
        }],
      }).execute({
        location: "New Market", location_latitude: 14, location_longitude: 120.0001,
      });
      assert.equal(result, "Old Market");
    });

    test("accepts a valid manual name without coordinates", async () => {
      const result = await new ResolveInspectionMarket({
        getAll: async () => [{
          id: "m1", name: "Old Market", latitude: null, longitude: null,
          created_at: "now", updated_at: "now",
        }],
      }).execute({
        location: " old market ", location_latitude: null, location_longitude: null,
      });
      assert.equal(result, "Old Market");
    });

- [ ] Step 2: Run and verify failure.

    Run: npm run test:unit -w backend -- tests/unit/markets/resolve-inspection-market.unit.test.ts
    Expected: FAIL because the use case is absent.

- [ ] Step 3: Implement the use case and call it in InspectionController after coordinate normalization and before createInspection.execute. Replace inspectionInput.location with the canonical return value and map validation errors to HTTP 400. Keep client-submission idempotency and pre-scan validation unchanged.

- [ ] Step 4: Run backend market and inspection tests plus typecheck.

    Run: npm run test:unit -w backend -- tests/unit/markets tests/unit/inspections
    Expected: PASS.

    Run: npm run typecheck -w backend
    Expected: exit code 0.

- [ ] Step 5: Commit.

    git add backend/src/modules/markets backend/src/modules/inspections/presentation/controllers/InspectionController.ts backend/src/types/inspection.ts backend/tests/unit/markets/resolve-inspection-market.unit.test.ts backend/tests/unit/inspections/get-inspection-controller.unit.test.ts
    git commit -m "feat: verify market classification on inspection save"

### Task 12: Add market and inspection API contract coverage

Files:
- Create tests/contracts/schemas/market-location.schema.ts
- Modify tests/contracts/api-contract.test.ts
- Create backend/tests/integration/markets/market-location-route.integration.test.ts

Interfaces:
- Market responses require string id/name, nullable numeric latitude/longitude, and string timestamps.
- Inspection create responses expose canonical location after coordinate override.

- [ ] Step 1: Write failing schema and route assertions. The schema must assert nullable finite numbers; the route test must PATCH a valid pair; the inspection test must submit “New Market” at “Old Market” coordinates and assert “Old Market” in the response.

- [ ] Step 2: Run and verify failure.

    Run: npm run test:contract
    Expected: FAIL until the new schema and route fixtures are wired.

- [ ] Step 3: Implement the schema and tests using existing encrypted test clients, auth/profile stubs, server lifecycle helpers, and finally restoration for every stub.

- [ ] Step 4: Run contract and backend integration lanes.

    Run: npm run test:contract
    Expected: PASS.

    Run: npm run test:backend:integration
    Expected: PASS within 110 seconds.

- [ ] Step 5: Commit.

    git add tests/contracts backend/tests/integration/markets
    git commit -m "test: cover market location API contracts"

### Task 13: Update operational documentation

Files:
- Modify documentation/manual-content.md
- Modify documentation/API_REFERENCE.md
- Modify documentation/application/frontend_documentation.md
- Modify documentation/application/backend_documentation.md
- Modify scripts/check-documentation.test.mjs
- Modify documentation/README.md only if the existing documentation checker requires the new page/link.

- [ ] Step 1: Extend scripts/check-documentation.test.mjs with a focused content assertion for latitude/longitude, 50 metres, and manual closest-market fallback.

- [ ] Step 2: Run and verify the documentation check identifies the missing content.

    Run: npm run test:documentation
    Expected: the new content assertion fails before the documentation edits.

- [ ] Step 3: Replace the old statement that the system never auto-assigns the nearest market. Document manual admin coordinate entry, the inclusive 50-metre rule, GPS failure/no-match fallback online and offline, and backend sync verification. Document latitude/longitude fields and PATCH /api/market-locations/:id in the API reference.

- [ ] Step 4: Run the documentation gate.

    Run: npm run test:documentation
    Expected: PASS.

- [ ] Step 5: Commit.

    git add documentation scripts/check-documentation.test.mjs
    git commit -m "docs: document market location classification"

### Task 14: Run the complete affected CI-equivalent verification

Files:
- No source changes expected. If verification reveals a feature defect, fix it in the relevant task commit rather than weakening a gate.

- [ ] Step 1: Run targeted checks.

    npm run lint
    npm run typecheck
    npm run test:documentation
    npm run test:unit -w frontend
    npm run test:component -w frontend
    npm run test:integration -w frontend
    npm run test:architecture -w frontend
    npm run test:unit -w backend
    npm run test:architecture -w backend
    npm run test:backend:integration
    npm run test:contract

    Expected: every command exits 0 and no lane exceeds 110 seconds.

- [ ] Step 2: Run the repository CI command.

    Run: npm run test:ci
    Expected: PASS for lint, typecheck, scripts, documentation, frontend/backend fast tests, backend integration, and contracts.

- [ ] Step 3: Inspect final state.

    git diff --check
    git status --short
    git log --oneline -18

    Expected: no whitespace errors; only feature commits and the user's pre-existing unrelated changes are present; at least 13 feature implementation commits are visible after the design/plan commits.

- [ ] Step 4: If a final feature-only correction was necessary, make one specific non-empty commit. Never create an empty verification commit.

## Self-review checklist

- Spec coverage: coordinate columns/constraints are Task 3; admin manual configuration is Tasks 4, 5, and 7; frontend automatic/fallback behavior is Tasks 6, 8, and 9; offline persistence/replay is Task 10; backend authority is Task 11; contracts/docs are Tasks 12 and 13; CI gates are Task 14.
- Placeholder scan: no TODO, TBD, FIXME, or unspecified implementation decisions are in this plan.
- Type consistency: frontend market rows expose nullable coordinates; both resolvers use the same 50-metre semantics; queue replay and backend creation canonicalize the same way.
- Commit count: Tasks 1–13 each define one coherent commit, giving 13 implementation commits before any final correction.

