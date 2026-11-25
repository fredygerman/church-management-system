# AI chat API

Status: implemented in `apps/api/src/ai` (DEC-08). Read-only. The server never executes actions.

## Endpoint

`POST /ai/chat`

- Guards: JwtAuthGuard and ChurchContextGuard (global), permission `read:self` (any signed-in member). Rate limit: 20 requests per minute per user (`AiUserThrottlerGuard`, plus the global IP throttle).
- Body: `{ "churchId"?: uuid, "message": string (1 to 1000 chars, not blank), "conversationId"?: uuid }`. `churchId` is injected by ChurchContextGuard.
- Response (normal envelope): `data = { "conversationId": uuid, "components": AiComponent[] }`. Components follow `packages/config/src/types/ai-components.ts` (see `ai-components.md`), always after `validateAiResponse`. Optional `sources` (`{ title, href? }[]`) and `uncertain` (boolean) come from the read tools of this answer: `sources` lists the tools that succeeded, `uncertain` is `true` when a tool was denied or failed (`ai.service.ts`, `toolProvenance`). Both are unset when no tool ran.
- Errors: 400 blank or invalid body; 404 conversation not found or not owned by the caller; 502 provider call failed; 503 AI settings missing or invalid (no call is made; the log names the variable, the response does not).

## Provider

Provider-neutral. The answer loop speaks one message model (`apps/api/src/ai/providers/ai-provider.ts`); an adapter per wire format translates it:

- `AI_API_FORMAT=anthropic` (default): Anthropic Messages API via `@anthropic-ai/sdk`.
- `AI_API_FORMAT=openai`: OpenAI chat-completions format over `fetch`. Works with any endpoint that speaks it, by setting `AI_BASE_URL`.

Each call times out after 30 seconds. The provider error is logged by class only; the body and the key are never logged.

## Environment

Set in the Coolify environment for church-dev. Never put these values in the repo, in docs, or in logs. `apps/api/.env.example` lists the names with empty values.

- `AI_API_FORMAT`: `anthropic` (default) or `openai`. Any other value returns 503.
- `AI_API_KEY`: required. Without it the endpoint returns 503. Sent as the Anthropic `x-api-key`, or as `Authorization: Bearer` for `openai`.
- `AI_MODEL`: model id. Defaults to `claude-haiku-5-5` for `anthropic`; required for `openai` (503 if missing).
- `AI_BASE_URL`: optional endpoint override. Defaults: the Anthropic SDK default, or `https://api.openai.com/v1` for `openai`.
- `AI_API_SECRET`: optional second credential, sent as the `x-api-secret` header on every call. Use it for a gateway that asks for one.

## Model behaviour

- The system prompt asks for answers only through the `respond` tool, with components. Prayer requests, family relationships and giving data are excluded and answered with a notice.
- Up to 4 read-tool rounds per question, and at most 6 model calls in total (including one retry).
- If `respond` is invalid, the model is asked once more with the validation errors. A second failure returns a single `notice` component.
- `confirm_action` and `form` components whose action id is not in `AI_ACTION_REGISTRY` are dropped. The registry is empty today, so these components never reach a client.
- Message text and the key are never logged.

## Read-only tools

Each tool re-checks the caller's permission on the server and uses the caller's church id. A denied call returns `permission_denied` to the model, which then answers with a notice.

| Tool | Permission | Data returned |
|---|---|---|
| `member_count` | `read:member` | total members |
| `upcoming_events` | `view:events` | up to 10 published events: title, start, location |
| `library_documents` | `read:self` | up to 20 member-visible documents (same rules as GET /api/files/library): title, description, type, date. No storage keys, no ids |
| `service_types` | `view:attendance` | service type name and active flag |

No tool exists for prayer requests, families, giving, visitors, or any write.

## Conversations and retention

- Table `ai_conversations` (migration `0012_swift_mesmero.sql`): id, user_id, church_id, messages (jsonb), created_at, updated_at, expires_at.
- Only the owner (same user and church) can read or append. Anyone else gets 404.
- `expires_at` is set to creation time plus 30 days and is not extended by later messages. Expired rows are deleted at the start of every chat call.
- Stored messages are capped at the last 12. Only the last 12 are sent to the model, starting on a user turn.

## Limits

- Message: 1 to 1000 characters. Model output: 1024 tokens per call.
- Components per response: 20 (`AI_LIMITS`). Tool results: 20 library documents, 10 events, 50-row table cap in the contract.
- Rate limit: 20 per minute per user on this route.

## Not done

- Expired conversations are removed by the daily `RetentionService` job (03:00) and lazily on chat calls.
- No endpoint to list or read a conversation.
- No action registry entries.

## Deferred until AI is in scope

- AI configuration (provider settings and keys) is deferred.
- AI testing is deferred.
- The AI feedback route (`POST /ai/feedback`) is deferred because it needs a new table. It is not implemented.
- The AI action registry (`AI_ACTION_REGISTRY`) stays empty this release.
