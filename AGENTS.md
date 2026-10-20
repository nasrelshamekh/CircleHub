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
| Send path | `POST /api/messages` remains the single write path (persists + unread counts). The server then fans out to the recipient's live connections and to the sender's other connections, so every tab that should know about the message learns of it from one event. |
| Ciphertext storage | The server stores the encrypted string as an opaque blob in `Message.Content` and never inspects it. |
| Push tokens | A dedicated `DeviceToken` table (multi-device), pruned when Expo reports `DeviceNotRegistered`. |
| Typing signals | Hub-only and ephemeral: relayed to whatever is live, never stored, never pushed, refused silently, rate limited per connection, and believed by the recipient for a few seconds at a time. |
| Message sound | Plays for a message the reader cannot see landing — silent only when that conversation's thread is open in a tab that is both visible and focused. A short committed sound file (the owner's own), no mute control yet. |
| Encryption scope | End-to-end on the web client (Step 17): WebCrypto ECDH P-256 + AES-GCM, one ephemeral keypair per message, a per-device key directory on the server. The server relays and stores ciphertext it cannot read. Mobile parity is a later step. |
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
- Typing is rate limited by `Services/TypingRateLimiter` (singleton, registered in `Program.cs`): a token
  bucket per **connection id** — capacity 10, refill 0.5/s, wall-clock refill taken under a per-bucket lock,
  entry removed on disconnect. Keyed by connection rather than by user, so two tabs each get their own budget
  while one hostile client can only ever exhaust its own. `SendTyping` consults it as its *first* line, before
  any policy or database work, and drops an over-budget signal at `Debug` — same silence as a policy refusal.
- Routing uses `Clients.User(recipientId)`, resolved by `Services/CircleHubUserIdProvider`, which maps the
  SignalR user id to the `sub` claim and normalises it to the canonical Guid form. SignalR's default
  `ClaimTypes.NameIdentifier` is never emitted by this API, so without that provider `Clients.User(id)`
  would silently deliver to nobody.
- The "may this sender message this recipient?" rule lives in `Services/MessagePolicyService`. Both
  `MessagesController` (the write path) and `ChatHub` call it, so the recipient's `MessagesFrom` setting
  cannot be bypassed by calling the hub directly instead of REST.
- Live connections are registered in `Services/IConnectionTracker` (`Add`/`Remove`/`IsOnline`), which is what
  will decide between real-time delivery and a push notification in the fallback step.
- `Services/MessageDeliveryService` mirrors a stored message to the recipient's live connections **and the
  sender's** (`Clients.Users(recipient, sender)`) through `IHubContext<ChatHub>`. The sender's other tabs are
  told about the send at the same moment as the recipient instead of waiting for their next refetch; the
  sending tab receives its own echo too, which the client deliberately downgrades to a bare invalidation (see
  the client contract). The hub-relay path (`SendEncryptedMessage`) still targets the recipient only: a relay
  is not a persisted message and has nothing for the sender's cache to learn. Every REST send fans out —
  a post-only message included, its envelope carrying `EncryptedPayload = ""` — so the payload is a defined
  value rather than an absence. It is called after the DB commit, so a client that reacts by fetching always finds
  the row, and it is deliberately *not* tied to `RequestAborted`: the message is stored either way, so a
  caller hanging up must not swallow the notification. A recipient with no live connection is logged there,
  which is exactly where the Expo push fallback goes.
