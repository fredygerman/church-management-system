# Platform improvement programme

Current audit baseline: `81de7d2` (2026-11-26). The repository contains implemented NestJS API, Next.js web and Expo mobile applications. Earlier planning documents remain useful intent/history, but their unqualified “not started”, missing-mobile/AI and unapproved-Expo statements are superseded by this index, accepted decisions and the current remediation register. Code present is not proof of deployed behavior.

## Current work and source of truth

- [Remediation plan and all 21 audit findings](remediation-plan.md): prioritized coverage, owning specs, proposal gates and future waves. This documentation update authorizes no implementation dispatch.
- Owning specifications: [security/API/dependencies](specs/remediation-security-and-api.md), [product/design/web](specs/remediation-product-and-design.md), [mobile/quality](specs/remediation-mobile-and-quality.md).
- Execution: [run policy](RUN-POLICY.md), [allocation manifest](allocation-manifest.md), [backlog and historical W/M work](backlog.md), [accepted decisions DEC-01–16](decisions.md), [handoff](handoff.md), [human verification](human-verification.md).
- Product direction: [design index and visual boards](../../product-design/README.md), [design language](../../product-design/DESIGN.md), [screen inventory](../../product-design/screen-specification.md), [acceptance checklist](../../product-design/implementation-checklist.md).
- Existing contracts: [API inventory](specs/mobile-api-inventory.md), [API contracts](specs/api-contracts.md), [AI API](specs/ai-api.md). Historical group plans remain [design](groups/design.md), [web/API](groups/web-api.md), [mobile](groups/mobile.md); current remediation allocation supersedes stale task statuses there.

## Product baseline

Mito Ya Baraka Church, HQ first. Member Home / Church / Events / Library / Profile; staff Dashboard / People / Services / Content / More; explicit same-account space switching. Public branch viewing must be distinct from membership context. Shared library is the vision, while current document access is branch-scoped. AI is a top-bar entry beside notifications, opening its own conversation; placement/visual implementation still needs remediation.

Existing code includes refresh rotation/revocation, dashboard metrics, member actions, persisted documents/signed downloads, AI conversation/feedback/retention, EN/SW copy and mobile member/staff screens. Newly confirmed security and session/context findings mean old “all code done” notes are not a present readiness claim.

## Completion and exclusions

Code complete, automated checks passed, human verified and deployed are separate states. The audit freshly passed API 19 suites/146 tests; other prior checks are historical until rerun. Device/design/accessibility/Swahili checks remain unperformed. Live revision, storage configuration and production schema are unverified by this audit. A push does not establish a deployment.

Commerce, email/SMS sending enablement, store setup/publishing, full offline operation and AI provider activation/live-provider testing remain deferred. Browser-based mobile reading remains accepted under DEC-15. Do not turn illustration details or these exclusions into release commitments.
