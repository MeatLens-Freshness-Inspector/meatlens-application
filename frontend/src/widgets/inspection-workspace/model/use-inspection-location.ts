import { useCallback, useEffect, useState } from "react";

import { marketLocationClient } from "@/entities/market-location";
import {
  FALLBACK_MARKET_LOCATIONS,
  normalizeMarketLocationNames,
} from "./inspect-page";
import {
  readRememberedMarketLocation,
  resolveRememberedMarketLocation,
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
  const [marketLocations, setMarketLocations] = useState<string[]>(FALLBACK_MARKET_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<string>(FALLBACK_MARKET_LOCATIONS[0] ?? "");

  useEffect(() => {
    let isCancelled = false;

    const loadMarketLocations = async () => {
      try {
        const locationRows = await marketLocationClient.getAll();
        if (isCancelled) return;

        const nextLocations = normalizeMarketLocationNames(locationRows);
        setMarketLocations(nextLocations);
        setSelectedLocation((current) =>
          resolveRememberedMarketLocation(
            userId ? readRememberedMarketLocation(getLocationStorage(), userId) : null,
            current,
            nextLocations,
          ),
        );
      } catch {
        if (isCancelled) return;
        setMarketLocations(FALLBACK_MARKET_LOCATIONS);
        setSelectedLocation((current) =>
          resolveRememberedMarketLocation(
            userId ? readRememberedMarketLocation(getLocationStorage(), userId) : null,
            current,
            FALLBACK_MARKET_LOCATIONS,
          ),
        );
      }
    };

    void loadMarketLocations();

    return () => {
      isCancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const rememberedLocation = readRememberedMarketLocation(getLocationStorage(), userId);
    setSelectedLocation((current) =>
      resolveRememberedMarketLocation(rememberedLocation, current, marketLocations),
    );
  }, [marketLocations, userId]);

  const handleSelectedLocationChange = useCallback(
    (value: string) => {
      setSelectedLocation(value);
      if (userId) {
        writeRememberedMarketLocation(getLocationStorage(), userId, value);
      }
    },
    [userId],
  );

  return { marketLocations, selectedLocation, handleSelectedLocationChange };
}
