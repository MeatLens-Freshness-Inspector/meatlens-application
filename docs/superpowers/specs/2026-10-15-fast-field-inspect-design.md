# Fast Field Inspect Design

## Summary

Streamline the inspector's Inspect page for fast, repeated use in Ikot Palengke. The page should guide a non-technical meat inspector through one obvious mobile workflow: complete the required safety checks, open the phone camera, capture a sample, and receive the analysis without an extra confirmation tap. The existing food-safety rules, offline behavior, inspection payload, and save semantics remain intact.

This is a frontend-only usability and performance change. It does not add or change backend endpoints, database columns, migrations, or server-side behavior.

## Goals

- Reduce time and taps from arriving on `/inspect` to a completed inspection.
- Make the next action obvious for older or non-technical phone users.
- Keep all required pre-scan safety answers and their current decision rules.
- Start analysis automatically after an accepted camera image is returned.
- Keep the retake path available when the image quality check fails or the result requires another sample.
- Make repeated inspections at the same market location faster without requiring a repeated location choice.
- Keep the first mobile viewport focused on the active inspection task.
- Prevent duplicate model warm-up work when the app shell and Inspect page initialize close together.

## Non-Goals

- Changing classification, confidence, protocol, or auto-save rules.
- Moving safety checks after capture or allowing capture before the checklist is complete.
- Changing backend APIs, database schema, Supabase migrations, or offline queue contracts.
- Removing the legal scope reminder; it may move below the active workflow or become a secondary disclosure.
- Adding a second workflow mode such as `Quick Inspect` versus `Detailed Inspect`.
- Replacing the phone's native camera confirmation UI. The app can remove its own duplicate confirmation after the camera returns.

## Existing Workflow And Friction

The current Inspect page presents several large sections before the operator reaches the capture action:

1. Legal scope reminder.
2. Status hero with location, capture, analysis, and confidence cards.
3. Full pre-scan checklist.
4. Market-location selector inside the capture station.
5. Camera entrypoint.
6. Photo capture or native camera return.
7. App-level `Analyze Sample` confirmation.
8. Analysis output and save/new-scan actions.

The current code already warms the model during app boot, selects model readiness on the Inspect page, captures GPS opportunistically, and auto-saves results that meet the existing confidence rule. The redesign should preserve these behaviors while removing unnecessary operator decisions and avoiding a second model-load request for the same active model.

## Approved Product Rules

- The pre-scan safety protocol remains required before the camera can open for ordinary inspector sessions.
- A failed safety answer continues to produce a protocol-spoiled result and must not run AI.
- Developer bypass remains available only through the existing unlocked developer path.
- The selected market location should be remembered locally for the signed-in inspector and reused while it remains a valid configured location.
- The inspector must have a visible, easy-to-find way to change the remembered market location.
- After an accepted camera image is available, the app starts the existing inspection analysis automatically.
- The app must not ask the operator to tap a second app-level `Use Photo`, `Confirm`, or equivalent action after returning from the phone camera.
- A failed image-quality check must stop automatic analysis and present a clear `Retake` action.
- A result that is already saved must present `New Scan` as the primary next action.
- No product rule may depend on network availability; online and offline flows retain their current semantics.

## Mobile-First Page Structure

The active workflow should be the first meaningful content on the page:

1. Compact Inspect header with the current market location and a `Change location` action.
2. Compact `Before you scan` safety checklist.
3. Capture station with one primary `Open Camera` action.
4. Analysis result and next-step action after capture.
5. Secondary legal scope reminder and optional detailed status information.

On mobile, the current four-card status hero must not occupy the critical path before the checklist and camera. It may be represented by a compact status line or rendered after the active workflow. On larger screens, the existing status information can remain visible as supporting context if it does not push the capture task below the first usable viewport.

The scope reminder remains accessible and readable, but it should not compete visually with the next required inspection action.

## Pre-Scan Checklist

The checklist keeps the existing fields and validation:

- Stall number.
- Meat inspection certificate proof.
- Meat expiry date.
- Storage correct: Yes/No.
- Light color correct: Yes/No.
- What color: required only when light color is No.
- Area clean: Yes/No.

The presentation changes to reduce scanning and scrolling:

- Use a short heading such as `Before you scan` and a plain-language explanation.
- Keep touch targets at least the current comfortable size.
- Use the existing large Yes/No controls, with the selected state obvious at a glance.
- Keep conditional fields hidden until needed.
- Place the checklist completion state immediately near the camera action.
- Do not add new fields or require a separate submit button for the checklist.

The checklist is still a gate. No layout optimization may make an incomplete checklist appear actionable.

## Location Memory

Remember the last selected configured market location in browser/device storage scoped to the signed-in inspector. When the Inspect page loads:

- Use the remembered value if it exists in the current market-location list.
- Fall back to the current configured default when the remembered value is missing or invalid.
- Continue loading the server-configured location list as today.
- Show the current location in the compact header and capture station.
- Make `Change location` open the existing selector without hiding or rewriting the selected value.

Location memory is a frontend convenience only. The selected location still travels through the existing inspection payload when an inspection is saved.

## Automatic Capture-To-Analysis Flow

