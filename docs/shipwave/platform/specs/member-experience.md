# Member experience

Status: Not started. Planning only.

## Outcome and product constraints
Implement member Home, Church browsing, Events, and Profile flows on existing web/API capabilities, then separately plan native mobile. HQ is first context. Branch browsing is distinct from membership switching; only memberships authorize operational context. Preserve church-wide shared library access. Profile and family privacy require approved policy.

## Facts checked against code
- Existing member portal routes/actions include `apps/web/actions/portal.ts`, `member.ts`, `family.ts`, `prayer.ts`, `event.ts`; forms include `components/form/PrayerRequestForm.tsx`, `FamilyForm.tsx`, and `MemberForm.tsx`.
- DB has `packages/db/tables/userChurchMemberships.ts`, `members.ts`, `families.ts`, `prayerRequests.ts`, `events.ts`, `eventRsvps.ts`.
- Proposed five-tab IA is in `docs/product-design/screen-specification.md`; it does not establish existing functionality.
- Active membership and branch authorization are enforced by church-context/permission guards; validate exact routes in implementation.

## Acceptance rows
| State/input | Result | Proof |
|---|---|---|
| Member opens Home in HQ | Only selected branch services/announcements and authorized staff switch appear | page test, branch fixture |
| Browse another public branch | Profile viewed while active membership remains unchanged | navigation integration test |
| Switch to branch without active membership | Denied; no branch data exposed | API guard test |
| Submit prayer request | Confirmation; private request visibility follows approved consent policy | service/controller test and privacy decision |
| Event RSVP submitted/repeated/full/closed | Correct confirmation or actionable validation; no duplicate RSVP | API tests |
| Member edits own profile | Allowed fields saved; another member's profile denied | API/UI tests |
| Empty/loading/API failure | Explicit empty, progress, retry states | component tests |

## Ownership and phases
M1 owns proposed `apps/web/app/[churchId]/member/**` and member navigation entries in `apps/web/config/sidebar.ts` (single writer; coordinate shared nav). M2 owns scoped member profile editing using existing `apps/web/components/member/member-edit-form.tsx` and `apps/web/actions/member.ts`. M3 owns prayer and RSVP member-facing flows in `apps/web/actions/prayer.ts`, `event.ts` and their pages/components. No worker shares a file in the same wave. Native iOS/Android app code is not present; mobile group owns separate proposed `apps/mobile/**` paths and must first choose framework and delivery scope. Full offline and store setup deferred.

## Decisions/migrations/checks
Decision IDs: PLAT-DEC-02 privacy/consent for prayer and family; PLAT-DEC-03 mobile framework and first platform. Schema changes, if needed, go through one migration owner, Drizzle schema edits and generated migrations only; no worker hand-writes SQL. Verify API permission/tenant tests, locale EN/SW parity, route smoke, OpenAPI and keyboard/mobile responsive checks.

## Handoff
Not started; no code changed. Sequence M1 shell, then M2/M3 independently once shared nav is merged. Human checks branch distinction, privacy and localized copy.
