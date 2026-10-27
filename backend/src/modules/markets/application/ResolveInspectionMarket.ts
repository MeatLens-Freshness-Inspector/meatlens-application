import {
  normalizeOptionalMarketCoordinates,
  resolveNearestMarketLocation,
  type MarketLocationCandidate,
} from "../domain/market-location-resolver";

export type InspectionMarketInput = {
  location: unknown;
  location_latitude: unknown;
  location_longitude: unknown;
};

export interface InspectionMarketReader {
  getAll(): Promise<MarketLocationCandidate[]>;
}

export class InvalidInspectionMarketLocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInspectionMarketLocationError";
  }
}

export class ResolveInspectionMarket {
  constructor(private readonly reader: InspectionMarketReader) {}

  async execute(input: InspectionMarketInput): Promise<string> {
    let coordinates;
    try {
      coordinates = normalizeOptionalMarketCoordinates({
        latitude: input.location_latitude,
        longitude: input.location_longitude,
      });
    } catch (error) {
      throw new InvalidInspectionMarketLocationError(
        error instanceof Error ? error.message : "Invalid inspection coordinates",
      );
    }

    const locations = await this.reader.getAll();
    const automaticMatch = resolveNearestMarketLocation(coordinates, locations);
    if (automaticMatch) return automaticMatch.market.name;

    const requestedLocation = typeof input.location === "string"
      ? input.location.trim()
      : "";
    if (!requestedLocation) {
      throw new InvalidInspectionMarketLocationError(
        "A market location is required when GPS cannot classify the inspection",
      );
    }

    const manualMatch = locations.find((market) => (
      market.name.localeCompare(requestedLocation, undefined, { sensitivity: "accent" }) === 0
    ));
    if (!manualMatch) {
      throw new InvalidInspectionMarketLocationError(
        "Market location must match a configured market",
      );
    }

    return manualMatch.name;
  }
}
