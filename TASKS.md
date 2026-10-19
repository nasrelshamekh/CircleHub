# TASKS

Working log for the SignalR end-to-end encrypted messaging feature. One concern per step; each step is
implemented, verified, then reported before the next one starts. Architecture and conventions live in
`AGENTS.md`.

**Scope of this phase:** backend hub + auth, presence, Expo push fallback, and the web client. Server-side
encryption keys are out of scope (the server relays ciphertext it cannot read). Mobile follows after the web app.

## Status

| # | Step | Status |
| --- | --- | --- |
| 1 | Reconnaissance + plan (backend, web client, docs) | done |
| 2 | Hub, user-id mapping, JWT-over-query-string, CORS | done, verified |
| 3 | Recipient policy on the hub + presence tracking | done, verified |
| 4 | Hub fan-out from the REST send path | done, verified |
| 5 | `DeviceToken` entity + registration endpoints + migration | not started |
| 6 | Expo Push Service fallback for offline recipients | not started |
| 7 | Web client: `@microsoft/signalr` provider, live thread + unread badge | not started |
| 8 | Mobile client (deferred until the web app is tested) | deferred |

## Step log

### Step 1 — Reconnaissance + plan (done)

- Backend: .NET 10, JWT bearer with `sub` claim and `tokenVersion` re-checked against the DB on every request;
  `MessagesController` writes to MySQL synchronously; no SignalR, no push infrastructure, no device tokens,
  no test project.
- Web: axios + React Query (`useConversations`, `useConversation`, `useUnreadMessages`), token in
  `localStorage`, no SignalR package.
- Docs reviewed before writing code: SignalR authentication/authorization, SignalR security (CORS), SignalR
  configuration (advanced HTTP options), and the Expo Push Service API.
- Decisions confirmed with the owner: REST persists + hub fans out; ciphertext stored opaquely in
  `Message.Content`; new `DeviceToken` table; server-opaque encryption for this phase; web first.

### Step 2 — Hub, identity and auth plumbing (done, verified)

Added:

- `Hubs/ChatHub.cs` — `[Authorize]` hub with `SendEncryptedMessage(recipientId, encryptedPayload)` routed with
  `Clients.User(recipientId)`; sender identity taken from the JWT; validation for self-send, non-Guid
  recipient, empty payload, and payloads over 16 KB; connection open/close/drop logging.
- `Dtos/EncryptedMessageEnvelope.cs` — the relayed envelope (`senderId`, `encryptedPayload`, `sentAt`).
- `Services/CircleHubUserIdProvider.cs` — maps `Clients.User(id)` to the `sub` claim.
- `Program.cs` — `AddSignalR()`, `IUserIdProvider` registration, `OnMessageReceived` reading `access_token`
  for `/hubs/*` only, a `SignalR` CORS policy with credentials, and
  `MapHub<ChatHub>("/hubs/chat")` with `CloseOnAuthenticationExpiration = true` + `RequireCors("SignalR")`.

