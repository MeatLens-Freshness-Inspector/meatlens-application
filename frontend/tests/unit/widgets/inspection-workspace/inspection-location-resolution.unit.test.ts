import assert from "node:assert/strict";
import test from "node:test";

import { resolveInspectionLocationState } from "../../../../src/widgets/inspection-workspace/model/inspection-location-resolution";

const market = {
  id: "m1",
  name: "Old Market",
  latitude: 14,
  longitude: 120,
  created_at: "now",
  updated_at: "now",
};

test("automatic resolution replaces a stale selection and reports distance", () => {
  const state = resolveInspectionLocationState({
    coordinates: { latitude: 14, longitude: 120.0001 },
    marketLocations: [market],
    selectedLocation: "New Market",
    isOnline: true,
  });

  assert.equal(state.selectedLocation, "Old Market");
  assert.equal(state.locationResolution, "automatic");
  assert.equal(typeof state.locationDistanceMeters, "number");
});

test("unmatched online GPS clears the selection for manual fallback", () => {
  const state = resolveInspectionLocationState({
    coordinates: { latitude: 10, longitude: 110 },
    marketLocations: [],
    selectedLocation: "Old Market",
    isOnline: true,
  });

  assert.equal(state.selectedLocation, "");
  assert.equal(state.locationResolution, "manual");
  assert.equal(state.locationDistanceMeters, null);
});

test("offline fallback preserves the remembered manual selection", () => {
  const state = resolveInspectionLocationState({
    coordinates: null,
    marketLocations: [],
    selectedLocation: "Old Market",
    isOnline: false,
  });

  assert.equal(state.selectedLocation, "Old Market");
  assert.equal(state.locationResolution, "manual");
});
