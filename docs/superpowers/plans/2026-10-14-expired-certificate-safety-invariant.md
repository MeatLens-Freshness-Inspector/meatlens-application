# Expired Meat Inspection Certificate Safety Invariant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure every inspection with a `meat_expiry_date` before the current UTC date is automatically recorded as a protocol-driven spoiled result, with AI bypassed and regulatory compliance false.

**Architecture:** Keep the existing `meat_expiry_date` field and freshness classification model. Centralize date-only expiry and protocol-reason selection in the frontend/backend pre-scan domains, derive the safety decision in online and offline clients, enforce it again in the API service, and add a PostgreSQL trigger as the final persistence boundary.

**Tech Stack:** React/TypeScript/Vite, Node test runner with `tsx`, Express/TypeScript backend, Supabase PostgreSQL migrations, IndexedDB/Capacitor SQLite offline queue, Markdown documentation.

## Global Constraints

- An inspection certificate is expired only when its date-only value is earlier than the current UTC calendar date; the expiry date itself remains valid through that date.
- An expired certificate uses the existing `spoiled` classification with `inspection_decision_source = protocol_pre_scan` and reason `expired_meat_inspection_certificate`; do not add an `expired` freshness classification.
- Expired certificate captures must not run AI analysis.
- Expired certificate records must persist with `confidence_score = 100` and `regulatory_compliance = false`.
- Missing or invalid expiry dates remain checklist/validation concerns and are not interpreted as expired.
- Preserve existing tests and the unrelated working-tree change in `frontend/src/widgets/legal/terms-and-conditions-dialog.tsx`.
- Every production code change must follow TDD: write a failing test, run it to observe the expected failure, implement the smallest passing change, then rerun the affected tests.
- Documentation-only edits use the repository documentation validator as their verification gate; they do not require production-code TDD.
- Before completion, run the relevant CI-equivalent local checks: lint, typecheck, affected frontend/backend test lanes, architecture/migration tests, build, and the repository's complete `npm run test:ci` gate where runtime permits.

---

## File Map

### Frontend domain and workflow

- Modify `frontend/src/entities/inspection/model/pre-scan.ts`: expiry constants, UTC date-only helper, protocol reason resolution, forced result construction, and compliance calculation.
- Modify `frontend/src/entities/inspection/index.ts`: export the new pre-scan helpers/constants.
- Modify `frontend/src/entities/inspection/model/mutations.ts`: derive expired safety metadata and override unsafe result payloads.
- Modify `frontend/src/widgets/inspection-workspace/model/pending-scan.ts`: persist expiry-derived reason, result, decision source, and compliance in offline captures.
- Modify `frontend/src/widgets/inspection-workspace/model/use-inspection-workspace.ts`: use expiry-aware protocol failure at capture time.
- Modify `frontend/src/features/offline-sync/ui/offline-sync-manager.tsx`: re-evaluate expiry at sync time and pass the correct forced result/reason without running AI.
- Modify `frontend/src/widgets/inspection-workspace/ui/InspectPreScanSection.tsx`: show the operator-facing expiry warning.
- Modify `frontend/tests/unit/domain/inspections/inspection-pre-scan.unit.test.ts`: date boundary and reason/result tests.
- Modify `frontend/tests/unit/features/inspection-submission/inspection-mutation.unit.test.ts`: online payload override tests.
- Modify `frontend/tests/unit/features/inspection-workspace/pending-scan.unit.test.ts`: offline payload override tests.
- Modify `frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx`: expiry warning rendering test.

### Backend enforcement and persistence

- Modify `backend/src/types/inspectionPreScan.ts`: backend UTC date helper and normalized safety-invariant function.
- Modify `backend/src/modules/inspections/infrastructure/InspectionService.ts`: apply the backend safety invariant before building the persistence payload.
- Modify `backend/tests/unit/inspections/pre-scan.unit.test.ts`: backend expiry boundary and override tests.
- Create `backend/supabase/migrations/20261014100000_enforce_expired_certificate_safety.sql`: trigger-based database enforcement.
- Create `backend/tests/unit/infrastructure/expired-certificate-migration.unit.test.ts`: migration contract test.

