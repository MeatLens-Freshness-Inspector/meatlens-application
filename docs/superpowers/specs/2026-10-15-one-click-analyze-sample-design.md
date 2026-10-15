# One-click Analyze Sample

## Context

The inspection flow currently requires two actions after an image is selected:
the user clicks `Use Photo` to confirm the capture, then clicks a separate
`Analyze Sample` button. This adds an unnecessary state transition for users
who are not comfortable with technology.

## Design

The captured-image confirmation action becomes `Analyze Sample` for every
image source supported by the capture surface: in-app camera captures, phone
camera/file input, and developer-enabled file uploads. The button keeps the
existing quality rules and `Retake` action.

Clicking the single action will submit the captured payload and start the
existing analysis workflow using that payload directly. The implementation
must not depend on a React state update followed by a second user click.

Pre-scan safety behavior remains unchanged. A failed quality check keeps the
action disabled, a warning permits proceeding, and a protocol failure produces
the existing immediate safety result without invoking model analysis.

## Verification

- Update capture unit/integration expectations from `Use Photo` to
  `Analyze Sample`.
- Update inspector and camera-quality journeys to use one click and assert
  analysis/save behavior remains correct.
- Run the affected frontend unit/integration tests, lint, typecheck, build,
  and the repository CI-equivalent checks applicable to the changed files.
