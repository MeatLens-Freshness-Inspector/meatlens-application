import { createAuthHeaders } from "@/shared/api/auth-headers";
import { API_BASE_URL } from "@/shared/api/base-url";
import { fetchWithTimeout } from "@/shared/api";

export interface MarketLocation {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface MarketLocationCreateInput {
  name: string;
  latitude: number;
  longitude: number;
}

export type MarketLocationUpdateInput = MarketLocationCreateInput;

export class MarketLocationClient {
  private static instance: MarketLocationClient;

  private constructor() {}

  static getInstance(): MarketLocationClient {
    if (!MarketLocationClient.instance) {
      MarketLocationClient.instance = new MarketLocationClient();
    }
    return MarketLocationClient.instance;
  }

  private createHeaders(initialHeaders?: HeadersInit): Headers {
    return createAuthHeaders(initialHeaders);
  }

  private createRequestError(action: string, response: Response): Error {
    if (response.status === 404) {
      return new Error(
        "Market location API is unavailable on the current backend deployment. Deploy the latest backend service.",
      );
    }

    return new Error(`Failed to ${action}: ${response.statusText}`);
  }

  async getAll(): Promise<MarketLocation[]> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/market-locations`, {
      headers: this.createHeaders(),
    });
    if (!res.ok) {
      if (res.status === 404) {
        console.warn("Market location API route missing in backend deployment; falling back to an empty list.");
        return [];
      }

      throw this.createRequestError("fetch market locations", res);
    }

    return res.json();
  }

  async create(input: MarketLocationCreateInput): Promise<MarketLocation>;
  async create(name: string): Promise<MarketLocation>;
  async create(input: MarketLocationCreateInput | string): Promise<MarketLocation> {
    const payload = typeof input === "string" ? { name: input } : input;
    const res = await fetchWithTimeout(`${API_BASE_URL}/market-locations`, {
      method: "POST",
      headers: this.createHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw this.createRequestError("create market location", res);
    return res.json();
  }

  async update(id: string, input: MarketLocationUpdateInput): Promise<MarketLocation> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/market-locations/${id}`, {
      method: "PATCH",
      headers: this.createHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(input),
    });
    if (!res.ok) throw this.createRequestError("update market location", res);
    return res.json();
  }

  async delete(id: string): Promise<void> {
    const res = await fetchWithTimeout(`${API_BASE_URL}/market-locations/${id}`, {
      method: "DELETE",
      headers: this.createHeaders(),
    });
    if (!res.ok) throw this.createRequestError("delete market location", res);
  }
}

export const marketLocationClient = MarketLocationClient.getInstance();