- Key directory: `POST /api/keys` registers **this device's** public key, `GET /api/keys/{username}` returns
  the devices of the person you are writing to. Storage is `Entities/UserDeviceKey` (unique `(UserId, DeviceId)`,
  so a re-publish is an upsert via `INSERT ... ON DUPLICATE KEY UPDATE`, never a duplicate row; migration
  `AddUserDeviceKeys`). `KeysController.Register` validates the key as a base64 uncompressed P-256 point — 65
  bytes, leading `0x04` — before storing it, to keep the table from becoming a place where any blob can be
  parked. The read is gated by the **same** `MessagePolicyService` rule as sending a message and answers with
  the **same** generic 403 wording ("This user isn't accepting messages right now"), so the directory cannot be
  used to enumerate users or to read around a `MessagesFrom=Followers` setting; your own keys are always
  readable, and an unknown username is a plain 404. The response exposes only `deviceId`, `publicKey` and
  `createdAt` — never a user id, and there is nothing secret to leak because a public key is public by
  definition.

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
  identity. No request follows either: `useConversation` only reacts when the thread's *messages* change (the
  newest id plus the count), so a partner appearing online costs zero fetches and the patch is the whole story.
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
- `ReceiveEncryptedMessage` first asks *whose* message it is: the fan-out now echoes back to the sender, so
  when `senderId === myUserIdRef.current` the handler skips the chime and the toast and still invalidates —
  the sender's own send must refresh their other tabs without announcing itself. The guard lives in the single
  event handler rather than inside `messageChime.js` / `messageToast.jsx`, which stay single-purpose policy
  libraries shared with the notification chime and toast. `myUserIdRef` is written in a `useEffect` because
  eslint's `react-hooks/refs` rule rejects ref writes during render. A post-only message (empty payload)
  toasts `"Shared a post"`, the wording the conversation list already shows for it.
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
- `public/message-chime.mp3` is the owner's own sound (a Mixkit "message pop alert", 1.07s, 46 KB), not a
  generated one, and its source is recorded here so it stays reproducible rather than an unexplained binary.
  Its URL is the single `CHIME_URL` constant in `src/lib/messageChime.js`, so swapping it again is that one
  line plus the file. Because the element is created at module load, the file is fetched on every page load:
  a few hundred milliseconds of compressed mono audio is the size budget to keep in.
- `ReceiveEncryptedMessage` also raises a message toast, but only where the message would otherwise be invisible:
  `src/lib/messageToast.jsx` (`shouldToast`, `showMessageToast`; body in
  `src/components/messages/MessageToast.jsx`) stays silent anywhere under `/messages`, where the list, the
  preview inside it and the unread badge are already on screen. The card carries the sender (avatar and name from
  the cached `conversations()` list, "New message" when that list is not cached) above the payload, and the whole
  card is a button: clicking it dismisses the card and navigates to `/messages/<conversationId>` through the
  router instance, because the provider sits above the router and has no hook to navigate with. Cards are keyed by
  message id, so a repeated envelope replaces its own card instead of stacking a second one.
- That toast lives in a *second* sonner stack (`<Toaster id="messages" position="bottom-right" />` in
  `src/main.jsx`). Sonner renders a toast only in the toaster whose id matches the toast's `toasterId`, which
  keeps message cards out of the error stack and lets the two corners be positioned independently. A message with
  no conversation to open — a pure hub relay whose sender is not in the cached list — is not toasted: there would
  be nothing for the click to do.
- Every toast is painted by `src/components/ui/sonner.jsx`, which maps sonner's variables onto the app tokens
  (`--surface-lowest`, `--text-primary`, `--border`, `--radius-lg`) and applies the `circlehub-toast*` classes
  from `src/index.css`. It reads the app's own theme with `@/hooks/useTheme` — the state behind the `light`/`dark`
  class on `<html>` — rather than `next-themes`, which the app never mounts: sonner's own palette only knows light
  and dark and cannot know which one the app is showing, which is how a white card ended up on a dark surface.

### End-to-end encryption (web client, Step 17)

The whole implementation is `src/services/messageCrypto.js`. The server is unchanged by it: it still stores and
relays one opaque `Message.Content` string, so this is a client contract plus the key directory above.

- **Envelope.** `ENC:v1:` + base64 of `{v, alg, e, iv, ct, w:[{d,k}]}` — `e` the sender's ephemeral P-256
  public key, `iv` the 12-byte AES-GCM nonce, `ct` the ciphertext, `w` one wrapped CEK per device (`d` = device
  id, `k` = the KEK-wrapped key). One **ephemeral keypair per message**, so two messages from the same sender
  share nothing that would let them be linked.
