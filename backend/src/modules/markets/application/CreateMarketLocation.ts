import type { MarketLocation } from "../infrastructure/MarketLocationService";
import type { MarketCoordinatePair } from "../domain/market-location-resolver";
export interface MarketLocationCreator {
  create(name: string, coordinates: MarketCoordinatePair): Promise<MarketLocation>;
}
export class CreateMarketLocation {
  constructor(private readonly creator: MarketLocationCreator) {}
  execute(name: string, coordinates: MarketCoordinatePair): Promise<MarketLocation> {
    return this.creator.create(name, coordinates);
  }
}
