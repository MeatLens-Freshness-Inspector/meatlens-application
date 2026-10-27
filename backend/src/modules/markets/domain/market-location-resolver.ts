export type MarketCoordinatePair = {
  latitude: number;
  longitude: number;
};

export type MarketLocationCandidate = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
};

export type MarketLocationMatch = {
  market: MarketLocationCandidate;
  distanceMeters: number;
};

const EARTH_RADIUS_METERS = 6_371_000;

function parseCoordinate(value: unknown, fieldName: "latitude" | "longitude"): number {
  if (value === undefined || value === null || value === "") {
    throw new Error(`${fieldName} is required`);
  }

  const parsed = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : Number.NaN;
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  const minimum = fieldName === "latitude" ? -90 : -180;
  const maximum = fieldName === "latitude" ? 90 : 180;
  if (parsed < minimum || parsed > maximum) {
    throw new Error(`${fieldName} must be within ${minimum} and ${maximum}`);
  }

  return parsed;
}

export function normalizeMarketCoordinates(input: {
  latitude: unknown;
  longitude: unknown;
}): MarketCoordinatePair {
  return {
    latitude: parseCoordinate(input.latitude, "latitude"),
    longitude: parseCoordinate(input.longitude, "longitude"),
  };
}

export function normalizeOptionalMarketCoordinates(input: {
  latitude: unknown;
  longitude: unknown;
}): MarketCoordinatePair | null {
  const latitudeMissing = input.latitude === undefined || input.latitude === null || input.latitude === "";
  const longitudeMissing = input.longitude === undefined || input.longitude === null || input.longitude === "";

  if (latitudeMissing && longitudeMissing) return null;
  return normalizeMarketCoordinates(input);
}

function isConfiguredMarket(
  market: MarketLocationCandidate,
): market is MarketLocationCandidate & MarketCoordinatePair {
  return market.latitude != null && market.longitude != null;
}

function distanceMeters(left: MarketCoordinatePair, right: MarketCoordinatePair): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(right.latitude - left.latitude);
  const longitudeDelta = toRadians(right.longitude - left.longitude);
  const leftLatitude = toRadians(left.latitude);
  const rightLatitude = toRadians(right.latitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(leftLatitude)
    * Math.cos(rightLatitude)
    * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function resolveNearestMarketLocation(
  coordinates: MarketCoordinatePair | null | undefined,
  locations: readonly MarketLocationCandidate[],
  radiusMeters = 50,
): MarketLocationMatch | null {
  if (!coordinates) return null;

  const matches = locations
    .filter(isConfiguredMarket)
    .map((market) => ({
      market,
      distanceMeters: distanceMeters(coordinates, {
        latitude: market.latitude,
        longitude: market.longitude,
      }),
    }))
    .filter((match) => match.distanceMeters <= radiusMeters)
    .sort((left, right) => (
      left.distanceMeters - right.distanceMeters
      || left.market.name.localeCompare(right.market.name)
      || left.market.id.localeCompare(right.market.id)
    ));

  return matches[0] ?? null;
}