- **Recipients of a wrap.** The CEK is wrapped for every device of *both* participants, the sender's own
  included. That is deliberate and load-bearing: the Step 16 fan-out echoes a send back to the sender's other
  tabs, and those tabs must be able to render it. A wrap list keyed to the recipient only would turn every one
  of the sender's own messages into a placeholder in their second tab.
- **Private keys never leave the device.** They are generated with WebCrypto as **non-extractable** and stored
  in IndexedDB (`circlehub-keyvault`), so no script — including one injected by an XSS — can read them back out
  or export them. The device id is a plain `localStorage` value (`circlehub-device-id`); it is an identifier,
  not a secret. Consequence: the keys are per-browser-profile and cannot be backed up or moved, so a wiped
  profile loses the ability to read that device's history (see the limits below).
- **Publishing.** `src/components/messages/DeviceKeyPublisher.jsx` (mounted in `src/main.jsx`) generates the
  device key on first need and `POST`s the public half once per signed-in session. It is idempotent server-side
  (the upsert), so a re-publish is a no-op rather than an error.
- **Rendering.** `src/hooks/useDecryptedContent.jsx` is the **only** place decryption happens at render time,
  and the thread (`MessageThread`), the conversation-list preview (`ConversationList`) and the message toast
  (`MessageToast`) all go through it. Adding a new surface that shows a message body means using this hook —
  showing `Content` directly is how ciphertext would reach the screen.
- **Fallback, in order.** (1) A recipient with no published key → the message is sent as **plaintext**, stored
  verbatim; the feature degrades to Step 16 rather than failing, which is what keeps the rollout from breaking
  conversations. (2) A row with no `ENC:v1:` prefix → passed through untouched (every legacy message). (3) An
  envelope this device cannot open — a foreign device's key, a test key that no longer exists — → renders
  `[Can't decrypt this message]`. (4) A malformed envelope → the same placeholder. Ciphertext is never shown to
  the reader in any of these cases.
- **Copy path.** The copy button writes the **decrypted** text, and writes the placeholder (never the envelope)
  when the body cannot be opened — so a copy can't be used to smuggle ciphertext to the clipboard.
- **Limits.** The server caps the *envelope* at `MessagesController.MaxContentLength` = 12000 and
  `SendMessageDto.Content` is `[MaxLength(14000)]`, deliberately above it so model binding never silently
  truncates an envelope before the controller sees it (the 4000 default did exactly that). The client caps the
  *plaintext* at `MAX_PLAINTEXT_LENGTH` = 4000, which is ~7.9 KB of envelope with four devices on the message —
  comfortably inside 12000. Changing any one of those three numbers means re-checking the other two.

### Known limits in this phase

- The fan-out targets the recipient and the sender's other connections; a pure hub relay still targets the
  recipient only, so a mobile client that talks to the hub directly will not echo its own send back to the
  sender's other tabs.
- Presence is process-local, so with more than one API instance a user connected to instance B reads as
  offline on instance A and only receives events raised by the instance they are connected to. Same
  backplane + sticky-session caveat as the connection registry.
- The typing rate limiter is in-process too: buckets are keyed by connection id and dropped on disconnect, so
  an instance meters only the connections it owns. Same multi-instance caveat as presence.
- A pure hub relay carries no `conversationId`, so the chime cannot tell whether it belongs to the open
  thread and errs towards a sound too many rather than silence on an unseen message. The web client always
  sends over REST, so this only becomes visible once the mobile client calls the hub directly.
- The chime rings for anyone with the app open: there is no mute control and no per-conversation preference
  yet (the owner asked for the sound only, with the door left open for a toggle later).
