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
| Typing signals | Hub-only and ephemeral: relayed to whatever is live, never stored, never pushed, refused silently, and believed by the recipient for a few seconds at a time. |
| Message sound | Plays for a message the reader cannot see landing — silent only when that conversation's thread is open in a tab that is both visible and focused. A short committed chime, no mute control yet. |
| Encryption scope | The server is a dumb pipe; the actual crypto (WebCrypto ECDH + AES-GCM) is a later phase. |
| Rollout order | Web app first, then the Expo mobile app. |

### Server surface

- Hub: `Hubs/ChatHub.cs`, mapped at `GET|POST /hubs/chat` (`MapHub<ChatHub>("/hubs/chat")`).
- Client → server method: `SendEncryptedMessage(string recipientId, string encryptedPayload)`.
- Server → client event: `ReceiveEncryptedMessage` (`ChatHub.ReceiveMessageMethod`) carrying
  `Dtos/EncryptedMessageEnvelope` `{ senderId, encryptedPayload, sentAt }`.
- Second client → server method: `SendTyping(string recipientId, bool isTyping)`, relayed as `TypingChanged`
  (`ChatHub.TypingChangedMethod`) carrying `Dtos/TypingChangedEnvelope` `{ userId, isTyping }`. It applies the
  same recipient policy as a real message, so typing cannot be used to reach someone whose `MessagesFrom`
  refuses the sender — and every rejection is *silent* (reason at `Debug`), because the signal is raised
  automatically on each keystroke burst: it must neither raise an error the user never asked for nor let a
  refused client write to the log at will. Nothing is stored, nothing is pushed, and an offline recipient is
  simply not told; a stale "typing…" would be worse than a missing one.
- Routing uses `Clients.User(recipientId)`, resolved by `Services/CircleHubUserIdProvider`, which maps the
  SignalR user id to the `sub` claim and normalises it to the canonical Guid form. SignalR's default
  `ClaimTypes.NameIdentifier` is never emitted by this API, so without that provider `Clients.User(id)`
  would silently deliver to nobody.
- The "may this sender message this recipient?" rule lives in `Services/MessagePolicyService`. Both
  `MessagesController` (the write path) and `ChatHub` call it, so the recipient's `MessagesFrom` setting
  cannot be bypassed by calling the hub directly instead of REST.
- Live connections are registered in `Services/IConnectionTracker` (`Add`/`Remove`/`IsOnline`), which is what
  will decide between real-time delivery and a push notification in the fallback step.
- `Services/MessageDeliveryService` mirrors a stored message to the recipient's live connections through
  `IHubContext<ChatHub>`. It is called after the DB commit, so a client that reacts by fetching always finds
  the row, and it is deliberately *not* tied to `RequestAborted`: the message is stored either way, so a
  caller hanging up must not swallow the notification. A recipient with no live connection is logged there,
  which is exactly where the Expo push fallback goes.

### Security invariants

- `[Authorize]` on the hub. The browser cannot set an `Authorization` header on a WebSocket, so
  `JwtBearerEvents.OnMessageReceived` reads `?access_token=` **only** for paths starting with `/hubs`.
- `OnTokenValidated` (token version check against `Users.TokenVersion`) runs for hub requests too, and
  `CloseOnAuthenticationExpiration = true` closes a connection once its JWT expires, so a revoked session
  cannot keep streaming.
- The sender identity is always `Context.UserIdentifier`; a sender id in the payload would allow impersonation.
- Payload cap is 16 KB (`ChatHub.MaxPayloadLength`), below SignalR's 32 KB `MaximumReceiveMessageSize`.
- The hub applies the same recipient policy as REST and refuses with a deliberately generic message
  ("This user isn't accepting messages right now"), so it cannot be used to probe for existing user ids.
  The real reason (unknown user / `MessagesFrom=Followers`) is written to the server log instead.
- Access tokens in the query string end up in request logs. `appsettings.json` sets
  `Microsoft.AspNetCore` to `Warning`, which suppresses the `Info`-level request URL logging that would
  otherwise record the token.

### Presence

`ConnectionTracker` keeps a `ConcurrentDictionary<Guid, ConcurrentDictionary<string, byte>>` of live
connections, so a user with several tabs/devices is still counted once (`OnlineUserCount`) while every one of
their connections receives a relayed envelope. Users are dropped from the map when their last connection
goes away; removal is a conditional `TryRemove(KeyValuePair)` so a connection that arrives during teardown is
not lost.

