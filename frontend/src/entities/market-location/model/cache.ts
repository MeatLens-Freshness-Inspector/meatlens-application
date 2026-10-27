import type { MarketLocation } from "../api/market-location-client";

export const MARKET_LOCATIONS_STORAGE_KEY = "meatlens.market-locations.v1";

type MarketLocationStorage = Pick<Storage, "getItem" | "setItem">;

function isMarketLocation(value: unknown): value is MarketLocation {
  if (!value || typeof value !== "object") return false;

  const row = value as Record<string, unknown>;
  const hasNullableNumber = (candidate: unknown) => (
    candidate === null || (typeof candidate === "number" && Number.isFinite(candidate))
  );

  return typeof row.id === "string"
    && typeof row.name === "string"
    && hasNullableNumber(row.latitude)
    && hasNullableNumber(row.longitude)
    && typeof row.created_at === "string"
    && typeof row.updated_at === "string";
}

export function readCachedMarketLocations(
  storage: MarketLocationStorage | null | undefined,
): MarketLocation[] {
  if (!storage) return [];

  try {
    const raw = storage.getItem(MARKET_LOCATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isMarketLocation) : [];
  } catch {
    return [];
  }
}

export function writeCachedMarketLocations(
  storage: MarketLocationStorage | null | undefined,
  locations: readonly MarketLocation[],
): void {
  if (!storage) return;

  try {
    storage.setItem(MARKET_LOCATIONS_STORAGE_KEY, JSON.stringify(locations));
  } catch {
    // Storage is an optional offline enhancement and must never block capture.
  }
}