- A toast's expiry timer does not run while its tab is in the background, so cards accumulate unseen there and
  dismiss the moment the tab is looked at again. For a hidden tab the chime and the `(n)` title prefix are still
  the channels that carry it.
- The card shows the payload exactly as the thread does — it goes through `useDecryptedContent`, so it renders
  decrypted text and the `[Can't decrypt this message]` placeholder, never ciphertext.
- **Key recovery (Step 18).** A 12-word BIP39 recovery phrase protects a random 32-byte account key, which
  wraps the device private key for backup without compromising non-extractable storage in IndexedDB. Stored
  in `UserKeyBackups` via `KeyBackupController` (`/api/keys/backup`). Clearing site data or opening a new browser
  allows restoring message history by entering the phrase.
- **Encryption is opportunistic, not guaranteed.** A recipient who has not published a key (a browser that has
  never signed in since Step 17, or the mobile client before its own step) receives plaintext, and the sender
  is not told. This is what keeps the rollout from breaking conversations, but it does mean `Message.Content`
  is not uniformly ciphertext and a mixed history is normal.
- Mobile parity has not landed: the mobile client neither publishes a device key nor decrypts the envelope
  (the wrap list makes this additive — no server or format change is needed).

## In-app notification feed

`/notifications`, written for the same real-time path as messages but deliberately quieter. Three event
groups, chosen by the owner: follows, post likes and comments on your posts; community join requests and the
decisions on them; membership and moderation events (member removed, role changed, post removed). "New posts
in my communities" was explicitly *not* chosen. Messages stay out of the feed — they already have their own
list, badge, toast and sound, and counting them here would announce the same thing twice. The
`EmailNotifications` / `CommunityUpdates` profile toggles stay out of it too (they currently do nothing), and
the tab title stays messages-only (`useUnreadTitle`).

### Data and unread model

- A row stores the *facts* only — `Type`, recipient, actor, and `PostId?` / `CommunityId?`. There is no text
  column: the client renders the wording per type in `src/lib/notificationCopy.js`, so a rename cannot leave
  stored copy stale and there is no second copy to keep in sync. `PostId` cascades away with the post (a row
  pointing at a deleted post has nothing to open); `CommunityPostRemoved` carries no `PostId` on purpose,
  because the FK would cascade the notification away moments before the post goes.
- Unread is derived, not flagged: `Users.NotificationsSeenAt` is a bulk cursor (the messaging `LastReadAt`
  pattern) that opening the feed moves once, composed with a nullable `Notification.ReadAt` for the one
  exception — a single row marked read on a visit whose cursor is older than it. The rule
  (`ReadAt IS NULL AND CreatedAt > seenAt`) feeds both `unreadCount` and each row's `Unread` from the *same*
  cursor read per request, so the two can never disagree inside one response. Index on `(UserId, CreatedAt)`.
- Migration `AddNotificationReadAt`; the original feed tables came with `AddNotifications`.

### Writing

`Services/NotificationService` is the single writer, so the self-guard (you are never told about your own
action) and de-duplication live in one place instead of at every call site — de-duplication matters because
`ToggleLike` toggles (like/unlike/relike would otherwise ring twice), a follow can be re-made after an
unfollow, and a declined join request can be re-sent. It commits on its *own* after the action: a notification
is a side effect, so a crash in between loses one row rather than leaving a row pointing at something that
never happened. Call sites: `UsersController.FollowUser`, `PostsController.ToggleLike` (like branch),
`CommentsController.AddComment`, and `CommunitiesController` (join request create/approve/reject, member
removed, role changed, post removed).

### Transport

- `ChatHub.NotificationCreatedMethod` (`NotificationCreated`) is pushed after the commit to each recipient
  via `Clients.User(...)`, carrying a `NotificationDto` (added when the toast landed; it was payload-less
  first). The payload exists so the card and the chime do not wait for a refetch — but the client still
  invalidates `queryKeys.notifications()` on every event, because the feed and both badge counts are derived
  from the server and `refetchOnWindowFocus: false` is global. Not tied to `RequestAborted`, same rule as
  `MessageDeliveryService`.
