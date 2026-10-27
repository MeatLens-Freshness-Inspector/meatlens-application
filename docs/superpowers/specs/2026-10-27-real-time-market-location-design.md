# Real-Time Market Location Classification

## Goal

Classify an inspection's market from its captured GPS position whenever the
position is within 50 metres of a configured market reference point. If GPS
is unavailable or no configured market is within 50 metres, let the inspector
choose the closest market manually. This fallback is available both online
and offline. The backend verifies the final market during normal saves and
offline synchronization.

## Approved approach

Use a shared location-resolution rule in the frontend and backend, with the
backend as the authority for persisted inspections.

Client-only matching would allow stale or altered offline payloads to be
accepted. Backend-only matching would prevent the capture UI from showing the
detected market immediately. The shared resolver provides immediate feedback
while the backend re-checks every submitted inspection.

## Data model and administration

Extend `market_locations` with nullable `latitude` and `longitude` columns.
Existing seeded markets remain valid records but are marked as not configured
until an administrator supplies a coordinate pair.

The Admin Dashboard Markets tab will allow administrators to create and edit
market coordinates manually:

- latitude must be between `-90` and `90`;
- longitude must be between `-180` and `180`;
- both values are required together for a configured market;
- markets without a complete coordinate pair are ignored by automatic
  classification and visibly marked as not configured.

The market API will return coordinates, validate coordinate pairs on create
and update, and expose an update operation for existing markets. Unknown
market names and malformed coordinate payloads are rejected by the backend.

## Inspection behavior

Before capture, an online inspector is told that the location will be detected
automatically and the market selector is disabled. Offline inspectors can use
the selector immediately because the capture must remain usable without a
server connection.

After capture, the client requests the current GPS position and resolves the
nearest configured market with the shared 50-metre rule:

- If a market is within 50 metres, the nearest market is assigned
  automatically, the distance is shown, and the selector remains locked.
- If GPS permission is denied, the request times out, coordinates are
  unavailable, or no market is within 50 metres, the selector is enabled and
  the inspector must select the closest market.
- If cached market coordinates are available offline, automatic matching may
  still occur; otherwise the offline selector provides the fallback.
- A capture cannot be saved until a market has been resolved.

The queued offline payload preserves the selected market and captured
coordinates. On save or synchronization, the backend re-resolves the
coordinates. A valid nearby market always wins over a stale/manual name. If
there is no nearby match, the backend accepts only a valid configured manual
market selection.

## Location resolution rule

Use the Haversine distance between the inspection coordinates and each
configured market reference point. A distance of exactly 50 metres is
considered inside the boundary. If more than one market qualifies, select the
closest one; resolve exact-distance ties deterministically by market name and
then market id.

The resolver must handle missing coordinates, incomplete market configuration,
invalid coordinate values, and an empty market list without throwing from the
capture UI. Invalid submitted values must still produce a clear backend
validation error.

## Error handling and security

- GPS failure and no-match conditions are normal fallback states, not fatal
  errors.
- The frontend displays whether the market was auto-detected or manually
  selected.
- Missing manual selection blocks save with an actionable message.
- The backend validates coordinate ranges and requires a configured market
  name for manual fallback.
- The backend's canonical market resolution is applied before persistence,
  including for records replayed from the offline queue.
- Existing inspection coordinate fields remain the source of the captured
  position; no location data is trusted solely because it came from the UI.

## Testing and verification

Add coverage for:

- Haversine boundary behavior, nearest-market selection, deterministic ties,
  and invalid/missing coordinates;
- market create/update validation and API payloads;
- Admin Dashboard coordinate editing and configured/unconfigured states;
- online auto-detection, no-match fallback, GPS failure fallback, and selector
  locking;
- offline queue preservation and synchronization override/preservation rules;
- backend authority when a submitted manual market conflicts with a valid
  nearby coordinate;
- API contracts, documentation, lint, typecheck, build, and the relevant CI
  test lanes.

## Scope boundaries

This change does not add a map provider, background continuous tracking, or a
new market-management role. GPS is sampled as part of the existing inspection
capture flow, and administrators enter reference coordinates through the
existing Markets tab.
