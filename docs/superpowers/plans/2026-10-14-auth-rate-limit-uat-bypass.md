# UAT Authentication Rate-Limit Bypass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a backend-only UAT switch that bypasses public authentication rate limiting in non-production environments while preserving the existing production limit.

**Architecture:** Keep the existing in-memory limiter and auth routes unchanged. Add a pure environment predicate and a factory that wraps the limiter with a non-production bypass, allowing tests to inject environment objects without mutating global process state.

**Tech Stack:** Node.js 22, TypeScript, Express request handlers, Node’s built-in test runner, npm workspaces.

## Global Constraints

- `DISABLE_AUTH_RATE_LIMIT=true` is the only bypass switch.
- The switch must never bypass rate limiting when `NODE_ENV=production`.
- Missing, false, or malformed values keep the existing limit of 5 requests per 10 minutes per IP.
- Preserve the `429` response and `Retry-After` header when rate limiting is active.
- Run the affected local CI checks before claiming completion.

---

### Task 1: Add test coverage for the UAT bypass and production guard

**Files:**
- Create: `backend/tests/unit/shared/rate-limit.unit.test.ts`
- Test: `backend/src/middleware/rateLimit.ts`

**Interfaces:**
- Consumes: `isAuthRateLimitBypassed(env)` and `createPublicAuthRateLimit(env)` from `backend/src/middleware/rateLimit.ts`.
- Produces: executable tests for default, UAT bypass, production guard, and normal 429 behavior.

- [ ] **Step 1: Write the failing tests**

Create a fake Express response with `setHeader`, `status`, and `json`, invoke the middleware with a stable IP, and assert:

```ts
test("auth bypass is disabled by default and for malformed values", () => {
  assert.equal(isAuthRateLimitBypassed({}), false);
  assert.equal(isAuthRateLimitBypassed({ DISABLE_AUTH_RATE_LIMIT: "false", NODE_ENV: "uat" }), false);
  assert.equal(isAuthRateLimitBypassed({ DISABLE_AUTH_RATE_LIMIT: "yes", NODE_ENV: "uat" }), false);
});

test("auth bypass is enabled only for non-production environments", () => {
  assert.equal(isAuthRateLimitBypassed({ DISABLE_AUTH_RATE_LIMIT: "true", NODE_ENV: "uat" }), true);
  assert.equal(isAuthRateLimitBypassed({ DISABLE_AUTH_RATE_LIMIT: "true", NODE_ENV: "development" }), true);
  assert.equal(isAuthRateLimitBypassed({ DISABLE_AUTH_RATE_LIMIT: "true", NODE_ENV: "production" }), false);
});

test("enabled UAT bypass allows repeated auth requests", () => {
  const middleware = createPublicAuthRateLimit({
    DISABLE_AUTH_RATE_LIMIT: "true",
    NODE_ENV: "uat",
  });
  let nextCalls = 0;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    middleware(requestWithIp("203.0.113.10"), response, () => {
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
  let nextCalls = 0;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    middleware(requestWithIp("203.0.113.11"), response, () => {
      nextCalls += 1;
    });
  }

  assert.equal(nextCalls, 5);
  assert.equal(response.statusCode, 429);
  assert.match(response.headers.get("Retry-After") ?? "", /^\d+$/);
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npx tsx --test backend/tests/unit/shared/rate-limit.unit.test.ts`

Expected: FAIL because the new exported predicate and factory do not exist yet.

- [ ] **Step 3: Commit the failing test**

Run: `git add -- backend/tests/unit/shared/rate-limit.unit.test.ts` then `git commit -m "test: cover UAT auth rate-limit bypass"`.

### Task 2: Implement the guarded bypass and document configuration

**Files:**
- Modify: `backend/src/middleware/rateLimit.ts`
- Modify: `.env.docker.example`

**Interfaces:**
- Consumes: `NodeJS.ProcessEnv` values `DISABLE_AUTH_RATE_LIMIT` and `NODE_ENV`.
- Produces: `isAuthRateLimitBypassed(env: NodeJS.ProcessEnv): boolean`, `createPublicAuthRateLimit(env?: NodeJS.ProcessEnv): RequestHandler`, and the existing `publicAuthRateLimit` export used by auth routes.

- [ ] **Step 1: Add the guarded predicate and factory**

Keep `createRateLimiter` unchanged. Add the following behavior around the existing public-auth limiter:

```ts
export function isAuthRateLimitBypassed(env: NodeJS.ProcessEnv = process.env): boolean {
  return (
    env.DISABLE_AUTH_RATE_LIMIT?.trim().toLowerCase() === "true" &&
    env.NODE_ENV?.trim().toLowerCase() !== "production"
  );
}

export function createPublicAuthRateLimit(env: NodeJS.ProcessEnv = process.env): RequestHandler {
  const rateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    maxRequests: 5,
    message: "Too many authentication attempts. Please try again later.",
  });

  return (req, res, next) => {
    if (isAuthRateLimitBypassed(env)) {
      next();
      return;
    }

    rateLimiter(req, res, next);
  };
}

export const publicAuthRateLimit = createPublicAuthRateLimit();
```

- [ ] **Step 2: Document the UAT setting**

Add `DISABLE_AUTH_RATE_LIMIT=false` to `.env.docker.example` with a comment that UAT must also use a non-production `NODE_ENV`, for example:

```dotenv
# UAT only: set true together with NODE_ENV=uat. Production always rate-limits auth.
DISABLE_AUTH_RATE_LIMIT=false
```

- [ ] **Step 3: Run the focused tests**

Run: `npx tsx --test backend/tests/unit/shared/rate-limit.unit.test.ts`

Expected: all bypass and production-guard tests pass.

- [ ] **Step 4: Run affected backend checks**

Run:

```powershell
npm run typecheck -w backend
npm run lint -w backend
npm run test:unit -w backend
npm run test:backend:integration
```

Expected: exit code 0; the existing security integration test continues to observe a 429 when the bypass flag is not enabled.

- [ ] **Step 5: Review the diff and commit the implementation**

Run: `git diff --check` and `git status --short`, then commit only `backend/src/middleware/rateLimit.ts`, `backend/tests/unit/shared/rate-limit.unit.test.ts`, and `.env.docker.example` with `git commit -m "feat: add UAT auth rate-limit bypass"`.
