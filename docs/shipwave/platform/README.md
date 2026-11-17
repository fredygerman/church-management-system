# Platform improvement programme

Planning baseline only. This document organizes the audited gaps into design, web/API, and mobile groups. It does not authorize implementation or accept any pending product or runtime decision.

## Source of truth

- Product identity and design baseline: [product design](../../product-design/README.md), [design language](../../product-design/DESIGN.md), [screen inventory](../../product-design/screen-specification.md), [visual audit](../../product-design/visual-audit.md), and [acceptance checklist](../../product-design/implementation-checklist.md).
- Programme status and execution boundaries: [run policy](RUN-POLICY.md), [backlog](backlog.md), [decisions](decisions.md), [human verification](human-verification.md), [handoff](handoff.md), and [incidental findings](incidental-findings.md).
- Group specifications are [design](groups/design.md), [web/API](groups/web-api.md), and [mobile](groups/mobile.md); detailed owning specs are linked from the stable [backlog](backlog.md). The [allocation manifest](allocation-manifest.md) maps every stable task ID to scope, ownership, dependencies, checks and dispatch fields.
- Prompt templates: [programme leader](prompts/programme-leader.md) and [worker](prompts/worker.md); the mobile prompt is owned by the mobile writer.

## Product baseline

Design for Mito Ya Baraka Church HQ as the initial context. Preserve member navigation Home / Church / Events / Library / Profile and staff navigation Dashboard / People / Services / Content / More. Membership branch context is distinct from public branch browsing. Shared account and library behavior follows item access. AI is an entry beside notifications that opens a dedicated conversation. Use the current design docs as proposed direction, not verified production artwork or behavior. Verify all church data and copy.

## Programme groups

1. **Design**: reconcile current UI with the baseline, define responsive member/staff journeys and observable states, and produce implementation-ready acceptance artifacts.
2. **Web/API**: close dashboard false-zero/missing-stat behavior, establish refresh-token type and revocation semantics, replace document storage stubs with a durable authenticated workflow, define email capability accurately, and strengthen CI/test evidence.
3. **Mobile**: separately plan and implement member home/edit/navigation and the missing library, AI, and content/commerce surfaces, subject to approved scope and contracts. Expo and Expo Router remain unapproved.

Specs verify code facts, acceptance rows and guard tests. See [allocation manifest](allocation-manifest.md) for dispatch fields. Independent fixes may proceed without a blanket foundation wave; only actual contract/schema edges block. A serialized schema/contract/integration lane names one migration owner and one bounded reviewer covering correctness, scope and complexity. CI/testing baseline is part of Q-01. Pending decisions are proposals, not approvals.

## Completion model

Completion means all human-approved backlog tasks are implemented against their specs; recorded checks have fresh command/exit/log evidence; bounded review covers correctness, scope, and complexity; integration checks pass; and every remaining human check is listed with observable steps. “Code complete” does not mean human verified or released. See [state vocabulary](RUN-POLICY.md#state-vocabulary).
