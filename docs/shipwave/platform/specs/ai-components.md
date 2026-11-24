# AI response components contract

Status: Contract defined in code; no AI endpoint, provider call or client renderer exists yet. Implements the shape decided in DEC-08 (see `../decisions.md`).

## Source of truth

- Code: `packages/config/src/types/ai-components.ts` (types, limits, action registry type, `validateAiResponse`). Exported from `@church/config` and from the subpath `@church/config/ai`, which avoids the server-only DB schema export.
- Tests: `packages/config/src/types/ai-components.test.ts`, run with `pnpm --filter @church/config test` (compiles with `tsc`, then `node --test`).

The API validates every AI answer with `validateAiResponse` before sending it. Web and mobile render only the listed component types, natively. There is no HTML, markdown, script, or free-form props anywhere in the contract.

## Response shape

`{ components: AiComponent[] }`, at most 20 components. Unknown keys are rejected at every level.

| type | Fields | Limits |
|---|---|---|
| `text` | `text` | 1 to 280 chars |
| `stat_cards` | `items[]`: `label`, `value` (string), `hint?` | 1 to 12 items; label/value 120 chars, hint 280 |
| `table` | `columns[]`: `key`, `label`; `rows[]`: record of column key to string, number, boolean or null | 1 to 10 columns, 0 to 50 rows; cell strings 280 chars; row keys must be column keys |
| `list` | `items[]`: `title`, `subtitle?`, `href?` | 1 to 50 items |
| `form` | `fields[]`: `name`, `label`, `kind` (`text`, `number`, `date`, `select`, `textarea`), `required?`, `options?` (select only); `submit`: `label`, `actionId` | 1 to 20 fields; 1 to 100 options |
| `confirm_action` | `title`, `summary` (plain statement of what happens), `action`: `actionId`, `params` | params at most 20 |
| `link_button` | `label`, `href` | href relative (see below) |
| `notice` | `tone` (`info`, `warning`), `text` | 280 chars |

Names (`name`, column `key`, param names) match `^[a-zA-Z][a-zA-Z0-9_]{0,63}$`. Action ids match `area.action` in lowercase, for example `attendance.record`.

The limits above that the spec did not fix (component count, item counts, label lengths) are first-pass choices. Change them in `AI_LIMITS` together with the tests.

## Href rule

Every `href` must be a relative in-app path: it starts with `/`, is not `//...`, contains no backslash, and no whitespace or control characters. Absolute URLs, `javascript:`, `data:` and similar schemes are rejected.

## Action registry

- `AI_ACTION_REGISTRY` maps `actionId` to `{ method, path, permission, params }`, where `permission` is a `PermissionAction` from `@church/config` and `params` is a whitelist of names.
- The registry ships empty. Real entries are added only when approved. Example in a code comment only.
- Clients execute an action only when its `actionId` is a key in the registry, and only after the user taps the confirm button. The request then runs through the existing API with the user's own token. The API still enforces permissions.
- The validator checks shape only. It does not check that an `actionId` is registered; the client does that at execution time.

## Rules

1. **Read-only by default.** Components never change data on render. Writes happen only through `confirm_action` or form submit, after confirmation.
2. **Confirm before action.** No automatic execution of any `actionId`.
3. **User's own permissions.** The AI answers only from data the signed-in user's role can already read. Actions run with the user's token, so the API decides.
4. **Excluded data classes.** Prayer requests and family details (DEC-02) are never sent to the model or shown in AI answers.
5. **Retention.** AI conversations are kept 30 days, then deleted (DEC-08). Deletion job not built yet.
6. **Provider.** Anthropic Claude API (DEC-08). The API key lives only in the Coolify environment, never in the repo.
7. **Validation at the boundary.** Responses that fail `validateAiResponse` are not rendered. Show an unavailable state instead.

## Open items

- AI API endpoint and provider wiring: not started (blocked on `apps/api` ownership and review).
- Web and mobile renderers: not started.
- Retention purge job: not built.
- Real action registry entries: none approved.