### Documentation

- Modify `documentation/manual-content.md`: explain that an expired certificate automatically records a protocol-driven spoiled result and skips AI.

## Interfaces

The frontend pre-scan module will expose:

```ts
export const EXPIRED_CERTIFICATE_REASON = "expired_meat_inspection_certificate";

export function isCertificateExpired(
  meatExpiryDate: string | null | undefined,
  todayUtcDate?: string,
): boolean;

export function getProtocolSpoiledReason(
  form: InspectionPreScanForm,
  todayUtcDate?: string,
): string;

export function getRegulatoryCompliance(
  form: InspectionPreScanForm,
  todayUtcDate?: string,
): boolean | null;

export function buildProtocolSpoiledAnalysisResult(
  reason?: string,
): AnalysisResult;
```

The backend pre-scan module will expose:

```ts
export function isInspectionCertificateExpired(
  meatExpiryDate: string | null | undefined,
  todayUtcDate?: string,
): boolean;

export function enforceInspectionPreScanSafety<T extends InspectionInsert>(
  inspection: T,
  todayUtcDate?: string,
): T;
```

The backend enforcement function returns the input unchanged unless `meat_expiry_date` is earlier than `todayUtcDate`; for an expired date it returns the input with `classification`, `manual_classification`, `confidence_score`, `inspection_decision_source`, `protocol_spoiled_reason`, `regulatory_compliance`, `flagged_deviations`, and `explanation` set to the invariant outcome.

---

## Task 1: Add deterministic frontend expiry and protocol helpers

**Files:**
- Modify: `frontend/src/entities/inspection/model/pre-scan.ts`
- Modify: `frontend/src/entities/inspection/index.ts`
- Test: `frontend/tests/unit/domain/inspections/inspection-pre-scan.unit.test.ts`

**Interfaces:**
- Consumes: existing `InspectionPreScanForm`, `AnalysisResult`, and `InspectionInsert` types.
- Produces: `EXPIRED_CERTIFICATE_REASON`, `isCertificateExpired`, `getProtocolSpoiledReason`, and `getRegulatoryCompliance` for client workflow and payload tasks.

- [ ] **Step 1: Write the failing tests**

Add tests with explicit UTC dates:

```ts
test("treats a date before today as expired but today and future dates as valid", () => {
  assert.equal(isCertificateExpired("2026-10-13", "2026-10-14"), true);
  assert.equal(isCertificateExpired("2026-10-14", "2026-10-14"), false);
  assert.equal(isCertificateExpired("2026-10-15", "2026-10-14"), false);
  assert.equal(isCertificateExpired(null, "2026-10-14"), false);
});

test("uses certificate expiry as the highest-priority protocol reason", () => {
  const form = { ...safeForm, meatExpiryDate: "2026-10-13", areaClean: "no" as const };

  assert.equal(hasProtocolFailure(form, "2026-10-14"), true);
  assert.equal(getInspectionDecisionSource(form, "2026-10-14"), "protocol_pre_scan");
  assert.equal(getProtocolSpoiledReason(form, "2026-10-14"), EXPIRED_CERTIFICATE_REASON);
  assert.equal(getRegulatoryCompliance(form, "2026-10-14"), false);
});

test("does not expire a certificate on its stated expiry date", () => {
  const form = { ...safeForm, meatExpiryDate: "2026-10-14" };

  assert.equal(hasProtocolFailure(form, "2026-10-14"), false);
  assert.equal(getInspectionDecisionSource(form, "2026-10-14"), "ai");
  assert.equal(getRegulatoryCompliance(form, "2026-10-14"), true);
});

test("builds a forced spoiled result with a supplied protocol reason", () => {
  assert.deepEqual(buildProtocolSpoiledAnalysisResult(EXPIRED_CERTIFICATE_REASON), {
    classification: "spoiled",
    confidence_score: 100,
    flagged_deviations: [EXPIRED_CERTIFICATE_REASON],
    explanation: "Automatically classified as spoiled because the meat inspection certificate is expired. AI analysis was skipped.",
  });
});
```