The registry is process-local state: an instance can only deliver to the connections it owns. Running more
than one API instance therefore needs a shared backplane (Redis) and sticky sessions at the proxy.

`Users.LastSeenAt` is the durable half: it is stamped when a user's **first** connection opens and when their
**last** one closes, so a process that dies without running `OnDisconnectedAsync` still leaves a believable
time behind. `Services/PresenceService` owns both halves — `IsOnline` for the REST projections, the stamping,
and the fan-out — and pushes `ChatHub.PresenceChangedMethod` (`PresenceChanged`) carrying
`Dtos/PresenceChangedEnvelope` `{ userId, isOnline, lastSeenAt }`.

Only a *transition* is announced: a second tab belongs to a user who is already shown online, and the offline
event (the only one that carries a timestamp) is sent only when the connection count reaches zero. The
audience is the other participants of the user's existing conversations, so presence is never visible to
strangers; on the REST side it only exists on `ConversationUserDto` (`ConversationDto.OtherUser`,
`ConversationThreadDto.OtherUser`), never on `AuthorDto`, which every post and comment also returns.

`OnDisconnectedAsync` stamps with `CancellationToken.None` on purpose: `Context.ConnectionAborted` is already
cancelled at that point, so passing it would cancel the write that records when the user was last around.

### CORS

SignalR requires credentials on the cross-origin negotiation request, which is incompatible with the global
`AllowAll` policy (`AllowAnyOrigin`). A separate `SignalR` policy (`SetIsOriginAllowed(_ => true)` +
`AllowCredentials`, methods `GET, POST, DELETE`) is applied with `RequireCors("SignalR")` on the hub endpoint.
The endpoint policy takes precedence over the middleware default, so REST keeps `Allow-Origin: *`.

### Client contract (web)

Wiring lives in `src/services/chatHub.js` (connection factory + event name) and
`src/context/ChatConnectionContext.jsx`, which `src/main.jsx` mounts inside the auth provider so one
connection serves the whole signed-in session. `src/hooks/useChatConnection.jsx` exposes its status to any
component (`ChatConnectionStatus` renders the pill in the Messages header).

- Event `ReceiveEncryptedMessage` carries `EncryptedMessageEnvelope`. `messageId` and `conversationId` are
  filled in by the REST fan-out (null for a pure hub relay). One event name covers both delivery paths.
- The hub URL is derived from `VITE_BASE_URL` (`<rest root>` → `<rest root minus /api>/hubs/chat`), so there
  is a single source of truth for the API location.
- `accessTokenFactory` returns the `localStorage` token, which browsers send as `access_token` on the
  negotiate request, and it is read on every negotiation so reconnects pick up the current token.
- On an incoming message the context invalidates `queryKeys.conversations()`. React Query matches keys by
  prefix, so this also covers `conversation(id)`; the list, the open thread and the unread badge all refresh
  from the server rather than being patched by hand.
- Reconnects retry every 10s indefinitely. The SignalR default (0s, 2s, 10s, 30s, then give up) would leave
  a chat tab silently dead after a short outage.
- A *failed first* `start()` is retried every 5s by the context. `withAutomaticReconnect` only recovers a
  connection that was established once, so a tab opened while the API is down would otherwise stay dead.
- The connection reports `connecting` / `live` / `reconnecting` / `offline` (`idle` while signed out), and
  the chip is deliberately quiet while `live` or during the initial `connecting`: it only appears when
  real-time delivery is actually impaired, so it is not noise on every page load.
- Sending is optimistic: the composer hands the thread a temporary bubble (`pending: true`, reduced opacity)
  before the request resolves, and the thread stops rendering it as soon as the stored message with that id
  appears. The stored row is still the source of truth — nothing is written into the thread cache, so a
  background refetch can never wipe or duplicate the bubble.
- The thread only follows new messages when the reader is already at the bottom (within 80px). Otherwise it
  holds the scroll position and shows a floating "New message" chip that jumps to the latest; opening a
  conversation always starts at the latest message.
- `useUnreadTitle` (mounted in the authenticated layout, not at the app root — the conversations query has no
  auth guard) prefixes the tab title with `(n)` while unread messages exist.
- The sender id is not part of the payload call — it is added by the server.
- `PresenceChanged` is *patched* into the caches (`withPresence` in the context) rather than invalidated. One
  helper covers both shapes React Query holds under the `conversations()` prefix — the list is an array, a
  thread is `{ pages }` — and returns its input untouched when nothing matched, so unrelated caches keep their
  identity. A refetch still follows from `useConversation`'s invalidate-on-change effect; the patch is what
  makes the change visible without waiting for a round trip.
