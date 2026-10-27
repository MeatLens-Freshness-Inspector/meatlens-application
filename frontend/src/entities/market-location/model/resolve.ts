import type { MarketLocation } from "../api/market-location-client";

export type CoordinatePoint = {
  latitude: number;
  longitude: number;
};

export type MarketLocationResolution =
  | {
      kind: "auto";
      market: MarketLocation;
      distanceMeters: number;
    }
  | {
      kind: "unresolved";
      reason: "missing_coordinates" | "no_match";
    };

const EARTH_RADIUS_METERS = 6_371_000;

function isValidCoordinatePoint(point: CoordinatePoint): boolean {
  return Number.isFinite(point.latitude)
    && Number.isFinite(point.longitude)
    && point.latitude >= -90
    && point.latitude <= 90
    && point.longitude >= -180
    && point.longitude <= 180;
}

function distanceMeters(left: CoordinatePoint, right: CoordinatePoint): number {
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

export function resolveMarketLocation(
  coordinates: CoordinatePoint | null | undefined,
  locations: readonly MarketLocation[],
  radiusMeters = 50,
): MarketLocationResolution {
  if (!coordinates || !isValidCoordinatePoint(coordinates)) {
    return {
      kind: "unresolved",
      reason: "missing_coordinates",
    };
  }

  const matches = locations
    .filter((location) => (
      location.latitude != null
      && location.longitude != null
      && isValidCoordinatePoint({
        latitude: location.latitude,
        longitude: location.longitude,
      })
    ))
    .map((market) => ({
      market,
      distanceMeters: distanceMeters(coordinates, {
        latitude: market.latitude as number,
        longitude: market.longitude as number,
      }),
    }))
    .filter((match) => match.distanceMeters <= radiusMeters)
    .sort((left, right) => (
      left.distanceMeters - right.distanceMeters
      || left.market.name.localeCompare(right.market.name)
      || left.market.id.localeCompare(right.market.id)
    ));

  const match = matches[0];
  return match
    ? { kind: "auto", market: match.market, distanceMeters: match.distanceMeters }
    : { kind: "unresolved", reason: "no_match" };
}
