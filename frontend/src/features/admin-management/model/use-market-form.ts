import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import {
  marketLocationClient,
  normalizeMarketName,
  type MarketLocation,
  type MarketLocationCreateInput,
} from "@/entities/market-location";

interface UseMarketFormOptions {
  marketLocations: MarketLocation[];
  setMarketLocations: Dispatch<SetStateAction<MarketLocation[]>>;
}

export function parseMarketCoordinateInput(
  latitudeValue: string,
  longitudeValue: string,
): { latitude: number; longitude: number } | null {
  if (!latitudeValue.trim() || !longitudeValue.trim()) return null;

  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
}

export function useMarketForm({ marketLocations, setMarketLocations }: UseMarketFormOptions) {
  const [newMarketName, setNewMarketName] = useState("");
  const [newMarketLatitude, setNewMarketLatitude] = useState("");
  const [newMarketLongitude, setNewMarketLongitude] = useState("");
  const [editingMarketId, setEditingMarketId] = useState<string | null>(null);
  const [editingLatitude, setEditingLatitude] = useState("");
  const [editingLongitude, setEditingLongitude] = useState("");

  const parseCoordinates = (
    latitudeValue: string,
    longitudeValue: string,
  ): Pick<MarketLocationCreateInput, "latitude" | "longitude"> | null => {
    if (!latitudeValue.trim() || !longitudeValue.trim()) {
      toast.error("Latitude and longitude are both required");
      return null;
    }

    const coordinates = parseMarketCoordinateInput(latitudeValue, longitudeValue);
    if (!coordinates) {
      toast.error("Latitude and longitude must be valid numbers");
      return null;
    }

    return coordinates;
  };

  const handleCreateMarket = async () => {
    const normalizedName = normalizeMarketName(newMarketName);
    if (!normalizedName) {
      toast.error("Market name cannot be empty");
      return;
    }

    if (marketLocations.some((market) => market.name.localeCompare(normalizedName, undefined, { sensitivity: "accent" }) === 0)) {
      toast.error("Market already exists");
      return;
    }

    const coordinates = parseCoordinates(newMarketLatitude, newMarketLongitude);
    if (!coordinates) return;

    try {
      const created = await marketLocationClient.create({
        name: normalizedName,
        ...coordinates,
      });
      setMarketLocations((previous) => [...previous, created].sort((left, right) => left.name.localeCompare(right.name)));
      setNewMarketName("");
      setNewMarketLatitude("");
      setNewMarketLongitude("");
      toast.success("Market added");
    } catch {
      toast.error("Failed to add market");
    }
  };

  const startEditingMarket = (market: MarketLocation) => {
    setEditingMarketId(market.id);
    setEditingLatitude(market.latitude?.toString() ?? "");
    setEditingLongitude(market.longitude?.toString() ?? "");
  };

  const cancelEditingMarket = () => {
    setEditingMarketId(null);
    setEditingLatitude("");
    setEditingLongitude("");
  };

  const saveMarketCoordinates = async (id: string) => {
    const market = marketLocations.find((candidate) => candidate.id === id);
    if (!market) return;

    const coordinates = parseCoordinates(editingLatitude, editingLongitude);
    if (!coordinates) return;

    try {
      const updated = await marketLocationClient.update(id, {
        name: market.name,
        ...coordinates,
      });
      setMarketLocations((previous) => previous
        .map((candidate) => candidate.id === updated.id ? updated : candidate)
        .sort((left, right) => left.name.localeCompare(right.name)));
      cancelEditingMarket();
      toast.success("Market reference point updated");
    } catch {
      toast.error("Failed to update market reference point");
    }
  };

  return {
    cancelEditingMarket,
    editingLatitude,
    editingLongitude,
    editingMarketId,
    handleCreateMarket,
    newMarketLatitude,
    newMarketLongitude,
    newMarketName,
    saveMarketCoordinates,
    setEditingLatitude,
    setEditingLongitude,
    setNewMarketLatitude,
    setNewMarketLongitude,
    setNewMarketName,
    startEditingMarket,
  };
}
