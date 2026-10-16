# Documentation photo narrow-card layout

## Context

Inspection history cards now keep their primary action inside the card at narrow mobile widths. Documentation-photo cards still use the previous non-wrapping metrics row, so their `View details` button can extend beyond the card around 300–350px wide.

## Design

Make the documentation-photo card use the same responsive action structure as the inspection card:

- Allow the mobile metrics row to wrap and constrain it with `min-w-0`.
- Put `View details` on its own full-width row below the mobile metrics.
- Restore the existing compact inline action on `sm` and wider screens.
- Preserve the current documentation-specific content, disabled state for unavailable images, detail dialog, and image preview behavior.

This keeps the two history card types visually and behaviorally consistent without extracting a shared component or changing the desktop layout.

## Scope and non-goals

Only the documentation-photo card styles and its frontend regression coverage change. No backend, database, API, offline-sync, or PDF behavior changes are required.

## Verification

Add a browser regression that renders a documentation-photo card at 300px, 340px, and 350px viewport widths and verifies that the `View details` action remains within the card bounds. Run the existing documentation-photo unit tests, the focused history journey tests, typecheck, and lint.
