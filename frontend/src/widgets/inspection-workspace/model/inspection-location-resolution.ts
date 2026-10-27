import {
  resolveMarketLocation,
  type MarketLocation,
} from "@/entities/market-location";
import type { InspectionCoordinates } from "@/entities/inspection";

export type InspectionLocationResolution = "pending" | "automatic" | "manual";

export type InspectionLocationResolutionState = {
  selectedLocation: string;
  locationResolution: Exclude<InspectionLocationResolution, "pending">;
  locationDistanceMeters: number | null;
};

export function resolveInspectionLocationState(input: {
  coordinates: InspectionCoordinates | null;
  marketLocations: readonly MarketLocation[];
  selectedLocation: string;
  isOnline: boolean;
}): InspectionLocationResolutionState {
  const result = resolveMarketLocation(input.coordinates, input.marketLocations);
  if (result.kind === "auto") {
    return {
      selectedLocation: result.market.name,
      locationResolution: "automatic",
      locationDistanceMeters: result.distanceMeters,
    };
  }

  return {
    selectedLocation: input.isOnline ? "" : input.selectedLocation,
    locationResolution: "manual",
    locationDistanceMeters: null,
  };
}
