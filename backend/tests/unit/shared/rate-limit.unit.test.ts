import assert from "node:assert/strict";
import { test } from "node:test";
import type { Request, Response } from "express";
import {
  createPublicAuthRateLimit,
  isAuthRateLimitBypassed,
} from "../../../src/middleware/rateLimit";

type TestResponse = {
  statusCode: number;
  headers: Map<string, string>;
  body: unknown;
  setHeader(name: string, value: string): TestResponse;
  status(code: number): TestResponse;
  json(body: unknown): TestResponse;
};

function createResponse(): TestResponse {
  return {
    statusCode: 200,
    headers: new Map<string, string>(),
    body: undefined,
    setHeader(name, value) {
      this.headers.set(name, value);
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function requestWithIp(ip: string): Request {
  return { ip, socket: { remoteAddress: ip } } as unknown as Request;
}

function invoke(
  middleware: ReturnType<typeof createPublicAuthRateLimit>,
  request: Request,
  response: TestResponse,
  onNext: () => void,
): void {
  middleware(request, response as unknown as Response, onNext);
}

test("auth bypass is disabled by default and for malformed values", () => {
  assert.equal(isAuthRateLimitBypassed({}), false);
  assert.equal(
    isAuthRateLimitBypassed({ DISABLE_AUTH_RATE_LIMIT: "false", NODE_ENV: "uat" }),
    false,
  );
  assert.equal(
    isAuthRateLimitBypassed({ DISABLE_AUTH_RATE_LIMIT: "yes", NODE_ENV: "uat" }),
    false,
  );
});

test("auth bypass is enabled only for non-production environments", () => {
  assert.equal(
    isAuthRateLimitBypassed({ DISABLE_AUTH_RATE_LIMIT: "true", NODE_ENV: "uat" }),
    true,
  );
  assert.equal(
    isAuthRateLimitBypassed({ DISABLE_AUTH_RATE_LIMIT: "true", NODE_ENV: "development" }),
    true,
  );
  assert.equal(
    isAuthRateLimitBypassed({ DISABLE_AUTH_RATE_LIMIT: "true", NODE_ENV: "production" }),
    false,
  );
});

test("enabled UAT bypass allows repeated auth requests", () => {
  const middleware = createPublicAuthRateLimit({
    DISABLE_AUTH_RATE_LIMIT: "true",
    NODE_ENV: "uat",
  });
  const response = createResponse();
  let nextCalls = 0;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    invoke(middleware, requestWithIp("203.0.113.10"), response, () => {
      nextCalls += 1;
    });
  }

  assert.equal(nextCalls, 6);
  assert.equal(response.statusCode, 200);
});

test("production still returns 429 after five allowed requests", () => {
  const middleware = createPublicAuthRateLimit({
    DISABLE_AUTH_RATE_LIMIT: "true",
    NODE_ENV: "production",
  });
  const response = createResponse();
  let nextCalls = 0;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    invoke(middleware, requestWithIp("203.0.113.11"), response, () => {
      nextCalls += 1;
    });
  }

  assert.equal(nextCalls, 5);
  assert.equal(response.statusCode, 429);
  assert.match(response.headers.get("Retry-After") ?? "", /^\d+$/);
});
