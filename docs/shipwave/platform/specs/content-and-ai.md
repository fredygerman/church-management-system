# Shared library, content and AI

Status: Not started. Planning only.

## Facts checked against code
- Existing upload controller/service: `apps/api/src/file-upload/file-upload.controller.ts`, `file-upload.service.ts`; document metadata methods are stubs pending a documents table migration.
- Shared library, reader, paid entitlements and AI conversation are proposed in product design docs; no member library/reader/AI app flow exists in current web routes.
- Payment service is an empty stub per plans/README.md. Store accounts, agreements, publishing and commerce are deferred.

## Acceptance rows
| Input/state | Result | Proof |
|---|---|---|
| Authorized user uploads allowed file | Validated storage object with durable metadata and branch/shared visibility | API tests and migration test |
| Invalid type/oversize/unauthorized upload | Rejected; no orphan object or metadata leak | negative controller/service tests |
| Library search empty/error | Clear states and retry without exposing restricted item | UI/API tests |
| Free item opens/downloads | Eligible content available; removal and failure surfaced | content tests |
| Paid item without entitlement | Access denied and no purchase promise | entitlement tests |
| AI lacks source/permission/availability | States uncertainty/unavailable and never reveals protected branch data | policy tests and red-team scenarios |

## Decision and ownership
C1 document metadata/storage lifecycle; schema migration in serialized lane. C2 library catalog and free eligible downloads; proposed paths `apps/web/app/[churchId]/library/**`, `apps/api/src/library/**`. C3 paid entitlement design only after PLAT-DEC-07 commerce decision; do not implement payments/store setup while undecided. C4 AI scope and privacy policy PLAT-DEC-08 before implementation; proposed `apps/api/src/ai/**`, `apps/web/app/[churchId]/ai/**`. AI must inherit server-side branch/role permissions, show sources/context, uncertainty and feedback route. Do not send sensitive prayer/family records to AI absent explicit approved policy.

## Dependencies/checks/handoff
C1 storage contract before C2; shared API types/OpenAPI serialized before web integration. C3/C4 blocked on decisions. Verify auth, content permission/tenant tests, migration generation/inspection, upload cleanup, OpenAPI, EN/SW and retry/empty states. No implementation launched, state Not started.