Update the test imports and add `todayUtcDate?: string` to the existing `hasProtocolFailure` and `getInspectionDecisionSource` calls used by the new assertions.

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```powershell
npx tsx --test frontend/tests/unit/domain/inspections/inspection-pre-scan.unit.test.ts
```

Expected: FAIL because the new expiry exports/signatures and reason-aware result do not exist yet.

- [ ] **Step 3: Implement the minimal frontend helpers**

In `pre-scan.ts`:

```ts
export const EXPIRED_CERTIFICATE_REASON = "expired_meat_inspection_certificate";

function getUtcDateString(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function isCertificateExpired(
  meatExpiryDate: string | null | undefined,
  todayUtcDate = getUtcDateString(),
): boolean {
  const normalizedDate = meatExpiryDate?.trim();
  return Boolean(normalizedDate && normalizedDate < todayUtcDate);
}

export function hasProtocolFailure(
  form: InspectionPreScanForm,
  todayUtcDate = getUtcDateString(),
): boolean {
  return isCertificateExpired(form.meatExpiryDate, todayUtcDate)
    || form.storageCorrect === "no"
    || form.lightColorCorrect === "no"
    || form.areaClean === "no";
}

export function getProtocolSpoiledReason(
  form: InspectionPreScanForm,
  todayUtcDate = getUtcDateString(),
): string {
  return isCertificateExpired(form.meatExpiryDate, todayUtcDate)
    ? EXPIRED_CERTIFICATE_REASON
    : PROTOCOL_SPOILED_REASON;
}

export function getRegulatoryCompliance(
  form: InspectionPreScanForm,
  todayUtcDate = getUtcDateString(),
): boolean | null {
  const preScanPayload = toInspectionPreScanPayload(form);
  const hasPreScan = Object.values(preScanPayload).some((value) => value != null);
  if (!hasPreScan) return null;
  if (isCertificateExpired(form.meatExpiryDate, todayUtcDate)) return false;
  return preScanPayload.storage_correct === true
    && preScanPayload.light_color_correct === true
    && preScanPayload.area_clean === true;
}
```

Change `buildProtocolSpoiledAnalysisResult(reason = PROTOCOL_SPOILED_REASON)` so the explanation is specific when `reason === EXPIRED_CERTIFICATE_REASON`, while preserving the existing output for the default reason. Update `getInspectionDecisionSource` to accept the optional date and use the updated `hasProtocolFailure`. Export all new helpers/constants through `frontend/src/entities/inspection/index.ts`.

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```powershell
npx tsx --test frontend/tests/unit/domain/inspections/inspection-pre-scan.unit.test.ts
```

Expected: PASS, including the existing generic protocol tests and the new date-boundary tests.

- [ ] **Step 5: Commit the frontend domain change**

```powershell
git add frontend/src/entities/inspection/model/pre-scan.ts frontend/src/entities/inspection/index.ts frontend/tests/unit/domain/inspections/inspection-pre-scan.unit.test.ts
git commit -m "feat: add expired certificate pre-scan rule"
```

## Task 2: Apply expiry to online, offline, and sync payloads

**Files:**
- Modify: `frontend/src/entities/inspection/model/mutations.ts`
- Modify: `frontend/src/widgets/inspection-workspace/model/pending-scan.ts`
- Modify: `frontend/src/widgets/inspection-workspace/model/use-inspection-workspace.ts`
- Modify: `frontend/src/features/offline-sync/ui/offline-sync-manager.tsx`
- Test: `frontend/tests/unit/features/inspection-submission/inspection-mutation.unit.test.ts`
- Test: `frontend/tests/unit/features/inspection-workspace/pending-scan.unit.test.ts`

**Interfaces:**
- Consumes: Task 1's `isCertificateExpired`, `getInspectionDecisionSource`, `getProtocolSpoiledReason`, `getRegulatoryCompliance`, and `buildProtocolSpoiledAnalysisResult`.
- Produces: online saves, queued scans, and replayed scans that cannot retain an AI result when the certificate is expired.

