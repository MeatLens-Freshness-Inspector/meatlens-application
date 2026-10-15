# Documentation photo mode — implementation plan

1. Add shared documentation-photo types, authenticated API client, backend
   table/service/controller/routes, and migration.
2. Add separate web IndexedDB and native SQLite queues with focused tests.
3. Add offline-sync draining for documentation photos without analysis.
4. Add the inspect-page mode picker and photo-only save/retake flow while
   preserving the Analyze sample flow.
5. Add documentation photos and queued items to History.
6. Update the inspector tutorial with both choices and the photo-only flow.
7. Run focused frontend/backend tests, typechecks, lint, builds, and the
   relevant CI-equivalent checks before committing/pushing.