- `PresenceLabel` is the only place the wording lives ("Online" / "Last seen 12 minutes ago" / "Offline" for a
  user who has never connected) and `PresenceDot` the avatar dot; the list row and the thread header both use
  them, so the two cannot drift apart. The relative text re-renders on a 60s interval while the other person
  is away — a frozen "12 minutes ago" is wrong within a minute — and nothing ticks while they are online.
- `onreconnected` invalidates `conversations()`: presence moved while the socket was down and no event was
  delivered to us for that window.
- In development, React StrictMode mounts effects twice, so the first connect is stopped mid-negotiation and
  SignalR logs "The connection was stopped during negotiation" before the second one succeeds. That is
  expected dev-only noise, not a failure.
- Typing is the only client → server signal the web app sends. `sendTyping` (`src/services/chatHub.js`) fires
  it and forgets it — never awaited, no error surfaced, and skipped unless the connection is `Connected` — and
  `useTypingBroadcast` throttles it: one "started" per 2s while keys keep coming, an explicit "stopped" after
  3s of silence, on send, on switching conversation and on leaving the thread. Ten keystrokes become two
  signals, not ten.
- The receiving side *believes* a claim for 6s (`TYPING_CLAIM_MS`): the context stamps a deadline per user and
  sweeps once a second, so the indicator clears itself when the "stopped" signal is lost to a killed tab or a
  dropped socket — which is why nothing here is persisted, queued or replayed. A sweep that finds nothing
  expired returns its input untouched, so a sender who keeps refreshing costs no re-render.
- The claim is keyed by the user id the server put on it (`useTypingIndicator(userId)`), so it only ever
  renders on that person's row in the list and in their thread: several partners can be typing at once, and a
  claim from someone whose conversation is not open (or who is not a partner at all) renders nowhere.
  `TypingLabel` owns the wording — in the thread header it *replaces* the presence line, in the list it
  replaces the message preview and leaves presence in place.
- Typing never touches the query cache: nothing is invalidated or patched, so a claim costs no request. The
  cache keeps its identity because typing is not app data — it is true for a couple of seconds and then it is
  simply gone, like the 60s tick in `PresenceLabel`.
- `ReceiveEncryptedMessage` also rings `src/lib/messageChime.js` before the cache is invalidated. The chime is
  silent exactly when the bubble is landing in front of the reader — that conversation's thread open, in a tab
  that is both visible and the focused window — and plays for every other case: another conversation, another
  page, a background tab, a window that lost focus to another app. The policy reads `document` state and the
  open thread from `window.location.pathname` at event time, because the provider sits above the router and
  nothing here needs to react to navigation.
- One `Audio` element is created at module load, not on the first message: the first arrival is exactly the
  one that must not be announced a fetch late. A chime that is still ringing swallows the next arrival, so a
  burst of messages makes one sound rather than a machine gun, and a `play()` the browser refuses — it blocks
  audio until the page has been interacted with — is swallowed rather than surfaced: no sound is the correct
  outcome there, and it is also what a reader on a browser without the file gets.
- `public/message-chime.wav` is generated by `gen-chime.mjs` (a 0.34s two-note rise) so the asset is
  reproducible instead of an unexplained binary; swapping in a designed sound means replacing the file.

### Known limits in this phase

