# Lane 13: design-system-and-brand

- **Waves:** 1 (tokens, primitives, contrast), 3 (brand wiring, dark mode, motion, gallery, a11y lint).
- **Backlog IDs:** RM-047, 048, 049 (W1); RM-118, 119, 120, 121, 122, 125, 148 (W3).
- **Decisions:** D-12 (brand kit from the church; fidelity capped at 6/10 without it), D-27 (terminology), D-20 (tab bar), DEC-07 (no commerce in the design).
- **Depends on:** nothing for W1. W3 brand wiring needs D-12; RM-119 needs RM-091 (bell) from lanes 07/09.
- **Blocks:** lanes 07 (`Sheet`), 09 (`Avatar`, `Segmented`), 10, 14 (web codemod needs tokens), 02 (icon and splash for `app.json`).
- **Model:** Luna medium; split W1 into brief A (tokens), B (primitives), C (contrast and targets).

## Goal

One token source for web and mobile with a contrast test, the missing mobile primitives, and the brand and fidelity work the concept boards ask for, without inventing church data.

## Facts (verified in audit)

Hex values are duplicated in `apps/mobile/theme/index.ts:3-16` and `apps/web/app/globals.css:8-18` (DX-16). Mobile has 8 UI primitives; web has about 45 shadcn files (DX-17). Input border `#E2E8F0` on white is about 1.2:1 and the warning pill text about 4.4:1 (hand-computed, DX-20, confirm with the new test). There is no logo, icon, splash or photography in the repo (DX-02, DX-09). The average fidelity to the concept boards is 3.1/10; target about 7 once photography and logo exist (DX section 3). Concept boards contain invented branches, prices and statistics that must not be seeded (DX-03, DX-31).

## Owned files (exclusive)

```
packages/ui-tokens/**   (new, incl. its own package.json; the lockfile is the integrator's)
apps/mobile/theme/**, apps/mobile/theme/tokens.generated.ts (generated)
apps/mobile/components/ui/**
apps/mobile/assets/**   (new), apps/mobile/app/(dev)/**   (new: dev-only gallery), apps/mobile/.maestro/**   (new)
apps/web/app/globals.css, apps/web/app/tokens.generated.css (generated), apps/web/tailwind.config.ts
apps/web/components/ui/**, apps/web/eslint.config.mjs, apps/web/public/**
apps/web/playwright.config.ts, apps/web/tests/visual/**   (new)
docs/brand/**   (new)
```

Not owned: screens and feature components (they consume), `components/header/**` (lane 07), `apps/web/components/layout/**` (lane 14), `app.json` (lane 02), `package.json` and lockfile (integrator).

## Tasks (in order)

### Wave 1

1. **RM-047 tokens.** `packages/ui-tokens/src/tokens.ts` (`as const`): `color.light`, `color.dark`, `space`, `radius`, `type`, `shadow`, `motion`; semantic names `canvas, surface, ink, muted, brand, brandStrong, onBrand, accent, tint, border, inputBorder, focusRing, success, warning, danger, overlay`. `src/generate.ts` writes `apps/web/app/tokens.generated.css` (`@theme` variables, `.dark` overrides, shadcn bridge such as `--background: var(--color-canvas)`) and `apps/mobile/theme/tokens.generated.ts`. `apps/mobile/theme/index.ts` re-exports with the same `colors.*` names so no screen needs edits in the first PR; `globals.css:8-18` hex copy is removed only after the generated file is imported. `src/contrast.test.ts` asserts every declared text-on-surface pair at 4.5:1 and every control boundary at 3:1 in both schemes. Check whether `apps/web/tailwind.config.ts` is referenced (Tailwind v4 CSS-first config); delete it if dead and say so. Starting dark values from DX 4.3 (verify with the test): canvas `#0B1220`, surface `#111A2E`, ink `#E5EDFF`, muted `#94A3B8`, brand `#60A5FA`, accent `#A78BFA`, border `#24314D`. Light values unchanged until D-12 confirms (`#1D4ED8`, `#172554`, `#7C3AED`).
2. **RM-048 primitives (mobile, `components/ui/`).** `Sheet` (modal bottom sheet, focus moves in and returns, visible Close button, Android back closes, drag optional but never required), `Avatar` (image plus initials fallback, load-error fallback, sizes), `Skeleton`, `EmptyState` (icon, title, body, optional action), `Toast` (provider and hook, announced to screen readers), `Segmented` (promoted from `components/events/segmented-control.tsx`; lane 08 migrates its usage), `TextField` error association and `autoComplete` props. All with roles, labels and 44 px minimum targets.
3. **RM-049 contrast and targets.** `inputBorder` token at 3:1 or better and use it in `text-field.tsx`; darken warning pill text (`pill.tsx`); `SectionHeader` gets `minHeight: 44`, `hitSlop` and `accessibilityRole="header"` (MM-27, MM-30); `ListRow` gets avatar and trailing-action slots; button `size` prop. Do not change public prop names used by existing screens.

### Wave 3

