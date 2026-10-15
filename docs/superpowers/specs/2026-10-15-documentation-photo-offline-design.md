# Documentation photo mode — offline-first design

## Goal

Give inspectors a plain camera flow for documenting a stall or display without
asking them to complete the inspection checklist or wait for an AI result.

## User flow

1. The inspect page presents two large choices: **Analyze sample** and
   **Take photo only**.
2. **Analyze sample** keeps the existing pre-scan, camera, model, save, and
   dispute flow unchanged.
3. **Take photo only** opens the camera without the checklist, model guide,
   analysis, or result card. The inspector can retake or save the photo.
4. Saving while offline writes the image and metadata to a dedicated durable
   documentation-photo queue. The user sees that it is saved on the phone.
5. When the device is online and authenticated, the queue uploads the image and
   creates an idempotent documentation-photo record. It is removed locally only
   after both operations succeed.
6. History shows saved documentation photos and clearly labels photos waiting
   to sync. The existing inspection history remains separate.

## Data boundaries

- Documentation photos have their own backend table and API endpoint.
- They reuse the existing authenticated image upload storage path, but do not
  create an `inspections` row and do not call the analysis model.
- The browser uses a separate IndexedDB object store; native builds use a new
  SQLite table/migration.
- `client_submission_id` is unique so reconnect retries are safe.
- Location is best-effort and never blocks capture or save.

## Out of scope

- No changes to admin dashboard behavior.
- No changes to the Analyze sample model, checklist, or dispute flow.
- No server-side model processing for documentation photos.
