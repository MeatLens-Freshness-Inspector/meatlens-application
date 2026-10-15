export type LocationStorage = Pick<Storage, "getItem" | "setItem">;

const LOCATION_STORAGE_PREFIX = "meatlens.inspect.last-market-location";

export function getInspectionLocationStorageKey(userId: string): string {
  return `${LOCATION_STORAGE_PREFIX}:${userId}`;
}

export function readRememberedMarketLocation(
  storage: LocationStorage | null | undefined,
  userId: string,
): string | null {
  if (!storage || !userId.trim()) return null;

  try {
    const value = storage.getItem(getInspectionLocationStorageKey(userId));
    const normalized = value?.trim() ?? "";
    return normalized || null;
  } catch {
    return null;
  }
}

export function writeRememberedMarketLocation(
  storage: LocationStorage | null | undefined,
  userId: string,
  location: string,
): void {
  if (!storage || !userId.trim() || !location.trim()) return;

  try {
    storage.setItem(
      getInspectionLocationStorageKey(userId),
      location.trim(),
    );
  } catch {
    // Private browsing or blocked storage must never block a capture.
  }
}

export function resolveRememberedMarketLocation(
  rememberedLocation: string | null,
  currentLocation: string,
  validLocations: readonly string[],
): string {
  if (rememberedLocation && validLocations.includes(rememberedLocation)) {
    return rememberedLocation;
  }

  if (currentLocation && validLocations.includes(currentLocation)) {
    return currentLocation;
  }

  return validLocations[0] ?? "";
}
