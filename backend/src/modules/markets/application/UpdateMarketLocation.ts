import type { MarketCoordinatePair } from "../domain/market-location-resolver";
import type { MarketLocation } from "../infrastructure/MarketLocationService";

export interface MarketLocationUpdater {
  update(
    id: string,
    name: string,
    coordinates: MarketCoordinatePair,
  ): Promise<MarketLocation>;
}

export class UpdateMarketLocation {
  constructor(private readonly updater: MarketLocationUpdater) {}

  execute(
    id: string,
    name: string,
    coordinates: MarketCoordinatePair,
  ): Promise<MarketLocation> {
    return this.updater.update(id, name, coordinates);
  }
}