- `GET /api/notifications` (paged, `ApiResponse` + `PageMeta`, one cursor for count and rows),
  `POST /api/notifications/seen` (bulk stamp, idempotent),
  `POST /api/notifications/{id}/read` (per-row, never moves backwards), `DELETE /api/notifications/{id}`
  (owner-scoped: another user's id is a 404, not a hint the row exists).

### Client contract (web)

- **The page stamps the cursor exactly once per visit.** The first version re-stamped on every `unreadCount`
  change, so an arrival while the page was open was zeroed again within a frame — which the owner reported as
  "the badge doesn't update". Now a ref flips when the feed first has data (even at zero, so a first arrival
  after a quiet open is not stamped away either), arrivals mid-visit move the badge and *stay* until the next
  open, and rows keep the flags they were fetched with so the dots remain meaningful for the visit. The
  StrictMode cancellation guard went with it: the only write is to the query cache, which outlives the
  component, and cancelling is what left the badge unpatched when React re-ran the effect.
- Badges: the navbar bell and `SidebarNav` both read `useUnreadNotifications`, which shares the feed's own
  query — one cache, one refetch, three consumers (page pill, bell, sidebar). The sidebar count is a pill
  pinned to the icon itself (`SidebarNavItem`: `relative` icon wrapper, `absolute -right-2 -top-2`), so it
  reads identically collapsed and expanded, matching the navbar's icon buttons; nothing is rendered at zero.
- A `CommunityJoinRequested` row opens `/communities/<slug>/manage?tab=requests` (`notificationLink`), so the
  reviewer lands on the action instead of the community's public page, where it does not exist.
  `ManageCommunity` drives its tab from `?tab=`: an unknown or admin-only value (moderator) falls back to the
  role default, and the tab change is written with `replace` so the URL describes the pane without filling
  the history.
- Row actions (`Mark as read` only while unread, `Delete`) sit **outside** the row's `<Link>`: a `<button>`
  inside an `<a>` is invalid HTML and its click would navigate. Both mutate by REST and then invalidate
  `notifications()` — no hand-patching of counts. Clicking the row's link itself counts as reading too: its
  `onClick` fires the same `Mark as read` mutation when the row is unread and the navigation proceeds either
  way, so the dot, the pill and both badges clear while the reader is taken to the target; an already-read
  row costs no request.
- `src/lib/notificationChime.js` mirrors `messageChime.js` (module-load `Audio`, swallow a ringing overlap,
  swallow an autoplay refusal): the owner's own file `public/notification-chime.wav` (Mixkit "long pop",
  `mixkit-long-pop-2358.wav`, 226 KB, shipped as WAV because that is what was supplied — one constant to
  swap). It is silent exactly when `/notifications` is open in a tab that is visible *and* focused — the
  reader watched the row land — and plays for every other case. No mute control, as with messages. Message
  events keep their own `message-chime.mp3`; the two sounds identify which channel rang.
- `src/lib/notificationToast.jsx`: `shouldToastNotification()` is the mirror of `shouldToast()` (silent only
  under `/notifications`), and `showNotificationToast()` deliberately reuses `MessageToast` inside the same
  `MESSAGE_TOASTER_ID` stack — same card, same bottom-right corner, same ~6s. Seeing the card *is* reading
  the notification, so the click marks the row behind it read (same `POST {id}/read`, only while the payload
  says `unread`, then one `notifications()` invalidation — pill, bell and sidebar refetch from the server)
  and then opens `notificationCopy.notificationLink(...)` through the router instance (the provider sits
  above the router). The POST is fire-and-forget: it survives the navigation, and a failure just leaves the
  badge where it was, the same rule as a failed seen-stamp. A row with nothing left to open still toasts;
  the click still marks it read and dismisses.
- The `ChatConnectionContext` handler order mirrors messages: chime, toast, invalidate.

