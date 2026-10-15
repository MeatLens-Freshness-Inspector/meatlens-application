# Inspect Tutorial Flow Design

## Goal

Keep the first-run and profile replay Inspect tutorial aligned with the simplified field workflow used by the live Inspect page. The tutorial should teach a meat inspector what to tap and what to expect without introducing an extra analysis action that no longer exists.

## Scope

- Preserve the current tutorial shell and step order through market selection, pre-scan, capture, result review, save, and post-save dispute.
- Remove the standalone `inspect-analysis` tutorial step and its simulated `Analyze Sample` tap.
- Make the capture step explain that an accepted capture starts analysis automatically.
- Show the current pre-scan fields in the mock scene, including Light Color Correct and Area Clean.
- Show the pre-save `Dispute result` affordance as disabled with the save-first explanation, then show the enabled dispute action after the simulated record is saved.
- Keep all changes in the frontend tutorial model and mock scene; do not change backend APIs, persistence, or database schemas.

## Design

The tutorial model will represent the user journey rather than the former button mechanics. The Inspect steps will be `inspect-scope`, `inspect-market`, `inspect-prescan`, `inspect-capture`, `inspect-save`, and `inspect-dispute`. The capture step will render the captured sample plus an automatic-analysis status, the save step will render the completed analysis and the save-first dispute state, and the dispute step will render the enabled action after the simulated record is saved.

The mock scene will use the existing fixture data and hotspot system. The pre-scan mock will list all current checklist concepts. Before saving, the dispute block will communicate that the result must be saved first; after saving, the scene will expose the dispute action in the same part of the workflow as the live page.

## Verification

- Add component assertions that the Inspect tutorial has no standalone analysis step.
- Assert that the capture scene teaches automatic analysis and that the current checklist/dispute states are represented.
- Run the focused tutorial component tests, frontend typecheck, lint, and production build.
