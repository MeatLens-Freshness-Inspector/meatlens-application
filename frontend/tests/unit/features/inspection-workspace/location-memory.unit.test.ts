import assert from "node:assert/strict";
import test from "node:test";
import {
  getInspectionLocationStorageKey,
  readRememberedMarketLocation,
  resolveActiveInspectionLocation,
  resolveRememberedMarketLocation,
  writeRememberedMarketLocation,
} from "../../../../src/widgets/inspection-workspace/model/location-memory";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
}

test("scopes the remembered location key to the signed-in inspector", () => {
  assert.notEqual(
    getInspectionLocationStorageKey("user-1"),
    getInspectionLocationStorageKey("user-2"),
  );
});

test("reads and writes a trimmed remembered market location", () => {
  const storage = createStorage();
  writeRememberedMarketLocation(storage, "user-1", "  New Market  ");

  assert.equal(readRememberedMarketLocation(storage, "user-1"), "New Market");
});

test("ignores invalid or empty remembered values", () => {
  const storage = createStorage();
  writeRememberedMarketLocation(storage, "user-1", " ");

  assert.equal(readRememberedMarketLocation(storage, "user-1"), null);
  assert.equal(
    resolveRememberedMarketLocation("Missing Market", "Old Market", ["Old Market", "New Market"]),
    "Old Market",
  );
});

test("keeps a valid remembered location and falls back safely", () => {
  assert.equal(
    resolveRememberedMarketLocation("New Market", "Old Market", ["Old Market", "New Market"]),
    "New Market",
  );
  assert.equal(
    resolveRememberedMarketLocation(null, "Old Market", []),
    "",
  );
});

test("does not carry the previous inspector's current market into a new user", () => {
  assert.equal(
    resolveActiveInspectionLocation(
      "user-1",
      "user-2",
      null,
      "Old Market",
      ["New Market", "Other Market"],
    ),
    "New Market",
  );
  assert.equal(
    resolveActiveInspectionLocation(
      "user-2",
      "user-2",
      "Other Market",
      "New Market",
      ["New Market", "Other Market"],
    ),
    "Other Market",
  );
});

test("storage failures do not block inspection", () => {
  const unavailableStorage = {
    getItem: () => {
      throw new Error("storage blocked");
    },
    setItem: () => {
      throw new Error("storage blocked");
    },
  };

  assert.equal(readRememberedMarketLocation(unavailableStorage, "user-1"), null);
  assert.doesNotThrow(() =>
    writeRememberedMarketLocation(unavailableStorage, "user-1", "Old Market"),
  );
});
