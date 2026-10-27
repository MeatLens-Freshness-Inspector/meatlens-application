import assert from "node:assert/strict";
import test from "node:test";
import "../../setup/env";

import { startTestServer } from "../../support/appFactory";
import { getEncryptedTestClient } from "../../support/requestFactory";
import { auditLogService } from "../../../src/modules/audit/infrastructure/AuditLogService";
import { authService } from "../../../src/modules/auth/infrastructure/SupabaseAuthFactory";
import { inspectionService } from "../../../src/modules/inspections/infrastructure/InspectionService";
import { marketLocationService } from "../../../src/modules/markets/infrastructure/MarketLocationService";
import { profileService } from "../../../src/modules/users/infrastructure/ProfileService";

const market = {
  id: "market-1",
  name: "Old Market",
  latitude: 14,
  longitude: 120,
  created_at: "2026-10-27T00:00:00.000Z",
  updated_at: "2026-10-27T00:00:00.000Z",
};

test("admin PATCH returns the updated coordinate pair", async () => {
  const originalGetUser = authService.getUserByAccessToken.bind(authService);
  const originalGetRoles = profileService.getPrivilegeSummary.bind(profileService);
  const originalUpdate = marketLocationService.update.bind(marketLocationService);
  const originalAuditWrite = auditLogService.write.bind(auditLogService);

  authService.getUserByAccessToken = async () => ({ id: "admin-1", email: "admin@example.com" });
  profileService.getPrivilegeSummary = async () => ({
    roles: [{ id: "role-1", user_id: "admin-1", role: "admin" }],
    primaryRole: "admin",
    isAdmin: true,
    isDeveloper: false,
  });
  marketLocationService.update = async (_id, name, coordinates) => ({
    ...market,
    name,
    ...coordinates,
  });
  auditLogService.write = async () => undefined;

  const { baseUrl, close } = await startTestServer();
  try {
    const client = await getEncryptedTestClient(baseUrl);
    const response = await client.request("/api/market-locations/market-1", {
      method: "PATCH",
      headers: { Authorization: "Bearer admin-token", "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Old Market", latitude: 14.1, longitude: 120.1 }),
    });

    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.latitude, 14.1);
    assert.equal(body.longitude, 120.1);
  } finally {
    authService.getUserByAccessToken = originalGetUser;
    profileService.getPrivilegeSummary = originalGetRoles;
    marketLocationService.update = originalUpdate;
    auditLogService.write = originalAuditWrite;
    await close();
  }
});

test("inspection create canonicalizes a stale manual market at a nearby point", async () => {
  const originalGetUser = authService.getUserByAccessToken.bind(authService);
  const originalGetRoles = profileService.getPrivilegeSummary.bind(profileService);
  const originalGetMarkets = marketLocationService.getAll.bind(marketLocationService);
  const originalCreate = inspectionService.create.bind(inspectionService);
  const originalAuditWrite = auditLogService.write.bind(auditLogService);

  authService.getUserByAccessToken = async () => ({ id: "inspector-1", email: "inspector@example.com" });
  profileService.getPrivilegeSummary = async () => ({
    roles: [{ id: "role-1", user_id: "inspector-1", role: "inspector" }],
    primaryRole: "inspector",
    isAdmin: false,
    isDeveloper: false,
  });
  marketLocationService.getAll = async () => [market];
  inspectionService.create = async (input, userId) => ({
    created: true,
    inspection: {
      id: "inspection-1",
      user_id: userId,
      meat_type: input.meat_type,
      classification: input.classification,
      manual_classification: input.classification,
      confidence_score: input.confidence_score,
      flagged_deviations: input.flagged_deviations ?? [],
      explanation: input.explanation ?? null,
      image_url: input.image_url ?? null,
      location: input.location ?? null,
      location_latitude: input.location_latitude ?? null,
      location_longitude: input.location_longitude ?? null,
      client_submission_id: input.client_submission_id,
      captured_at: input.captured_at ?? "2026-10-27T00:00:00.000Z",
      created_at: "2026-10-27T00:00:00.000Z",
      updated_at: "2026-10-27T00:00:00.000Z",
    } as never,
  });
  auditLogService.write = async () => undefined;

  const { baseUrl, close } = await startTestServer();
  try {
    const client = await getEncryptedTestClient(baseUrl);
    const response = await client.request("/api/inspections", {
      method: "POST",
      headers: { Authorization: "Bearer inspector-token", "Content-Type": "application/json" },
      body: JSON.stringify({
        client_submission_id: "submission-1",
        meat_type: "pork",
        classification: "fresh",
        confidence_score: 0.95,
        flagged_deviations: [],
        explanation: "Fresh",
        location: "New Market",
        location_latitude: 14,
        location_longitude: 120.0001,
      }),
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.location, "Old Market");
  } finally {
    authService.getUserByAccessToken = originalGetUser;
    profileService.getPrivilegeSummary = originalGetRoles;
    marketLocationService.getAll = originalGetMarkets;
    inspectionService.create = originalCreate;
    auditLogService.write = originalAuditWrite;
    await close();
  }
});
