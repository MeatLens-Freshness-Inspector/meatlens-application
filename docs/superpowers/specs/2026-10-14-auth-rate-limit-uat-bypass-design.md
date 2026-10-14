# UAT Authentication Rate-Limit Bypass Design

## Goal

Allow UAT environments to temporarily bypass the public authentication rate limiter without exposing a client-controlled switch or weakening production protection.

## Design

The backend will read `DISABLE_AUTH_RATE_LIMIT=true`. The flag is honored only when `NODE_ENV` is not `production`; production always keeps the existing limit of five public authentication requests per IP per ten-minute window. Missing, false, malformed, or production-scoped values leave rate limiting enabled.

The existing auth routes and response behavior remain unchanged when the flag is disabled. When the flag is enabled in a non-production environment, the shared public-auth middleware calls `next()` without creating or consulting rate-limit buckets. The environment example will document the flag and the requirement to use a non-production `NODE_ENV` for UAT.

## Testing

Add unit coverage for the bypass predicate and middleware behavior:

- the default and false values keep rate limiting enabled;
- `true` bypasses only for non-production environments;
- `true` does not bypass production;
- the normal limiter still returns 429 with `Retry-After` after the fifth allowed request.

Run the focused backend unit test, backend typecheck, lint, and the relevant backend integration/security lane.
