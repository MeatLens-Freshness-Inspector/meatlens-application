import { supabase } from "../../../integrations/supabase";
import type { MarketCoordinatePair } from "../domain/market-location-resolver";

export interface MarketLocation {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export class MarketLocationService {
  private static instance: MarketLocationService;
  private readonly tableName = "market_locations";

  private constructor() {}

  static getInstance(): MarketLocationService {
    if (!MarketLocationService.instance) {
      MarketLocationService.instance = new MarketLocationService();
    }
    return MarketLocationService.instance;
  }

  async getAll(): Promise<MarketLocation[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("id, name, latitude, longitude, created_at, updated_at")
      .order("name", { ascending: true })
      .order("id", { ascending: true })
      .limit(2_000);

    if (error) throw new Error(`Failed to fetch market locations: ${error.message}`);
    return (data as unknown as MarketLocation[]) ?? [];
  }

  async create(name: string, coordinates: MarketCoordinatePair): Promise<MarketLocation> {
    const normalizedName = this.normalizeName(name);
    if (!normalizedName) {
      throw new Error("Market location name is required");
    }

    const { data, error } = await (supabase
      .from(this.tableName) as any)
      .insert({
        name: normalizedName,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      })
      .select("id, name, latitude, longitude, created_at, updated_at")
      .single();

    if (error) throw new Error(`Failed to create market location: ${error.message}`);
    return data as unknown as MarketLocation;
  }

  async update(
    id: string,
    name: string,
    coordinates: MarketCoordinatePair,
  ): Promise<MarketLocation> {
    const normalizedName = this.normalizeName(name);
    if (!id.trim()) {
      throw new Error("Market location ID is required");
    }
    if (!normalizedName) {
      throw new Error("Market location name is required");
    }

    const { data, error } = await (supabase
      .from(this.tableName) as any)
      .update({
        name: normalizedName,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, name, latitude, longitude, created_at, updated_at")
      .single();

    if (error) throw new Error(`Failed to update market location: ${error.message}`);
    return data as unknown as MarketLocation;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq("id", id);

    if (error) throw new Error(`Failed to delete market location: ${error.message}`);
  }

  private normalizeName(value: string): string {
    return value.trim().replace(/\s+/g, " ");
  }
}

export const marketLocationService = MarketLocationService.getInstance();
