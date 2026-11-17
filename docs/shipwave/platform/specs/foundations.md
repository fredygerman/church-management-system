# Platform foundations: auth and dashboard

Status: Not started. Planning only; no implementation launched.

## Outcome
Reliable refresh-token validation and a branch-scoped dashboard that distinguishes unavailable data from genuine zero values. Dashboard endpoint vs composition, activity semantics, and auth payload policy remain decision `PLAT-DEC-01`.

## Facts checked against code
- `apps/web/actions/dashboard.ts` calls `/dashboard/stats` and catches every error as all-zero values.
- `apps/api/src/auth/strategies/jwt-refresh.strategy.ts` requires `type === 'refresh'`, checks user existence/deletion; `apps/api/src/auth/auth.service.ts` `verifyRefreshToken` only verifies JWT signature/expiry.
- Global church context and permissions are enforced by `apps/api/src/church-context/church-context.guard.ts` and `apps/api/src/permissions/guards/permission.guard.ts` (inspect actual route path and tests before edits); do not presume a tenant leak.
- API Swagger is configured in the API app; preserve generated API documentation.

## Acceptance rows
| Input/state | Observable result | Proof |
|---|---|---|
| Valid refresh token | New token pair for existing active account | auth service/strategy test |
| Access token submitted for refresh | Unauthorized; no token rotation | strategy/controller test |
| Missing/deleted user or malformed payload | Unauthorized with no account detail leakage | auth tests |
| Dashboard endpoint unavailable | UI shows explicit retry/error state, never fabricated zero totals | action/page test |
| Authorized user selects a branch | Dashboard data and activity are scoped to that branch | API service/controller test with two branches |
| No records in branch | Explicit zero/empty state | API and UI tests |

## Boundaries and ownership
Task F1 owns `apps/api/src/auth/strategies/jwt-refresh.strategy.ts`, its focused spec, and `apps/api/src/auth/auth.service.ts` only if verification logic is assigned there. Task F2 owns `apps/web/actions/dashboard.ts`, dashboard home page and its focused tests. Dashboard API module/controller/service paths are proposed pending decision; no worker owns them until PLAT-DEC-01 resolves endpoint vs composition. Exclude general tenancy rewrite and analytics redesign.

## Migration/dependencies/checks
No schema migration expected. F1 independent. F2 waits for decision; if endpoint selected, add API implementation as a separately owned task and serialize shared contract/OpenAPI changes before web integration. Verify focused tests, auth/route guards, branch-scope tests, Swagger/contract generation, web route smoke and build at integration gate.

## Handoff
State Not started. No source edits, commits, or checks performed. Resolve PLAT-DEC-01 with product owner; then allocate F1 and F2 as small tasks with disjoint paths. Human verifies error/empty dashboard behavior.