- `MessagesController.MaxContentLength` is 2000 characters, and `Message.Content` is sized for that. Base64
  ciphertext runs larger than the plaintext (plus a tag/nonce), so the column and the cap need revisiting
  before client-side encryption lands — a decision the owner explicitly deferred ("migration only if the
  limit needs extending").
- The fan-out targets the recipient only. The sender's other tabs are not notified; the web client updates
  its own cache from the `POST /api/messages` response.
- Presence is process-local, so with more than one API instance a user connected to instance B reads as
  offline on instance A and only receives events raised by the instance they are connected to. Same
  backplane + sticky-session caveat as the connection registry.
- A presence event also costs one refetch of the list and of the open thread (`useConversation` invalidates
  the `conversations()` prefix whenever its data changes). Narrowing that effect to "the messages changed"
  would remove it; it was left alone to keep the presence step's blast radius small.
- Typing signals are relayed as they arrive and are not rate limited server-side, so a hostile client can
  re-render one recipient's UI as fast as it can call `SendTyping`. The blast radius is small — the id on a
  claim always comes from the JWT, so a client can only ever pollute its own entry, and nothing is stored —
  but a public deployment should cap hub calls per connection.
- A pure hub relay carries no `conversationId`, so the chime cannot tell whether it belongs to the open
  thread and errs towards a sound too many rather than silence on an unseen message. The web client always
  sends over REST, so this only becomes visible once the mobile client calls the hub directly.
- The chime rings for anyone with the app open: there is no mute control and no per-conversation preference
  yet (the owner asked for the sound only, with the door left open for a toggle later).

## Environment notes / gotchas

- `ASPNETCORE_ENVIRONMENT=Development` is required for user-secrets to load; without it `Jwt:Key` is empty and
  authentication fails with `IDX10703: ... key length is zero`.
- A running `CircleHub.Api.exe` locks `bin/Debug/net10.0`, so `dotnet build` fails with `MSB3021`. Either stop
  the running instance or build to another output directory: `dotnet build <proj> -o <temp dir>`.
- MySQL 8 is installed locally; the CLI is at
  `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`. The dev credentials come from user-secrets.
- `Users.MessagesFrom` is stored as `varchar(20)` holding the enum *name* (`.HasConversion<string>()`, DB
  default `Followers`), so write `MessagesFrom = 'Followers'` in SQL, not `1`.
- Vite Fast Refresh swaps a module's code but does **not** re-run effects whose dependencies are unchanged, so
  a hub handler registered before the edit keeps running the *old* closure — the new module is loaded and the
  old code still runs. Reload the tab before verifying any change to `ChatConnectionContext.jsx`; this
  silently made the first round of chime checks look like a pass.
- Migrations require `dotnet ef` (pinned in `dotnet-tools.json`).

## Verification

There is no test project in the solution; the messaging work is verified end-to-end against the real dev
database by the throwaway harness in `%TEMP%\opencode` (started so it does not disturb a running dev server):

- `step3-e2e.ps1` — mints real JWTs from the dev user-secrets, picks an allowed and a restricted recipient
  straight from MySQL, starts the temp build on a spare port, exercises the REST write path and the hub, and
  asserts the presence counters from the server log.
- `step4-e2e.ps1` — connects a recipient twice over the hub, sends through `POST /api/messages`, and asserts
  the fan-out envelope (including that the message/conversation ids match the REST response), that an offline
  recipient is logged rather than delivered to, and that a refused message is never fanned out.
- `sigtest\hub-test.mjs`, `sigtest\fanout-test.mjs` — the `@microsoft/signalr` client driving those flows.
- `web-test-setup.ps1` + `web-test-badge.ps1` — mint a session for a real user and a sender the policy
  allows, for driving the browser against a running dev server (inject the token into `localStorage`, then
  open the thread and watch it update).
- `mint-token.ps1 -Username <u> -OutFile <f>` — mint a real JWT for any dev user.
- `sigtest\presence-client.mjs` — connect one user to the hub and print every `PresenceChanged` envelope
  received. Used to watch a browser flip between "Online" and "Last seen …", and to prove that a user with no
  shared conversation receives nothing.
- `typing-setup.ps1` + `sigtest\typing-test.mjs` — mint the two tokens the typing flow needs (plus a
  recipient whose `MessagesFrom` refuses the sender) and assert the whole hub contract: routing to every live
  connection of the recipient, the sender id coming from the JWT, the sender hearing nothing of their own
  signal, and a silent drop for a self-send, a malformed id, an unknown id or a refused recipient.
- `sigtest\typing-client.mjs` — one authenticated client that either prints every `TypingChanged` it receives
  (listen mode) or drums typing signals out on a schedule, so a signed-in browser on the other end can be
  watched gaining and losing its "typing…" line.
- `gen-chime.mjs` — regenerates `public/message-chime.wav` from its note table (a script rather than an
  unexplained binary in the repo).
- `send-message.ps1 -TokenFile <f> [-To <username>] -Content <text>` — sends a real message as any dev user by
  REST, which is the only path that persists a row and therefore the only one whose envelope carries a
  `conversationId`.
- `sigtest\chime-relay.mjs` — invokes `SendEncryptedMessage` directly with the same token, writing nothing to
  the database; `BURST=n` fires n invocations in one tick.
- `chime-cleanup.ps1 [-Apply]` — prints the `Messages` count and the labelled `chime-*` rows (and with
  `-Apply` deletes them, then prints the counts again).

It requires MySQL running locally plus `npm install @microsoft/signalr` in that directory. Keep it in sync
with the hub contract when the contract changes.
