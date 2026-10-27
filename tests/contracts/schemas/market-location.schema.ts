import assert from "node:assert/strict";
import type { MarketLocation } from "../../../frontend/src/entities/market-location";

function assertRecord(value: unknown, message: string): asserts value is Record<string, unknown> {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), message);
}

function assertNullableNumber(value: unknown, message: string): void {
  if (value === null) return;
  assert.equal(typeof value, "number", message);
  assert.ok(Number.isFinite(value), message);
}

export function assertMarketLocationSchema(value: unknown): asserts value is MarketLocation {
  assertRecord(value, "Market location payload must be an object");
  assert.equal(typeof value.id, "string", "Market location id must be a string");
  assert.equal(typeof value.name, "string", "Market location name must be a string");
  assertNullableNumber(value.latitude, "Market latitude must be a number or null");
  assertNullableNumber(value.longitude, "Market longitude must be a number or null");
  assert.equal(typeof value.created_at, "string", "Market created_at must be a string");
  assert.equal(typeof value.updated_at, "string", "Market updated_at must be a string");
}

export function assertMarketLocationListSchema(value: unknown): asserts value is MarketLocation[] {
  assert.ok(Array.isArray(value), "Market location payload must be an array");
  value.forEach((market) => assertMarketLocationSchema(market));
}
