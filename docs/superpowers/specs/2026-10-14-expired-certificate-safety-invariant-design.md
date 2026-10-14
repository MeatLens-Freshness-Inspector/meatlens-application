# Expired Meat Inspection Certificate Safety Invariant

## Problem

The pre-scan protocol collects `meat_expiry_date`, which represents the meat inspection certificate's expiration date. The current flow treats only the storage, lighting, and area-clean checks as protocol failures. A certificate date in the past can therefore reach AI analysis or be submitted with a safe classification.

For this safety-critical workflow, an expired certificate must make the captured inspection unsafe regardless of the visual model result or client request contents.

## Decision

An inspection certificate is expired when its date-only value is earlier than the current UTC calendar date. The expiration date itself remains valid through that date. Missing or invalid dates remain validation/checklist concerns and are not interpreted as expired.

Because the existing freshness domain does not have an `expired` classification, an expired certificate is represented as a protocol-driven `spoiled` inspection with the dedicated reason `expired_meat_inspection_certificate`.

The invariant is:

```text
meat_expiry_date < current UTC date
  => classification = spoiled
  => confidence_score = 100
  => inspection_decision_source = protocol_pre_scan
  => protocol_spoiled_reason includes expired_meat_inspection_certificate
  => regulatory_compliance = false
  => AI analysis is not run
```

## Enforcement layers

### Pre-scan domain and client workflow

Add a date-only expiry helper to the pre-scan domain model with an injectable `today` value for deterministic tests. Include certificate expiry in `hasProtocolFailure` and `getInspectionDecisionSource`.

When capture begins, an expired certificate follows the existing protocol-result path: the UI creates a forced spoiled analysis result and does not expose an AI analysis action. The pre-scan card displays a clear warning that the certificate is expired and the capture will be auto-classified as spoiled.

The online mutation builder and offline pending-scan builder must independently derive the same protocol decision from the form, rather than trusting stale decision-source state. This prevents a date change or delayed offline save from losing the invariant.

### Backend API

Normalize the date before applying the safety rule. If an incoming inspection has an expired `meat_expiry_date`, the backend overrides client-provided classification and decision metadata with the invariant outcome before validation and persistence. The API therefore rejects no legitimate capture solely because the client did not precompute the rule; it safely corrects unsafe client values.

The backend must use the same date-only UTC semantics and a testable date provider/helper. A protocol reason supplied for other pre-scan failures remains possible, but the expiry reason must be preserved when certificate expiry is the triggering condition.

### Database

Add a Supabase migration with a `BEFORE INSERT OR UPDATE` trigger on `public.inspections`. For rows whose `meat_expiry_date` is earlier than `CURRENT_DATE`, the trigger forces the classification, confidence, decision source, protocol reason, and regulatory compliance fields to the invariant values. This protects direct database writes and future clients that do not use the current API.

The trigger must not change rows whose expiry date is today or in the future, and must not invent expiry decisions when the date is null.

## Data and UI behavior

- Keep the existing `meat_expiry_date` storage field and date input.
- Add the expiry reason to the existing flagged-deviation/protocol-result path without introducing a new freshness classification.
- Use the existing spoiled badge and history/detail surfaces, while showing the dedicated protocol reason so operators can distinguish certificate expiry from visual spoilage or other checklist failures.
- Keep `regulatory_compliance` false for an expired certificate even if the three existing boolean checks are all true.
- Preserve the existing developer bypass behavior for opening the workflow, but do not allow bypassed submission data to override backend/database enforcement when an expired date is present.

## Testing strategy

Use TDD and deterministic date fixtures.

1. Frontend pre-scan unit tests prove dates before today are expired, today is not expired, future dates are not expired, and expiry joins the protocol failure/decision-source logic.
2. Frontend workflow/payload tests prove expired captures produce a forced spoiled result, skip AI, set compliance false, and preserve the expiry reason in both online and offline payloads.
3. Backend unit tests prove normalization and server-side enforcement override an AI/fresh payload with an expired date, preserve valid/today dates, and enforce protocol invariants.
4. Migration/architecture tests verify the database trigger is present and includes the expiry condition and forced fields.
5. Run the affected frontend/backend unit and architecture lanes, then the complete local CI-equivalent checks required by the repository before completion.

## Documentation

Update the user manual's pre-scan section and any protocol-specific developer documentation to state that an expired certificate automatically produces a protocol-driven spoiled result and that AI analysis is skipped.

## Non-goals

- Do not add a new `expired` freshness classification.
- Do not change the meaning of the existing three boolean pre-scan checks.
- Do not backfill historical rows in this change; the database trigger governs new inserts and updates. A separate migration may be needed if historical records require audit remediation.