Add an optional `todayUtcDate?: string` field to both `InspectionSubmissionInput` and `BuildPendingScanInput`. Production callers omit it; unit tests pass a fixed date so the payload builders never depend on the machine clock.

- [ ] **Step 1: Write failing online and offline payload tests**

Add an expired submission fixture to `inspection-mutation.unit.test.ts` that passes `decisionSource: "ai"`, a fresh result, `meatExpiryDate: "2026-10-13"`, and `todayUtcDate: "2026-10-14"`. Assert that `buildInspectionInsert` returns:

```ts
assert.equal(result.classification, "spoiled");
assert.equal(result.confidence_score, 100);
assert.deepEqual(result.flagged_deviations, [EXPIRED_CERTIFICATE_REASON]);
assert.equal(result.inspection_decision_source, "protocol_pre_scan");
assert.equal(result.protocol_spoiled_reason, EXPIRED_CERTIFICATE_REASON);
assert.equal(result.regulatory_compliance, false);
```

Add an expired `buildPendingScan` case with all three boolean checks set to `"yes"` and `todayUtcDate: "2026-10-14"`, then assert `inspectionDecisionSource`, `protocolSpoiledReason`, `regulatoryCompliance`, and `analysisResult` are the forced expired-certificate values.

- [ ] **Step 2: Run the focused tests to verify they fail**

```powershell
npx tsx --test frontend/tests/unit/features/inspection-submission/inspection-mutation.unit.test.ts frontend/tests/unit/features/inspection-workspace/pending-scan.unit.test.ts
```

Expected: FAIL because the builders currently trust the caller's decision source, generic reason, and three-boolean compliance calculation.

- [ ] **Step 3: Implement online and offline derivation**

In `buildInspectionInsert`, compute the expiry-aware decision from `preScanForm` before constructing the return value:

```ts
const expired = isCertificateExpired(preScanForm.meatExpiryDate, todayUtcDate);
const resolvedDecisionSource = expired ? "protocol_pre_scan" : decisionSource;
const resolvedResult = expired
  ? buildProtocolSpoiledAnalysisResult(EXPIRED_CERTIFICATE_REASON)
  : result;
const regulatoryCompliance = getRegulatoryCompliance(preScanForm, todayUtcDate);
```

Use `resolvedDecisionSource`, `resolvedResult`, `regulatoryCompliance`, and `getProtocolSpoiledReason(preScanForm, todayUtcDate)` in the returned insert. For an AI decision with a non-expired form, preserve current behavior and set `protocol_spoiled_reason` to `null`.

In `buildPendingScan`, derive the same values using its optional `todayUtcDate`. If the form is expired, store the forced `analysisResult` immediately, set the protocol source/reason, and set compliance false even when all three boolean checks are true. Preserve optional model analysis for non-expired AI scans.

In `use-inspection-workspace.ts`, compute `protocolTriggered` with the updated `hasProtocolFailure(preScanForm)` and construct `buildProtocolSpoiledAnalysisResult(getProtocolSpoiledReason(preScanForm))` when capture begins. Pass the expiry reason through the existing state and queue path.

In `offline-sync-manager.tsx`, import `isCertificateExpired` and `buildProtocolSpoiledAnalysisResult`. At replay time compute:

```ts
const expired = isCertificateExpired(scan.meatExpiryDate);
const protocolDecision = scan.inspectionDecisionSource === "protocol_pre_scan" || expired;
const protocolReason = expired
  ? EXPIRED_CERTIFICATE_REASON
  : scan.protocolSpoiledReason ?? dependencies.protocolSpoiledReason;
const result = protocolDecision
  ? dependencies.buildProtocolSpoiledAnalysisResult(protocolReason)
  : scan.analysisResult ?? await dependencies.analyzeOffline(imageFile, scan.meatType);
```

