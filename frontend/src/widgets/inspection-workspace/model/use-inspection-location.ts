import { useCallback, useEffect, useState } from "react";

import {
  marketLocationClient,
  readCachedMarketLocations,
  writeCachedMarketLocations,
  type MarketLocation,
} from "@/entities/market-location";
import {
  FALLBACK_MARKET_LOCATIONS,
  normalizeMarketLocationNames,
} from "./inspect-page";
import {
  readRememberedMarketLocation,
  resolveActiveInspectionLocation,
  writeRememberedMarketLocation,
} from "./location-memory";

function getLocationStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function createFallbackMarketRows(): MarketLocation[] {
  return FALLBACK_MARKET_LOCATIONS.map((name, index) => ({
    id: `fallback-${index}-${name}`,
    name,
    latitude: null,
    longitude: null,
    created_at: "",
    updated_at: "",
  }));
}

function getMarketNames(locations: readonly MarketLocation[]): string[] {
  return locations.map((location) => location.name);
}

export function useInspectionLocation(userId: string | null) {
  const [isOnline, setIsOnline] = useState(() => globalThis.navigator?.onLine ?? true);
  const [locationState, setLocationState] = useState(() => ({
    ownerId: userId,
    marketLocationRows: createFallbackMarketRows(),
    selectedLocation: FALLBACK_MARKET_LOCATIONS[0] ?? "",
  }));

  const activeLocationState = locationState.ownerId === userId
    ? locationState
    : {
        ownerId: userId,
        marketLocationRows: createFallbackMarketRows(),
        selectedLocation: FALLBACK_MARKET_LOCATIONS[0] ?? "",
      };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    if (!userId) {
      setLocationState({
        ownerId: null,
        marketLocationRows: createFallbackMarketRows(),
        selectedLocation: FALLBACK_MARKET_LOCATIONS[0] ?? "",
      });
      return () => {
        isCancelled = true;
      };
    }

    const applyLocations = (nextLocations: MarketLocation[]) => {
      if (isCancelled) return;

      setLocationState((current) => {
        const rememberedLocation = readRememberedMarketLocation(getLocationStorage(), userId);
        const nextNames = getMarketNames(nextLocations);
        return {
          ownerId: userId,
          marketLocationRows: nextLocations,
          selectedLocation: resolveActiveInspectionLocation(
            current.ownerId,
            userId,
            rememberedLocation,
            current.selectedLocation,
            nextNames,
          ),
        };
      });
    };

    const loadMarketLocations = async () => {
      try {
        const locationRows = await marketLocationClient.getAll();
        const normalizedNames = normalizeMarketLocationNames(locationRows);
        const normalizedRows = locationRows.length > 0
          ? locationRows
              .map((row) => ({
                ...row,
                name: row.name.trim().replace(/\s+/g, " "),
              }))
              .filter((row) => normalizedNames.includes(row.name))
          : createFallbackMarketRows();
        writeCachedMarketLocations(getLocationStorage(), normalizedRows);
        applyLocations(normalizedRows);
      } catch {
        const cachedRows = readCachedMarketLocations(getLocationStorage());
        applyLocations(cachedRows.length > 0 ? cachedRows : createFallbackMarketRows());
      }
    };

    void loadMarketLocations();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  const handleSelectedLocationChange = useCallback(
    (value: string) => {
      if (userId) {
        writeRememberedMarketLocation(getLocationStorage(), userId, value);
      }
      setLocationState((current) => ({
        ownerId: userId,
        marketLocationRows: current.ownerId === userId
          ? current.marketLocationRows
          : createFallbackMarketRows(),
        selectedLocation: value,
      }));
    },
    [userId],
  );

  const setResolvedLocation = useCallback((value: string) => {
    setLocationState((current) => ({
      ...current,
      selectedLocation: value,
    }));
  }, []);

  return {
    isOnline,
    marketLocations: getMarketNames(activeLocationState.marketLocationRows),
    marketLocationRecords: activeLocationState.marketLocationRows,
    selectedLocation: activeLocationState.selectedLocation,
    handleSelectedLocationChange,
    setResolvedLocation,
  };
}