Verification (temp build on a spare port so the owner's running instance was untouched):

| Check | Result |
| --- | --- |
| `dotnet build` | 0 warnings, 0 errors |
| `POST /hubs/chat/negotiate` without a token | 401 + `ApiErrorResponse` JSON (hub mapped, `[Authorize]` enforced) |
| Unknown hub path `/hubs/nope/negotiate` | 404 (route is specific) |
| Preflight `OPTIONS /hubs/chat/negotiate` | 204, `Allow-Credentials: true`, `Allow-Methods: GET,POST,DELETE`, origin echoed |
| Preflight `OPTIONS /api/messages` | 204, `Allow-Origin: *` (REST policy unchanged) |
| Negotiate with a revoked token (`tokenVersion + 1`) | 401 (DB-backed revocation applies to hub paths) |
| Two real users over real JWTs: A → `SendEncryptedMessage(B, payload)` | B receives `ReceiveEncryptedMessage` with `senderId` = A; payload byte-identical |
| Sender does not receive their own relayed message | confirmed |
| Self-send / non-Guid id / empty payload / 16 KB+ payload | rejected with `HubException` |
| `GET /api/messages/conversations` with a minted token | 200 (REST path unaffected) |

Reproduction: `powershell -File %TEMP%\opencode\step3-e2e.ps1`. Requires MySQL 8 running locally and the
`@microsoft/signalr` npm package in the harness directory.

### Step 3 — Recipient policy on the hub + presence tracking (done, verified)

The owner chose to close the hole where the hub relay ignored the recipient's privacy setting, and to track
connections for the upcoming offline/push decision.

Added:

- `Services/MessagePolicyService.cs` — the "may this sender message this recipient?" rule, moved out of
  `MessagesController` unchanged. `MessagesController` and `ChatHub` now share it, so the two paths cannot
  drift apart.
- `Services/IConnectionTracker.cs` + `Services/ConnectionTracker.cs` — per-user registry of live connections
  (`ConcurrentDictionary<Guid, ConcurrentDictionary<string, byte>>`), registered as a singleton. A user with
  several tabs/devices counts once but every connection receives a relayed envelope.
- `ChatHub` — loads the recipient, applies `MessagePolicyService`, and refuses with a generic
  `HubException` so the hub cannot be used to discover which user ids exist. The real reason
  (unknown user vs `MessagesFrom=Followers`) is logged server-side. Connections are registered and
  deregistered in `OnConnectedAsync`/`OnDisconnectedAsync`, which also log the live-connection and
  online-user counts.
- `CircleHubUserIdProvider` — normalises the `sub` claim to the canonical Guid form, and the hub routes with
  that same form, so casing can never silently break delivery.

Verification (12/12 client checks, 4/4 presence checks, against the real dev database):

| Check | Result |
| --- | --- |
| `dotnet build` | 0 warnings, 0 errors |
| A (2 connections) → allowed recipient (2 connections) | all 4 connections receive; payload byte-identical; `senderId` from the JWT |
| Sender's own connections | receive nothing |
| Self-send / non-Guid / empty / 16 KB+ payload | rejected |
| Recipient with `MessagesFrom=Followers` that A does not follow (hub) | refused; nothing delivered |
| Same recipient via `POST /api/messages` | 403 with the same rule's message |
| Unknown user id | refused with the identical generic message (no id enumeration); real reason only in the log |
| Presence: A's second connection | logged as 2 live connections, still 1 user online |
| Presence: B connects | 2 users online |
| Presence: connections close in order | 1 left → 0 left, user forgotten, 0 users online |
| Revoked token negotiate | 401 |

### Step 4 — Hub fan-out from the REST send path (done, verified)

The write path stays authoritative and now also mirrors the stored message to whatever the recipient has
open, reusing the shared envelope so the web client needs a single handler.

Added:

- `Services/MessageDeliveryService.cs` — publishes to `IHubContext<ChatHub>.Clients.User(recipientId)` and
  logs when the recipient has no live connection (the hook point for the Expo push fallback).
- `Dtos/EncryptedMessageEnvelope.cs` — gained optional `messageId`/`conversationId`, filled in by the fan-out
  so the client can refresh one thread; null for a pure hub relay.
- `MessagesController.SendMessage` — delivers after `SaveChangesAsync`, only when there is content, and
  deliberately not tied to `RequestAborted`: the message is stored either way, so a caller hanging up must
  not swallow the notification.

Verification (11/11 client checks + 2 server-log checks):

| Check | Result |
| --- | --- |
| REST 200 with the recipient connected twice | both connections received the stored message |
| Envelope contents | `messageId`/`conversationId` match the REST response, `senderId` from the JWT, payload byte-identical, `sentAt` parses |
| REST 200 to a recipient with no connection | nothing delivered and nothing misrouted; server logs "stored but was not delivered in real time" |
| REST 403 for a restricted recipient | nothing delivered; the refusal short-circuits before the hub is involved |

Reproduction: `powershell -File %TEMP%\opencode\step4-e2e.ps1`.

## Open questions

- Where does the client-side key exchange live (per-device key bundles, WebCrypto ECDH), and does the
  2000-character `Message.Content` cap need to grow first? Base64 ciphertext for a long message will not fit.

## Incidents

- **Interference by a second agent (during Step 3).** A different model reverted
  `Controllers/MessagesController.cs` to its pre-Step-3 state and left two scratch files (`probe.js`,
  `smoke.js`) in the repo root; it also created a verified `smoketest` user in the dev database. The scratch
  files were deleted, the controller change was re-applied, and everything else was verified untouched (no
  stashes, no extra commits, mobile repo clean). The `smoketest` user is still in the dev database and is
  currently used by the harness as the restricted recipient.

## Known cleanups (not yet scheduled)

- Local dev instance of `CircleHub.Api.exe` (started before this work) still serves the pre-hub build.