Use `protocolDecision` and `protocolReason` in the submitted payload, and compute compliance with `false` when `expired` is true. Update `OfflineSyncDependencies.buildProtocolSpoiledAnalysisResult` to accept an optional string reason.

- [ ] **Step 4: Run the focused tests to verify they pass**

```powershell
npx tsx --test frontend/tests/unit/features/inspection-submission/inspection-mutation.unit.test.ts frontend/tests/unit/features/inspection-workspace/pending-scan.unit.test.ts frontend/tests/unit/domain/inspections/inspection-pre-scan.unit.test.ts
```

Expected: PASS with existing generic protocol behavior unchanged and expired submissions forced to the certificate-expiry result.

- [ ] **Step 5: Commit the client safety-flow change**

```powershell
git add frontend/src/entities/inspection/model/mutations.ts frontend/src/widgets/inspection-workspace/model/pending-scan.ts frontend/src/widgets/inspection-workspace/model/use-inspection-workspace.ts frontend/src/features/offline-sync/ui/offline-sync-manager.tsx frontend/tests/unit/features/inspection-submission/inspection-mutation.unit.test.ts frontend/tests/unit/features/inspection-workspace/pending-scan.unit.test.ts
git commit -m "feat: force expired certificates through protocol path"
```

## Task 3: Add the operator-facing expiry warning

**Files:**
- Modify: `frontend/src/widgets/inspection-workspace/ui/InspectPreScanSection.tsx`
- Test: `frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx`

**Interfaces:**
- Consumes: `isCertificateExpired` from the pre-scan domain and the existing `InspectionPreScanForm`.
- Produces: visible, non-dismissable safety messaging whenever the entered certificate date is before the current UTC date.

- [ ] **Step 1: Write the failing component test**

Add a form whose `meatExpiryDate` is `2000-01-01`, render the section with `isBypassed={false}`, and assert the markup includes both phrases. The fixed historical date keeps the test valid regardless of when it runs:

```ts
assert.match(markup, /certificate is expired/i);
assert.match(markup, /automatically classified as spoiled/i);
```

- [ ] **Step 2: Run the component test to verify it fails**

```powershell
npx tsx --test frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx
```

Expected: FAIL because the component has no expiry warning.

- [ ] **Step 3: Implement the warning**

In `InspectPreScanSection.tsx`, compute `const isCertificateExpiredValue = isCertificateExpired(form.meatExpiryDate);`. When true, render a warning block immediately below the introductory copy:

```tsx
{isCertificateExpiredValue && (
  <div role="alert" className="mt-4 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-foreground">
    Certificate is expired. Any captured meat will be automatically classified as spoiled, and AI analysis will be skipped.
  </div>
)}
```

Keep the checklist unlock behavior unchanged: a completed form can still open capture so the capture is recorded with the safety decision rather than silently discarded.

- [ ] **Step 4: Run the component test to verify it passes**

```powershell
npx tsx --test frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx
```

Expected: PASS, including the existing radio-control assertions.

- [ ] **Step 5: Commit the UI safety warning**

```powershell
git add frontend/src/widgets/inspection-workspace/ui/InspectPreScanSection.tsx frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx
git commit -m "feat: warn about expired inspection certificates"
```

## Task 4: Enforce the invariant in the backend API

**Files:**
- Modify: `backend/src/types/inspectionPreScan.ts`
- Modify: `backend/src/modules/inspections/infrastructure/InspectionService.ts`
- Test: `backend/tests/unit/inspections/pre-scan.unit.test.ts`

**Interfaces:**
- Consumes: backend `InspectionInsert` and normalized `meat_expiry_date` values.
- Produces: `isInspectionCertificateExpired` and `enforceInspectionPreScanSafety`, applied before persistence for every service caller.

- [ ] **Step 1: Write failing backend tests**

Add tests to `pre-scan.unit.test.ts`:

