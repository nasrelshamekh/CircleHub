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
| 3 | Presence tracking (connection registry) | not started |
| 4 | Hub fan-out from the REST send path | not started |
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

Reproduction: `powershell -File %TEMP%\opencode\step2-e2e.ps1` (mints JWTs from the dev user-secrets, starts
the temp build, drives `%TEMP%\opencode\sigtest\hub-test.mjs`). Requires MySQL 8 running locally and the
`@microsoft/signalr` npm package in that directory.

## Open questions

- Commit/push cadence: one commit per step, or a single branch/Hub commit?
- Should REST fan-out (Step 4) also verify the recipient's `MessagesFrom` policy before publishing to the hub?

## Known cleanups (not yet scheduled)

- Local dev instance of `CircleHub.Api.exe` (started before this work) still serves the pre-hub build.
