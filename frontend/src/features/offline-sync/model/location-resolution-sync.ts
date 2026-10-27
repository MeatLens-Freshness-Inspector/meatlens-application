import {
  resolveMarketLocation,
  type MarketLocation,
} from "@/entities/market-location";

export type QueuedLocationInput = {
  location: string | null | undefined;
  locationLatitude: number | null | undefined;
  locationLongitude: number | null | undefined;
};

export function resolveQueuedInspectionLocation(
  input: QueuedLocationInput,
  marketLocations: readonly MarketLocation[],
): string | null {
  const hasCoordinates = input.locationLatitude != null && input.locationLongitude != null;
  const automatic = resolveMarketLocation(
    hasCoordinates
      ? { latitude: input.locationLatitude as number, longitude: input.locationLongitude as number }
      : null,
    marketLocations,
  );
  if (automatic.kind === "auto") return automatic.market.name;

  const manual = input.location?.trim();
  if (!manual) return null;

  return marketLocations.find((market) => (
    market.name.localeCompare(manual, undefined, { sensitivity: "accent" }) === 0
  ))?.name ?? null;
}