```ts
test("forces an expired certificate submission to the protocol spoiled invariant", () => {
  const result = enforceInspectionPreScanSafety({
    classification: "fresh",
    manual_classification: "fresh",
    confidence_score: 91,
    flagged_deviations: ["model_flag"],
    explanation: "Model result",
    inspection_decision_source: "ai",
    protocol_spoiled_reason: null,
    regulatory_compliance: true,
    meat_expiry_date: "2026-10-13",
  } as any, "2026-10-14");

  assert.equal(result.classification, "spoiled");
  assert.equal(result.manual_classification, "spoiled");
  assert.equal(result.confidence_score, 100);
  assert.equal(result.inspection_decision_source, "protocol_pre_scan");
  assert.equal(result.protocol_spoiled_reason, "expired_meat_inspection_certificate");
  assert.equal(result.regulatory_compliance, false);
  assert.deepEqual(result.flagged_deviations, ["model_flag", "expired_meat_inspection_certificate"]);
});

test("does not force a certificate dated today or later", () => {
  const input = { classification: "fresh", meat_expiry_date: "2026-10-14" } as any;

  assert.deepEqual(enforceInspectionPreScanSafety(input, "2026-10-14"), input);
  assert.deepEqual(enforceInspectionPreScanSafety({ ...input, meat_expiry_date: "2026-10-15" }, "2026-10-14"), {
    ...input,
    meat_expiry_date: "2026-10-15",
  });
});
```

- [ ] **Step 2: Run the backend tests to verify they fail**

```powershell
npx tsx --test backend/tests/unit/inspections/pre-scan.unit.test.ts
```

Expected: FAIL because the backend helper is not defined.

- [ ] **Step 3: Implement backend normalization and service enforcement**

In `backend/src/types/inspectionPreScan.ts`, implement date-only comparison using `new Date().toISOString().slice(0, 10)` and lexicographic `YYYY-MM-DD` comparison. `enforceInspectionPreScanSafety` must return a shallow copy and append the expiry reason only once:

```ts
const EXPIRED_CERTIFICATE_REASON = "expired_meat_inspection_certificate";

if (!isInspectionCertificateExpired(inspection.meat_expiry_date, todayUtcDate)) {
  return inspection;
}

const flaggedDeviations = inspection.flagged_deviations ?? [];
return {
  ...inspection,
  classification: "spoiled",
  manual_classification: "spoiled",
  confidence_score: 100,
  flagged_deviations: flaggedDeviations.includes(EXPIRED_CERTIFICATE_REASON)
    ? flaggedDeviations
    : [...flaggedDeviations, EXPIRED_CERTIFICATE_REASON],
  explanation: "Automatically classified as spoiled because the meat inspection certificate is expired. AI analysis was skipped.",
  inspection_decision_source: "protocol_pre_scan",
  protocol_spoiled_reason: EXPIRED_CERTIFICATE_REASON,
  regulatory_compliance: false,
};
```

Export the helper and constant for tests and service use. In `InspectionService.create`, call `enforceInspectionPreScanSafety(inspection)` immediately before `buildInsertPayload`, then build the payload from the returned value. This ensures direct service callers receive the same protection as HTTP callers.

- [ ] **Step 4: Run the backend tests to verify they pass**

```powershell
npx tsx --test backend/tests/unit/inspections/pre-scan.unit.test.ts
```

Expected: PASS with existing normalization and decision assertions preserved.

- [ ] **Step 5: Commit the backend API safety boundary**

```powershell
git add backend/src/types/inspectionPreScan.ts backend/src/modules/inspections/infrastructure/InspectionService.ts backend/tests/unit/inspections/pre-scan.unit.test.ts
git commit -m "feat: enforce expired certificate safety on backend"
```

## Task 5: Add database trigger enforcement and migration coverage

**Files:**
- Create: `backend/supabase/migrations/20261014100000_enforce_expired_certificate_safety.sql`
- Create: `backend/tests/unit/infrastructure/expired-certificate-migration.unit.test.ts`

**Interfaces:**
- Consumes: `public.inspections.meat_expiry_date` and the existing inspection classification/protocol columns.
- Produces: a database-level invariant for all future inserts and updates.

- [ ] **Step 1: Write the failing migration contract test**