### Passing checklist and acceptable image

1. Inspector completes the checklist.
2. Inspector taps `Open Camera`.
3. The phone camera opens through the existing camera input.
4. Inspector takes the photo and returns to MeatLens.
5. The app performs the existing image-quality check.
6. If the image can proceed, the app commits the capture to the existing workspace state and starts the existing offline analysis automatically.
7. The UI shows a clear progress state such as `Analyzing sample...`.
8. The existing auto-save rule applies after analysis. Lower-confidence results keep the existing manual-save behavior.

The app may show the captured image while analysis runs, but the operator must not need to tap an additional app-level analysis confirmation.

### Failed image quality

If the existing image-quality check cannot proceed:

- Do not call the inspection capture callback.
- Do not run analysis.
- Show the existing quality explanation in plain language.
- Present `Retake` as the primary action.

Warnings that are allowed to proceed should continue through the automatic analysis path.

### Protocol-failed checklist

If a checklist answer triggers the existing protocol-spoiled path:

- Capture remains allowed after checklist completion.
- AI analysis remains skipped.
- The existing forced spoiled result and immediate save behavior remain unchanged.
- The UI should not display a model-waiting or analysis-progress message for this path.

### Retake and reset

- `Retake` must reset only the current capture attempt and must not clear the completed checklist or remembered location.
- `New Scan` must clear the current inspection result and capture state while keeping the remembered location.
- `New Scan` may clear the checklist answers only if the existing product flow intentionally starts a fresh protocol; the implementation must make this explicit in tests and copy. The recommended behavior is to retain the market location but reset inspection-specific fields.

## Model Readiness And Perceived Performance

- Keep model warm-up at application boot so the Inspect page can benefit from it.
- Ensure the app shell and Inspect workspace share one in-flight load/readiness state rather than launching duplicate active-model loads.
- Keep the technical model name out of the primary inspector-facing action. If the model is not ready, show a plain message such as `Getting the scan ready...` and keep the action disabled until it is safe to run.
- Preserve the existing offline rule that analysis remains available without network access when the local runtime is ready.
- Do not trade away model correctness, preprocessing, ROI behavior, or quality checks for perceived speed.

## Results And Next Action

The first result state should prioritize the decision an inspector needs:

- Freshness classification.
- Confidence or a simple confidence label.
- Existing recommendation/explanation.
- A clear saved/queued state when applicable.
- `New Scan` as the primary action after a successful save or queue.

Detailed metrics and secondary status information may remain available below the primary result. Existing dispute and manual-save actions remain available when their current rules require them.

## Accessibility And Usability Requirements

- Use plain language appropriate for meat inspectors who are comfortable with phones but not technical systems.
- Preserve accessible labels and screen-reader names for all inputs and buttons.
- Keep touch targets at least 44px where practical.
- Do not communicate state by color alone.
- Keep focus behavior predictable when the camera returns, analysis starts, quality fails, or a result appears.
- Avoid technical copy such as `MobileNetV3` in the primary operator path.
- Keep primary actions visually distinct from secondary links and developer-only controls.

## Data And Backend Safety

This change must not modify:

- Backend source files.
- Database migrations or schema.
- API request/response contracts.
- Offline queue payload shape.
- Inspection result or protocol persistence behavior.

Allowed client-side storage is limited to the selected market location, scoped so one signed-in inspector does not accidentally inherit another inspector's value. No inspection data or image may be placed in the location-memory entry.

## Verification Strategy

### Unit and component coverage

- Location memory reads a valid remembered location and ignores an invalid one.
- Location memory is scoped to the signed-in inspector.
- Incomplete checklists keep camera entrypoints disabled.
- Acceptable camera captures trigger the capture callback without an app-level confirmation action.
- Failed quality checks do not trigger analysis and show retake guidance.
- Protocol-failed captures still bypass AI and preserve the forced spoiled path.
- Reset keeps the remembered location and follows the selected checklist-reset rule.
- Model warm-up does not create duplicate active-model loads.

### End-to-end coverage

- A standard inspector can complete the flow on a mobile viewport with one camera-entry tap and no second app-level confirmation.
- A warning-quality image proceeds automatically.
- A failed-quality image stops and can be retaken.
- A protocol-failed checklist still saves without AI.
- A repeat inspection reuses the last market location and offers a visible change action.
- A saved result makes `New Scan` the obvious next action.
- Existing offline analysis and queue behavior remains covered.

### Required local gate

After implementation, run the smallest affected frontend checks first, then the repository's complete CI-equivalent gate:

```text
npm run test:ci
npm run build:frontend
```

No test may be skipped, focused, weakened, or made advisory to accommodate this work.

## Expected Commit Structure

The implementation will use at least four coherent commits:

1. Add tests and flow contracts for the fast capture path and location memory.
2. Implement the mobile-first Inspect page hierarchy and compact checklist/location presentation.
3. Implement automatic accepted-capture analysis and model warm-up de-duplication.
4. Finish result/reset UX, accessibility copy, documentation, and full verification updates.

Each commit should leave the affected tests passing where practical. Backend and database files must remain unchanged throughout the implementation.
