import { useCallback, useEffect, useState } from "react";

import { marketLocationClient } from "@/entities/market-location";
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

export function useInspectionLocation(userId: string | null) {
  const [locationState, setLocationState] = useState(() => ({
    ownerId: userId,
    marketLocations: FALLBACK_MARKET_LOCATIONS,
    selectedLocation: FALLBACK_MARKET_LOCATIONS[0] ?? "",
  }));

  const activeLocationState = locationState.ownerId === userId
    ? locationState
    : {
        ownerId: userId,
        marketLocations: FALLBACK_MARKET_LOCATIONS,
        selectedLocation: FALLBACK_MARKET_LOCATIONS[0] ?? "",
      };

  useEffect(() => {
    let isCancelled = false;

    if (!userId) {
      setLocationState({
        ownerId: null,
        marketLocations: FALLBACK_MARKET_LOCATIONS,
        selectedLocation: FALLBACK_MARKET_LOCATIONS[0] ?? "",
      });
      return () => {
        isCancelled = true;
      };
    }

    const applyLocations = (nextLocations: string[]) => {
      if (isCancelled) return;

      setLocationState((current) => {
        const rememberedLocation = readRememberedMarketLocation(getLocationStorage(), userId);
        return {
          ownerId: userId,
          marketLocations: nextLocations,
          selectedLocation: resolveActiveInspectionLocation(
            current.ownerId,
            userId,
            rememberedLocation,
            current.selectedLocation,
            nextLocations,
          ),
        };
      });
    };

    const loadMarketLocations = async () => {
      try {
        const locationRows = await marketLocationClient.getAll();
        applyLocations(normalizeMarketLocationNames(locationRows));
      } catch {
        applyLocations(FALLBACK_MARKET_LOCATIONS);
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
        marketLocations: current.ownerId === userId
          ? current.marketLocations
          : FALLBACK_MARKET_LOCATIONS,
        selectedLocation: value,
      }));
    },
    [userId],
  );

  return {
    marketLocations: activeLocationState.marketLocations,
    selectedLocation: activeLocationState.selectedLocation,
    handleSelectedLocationChange,
  };
}