Create a test following the existing migration-test pattern:

```ts
const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20261014100000_enforce_expired_certificate_safety.sql",
);

test("expired certificate migration forces the safety invariant", () => {
  const sql = readFileSync(migrationPath, "utf8").toLowerCase();

  assert.match(sql, /create or replace function public\.enforce_expired_certificate_safety/);
  assert.match(sql, /meat_expiry_date/);
  assert.match(sql, /timezone\('utc', now\(\)\)/);
  assert.match(sql, /::date/);
  assert.match(sql, /new\.classification := 'spoiled'/);
  assert.match(sql, /new\.confidence_score := 100/);
  assert.match(sql, /new\.inspection_decision_source := 'protocol_pre_scan'/);
  assert.match(sql, /expired_meat_inspection_certificate/);
  assert.match(sql, /new\.regulatory_compliance := false/);
  assert.match(sql, /before insert or update/);
});
```

- [ ] **Step 2: Run the migration test to verify it fails**

```powershell
npx tsx --test backend/tests/unit/infrastructure/expired-certificate-migration.unit.test.ts
```

Expected: FAIL because the migration file does not exist.

- [ ] **Step 3: Implement the migration**

Create the trigger function with UTC date semantics:

```sql
CREATE OR REPLACE FUNCTION public.enforce_expired_certificate_safety()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  expired_reason CONSTANT TEXT := 'expired_meat_inspection_certificate';
BEGIN
  IF NEW.meat_expiry_date IS NOT NULL
     AND NEW.meat_expiry_date < (timezone('UTC', now()))::date
  THEN
    NEW.classification := 'spoiled';
    NEW.manual_classification := 'spoiled';
    NEW.confidence_score := 100;
    NEW.inspection_decision_source := 'protocol_pre_scan';
    NEW.protocol_spoiled_reason := expired_reason;
    NEW.regulatory_compliance := FALSE;
    NEW.flagged_deviations := CASE
      WHEN NEW.flagged_deviations IS NULL THEN ARRAY[expired_reason]::TEXT[]
      WHEN expired_reason = ANY(NEW.flagged_deviations) THEN NEW.flagged_deviations
      ELSE array_append(NEW.flagged_deviations, expired_reason)
    END;
    NEW.explanation := 'Automatically classified as spoiled because the meat inspection certificate is expired. AI analysis was skipped.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inspections_enforce_expired_certificate_safety ON public.inspections;
CREATE TRIGGER inspections_enforce_expired_certificate_safety
BEFORE INSERT OR UPDATE ON public.inspections
FOR EACH ROW
EXECUTE FUNCTION public.enforce_expired_certificate_safety();
```

Use `CREATE OR REPLACE FUNCTION` and `DROP TRIGGER IF EXISTS` so the migration is safely repeatable in the repository's Supabase workflow. Do not backfill historical rows.

- [ ] **Step 4: Run the migration test to verify it passes**

```powershell
npx tsx --test backend/tests/unit/infrastructure/expired-certificate-migration.unit.test.ts backend/tests/unit/infrastructure/inspection-result-dispute-migration.unit.test.ts
```

Expected: PASS for the new trigger contract and existing migration contract.

- [ ] **Step 5: Commit the database enforcement**

```powershell
git add backend/supabase/migrations/20261014100000_enforce_expired_certificate_safety.sql backend/tests/unit/infrastructure/expired-certificate-migration.unit.test.ts
git commit -m "feat: enforce expired certificate safety in database"
```

## Task 6: Update the user manual and protocol documentation

**Files:**
- Modify: `documentation/manual-content.md`

**Interfaces:**
- Consumes: the implemented UI/API/database behavior.
- Produces: operator-facing documentation consistent with the safety invariant.

- [ ] **Step 1: Run the documentation check before the edit**

```powershell
npm run test:documentation
```

Expected: the existing documentation validator passes before this documentation-only edit.

- [ ] **Step 2: Update the manual**

Immediately after the existing `Meat Expiry Date` instruction in `documentation/manual-content.md`, add:

