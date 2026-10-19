# AGENTS.md

Guidance for agents working in this repository (CircleHub: React + Vite frontend, ASP.NET Core 10 API, MySQL 8).
See `README.md` for the product overview and setup steps; this file covers conventions, commands, and the
design of the real-time encrypted messaging feature.

## Commands

Backend (from `circlehub-dotnet/CircleHub/CircleHub.Api`):

```bash
dotnet build CircleHub.Api.csproj        # must be warning-free
dotnet run --project CircleHub.Api -lp http
dotnet ef migrations add <Name>          # dotnet-ef is pinned in dotnet-tools.json
dotnet ef database update
```

Frontend (repo root):

```bash
npm run dev
npm run lint
npm run build
```

## Conventions

- Controllers return `ApiResponse<T>` (`Dtos/ApiResponse.cs`) for success and `ApiErrorResponse` for failures,
  created through the local `Fail(status, message)` helper. Keep new endpoints consistent with that shape.
- The authenticated user id always comes from the JWT `sub` claim (`MapInboundClaims = false`), parsed as a
  `Guid` — see `MessagesController.CurrentUserId`. Never trust a user id supplied by the client.
- `Program.cs` uses top-level statements; services are registered inline. Options live in `appsettings.json`
  with secrets in .NET user-secrets (`UserSecretsId` is in the csproj).
- EF entities use `Guid` keys, `required` properties, and explicit `OnModelCreating` configuration.
- Comments explain *why* (security/behaviour trade-offs), not *what*.

## Real-time encrypted messaging (SignalR)

Design record for the in-progress end-to-end encrypted messaging work. Decisions were confirmed with the
project owner before implementation; see `TASKS.md` for status.

### Decisions

| Topic | Decision |
| --- | --- |
| Send path | `POST /api/messages` remains the single write path (persists + unread counts). The server then fans out to the recipient's live connections. |
| Ciphertext storage | The server stores the encrypted string as an opaque blob in `Message.Content` and never inspects it. |
| Push tokens | A dedicated `DeviceToken` table (multi-device), pruned when Expo reports `DeviceNotRegistered`. |
| Encryption scope | The server is a dumb pipe; the actual crypto (WebCrypto ECDH + AES-GCM) is a later phase. |
| Rollout order | Web app first, then the Expo mobile app. |

### Server surface

- Hub: `Hubs/ChatHub.cs`, mapped at `GET|POST /hubs/chat` (`MapHub<ChatHub>("/hubs/chat")`).
- Client → server method: `SendEncryptedMessage(string recipientId, string encryptedPayload)`.
- Server → client event: `ReceiveEncryptedMessage` (`ChatHub.ReceiveMessageMethod`) carrying
  `Dtos/EncryptedMessageEnvelope` `{ senderId, encryptedPayload, sentAt }`.
- Routing uses `Clients.User(recipientId)`, resolved by `Services/CircleHubUserIdProvider`, which maps the
  SignalR user id to the `sub` claim. SignalR's default `ClaimTypes.NameIdentifier` is never emitted by this
  API, so without that provider `Clients.User(id)` would silently deliver to nobody.

### Security invariants

- `[Authorize]` on the hub. The browser cannot set an `Authorization` header on a WebSocket, so
  `JwtBearerEvents.OnMessageReceived` reads `?access_token=` **only** for paths starting with `/hubs`.
- `OnTokenValidated` (token version check against `Users.TokenVersion`) runs for hub requests too, and
  `CloseOnAuthenticationExpiration = true` closes a connection once its JWT expires, so a revoked session
  cannot keep streaming.
- The sender identity is always `Context.UserIdentifier`; a sender id in the payload would allow impersonation.
- Payload cap is 16 KB (`ChatHub.MaxPayloadLength`), below SignalR's 32 KB `MaximumReceiveMessageSize`.
- Access tokens in the query string end up in request logs. `appsettings.json` sets
  `Microsoft.AspNetCore` to `Warning`, which suppresses the `Info`-level request URL logging that would
  otherwise record the token.

### CORS

SignalR requires credentials on the cross-origin negotiation request, which is incompatible with the global
`AllowAll` policy (`AllowAnyOrigin`). A separate `SignalR` policy (`SetIsOriginAllowed(_ => true)` +
`AllowCredentials`, methods `GET, POST, DELETE`) is applied with `RequireCors("SignalR")` on the hub endpoint.
The endpoint policy takes precedence over the middleware default, so REST keeps `Allow-Origin: *`.

### Client contract (web)

- `accessTokenFactory` returns the `localStorage` token; browsers then send it as `access_token` on the
  WebSocket/SSE negotiate request.
- The sender id is not part of the payload call — it is added by the server.
- WebSockets are not protected by CORS, so the JWT is the only gate on hub calls.

## Environment notes / gotchas

- `ASPNETCORE_ENVIRONMENT=Development` is required for user-secrets to load; without it `Jwt:Key` is empty and
  authentication fails with `IDX10703: ... key length is zero`.
- A running `CircleHub.Api.exe` locks `bin/Debug/net10.0`, so `dotnet build` fails with `MSB3021`. Either stop
  the running instance or build to another output directory: `dotnet build <proj> -o <temp dir>`.
- MySQL 8 is installed locally; the CLI is at
  `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`. The dev credentials come from user-secrets.
- Migrations require `dotnet ef` (pinned in `dotnet-tools.json`).
