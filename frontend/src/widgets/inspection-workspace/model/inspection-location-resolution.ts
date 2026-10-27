import {
  resolveMarketLocation,
  type MarketLocation,
} from "@/entities/market-location";
import type { CoordinateCaptureStatus, InspectionCoordinates } from "@/entities/inspection";

export type InspectionLocationResolution = "pending" | "automatic" | "manual";

export type InspectionLocationResolutionState = {
  selectedLocation: string;
  locationResolution: Exclude<InspectionLocationResolution, "pending">;
  locationDistanceMeters: number | null;
};

export function shouldWaitForOnlineLocationResolution(input: {
  isOnline: boolean;
  coordinateStatus: CoordinateCaptureStatus;
}): boolean {
  return input.isOnline && input.coordinateStatus === "capturing";
}

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