```md
If the certificate date is earlier than the current date, the certificate is expired. MeatLens automatically records any captured sample as **Spoiled** through the pre-scan safety protocol, sets regulatory compliance to **false**, and skips AI analysis. The expiry date itself remains valid through that date. Do not enter a replacement date to bypass an expired certificate; follow the organization's escalation procedure.
```

Update the following protocol paragraph so it explicitly includes an expired certificate as a protocol failure alongside a `No` safety answer.

- [ ] **Step 3: Run the documentation check after the edit**

```powershell
npm run test:documentation
```

Expected: PASS with the manual remaining renderable and internally consistent.

- [ ] **Step 4: Commit the documentation change**

```powershell
git add documentation/manual-content.md
git commit -m "docs: document expired certificate safety handling"
```


## Task 7: Run full verification and review the safety invariant

**Files:**
- Verify: all files changed by Tasks 1-6
- Preserve: `frontend/src/widgets/legal/terms-and-conditions-dialog.tsx`

**Interfaces:**
- Consumes: all implemented client, backend, database, and documentation changes.
- Produces: fresh local evidence for every CI-relevant gate; no completion claim without exit-code evidence.

- [ ] **Step 1: Inspect the final diff and working tree**

```powershell
git status --short --branch
git diff --check origin/master..HEAD
git diff --stat origin/master..HEAD
```

Confirm that the legal-dialog working-tree modification is still unstaged and that every changed file belongs to this feature.

- [ ] **Step 2: Run targeted frontend and backend tests**

```powershell
npx tsx --test frontend/tests/unit/domain/inspections/inspection-pre-scan.unit.test.ts frontend/tests/unit/features/inspection-submission/inspection-mutation.unit.test.ts frontend/tests/unit/features/inspection-workspace/pending-scan.unit.test.ts frontend/tests/component/inspection-workspace/inspect-pre-scan-section.component.test.tsx
npx tsx --test backend/tests/unit/inspections/pre-scan.unit.test.ts backend/tests/unit/infrastructure/expired-certificate-migration.unit.test.ts
```

Expected: both commands exit 0 with no failing tests.

- [ ] **Step 3: Run project lint, typecheck, architecture, and build checks**

```powershell
npm run lint
npm run typecheck
npm run test:architecture
npm run build
```

Expected: all commands exit 0. Do not suppress or weaken any existing lane.

- [ ] **Step 4: Run the complete repository CI-equivalent gate**

```powershell
npm run test:ci
```

Expected: exit 0 with the existing frontend shards, backend unit/integration/architecture tests, contract tests, script tests, and documentation validation all passing. If the command exceeds the repository's lane limit or fails because of an environmental dependency, record the exact command, exit code, and first failing output rather than claiming completion.

- [ ] **Step 5: Review the invariant manually in the final diff**

Verify all of the following are true in code and migration text:

```text
past expiry date -> protocol_pre_scan -> spoiled -> confidence 100
past expiry date -> expiry reason retained -> compliance false
today expiry date -> no expiry override
future expiry date -> no expiry override
null expiry date -> no expiry override
expired queued scan -> no offline AI inference during replay
database direct insert/update -> trigger enforces the same fields
```

- [ ] **Step 6: Commit verification-only adjustments if needed**

If verification reveals a defect, return to the relevant task's TDD cycle, add a regression test first, and commit the corrected logical change. Do not amend or rewrite the approved spec commit.

## Plan self-review

- Spec coverage: the plan covers frontend date semantics, online/offline decision derivation, UI warning, backend enforcement, database trigger enforcement, documentation, and targeted/full CI verification.
- Plan completeness: no unfinished markers or unspecified implementation steps remain; staging instructions name the exact feature files and preserve unrelated changes.
- Type consistency: frontend builders consume the Task 1 helpers; offline sync accepts the reason-aware result builder; backend service consumes the backend helper; migration tests use the exact migration filename and SQL identifiers defined in Task 5.
- Scope: no new classification, no historical backfill, and no unrelated refactor is included.
