# Inspect page progressive disclosure

## Context

The inspector page currently presents the entire workflow at once: market context, every pre-scan field, capture mode, camera controls, an empty analysis panel, save actions, scope guidance, and dispute controls. For older field users working quickly on phones, this creates too many competing controls before the next action is clear.

## Design

Keep the same inspection workflow and data, but reveal information in the order it becomes useful:

1. Confirm the current market and complete the required pre-scan information.
2. Open the camera and capture the sample.
3. Review the result when it exists.
4. Save or queue the record, then optionally dispute a saved result.

### Pre-scan protocol

- Keep all required fields and safety answers unchanged.
- Keep the section expanded while the checklist is incomplete so the user can finish it.
- Collapse the section automatically after it becomes complete.
- Provide an obvious in-place control to review or edit the completed checklist.

### Capture area

- Keep the market selector and coordinate status available.
- Remove the duplicate `Saved to report` line because the current market is already shown in the page header and selector.
- Keep `Analyze sample` as the default workflow and retain `Take photo only` as the secondary mode.
- Keep camera hardware controls, including flash and supported manual controls, behind a collapsed `Camera settings` control while the camera is active.

### Result and follow-up areas

- Do not render the empty `Analysis Output` card before a result exists; the camera and progress status provide the relevant initial state.
- Render the existing analysis output unchanged once a result exists.
- Keep save/reset actions unchanged and contextual to a captured result or documentation photo.
- Render the dispute section only after an inspection has a saved inspection ID. Preserve the existing dispute form and submitted state.

### Scope reminder

- Keep the reminder in its current position on the inspect page.
- Collapse its bullets and reference link by default.
- Provide an accessible in-place toggle that exposes the existing content without changing its copy or destination.

## Scope and non-goals

This is a frontend presentation/state change only. It does not change inspection payloads, safety validation, analysis, image upload, offline queueing, synchronization, backend routes, database schema, or PDF output. The admin dashboard is out of scope.

## Verification

Add focused component coverage for the collapsed/default states, completed pre-scan disclosure, camera settings disclosure, and scope reminder toggle. Run the relevant offline/capture E2E journeys at mobile width to confirm the critical capture and save flow remains available, then run frontend/backend typecheck and lint. No full-suite rerun is required for this UI-only change unless a focused gate exposes a regression.