4. **RM-118 brand kit.** After D-12: place logo SVG and PNG exports, app icon (1024 px, adaptive layers, monochrome), splash in `apps/mobile/assets/**` and `apps/web/public/logos/**`; `ui/logo.tsx`; `ui/photo.tsx` (slot with alt text and fallback tone); `docs/brand/README.md` with the kit checklist (DX 4.4) and sample-content policy (labelled fixtures, non-production only). Never use concept-board imagery or data.
5. **RM-119.** `ui/brand-header.tsx` (logo, AI pill slot, bell slot) and a photo-capable `ui/hero.tsx` replacing the unused `hero-banner.tsx`; lanes 07 and 08 adopt them.
6. **RM-120 dark mode** (`useColorScheme` in `theme/`), **RM-121 motion and haptics** (durations from tokens: micro 120 ms, standard 200 ms, sheet 280 ms spring; Reanimated only on `transform` and `opacity`; reduced-motion check; haptics `selection` on tab change, `success` on RSVP and saved forms; needs `expo-haptics` and Reanimated in the dependency batch), **RM-122 icon wrapper** `ui/icon.tsx` mapping names to Lucide (screen migration happens piecemeal in owner lanes).
7. **RM-125 QA tooling.** Dev-only gallery route `app/(dev)/gallery.tsx` rendering every primitive and state (loading, empty, error, offline, pill tones) in both schemes and locales, guarded by `__DEV__`; Maestro flows for sign-in, Home, Events RSVP, Library open, Profile edit; Playwright visual config with frozen clock, viewports 360x800, 390x844, 1280x800, light and dark; `eslint-plugin-jsx-a11y` in `eslint.config.mjs` and a check-only lint config.
8. **RM-148** delete unused `quick-action.tsx` and `hero-banner.tsx` after grep confirms no importers; ask lane 08 to remove `publicChurchesApi` from `lib/library-api.ts`.

## Contracts

- Token names above are the API; screens import `colors`, `spacing`, `radii`, `type` from `apps/mobile/theme` and CSS variables on web. No raw hex in new code.
- `Sheet` props: `visible`, `onClose`, `title`, `children`, `closeLabel`; `Avatar` props: `uri?`, `name`, `size`; `Segmented` props: `options`, `value`, `onChange`, `accessibilityLabel`. Frozen in the first PR so lanes 07, 08 and 09 can code against them.

## Acceptance (testable)

- `pnpm --filter @church/ui-tokens test` passes: all pairs 4.5:1 (text) and 3:1 (boundaries) in light and dark; failing a pair fails the test.
- Regenerating tokens produces no diff (CI check); web and mobile still build with old names.
- Primitives: roles and labels present, 44 px targets, Sheet closes with Android back and the Close button, Avatar shows initials without a photo and on load error (component logic tests).
- Gallery (W3) renders every primitive without crash in both schemes.
- No brand asset or photo appears that is not in the D-12 kit; no price, cart or commerce element exists.

## Test plan (targeted)

`pnpm --filter @church/ui-tokens test`; `pnpm --filter mobile test` for `ui-*` tests; one final `pnpm --filter mobile typecheck` and `pnpm --filter web type-check`. W3: Playwright and Maestro are run on DEV or locally, not in this brief's pass unless asked. Device visual check at 200% font scale and in dark mode via panel agent-device.

## Risks

- A new workspace package needs the integrator's lockfile step; do not run `pnpm install`.
- Replacing colours globally can shift screens: keep names 1:1 and review screenshots.
- Dark mode needs every screen to use tokens; raw hex in screens will look wrong (found by review, fixed in owner lanes).
- Brand assets block on the church (D-12); do not substitute concept imagery.
- Reanimated and haptics add native modules: development build required (not Expo Go).

## Agent brief (A: tokens package)

```
ROLE: build agent, lane 13 design-system-and-brand, brief A (RM-047 tokens). Leaf worker: start no subagents.
REPO: /Users/upstairs/Personal/builds/church/church-management-system  BRANCH: design/mito-ya-baraka-concepts (stay on it)
READ FIRST: docs/roadmap/README.md (ground rules), docs/roadmap/specs/lane-13-design-system-and-brand.md (facts, task 1), docs/roadmap/audits/design-system-ux.md DX-16, DX-20, 4.1, 4.3.
OWN (may edit): packages/ui-tokens/** (new, create its own package.json and tsconfig), apps/mobile/theme/**, apps/web/app/globals.css, apps/web/app/tokens.generated.css (generated), apps/web/tailwind.config.ts (only if dead).
DO NOT TOUCH: any screen/component, root package.json, pnpm-lock.yaml, other packages' package.json, API.
RULES: no commits/push; do NOT run pnpm install or pnpm add (the integrator wires the workspace package and lockfile); write tests so they run with node --test or tsc output.
GOAL: a single token source generating web CSS and mobile TypeScript, with a contrast test, without changing any existing token name used by screens.
STEPS:
1. Read apps/mobile/theme/index.ts (colors, spacing, radii, type) and apps/web/app/globals.css:1-210 (semantic tokens, .dark block, shadcn variables). Confirm whether tailwind.config.ts is referenced (Tailwind v4 CSS-first).
2. packages/ui-tokens/src/tokens.ts: as const color.light/dark, space, radius, type, shadow, motion; keep current light values exactly; add inputBorder (>=3:1 on surface/canvas) and dark values from the spec.
3. src/generate.ts: write apps/web/app/tokens.generated.css (@theme, .dark, shadcn bridge) and apps/mobile/theme/tokens.generated.ts; apps/mobile/theme/index.ts re-exports with identical colors.* names plus a scheme selector (useColorScheme) that defaults to light until screens adopt it.
4. src/contrast.test.ts: declare text-on-surface and boundary pairs, assert 4.5:1 / 3:1 for both schemes; report any current pair that fails (do not hide failures).
5. globals.css: import tokens.generated.css and remove the duplicated hex block only if the build output is identical for the same variables.
VERIFY: run the package's test via node --test on the compiled output (tsc in packages/ui-tokens); pnpm --filter mobile typecheck; pnpm --filter web type-check (once each).
REPORT (max 15 lines): files created/changed; RM-047 status; contrast pairs that failed and the values chosen; tests run/skipped; requests (integrator: add packages/ui-tokens to the workspace/turbo pipeline and lockfile; lane 02: CI drift check for generated files); open risks.
```

Briefs B (primitives, task 2) and C (contrast and targets, task 3) reuse this header with the matching owned files (`apps/mobile/components/ui/**`).