### Known limits in this phase

- The event payload duplicates the GET projection field-for-field (`NotificationService` vs
  `NotificationsController`); they must be kept in step when either grows.
- An unfocused window chimes even while `/notifications` is open (the `document.hasFocus()` gate, same rule
  as the message chime — an unseen arrival gets a sound).
- Read/delete refetch every loaded page of the infinite query rather than patching the list; fine at dev
  scale, worth a real pagination-aware update if the feed grows long.
- No web push: the web app has no service worker, manifest or PWA setup (iOS Safari would need a Home Screen
  install, 16.4+). The owner declined it in favour of this feed. If it ever returns, fold it into one
  `PushSubscription`/`DeviceToken` table with a `Provider` discriminator rather than adding a second table.

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
- Tailwind's `line-clamp-*` utilities set `display` themselves, so pairing one with `block` on the same element
  silently drops the clamp and the element grows to its full content height. The message toast's preview hit
  exactly this — `clamp-2` was applied (computed `-webkit-line-clamp: 2`) while the card still grew to 349px.
- The Vite dev server answers `200` with `index.html` for any path that is not a real file, so after a public
  asset is deleted `GET /message-chime.wav` still returns `200` — check the `Content-Type` (and byte count)
  before believing a 200 means the file is still there.
- Copying a file into `public/` while the dev server is watching can crash it: the watcher tries to add the
  new file, Windows still has it locked, and Node exits on `EBUSY: resource busy or locked, watch
  '...\public\message-chime.mp3'`. Restart the dev server; it starts clean once the file is settled.
- The message-crypto private keys are non-extractable and live in IndexedDB, so an `ENC:v1:` envelope written
  by a **Node** harness (whose keys live in a file) can never be opened in the browser — it will always render
  the placeholder. That is the design working, not a bug; the harness deletes its own `node-%` device keys so
  they do not accumulate in the directory.

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
- `step16-e2e.ps1` + `sigtest\step16-test.mjs` — the Step 16 contract on a temp build of its own (spare
  port): a post-only message fans out to every connection of the recipient with `encryptedPayload === ""` and
  ids matching the REST response, the sender's own two connections receive the echo of their send, and a
  40-signal typing burst is cut down by the per-connection token bucket (10 through, refill observed after a
  pause, a second connection of the same user unaffected, every drop silent).
- `sigtest\typing-client.mjs` — one authenticated client that either prints every `TypingChanged` it receives
  (listen mode) or drums typing signals out on a schedule, so a signed-in browser on the other end can be
  watched gaining and losing its "typing…" line.
- `send-message.ps1 -TokenFile <f> [-To <username>] -Content <text>` — sends a real message as any dev user by
  REST, which is the only path that persists a row and therefore the only one whose envelope carries a
  `conversationId`.
- `sigtest\chime-relay.mjs` — invokes `SendEncryptedMessage` directly with the same token, writing nothing to
  the database; `BURST=n` fires n invocations in one tick.
- `chime-cleanup.ps1 [-Apply]` — prints the `Messages` count and the labelled `chime-*` rows (and with
  `-Apply` deletes them, then prints the counts again).
- `toast-cleanup.ps1 [-Apply]` — the same shape, for the rows the message-toast checks leave in Alice's
  conversation with `bob_builder`.
- `step17-e2e.ps1` + `sigtest\step17-test.mjs` — the Step 17 contract (38 checks) on a temp build of its own:
  device-key registration and validation, the `GET /api/keys/{username}` policy gate and its generic refusal,
  the envelope round-trip (both participants' devices wrapped), the no-key plaintext fallback, and the
  over-cap server rejection. `s17b-cleanup.ps1 [-Apply]` deletes the rows and the browser-published device key
  it leaves behind and repairs `Conversations.LastMessageAt`.

It requires MySQL running locally plus `npm install @microsoft/signalr` in that directory. Keep it in sync
with the hub contract when the contract changes.
