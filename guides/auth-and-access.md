# Auth and Access

Environment-agnostic authentication and authorization guidance.

## Core Principles
- Fail-fast auth: surface failures immediately; no silent fallbacks.
- Clear error UX: actionable messages; never pretend success.
- Simple RBAC: keep roles simple; avoid complex permission matrices unless necessary.
- Strict environment separation: dev shortcuts never ship to production.

## Patterns
- Route protection: middleware/guards enforce access at boundaries.
- API checks: validate session and role per operation.
- Consistent error format: reuse canonical error/validation responses.
- Logging and metrics: record auth failures for observability and security.

## Environment Separation
- Development: allow fast local auth flows behind env flags.
- Production: enforce secure session/token handling and expiry.
- Test: deterministic tokens/fixtures; no external dependencies when possible.
