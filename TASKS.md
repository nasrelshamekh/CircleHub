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
| 5 | `DeviceToken` entity + registration endpoints + migration | deferred to the mobile phase |
| 6 | Expo Push Service fallback for offline recipients | deferred to the mobile phase |
| 7 | Web client: `@microsoft/signalr` connection, live thread + unread badge, then polish (status, optimistic send, scroll, tab title) | done, verified |
| 8 | Mobile client (SignalR + Expo push) | deferred until the web app is accepted |
| 9 | Presence: online / last seen in the thread header and the conversation list | done, verified |
| 10 | Typing indicator: `SendTyping` hub signal + web client (thread header + conversation list) | done, verified |
| 11 | Incoming-message sound: committed sound file (the owner's own), silent while the reader is looking at that thread | done, verified |
| 12 | Message toast away from the messages page: themed card, click to open | done, verified |
| 13 | In-app notification feed (`/notifications`): follows, likes, comments, community membership and moderation events | done, verified |
| 14 | Notification feed follow-up: live count badge, per-row mark-as-read/delete, notification chime (owner's wav), message-style toast | done, verified |
| 15 | Notification polish: join-request rows open the manage page on Requests; sidebar count pills sit on the icons | done, verified |
| 16 | Messaging fan-out gaps: post-only messages delivered live, sender's other tabs hear their own echo, typing rate limit on the hub | done, verified |
| 17 | End-to-end encryption on the web client: per-device key directory, WebCrypto ECDH + AES-GCM envelope, plaintext fallback for a recipient with no published key | done, verified |
| - | Cleanup pass: unused `next-themes` dropped, a presence event no longer costs a refetch, dev verification rows deleted | done, verified |

Step ordering is the owner's call: the web app is finished and handed over for testing first, then the push
pieces (5 and 6) land together with the mobile client (8), because Expo push only has a consumer there.

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

### Step 7 — Web client live delivery (done, verified)

`@microsoft/signalr` (10.0.11) is now wired into the web app, so a stored message reaches the recipient while
they have the app open. Sending is unchanged: `POST /api/messages` stays the only write path.

Added:

- `src/services/chatHub.js` — builds the connection. Derives `.../hubs/chat` from `VITE_BASE_URL` (which
  points at the REST root, e.g. `http://localhost:5289/api`), reads the token from `localStorage` on every
  negotiation, and retries every 10s indefinitely (the SignalR default gives up after ~30s, which is the
  wrong default for a chat client). Exports the event name so the contract lives in one place.
- `src/hooks/useRealtimeMessages.jsx` — opens the connection for the signed-in session, closes it on
  logout, and on `ReceiveEncryptedMessage` invalidates `queryKeys.conversations()`. That key is a prefix of
  `conversation(id)`, so one invalidation refreshes the list, the open thread and the unread badge, while
  the server stays the source of truth for their contents.
- `src/App.jsx` — calls the hook once at the app root (inside the auth and query providers).

Verification: `npx eslint .` exits 0 and `npm run build` succeeds, plus a real browser session against the
running API and dev server. Alice's token was placed in `localStorage` and her thread with `testuser` left
open; a message sent by `testuser` over REST appeared in that thread exactly once, with no reload.

| Check | Result |
| --- | --- |
| WebSocket established | `ws://localhost:5289/hubs/chat?id=...&access_token=...` (token in the query string, as designed) |
| Message sent by another user over REST, thread open | appears once, no reload, no duplicate |
| Conversation list | preview and relative timestamp update to the new message |
| Unread badge | 4 → 5 after a second sender's message, matching `GET /api/messages/conversations` |
| A message for another conversation | correctly does not appear in the open thread |

Harness: `%TEMP%\opencode\web-test-setup.ps1` (mints the session tokens, picks a sender the policy allows)
and `web-test-badge.ps1` (drives the second sender and prints the server's unread totals).

### Step 7 follow-up — Web client polish (done, verified)

The owner picked all four polish items before the web app is handed over. `useRealtimeMessages.jsx` is gone,
replaced by a provider: the connection outlives any single component, and its state has to reach a sibling of
the thread (the header chip).

Added:

- `src/hooks/useChatConnection.jsx` + `src/context/ChatConnectionContext.jsx` — the connection now lives in
  `main.jsx` inside `AuthContextProvider` and reports `connecting` / `live` / `reconnecting` / `offline`
  (`idle` while signed out). It keeps the incoming-message invalidation, and it retries a **failed initial
  `start()`** every 5s: `withAutomaticReconnect` only handles drops after a successful connect, so a tab
  opened while the API was down used to stay disconnected for the rest of the session. Callbacks are
  ignored after teardown so our own `stop()` is not reported as a drop.
- `src/components/messages/ChatConnectionStatus.jsx` — a quiet pill in the Messages header, rendered only for
  `reconnecting` / `offline`. The initial `connecting` is deliberately not surfaced (a flash of chrome on
  every page load is worse than the information is worth).
- `src/components/messages/MessageComposer.jsx` + `MessageThread.jsx` — optimistic send. The composer hands
  the thread a temporary bubble (`pending: true`, reduced opacity) before the request resolves; the thread
  stops rendering it once the stored message with that id exists. The bubble lives in thread state, **not**
  in the thread cache: writing into `conversation(id)` would be wiped by the refetch that the pending write
  itself triggers, which is exactly when optimism matters.
- `MessageThread.jsx` — smart auto-scroll: 80px near-bottom threshold, always jump on conversation change,
  otherwise hold position and show a floating "New message" chip. "Seen" is recorded on any scroll (not only
  near the bottom), because a thread that opens at the bottom has no baseline until the reader scrolls.
- `src/hooks/useUnreadTitle.jsx` — prefixes the tab title with `(n)` while unread exists. Mounted from
  `AppLayout` rather than `App`: the conversations query has no auth guard and must not fire on public pages.
- `src/App.jsx` is back to just the router.

Verification: `npx eslint .` exits 0 and `npm run build` succeeds. Behaviour was driven in a real browser
against the running API + dev server (`eslint-plugin-react-hooks` v7 treats `set-state-in-effect`, `refs` and
`purity` as errors, which shaped the design — no state is set synchronously in an effect).

| Check | Result |
| --- | --- |
| Send path | `POST /api/messages` unchanged; no new endpoints |
| Optimistic bubble | pending-styled bubble observed in the DOM before the response, then exactly one stored bubble (`opacity-70` gone, no duplicate), composer cleared |
| Auto-scroll, reader at the top | incoming message did **not** move the view; "New message" chip appeared over the scroll area |
| Chip click | smooth-scrolled to the latest and cleared |
| Auto-scroll, reader at the bottom | incoming message followed to the latest with no chip |
| Tab title | `CircleHub` → `(5)` → `(6)` → `(7)` matching the server's unread total, live, no reload |
| Connection drop | pill showed `Reconnecting…` within seconds of the API being stopped (screenshot captured) |
| Page loaded with the API down | pill showed `Live updates paused`; the 5s retry loop logged an attempt every 5s |
| API restored | reconnected on its own (chip cleared) and a REST message from `testuser` then arrived live (badge 6 → 7) |

Browser-driving notes (they cost time to rediscover): the programmatic `el.scrollTop = 0` used first does
**not** produce a scroll event in this browser, so React's handler never sees it — real wheel input via the
browser tool does, and that is what the scroll checks used. React-controlled inputs need the native value
setter plus an `input` event (or the fill tool) before `requestSubmit()`.

### Step 9 — Presence (done, verified)

The owner asked for the `@username` under the other person's name in the thread header to become presence
("Online" / "Last seen …"), and for the same information in the conversation list. Confirmed wording:
**"Online"**, **"Last seen 12 minutes ago"**, and "Offline" for a user who has never connected. Visible only to
people who already share a conversation with that user.

Added:

- `Entities/User.cs` + migration `20261019182004_AddUserLastSeenAt` — nullable `LastSeenAt`. Stamped on the
  first connection and on the last disconnect, so it is durable across a restart, unlike the in-memory
  registry.
- `Services/PresenceService.cs` — `IsOnline` for the REST projections, the stamping, and the fan-out to the
  other participants of the user's conversations via `IHubContext<ChatHub>` + `Clients.Users(...)`.
- `Hubs/ChatHub.cs` — `PresenceChangedMethod` (`PresenceChanged`) and the connect/disconnect hooks. Only a
  transition is announced (first connection / last disconnect). The disconnect path passes
  `CancellationToken.None`, because `Context.ConnectionAborted` is already cancelled there and would cancel
  the `LastSeenAt` write.
- `Dtos/PresenceChangedEnvelope.cs` — `{ userId, isOnline, lastSeenAt }` (the timestamp only on the offline
  event).
- `Dtos/ConversationUserDto.cs` — replaces `AuthorDto` as `OtherUser` in `ConversationDto` and
  `ConversationThreadDto`, adding `IsOnline` + `LastSeenAt`. `AuthorDto` is untouched, so posts, comments and
  the recipient picker are unaffected. `IsOnline` cannot be projected by SQL, so `MessagesController`
  fills it in after the query and drops `LastSeenAt` while the user is online (consistent with the event).
- `src/components/messages/PresenceLabel.jsx` + `PresenceDot.jsx` — the wording and the avatar dot.
- `src/components/messages/MessageThread.jsx` — the header's second line is now presence, replacing
  `@username`.
- `src/components/messages/ConversationList.jsx` — presence line + dot on the avatar.
- `src/context/ChatConnectionContext.jsx` — handles `PresenceChanged` by patching the list and thread caches
  (both shapes under the `conversations()` prefix, left untouched when nothing matched), and resyncs via
  `invalidateQueries` on reconnect, since presence moved while the socket was down.
- `src/lib/formatDate.js` — `formatLastSeen`, with "Last seen just now" under a minute (date-fns's "less than a
  minute ago" reads badly under a name).
- `src/index.css` — `--presence-online` in both themes (green light / `#4ade80` dark); the palette has no
  success colour to borrow.

Verification: `dotnet build` 0 warnings; `npx eslint .` exits 0; `npm run build` succeeds; migration applied.
Behaviour was driven in a real browser against the running API + dev server, with a real hub client
(`sigtest\presence-client.mjs`) as the second user.

| Check | Result |
| --- | --- |
| Header, never-connected user | "Offline" (was `@bob_builder`), grey dot in the list |
| `bob_builder` connects over the hub | header and list row flipped to green "Online" live, **no reload** |
| `bob_builder` drops (process killed) | header and row flipped to "Last seen just now", dot back to grey |
| Raw envelopes | `{userId, isOnline:true}` then `{userId, isOnline:false, lastSeenAt:"…Z"}` |
| `GET /api/messages/conversations` | online → `isOnline:true`, `lastSeenAt` omitted; offline → timestamp; never seen → omitted |
| `GET /api/messages/conversations/{id}` | same shape on `otherUser` |
| Relative time | `LastSeenAt` set to 12 min ago → "Last seen 12 minutes ago" in the header **and** the row |
| 60s tick | 50s-old stamp → "Last seen just now", then "2 minutes ago" ~66s later with the API call count unchanged (4 → 4), i.e. no refetch |
| Privacy | a user with no conversation with `bob_builder` received **no** presence events while he came online and went away |
| Row layout | 80px, three lines, presence line 765x16 unclipped, dot 10x10 |
| No refetch loop | API calls stable at 4 over 66s; one presence event costs one list + one thread call (removed in the cleanup pass below) |

Presence only ever reaches conversation partners, and it added no rows to the dev database. Harness:
`%TEMP%\opencode\presence-setup.ps1` (bob's token + the Alice↔bob conversation id),
`%TEMP%\opencode\mint-token.ps1` (a token for any dev user), `sigtest\presence-client.mjs`.

### Step 10 — Typing indicator (done, verified)

The owner asked for a typing indicator, shown where the UI already answers "what is this person doing": the
presence line in the thread header, and the message preview in the conversation list. Confirmed wording:
**"typing…"** in both — it replaces presence in the header, and replaces the preview in the list (where
presence keeps its own line).

Added:

- `Dtos/TypingChangedEnvelope.cs` — `{ userId, isTyping }`.
- `Hubs/ChatHub.cs` — `TypingChangedMethod` (`TypingChanged`) and `SendTyping(recipientId, isTyping)`. It
  applies the same recipient policy as a real message, so typing cannot reach someone whose `MessagesFrom`
  refuses the sender, but *every* rejection is silent and logged at `Debug`: the signal is raised
  automatically while the user types, there is nothing to report back, and a refused client must not be able
  to write to the log at will. Nothing is persisted, nothing is pushed, and an offline recipient is simply
  not told.
- `src/services/chatHub.js` — `TYPING_CHANGED_EVENT`, `SEND_TYPING_METHOD` and `sendTyping(connection, …)`,
  which skips the call unless the connection is `Connected` and never surfaces a failure.
- `src/context/ChatConnectionContext.jsx` — the connection now lives in a `connectionRef` so components can
  call it without a re-render; `notifyTyping` is exposed next to a `typingUsers` map of
  `userId → deadline`. A claim is stamped 6s ahead and a 1s sweep drops expired ones (returning the same
  object when nothing expired, so a sender who keeps refreshing costs no re-render); the map is cleared on
  session teardown, because a claim belongs to the connection that received it.
- `src/hooks/useTypingBroadcast.jsx` — the sender side: one signal per 2s while keys keep coming, "stopped"
  after 3s of silence, on send, on switching conversation and on leaving the thread.
- `src/hooks/useTypingIndicator.jsx` — `useTypingIndicator(userId)`, `useTypingUsers()` and `isTypingNow`, so
  the deadline comparison lives in one place.
- `src/components/messages/TypingLabel.jsx` — the wording ("typing…", in the accent colour).
- `src/components/messages/MessageThread.jsx` — the header renders `TypingLabel` instead of `PresenceLabel`
  while the other person is typing; the composer is handed `recipientId` for the first time.
- `src/components/messages/ConversationList.jsx` — the row's preview line becomes `TypingLabel` while that
  partner is typing; the presence line, dot and unread badge are untouched.
- `src/components/messages/MessageComposer.jsx` — reports typing on every change and stops before sending, so
  the arriving message is the real "done".

Verification: `dotnet build` 0 warnings; `npx eslint .` exits 0; `npm run build` succeeds; no migration — this
step writes nothing, and the `Messages` row count was 78 before and after (the one message sent to exercise
the send path was deleted again). The hub contract was driven by `sigtest\typing-test.mjs` (12/12 checks) and
the browser by `sigtest\typing-client.mjs`, with a `MutationObserver` injected into the page that timestamped
every appearance and disappearance of the indicator.

| Check | Result |
| --- | --- |
| Routing | one `SendTyping` reached both of the recipient's connections: `{userId: <sender>, isTyping: true}` |
| Sender id | taken from the JWT; the sender's own connection received nothing |
| Stop signal | `isTyping: false` relayed the same way |
| Silent refusals | self-send, `not-a-guid`, a random Guid and a `MessagesFrom=Followers` recipient the sender does not follow all resolved without error and delivered nothing |
| Appears | 7–8ms after the first claim, in the header **and** the list row; presence replaced in the header, kept in the row |
| Expires by itself | claims at 18:51:49.06/.51.06/.53.07 with no stop signal ever sent → cleared at 18:52:00.07, i.e. the last 6s claim (…59.07) plus the 1s sweep |
| Explicit stop wins | last claim 18:52:36.00, explicit `isTyping:false` at :37.51 → cleared at :37.51, 4.5s before the claim would have expired |
| Sender throttle | 6 input events in one tick → one signal; 4 more 2.4s later → one more (2 signals for 10 keystrokes) |
| Idle stop | exactly 3.00s after the last keystroke, twice |
| Stop on send | `isTyping:false` 1ms after submit, then the stored message fanned out |
| Cost | `/api/messages` request count unchanged across every typing window (14→14, 17→17, 22→22): typing is not cache data |
| Per-user keying | with the `testuser` thread open, `bob_builder` typing showed up in his own list row only — not in the header, not in the neighbouring rows |
| Clean-up | the test message row was deleted; `Messages` back to 78 rows |

Harness: `%TEMP%\opencode\typing-setup.ps1`, `sigtest\typing-test.mjs`, `sigtest\typing-client.mjs`.

### Step 11 — Incoming-message sound (done, verified)

The owner asked for a sound when a message arrives. Three choices were put to them and confirmed: play unless
the reader is already looking at that thread in a focused, visible tab; no mute control yet; a short committed
chime rather than a sound file they would supply. (The third was later reversed — see the Step 11 follow-up
below.)

Added:

- `public/message-chime.wav` — 0.34s, 22.05 kHz mono, a two-note rise (B5 → E6, 15 KB), generated by
  `%TEMP%\opencode\gen-chime.mjs` so the asset is reproducible rather than an unexplained binary.
- `src/lib/messageChime.js` — `shouldChime(envelope)` (the policy), `playMessageChime()` (one element, created
  at module load so the first message of a session is not delayed by its fetch) and `chimeForIncomingMessage`.
  A chime that is still ringing swallows the next arrival, so a burst of messages makes one sound, and a
  `play()` the browser refuses — it blocks audio until the page has been interacted with — is swallowed
  silently: no sound is the right outcome there, and it is also what a reader whose browser cannot decode the
  file gets.
- `src/context/ChatConnectionContext.jsx` — the `ReceiveEncryptedMessage` handler rings the chime before
  invalidating, so the sound does not wait for the refetch. Nothing is stored, pushed or fetched: the chime is
  a side effect of an event the client already receives.

The policy reads `document.visibilityState`/`hasFocus()` and the open thread straight from
`window.location.pathname`, because the provider sits above the router and the question ("is the reader looking
at this?") is asked at event time — there is nothing to subscribe to, and no cache is touched.

Verification: `npx eslint .` exits 0; `npm run build` succeeds and copies the asset into `dist/`; no migration,
no new endpoint. `HTMLMediaElement.prototype.play` was spied on in the page, recording both the call and whether
the promise resolved or was refused, so "played a sound" is measured rather than assumed: every positive check
below is a real playback, not just a call.

| Check | Result |
| --- | --- |
| Reading that thread, tab focused | message arrived in the open thread, **zero** `play()` calls |
| Same thread, window not focused | 1 call (the tab is behind another window; only a focused, visible tab counts as "already seen") |
| Same thread, tab hidden | `visibilityState: hidden` forced → 1 call |
| Another page open (`/explore`) | 1 call |
| Another conversation open | reading the `testuser` thread, a message in Bob's thread → 1 call, and it correctly did not appear in the open thread |
| Pure hub relay (no `conversationId`) | 1 call while that very thread was open — the documented conservative default |
| Burst | 3 relays in one tick → exactly 1 call (the "already ringing" guard) |
| Own send | optimistic + stored bubble, zero calls: the fan-out targets the recipient only |
| Asset | `GET /message-chime.wav` → 200 `audio/wav`; fetched with the page (`initiatorType: audio`, 15 KB) and `duration` read back as 0.34s, so it is already loaded when the first message arrives |
| Latency | chime started 33ms after the hub relay was invoked (relay at 20:02:38.332Z, `play()` at 20:02:38.365Z) |

Cost: the web app's own request counts were untouched (the chime is not cache data). The 8 labelled rows these
tests created (`chime-read`, `chime-read2`, `chime-unfocused`, `chime-unfocused2`, `chime-elsewhere`,
`chime-otherthread`, `chime-self`, `chime-recheck`) were all deleted; `Messages` had 81 rows before and 84
after, and the 3 extra rows are `testuser` ↔ `nasrdev` messages sent by another session during the window, not
part of this step.

Harness: `%TEMP%\opencode\gen-chime.mjs`, `%TEMP%\opencode\send-message.ps1`,
`%TEMP%\opencode\chime-cleanup.ps1`, `sigtest\chime-relay.mjs`.

One gotcha worth remembering: Vite Fast Refresh loaded the new `messageChime` module but did not re-run the
connection effect, so the *old* handler closure stayed registered and the first round of checks was silently
vacuous (a real message arrived with zero calls, for the wrong reason). Reload the tab before verifying a change
to `ChatConnectionContext.jsx`; the numbers above are from a full reload.

### Step 12 - Message toast away from the messages page (done, verified)

The owner asked that, while browsing anywhere but the messages page, an incoming message raise a toast in the
bottom-right corner carrying the message and opening the conversation when clicked. Three choices were put to
them and confirmed: never raise a card anywhere under `/messages` (the list, the preview inside it and the unread
badge are already in front of the reader there); show the sender above the message text; auto-dismiss after about
six seconds, click to open.

Added:

- `src/lib/messageToast.jsx` - `shouldToast()` (the policy, read from `window.location.pathname` at event time,
  exactly like the chime) and `showMessageToast({ messageId, conversationId, sender, preview })`. The card is
  keyed by the message id, so a repeated envelope replaces its own card instead of stacking a second one, and the
  click handler holds the id it needs to dismiss it. Navigation goes through the router instance
  (`router.navigate('/messages/<id>')`), because the provider sits above the router where no router hook is
  available; the card dismisses itself on the way out so it cannot outlive the journey.
- `src/components/messages/MessageToast.jsx` - the body: avatar, sender, message text. The whole card is a
  `<button>`, because there is exactly one thing to do with a notification. One row of the conversation list, in
  a card.
- `src/context/ChatConnectionContext.jsx` - the `ReceiveEncryptedMessage` handler raises the card next to the
  chime, before the invalidation. The sender comes from the cached `conversations()` list
  (`findConversationByPartner`), which the authenticated layout keeps loaded for the unread badge; when the list
  is not cached the card still shows the message, titled "New message". The envelope's `conversationId` is
  preferred, and a pure hub relay falls back to the conversation that sender is a partner in. A message with no
  conversation to open is not toasted: there would be nothing for the click to do.
- `src/main.jsx` - a second stack, `<Toaster id="messages" position="bottom-right" />`. Sonner renders a toast
  only in the toaster whose id the toast was created with (`toasts.filter(t => t.toasterId === id)`), so message
  cards and error toasts never share a corner or a stack.

Also fixed here: the cards were first painted with sonner's own palette, which only knows `light` and `dark` and
never learns which one the app is showing, so they came out white on the app's dark surface (spotted by the owner
on the first look). `src/components/ui/sonner.jsx` already existed for exactly this and was simply never mounted:
it maps sonner's variables onto the app tokens (`--surface-lowest`, `--text-primary`, `--border`, `--radius-lg`)
and applies the `circlehub-toast*` classes that `src/index.css` defines. `main.jsx` now mounts it for both
stacks, and it reads the app's own theme (`@/hooks/useTheme`, the thing that puts `light`/`dark` on `<html>`)
rather than `next-themes`, which this app never mounts. Consequence worth knowing: **every** toast in the app is
now themed - the 4px accent left border, Inter, lucide icons - not just the message cards.

Verification: `npx eslint .` exits 0 and `npm run build` succeeds. No migration, no endpoint, no server change.

| Check | Result |
| --- | --- |
| Sent while on `/feed` | card appeared bottom-right 90ms after the POST, reading "Bob Alvarez" over the message text |
| Corner | settled 24px above the bottom and 39px from the right of a 912x670 viewport (`right`/`bottom` stack) |
| Click | a real pointer click that landed on the message text inside the card bubbled to the card's button; the URL became `/messages/cdf5b507-...`, the conversation the envelope named, and the card dismissed itself (`[data-sonner-toast]` count 0) |
| Sent while on `/messages/<thread>` | zero cards in that tab while the same event produced one in the tab sitting on `/feed`; the message itself still landed in the open thread, so the event was delivered and only the card was withheld |
| Sender | name "Bob Alvarez" and a 40px avatar, read from the cached conversation list |
| Long message (477 characters) | clamped to 2 lines, card 90px tall |
| Dark theme | card `#060e20` (`--surface-lowest`), border `--border`, 4px `--primary` left edge, `--text-primary` name, `--text-secondary` message, radius 16px, Inter |
| Light theme | the same card as `#ffffff` on `#131b2e`, so it follows `<html>` rather than a preference of its own |
| Error toast regression | the refused send (Alice to Bob, 403) still raised "Bob Alvarez isn't accepting messages right now" in the top-right, now themed with the `--error` left edge; on the messages page it was the only card, which is what the rule requires |

Cost: a card is a side effect of an event the client already receives - no request, no cache write. The 9 labelled
rows these tests created in Alice's conversation with `bob_builder` (`toast-check-1`, `theme-check-dark`,
`theme-check-light`, `click-check`, `click-check-2`, `suppression-check`, `suppress-check-2`, `long-check`,
`long-check-2`) were all deleted; `Messages` went 102 -> 93 and both participants read as 0 unread.

Two gotchas: a sonner card's expiry timer is frozen while its tab is in the background, so cards pile up
unnoticed there and dismiss the moment the tab is looked at again (the chime and the `(n)` title prefix are what
carry a hidden tab); and Tailwind's `line-clamp-*` sets its own `display`, so pairing it with `block` on the same
element silently drops the clamp - the first version of the card grew to 349px on a long message.

Harness: `%TEMP%\opencode\toast-cleanup.ps1` (the same shape as `chime-cleanup.ps1`), reusing `send-message.ps1`
for the sends.

### Step 11 follow-up — The owner's own sound (done, verified)

The owner changed their mind about the sound: instead of the generated chime they supplied their own file
(`mixkit-message-pop-alert-2354.mp3`, a Mixkit "message pop alert"). It was copied in as
`public/message-chime.mp3` and `CHIME_URL` in `src/lib/messageChime.js` now points at it. `public/message-chime.wav`
and the script that generated it (`gen-chime.mjs`) are gone, so the asset is a committed download whose source
is recorded here rather than a reproducible script — the honest replacement for that bullet, not a silencing of
it.

The sound is 1.07s and 46 KB (compressed mono; a pop and a short tail). That size is a *page-load* cost, not a
per-message one — the `Audio` element is created at module load so the first arrival is never announced a fetch
late — so a future replacement should stay a few hundred milliseconds of compressed mono audio.

Nothing else changed. The policy (`shouldChime`), the one-element design, the still-ringing guard and the
swallowed refusal are all untouched, so the swap only had to be checked for "does the new file decode and
play".

Verification: `npx eslint .` exits 0 and `npm run build` succeeds and copies `message-chime.mp3` into `dist/`
(no `.wav` there). `GET /message-chime.mp3` → 200 `audio/mpeg`, 46,937 bytes with an `ID3` header, and a probe
`Audio` read `duration` back as 1.07s. The real check: with `HTMLMediaElement.prototype.play` spied on in a
`/feed` tab, one hub relay as `bob_builder` produced exactly one `play()` call on
`http://localhost:5173/message-chime.mp3` whose promise **resolved** — a real playback, not a refused one —
56ms after the relay was invoked. A pure hub relay persists nothing, so this left no rows behind and needed no
clean-up.

One trap worth knowing: `GET /message-chime.wav` still answers 200 (as `text/html`), because Vite's dev server
falls back to `index.html` for any path that is not a real file. The wav is gone; the 200 is not evidence it
survived.

### Cleanup pass - unused dependency, presence refetch cost, dev rows (done, verified)

Three small items picked from the follow-up list; none of them is a numbered step, and the presence *wording*
was deliberately left alone (the owner asked for that part to stay as it was: "Online" / "Last seen …" /
"Offline").

**`next-themes` removed.** It was a dependency nothing imported. `src/components/ui/sonner.jsx` reads the
app's own `ThemeContext` through `@/hooks/useTheme`, and *that* is what puts `light`/`dark` on `<html>` — the
sonner palette only ever knew light and dark, which is how a white card ended up on a dark surface.
`npm uninstall next-themes`, no code change.

**A presence event no longer costs a refetch.** `useConversation` invalidated the `conversations()` prefix
whenever `query.data` changed, and `withPresence` rewrites the open thread's object identity — so every partner
coming online or going away bought a list refresh *and* a thread refresh to learn nothing. The effect now keys
on the thread's messages (the newest id plus the count), which is the whole signal it was ever reacting to.

**The dev rows are gone.** The 7 labelled messages the browser runs left in Alice's thread with `testuser`
(`live-check-1`, `scroll-check`, `scroll-check-2`, `scroll-check-3`, `optimistic check from alice`,
`title-check`, `reconnect-check`), the `badge-check` row in her `nasrdev` thread, and the 3 `e2e rest ok` rows
from the earlier REST checks — 11 rows. `Conversations.LastMessageAt` is a *stored* column (it orders the
list), so it was repaired to `MAX(CreatedAt)` of the surviving messages; the `testuser` thread was already
carrying a stale value from an earlier cleanup, which is how that was noticed. The preview and the unread count
are derived, so they repaired themselves. The rows were deliberately *not* touched in the `testuser ↔ nasrdev`
thread, which belongs to another session.

Verification. `npx eslint .` exits 0 and `npm run build` succeeds. Two browser checks, both against the running
API + dev server, both read from `performance.getEntriesByType('resource')`:

- **No refetch from presence.** With a thread open, `gina_travel` connecting and then dropping flipped her row
  between "Online" and "Last seen just now" with the `/api/messages/conversations` count flat at 3 and the
  thread count flat at 4 — the old effect would have taken one of each for a transition.
- **The effect still does its job.** The list stays fresh for 30s (`staleTime`), so opening a thread with unread
  messages is exactly the case the effect exists for: doing it on a thread showing unread 3 refetched the list
  and cleared the badge to none.

Harness: `%TEMP%\opencode\labelled-cleanup.ps1 [-Apply]` (prints the rows and the stored `LastMessageAt` vs the
newest message before and after; `-Apply` deletes and repairs).

### Step 14 - Notification feed follow-up: live badge, row actions, own sound, toast (done, verified)

The owner came back after Step 13 with four things: the unread count on `/notifications` never moved when new
notifications arrived; their own sound (`mixkit-long-pop-2358.wav`, sitting in their Downloads folder) should
play when a notification comes in; rows should be deletable and markable as read; and a notification should
raise a toast bottom-right anywhere but the notifications page, just like a message.

**The badge (a real bug, not a polish item).** The mark-seen effect ran on every `unreadCount` change, so an
arrival while the page was open bumped the count and the effect immediately re-stamped the cursor and patched
it back to 0 within a frame — the pill never appeared to move, and the row would gain a dot next to a badge
reading "0 unread". The cursor is now stamped **once per visit** (a ref flips when the feed first has data,
*including at zero*, so the first arrival after a quiet open is not stamped away either). Arrivals mid-visit
move the pill and the bell and they stay until the next open of the page, which then covers everything that
landed meanwhile; rows keep the unread flags they were fetched with, so the dots stay meaningful for the visit.
The StrictMode cancellation guard went away with it — the only write is to the query cache, which outlives the
component, and cancelling is exactly what left the badge unpatched when React re-ran the effect.

**Mark as read / delete.** Unread stays derived from `Users.NotificationsSeenAt` and gained one nullable
column, `Notification.ReadAt`, for the single exception the cursor cannot express: one row read on a visit
whose cursor is older than it. The composed rule `ReadAt IS NULL AND CreatedAt > seenAt` feeds both
`unreadCount` and each row's flag, from the same cursor read, so they cannot disagree inside a response
(migration `AddNotificationReadAt`, applied). `POST /api/notifications/{id}/read` never moves backwards — a
repeat is a no-op, not a fresh timestamp. `DELETE /api/notifications/{id}` drops the row, because its only
purpose was to be read; both endpoints are owner-scoped, so another user's id (or a missing one) is a plain
404 rather than a hint that the row exists. In the UI the two buttons live **outside** the row's `<Link>` —
a `<button>` inside an `<a>` is invalid HTML and the click would navigate; the link keeps covering the icon
and sentence, so opening a row is unchanged. Both actions invalidate `notifications()` instead of patching:
the feed, the pill and both badges refetch together.

**Chime.** `src/lib/notificationChime.js` mirrors `messageChime.js` exactly (one `Audio` created at module
load, a ringing chime swallows the next arrival, an autoplay refusal is swallowed too): the owner's file went
in as `public/notification-chime.wav` (226 KB, shipped as WAV because that is what they supplied — the
mp3 re-encode question from Step 11 does not apply to it, and `CHIME_URL` is the one line to swap). Silent
exactly when `/notifications` is open in a tab that is visible *and* focused — the reader watched the row
land — and playing for every other case, no mute, same rule as messages. Message events keep their own
`message-chime.mp3`; hearing which file rang tells you which channel it was.

**Toast.** `src/lib/notificationToast.jsx` is the mirror of `messageToast.jsx`: `shouldToastNotification()`
returns false only under `/notifications`, and `showNotificationToast()` reuses `MessageToast` inside the
**same** `messages` toaster stack — same card, same bottom-right corner, same ~6s, actor name over the
generated sentence, click dismissing the card and navigating to `notificationCopy.notificationLink(...)`
through the router instance. A row with nothing left to open still toasts; the click just dismisses. To make
that possible the hub event grew a payload: `NotificationCreated` now carries the `NotificationDto` itself
(it was payload-less in Step 13) so card and chime do not wait for the refetch — the invalidation that
follows is unchanged and the feed remains the source of truth. The handler order in
`ChatConnectionContext` mirrors messages: chime, toast, invalidate.

Verification: `dotnet build` exits with 0 warnings, `npx eslint .` exits 0, `npm run build` succeeds, migration
`AddNotificationReadAt` applied. Browser checks against the running API + dev server, as Alice, with Bob
acting over REST; the Audio spy patches `HTMLMediaElement.prototype.play` and the toast recorder is a
page-side `MutationObserver` armed *before* each trigger (a toast lives 6s, which is shorter than the gap
between tool calls):

| Check | Result |
| --- | --- |
| Arrival while sitting on `/notifications` | pill 0 → **"1 unread" and it stayed** (the bug: the old code zeroed it again within a frame); bell badge 1; the new row the only dot; zero `[data-sonner-toast]` on this route |
| Second arrival on the same page | pill → "1 unread" again after a mark-as-read had cleared the first — arrivals keep moving it |
| Arrival while on `/feed` | card appeared with "Bob Alvarez \| commented on your post.", settled at x=517, y=577 in a 912×670 viewport (39px from the right, 23px from the bottom), `notification-chime.wav` played on the same tick |
| Click | page-side auto-click at appearance: `/feed` → `/post/08df2915-…`, card dismissed |
| Mark as read | pill and bell → 0, every dot gone, check buttons gone (delete stays, rows stay); SQL showed `ReadAt` set on the row that was **newer** than the cursor, and the composed rule counting 0 unread — the exact case a pure cursor cannot express |
| Delete | rows 6 → 5, pill and bell dropped to 0 |
| Contract | `DELETE` and `POST …/read` on another user's id → 404, on a missing id → 404, victim's row untouched and still counted |
| Message regression | a REST message to Alice while on `/notifications`: `message-chime.mp3` (not the wav), its card in the same stack (x=517), messages badge → 1 — the shared handler's message path is untouched |
| Console | only the documented StrictMode "connection was stopped during negotiation" line |

Not observable in this environment: the focused-window branch of the chime policy — the automation window
never has `document.hasFocus()`, so the wav played even on the feed (an unfocused window counts as "unseen",
which is the intended rule); the silence-on-focus branch is verified by the policy mirroring `shouldChime`,
not by ear.

Cost / cleanup: the dev database was restored to its pre-session state — Alice's 6 test notifications deleted
(table back to the 2 pre-existing community-test rows, `nasrdev`'s join request and `testuser`'s approval,
which were left alone), the 5 labelled comments, the 1 labelled message (with `Conversations.LastMessageAt`
repaired to the surviving newest), and Bob's test like removed. Copying the wav into `public/` while the dev
server watched crashed Vite on the documented `EBUSY`; it was restarted and served the file afterwards.

Harness: the page-side spy/observer snippets above are inline in the session; REST triggers reuse
`notif-test.ps1`'s shape and `send-message.ps1` for the message regression.

### Step 14 follow-up — Opening a notification marks it read (done, verified)

Two owner asks after Step 14: clicking the toast card, and clicking a row on `/notifications` itself, should
both mark the notification read. Both count as *reading* it — the card's sentence is on screen, or the reader
is being taken to the thing the row points at — so the badge must not keep counting it afterwards.

- Toast: `showNotificationToast`'s click handler now fires `POST {id}/read` (only while the payload says
  `unread`) and invalidates `notifications()` before navigating. Fire-and-forget on purpose: the request is
  not tied to the click's frame, it survives the router navigation, and a failure just leaves the badge
  where it was — the same rule as a failed seen-stamp. Nothing is patched by hand; the refetch moves pill,
  bell and sidebar together.
- Feed row: the row's `<Link>` gained an `onClick` that fires the **existing** `Mark as read` mutation when
  the row is unread — one mutation, one code path, so the pill, the dot, the check button and both badges
  all move on the single invalidation the check button already used. The navigation proceeds either way and
  an already-read row costs no request. Rows with no target keep no click, as before.

Verified (browser, as Alice, Bob commenting by REST): arrival while on `/notifications` gave pill "1
unread", one dot, one check button and bell 1; **clicking the row itself** navigated to `/post/…`, the bell
refetched to 0 with no error card, and returning to the feed showed the row present, dot gone, check button
gone (delete still there). SQL showed `ReadAt` set on that row while it was still *newer* than the cursor —
the per-row path doing the work, not the bulk stamp. Toast path: arrival on `/feed` → card auto-clicked at
appearance → navigated to the post, badge 0, `ReadAt` set on the second row. Console clean apart from the
documented StrictMode negotiation line; `eslint` exits 0 and `npm run build` succeeds. Dev database restored
as found (the two test notifications and two labelled comments deleted; the two pre-existing community-test
rows untouched).

### Step 15 — Notification polish: join-request deep link, sidebar count pills (done, verified)

Two follow-ups picked from the feed's first days of use. The session that started this work was cut short by
a rate limit with the code written but unrecorded; it was finished, verified and committed the next day.

**A join-request notification opens on the action.** `CommunityJoinRequested` rows used to link to the
community's public page, where the reviewer has no way to approve or decline. `notificationLink` now returns
`/communities/<slug>/manage?tab=requests` for that type, and `ManageCommunity` made its tab controlled by
`?tab=`: a value this reader cannot see — unknown, or admin-only for a moderator — falls back to the role
default, and the tab change is written with `replace` so clicking through tabs does not fill the history and
the role default clears the param. The address bar therefore describes the pane on screen, and the toast
card's click (same `notificationLink`) lands the reviewer straight on the queue.

**The count sits on the icon.** `SidebarNavItem` used to place the badge at the end of the row when expanded
and drop a bare dot on the icon when collapsed. The badge is now one pill pinned to the icon itself
(`relative` wrapper, `absolute -right-2 -top-2`), so Messages and Notifications read the same in both states
and match the navbar's icon buttons. `chatHub.js` gained a comment correction (`NotificationCreated` carries
the DTO, it is not payload-free).

Verification: `npx eslint .` exits 0 and `npm run build` succeeds. No server change, no migration. Driven in a
real browser against the running API + dev server as `gina_travel` (admin of Wanderlust) and `carla_dev` (its
moderator); the sidebar sits behind the `lg:` breakpoint at a 912px viewport, so it was measured in place with
the layout's grid template pinned inline:

| Check | Result |
| --- | --- |
| Pill, expanded sidebar | 16×16 badge on the 20×20 icon's top-right corner, offset exactly +8px/−8px; the label keeps its place after the icon |
| Pill, collapsed sidebar | same geometry, label gone, icon centered — the two states now read identically (the old code showed a bare dot here) |
| No badge at zero | `hasBadge = badge > 0`: Notifications at 0 unread renders no pill |
| Join request → toast → click | card raised for the community's admins, click navigated to `/communities/wanderlust/manage?tab=requests` with Requests the active tab |
| Owner's end-to-end | the request → notification → Requests-tab journey and both sidebar badges were confirmed by the owner in their own browser |

Cost / cleanup: the dev database was restored as found — the 8 notification rows the interrupted session and
this verification left (5 from the cut-off session's checks, 2 from the join-request trigger, 1 from the
owner's click-test), the two pending join requests they produced (`frank_fit` → Wanderlust, `testuser` →
Developers United), bob's labelled `pill-check comment`, and the two follows created in the same seconds as
the deleted Follow notifications. The two pre-existing join requests and bob→alice's harness follow were
deliberately left alone.

### Step 16 — Messaging fan-out gaps: post-only live delivery, sender echo, typing rate limit (done, verified)

Three gaps the owner picked from the messaging phase (the background-tab toast timer was reviewed and
explicitly excluded as minor — it stays a known limit):

**Post-only messages now fan out.** `MessagesController.SendMessage` skipped the hub fan-out whenever
`Content` was empty, so a message that only carries a shared post arrived silently: badge and preview only on
the next refetch, never a chime or a toast. The content guard is gone — every send fans out — and the
envelope carries `EncryptedPayload = message.Content ?? string.Empty`, so the receiving client gets a defined
`""` and the post-only fallback preview (`"Shared a post"`, the same wording `ConversationList` shows).

**The sender hears their own message.** `MessageDeliveryService.DeliverAsync` now routes with
`_hub.Clients.Users(recipient, sender)`: the sender's *other* tabs/devices get the same envelope as the
recipient, which is what keeps a second tab in sync instead of waiting for the next refetch. The sending tab
receives its own echo too and treats it as a plain invalidation — `ChatConnectionContext` skips the chime and
the toast when `senderId === myUserIdRef.current` but still invalidates `conversations()`. The guard lives in
the single `RECEIVE_MESSAGE_EVENT` handler rather than in `messageChime.js`/`messageToast.jsx`, so the policy
libraries keep their one job (they are also shared with the notification chime/toast). `myUserIdRef` is
written in a `useEffect` because eslint's `react-hooks/refs` rule rejects ref writes during render. The
hub-relay path (`SendEncryptedMessage`) stays recipient-only: a relay is not a persisted message and the
sender's own cache update is still theirs to make.

**Typing is rate limited per connection.** New `Services/TypingRateLimiter` singleton: a token bucket keyed
by connection id (capacity 10, refill 0.5/s, wall-clock refill under a per-bucket lock, entry removed on
disconnect), registered in `Program.cs` and injected into `ChatHub`, whose `SendTyping` now checks it as its
**first** line — before any policy or DB work — and drops over-budget signals at `Debug`. Keying by
connection (not user) means a user with two tabs gets two budgets, while a hostile client only ever exhausts
its own; the drop is silent for the same reason every other typing rejection is (the signal is automatic
noise, it must never surface an error).

Verification: `dotnet build -o <temp>` 0 warnings / 0 errors, `npx eslint .` exits 0, `npm run build`
succeeds. Harness (`%TEMP%\opencode\step16-e2e.ps1` + `sigtest\step16-test.mjs`, temp build on port 5299)
ran **20/20 checks passed** twice — post-only fan-out reaches all 3 of the recipient's connections with
`encryptedPayload === ""` and ids matching the REST response; the sender's two connections both receive the
echo; a 40-signal typing burst is capped at exactly 10 with ~2 tokens refilled after 4.2s, a second
connection of the same user still gets through (per-connection keying), refusals are silent (no caller
errors) and the sender never hears their own typing.

Browser checks against the live dev server (tab A: `gina_travel` on the alice thread; tab B: `gina_travel` on
`/feed` as the background canary, with a page-world spy injected via a `<script>` element mirroring
`{p,f,t}` — chime plays, message fetches, toast texts — onto `document.documentElement[data-s16]`, because
`browser.evaluate` runs in an isolated world and cannot see page-world patches):

| Check | Result |
| --- | --- |
| Own echo, no noise | message sent from tab A → tab B refetched `/api/messages/conversations` **+135 ms** after the POST (CDP), while the spy read `p:0 t:[]` — invalidation fired, no chime, no toast |
| Post-only live | REST `carla_dev → gina_travel` with `content:""` → 200; tab B chimed (`p:1`) and toasted `"Shared a post"` |
| Toast click | card navigated to `/messages/<new conversation>` where the shared post card rendered with Carla's post. The card had to be clicked *after* its entrance animation (its centre sits below the 700px viewport while sliding in, `elementFromPoint` → null) — a timing artefact of the check, not a product bug |
| Chime positive control | the same spy that stayed at `p:0` for the own-echo read `p:1` on the post-only arrival, so the zero is a real zero |

Cost / cleanup: the dev database was restored as found — the 4 harness rows (`step16-fanout-check` ×2 + the
2 post-only rows in `cdf5b507`), the 3 `step16-echo-check*` rows in gina's thread with alice, and the whole
carla↔gina conversation `04e65af2` the toast check created (6 messages + participants) deleted; 0 rows from
today remain. `LastMessageAt` repaired to `MAX(CreatedAt)` on both surviving conversations (`cdf5b507` →
2026-10-13 10:37:58, `1d98b7cd` → 2026-10-19 17:55:53), undoing the staleness this kind of deletion caused
before. Pre-existing rows untouched (7 + 2 messages respectively).

### Step 17 — End-to-end encryption on the web client (done, verified)

The owner's phase order: the web app gets real end-to-end encryption first, mobile follows. The server stays
exactly what it was — a dumb pipe that stores and relays ciphertext it cannot read — so this step is almost
entirely client-side, plus one new endpoint to publish and fetch the public keys a sender needs.

**Envelope format.** One string in `Message.Content`, so the column, the REST contract, the hub envelope and
the fan-out are all unchanged: `ENC:v1:` + base64 of `{v, alg, e, iv, ct, w:[{d,k}]}` — `e` the sender's
ephemeral P-256 public key, `iv` the 12-byte GCM nonce, `ct` the AES-GCM ciphertext, `w` one wrapped copy of
the CEK per device. The CEK is wrapped for **both** participants' devices, the sender's own included: that is
what makes the Step 16 self-echo render its real text in the sender's other tabs instead of a placeholder.
One ephemeral keypair per message, so nothing links two messages from the same sender.

**Key directory.** New `UserDeviceKeys` table (unique `(UserId, DeviceId)`, upserted with
`INSERT ... ON DUPLICATE KEY UPDATE` so a re-publish is an update and not a duplicate), migration
`20261020100420_AddUserDeviceKeys`. `KeysController` exposes `POST /api/keys` (register this device's public
key) and `GET /api/keys/{username}` (the devices of the person you are writing to). The read is gated by the
*same* `MessagePolicyService` rule as sending and answers with the *same* generic 403 wording ("This user
isn't accepting messages right now"), so the directory cannot be used to probe for users or to read around a
`MessagesFrom` setting; your own keys are always readable, and an unknown username is a plain 404. `Register`
validates the public key as a base64 uncompressed P-256 point (65 bytes, leading `0x04`) before storing it.

**Client.** `src/services/messageCrypto.js` is the whole implementation: envelope encode/decode, the keyvault,
send and receive, and the legacy decode path. Private keys are generated with WebCrypto as **non-extractable**
and live in IndexedDB (`circlehub-keyvault`), so they cannot be read back out by script or exfiltrated by an
XSS; the device id is a plain `localStorage` value (`circlehub-device-id`). `DeviceKeyPublisher` publishes the
key once per signed-in session (mounted in `src/main.jsx`), and `useDecryptedContent` is the single render
hook the thread, the conversation-list preview and the message toast all decrypt through. Every call site
(`MessageThread`, `ConversationList`, `MessageToast`, `MessageComposer`, `useSendMessage`) is a thin wrapper —
the crypto has one home.

**Never breaks the rollout.** A recipient with no published key gets plaintext, stored verbatim, so the
feature degrades to exactly what shipped in Step 16 rather than failing. Rows with no `ENC:v1:` prefix pass
through untouched, an envelope a device cannot open (a foreign device's, or one from a test key that no longer
exists) renders `[Can't decrypt this message]`, and a malformed envelope resolves to the same placeholder —
ciphertext is never shown to the reader.

**Limits.** `MessagesController.MaxContentLength` 2000 → 12000 (this is the *envelope*, not the plaintext),
`SendMessageDto.Content` `[MaxLength(14000)]` so model binding cannot silently truncate an envelope (the
default 4000 was cutting them off), and the client's `MAX_PLAINTEXT_LENGTH` is 4000.

Verification: `dotnet build` 0 warnings / 0 errors, `npx eslint .` exits 0, `npm run build` succeeds, and the
migration is applied. The hub/REST contract ran **38/38 checks passed** from
`%TEMP%\opencode\step17-e2e.ps1` + `sigtest\step17-test.mjs`, then the real-browser half was driven against a
temp API build on 5289 plus the Vite dev server.

| Check | Result |
| --- | --- |
| Device key on login | published automatically as `a1dad22e-…`; `GET /api/keys/alice_wonder` → 200 with 3 rows exposing only `deviceId`/`publicKey`/`createdAt` |
| Encrypted send | `alice_wonder` → `nasrdev` 200, stored envelope 1239 characters, prefix `ENC:v1:` |
| Thread + list preview | both render the decrypted plaintext |
| Cross-user receive | `nasrdev` read all four of alice's messages, **including his own send decrypted from its 4-wrap envelope** — the Step 16 echo stays readable |
| Sender's own device | can open their own send (`decrypted: true`, the 1 wrap for the local device) |
| Foreign-device envelope | renders `[Can't decrypt this message]` in the thread, in the list preview **and** in the copy path — the copy button wrote the placeholder, never the envelope |
| No-key fallback | sending to `bob_builder` (0 published keys) produced plaintext, stored verbatim |
| Legacy + malformed | old rows still decode; a malformed `ENC:v1:` handle resolves to the placeholder |
| Long message | a 4012-character plaintext → 8119-character envelope, stored and rendered intact |
| Over-cap | client throws `Messages can be at most 4000 characters`; server 400 `Messages can be at most 12000 characters`, no row written |
| No ciphertext on screen | 0 occurrences of `ENC:v1:` anywhere in the DOM |
| Toast | called directly with a raw ciphertext preview (as `ChatConnectionContext` does): renders the decrypted text, no leak |
| Live fan-out | a real REST fan-out as bob while Alice sat on `/feed` → one chime (`plays: 1`) and one card `Bob Alvarez \| live-relay-plain` |
| Access control | a non-participant got 404 `Conversation not found` |

Two notes worth keeping. The browser's private keys are non-extractable and IndexedDB-lived, so an envelope
written by `sigtest`'s node keys can *never* be read in the browser — that is the real reason those rows show
the placeholder, not a bug, and the harness deletes its `node-%` device keys. And this sandboxed model cannot
view screenshots, so every visual check above was measured through DOM/JS evaluation rather than by eye.

Also fixed in the same pass, from the owner's first look at the result: **long messages rendered as one
horizontal line.** The bubble put `max-w-[80%]` on a flex *column*, so the text box sized itself to its
content and `break-words` could not break a token with no spaces. The wrapper now carries `min-w-0` (so the
80% cap actually binds) and the bubble carries `max-w-full` + `[overflow-wrap:anywhere]`; the 4012-character
message now measures 653 px × 1236 px, a wrapped block inside the column. **The suggested people/communities
rail is gone on `/messages`** — `AppLayout` drops the third grid column there (the right sidebar is still
rendered on every other route: on `/feed` the 25 rem column and both headings are untouched), so the thread
takes the whole width. The conversation-list preview also gained `min-w-0 flex-1` so a long body cannot
stretch that row.

Cost / cleanup: the dev database was restored as found. The 8 rows this session wrote were deleted (their
conversations' `LastMessageAt` repaired to `MAX(CreatedAt)`, which also undid the staleness the earlier
deletions had left in `c4811a5f` and `cdf5b507`), the browser-published device key `a1dad22e-…` was removed
(keys back to the 5 pre-existing rows), and the legacy odd rows in the "known cleanups" list
(`ENC:v1:b2ZmbGluZQ==` in the gina thread, `ENC:v1:Q29kZS1pcy1vcGFxdWU=…` in the erin thread — 4 rows in
total) were deleted as that note said they should be. Pre-existing `ENC:v1:` rows from another session's
harness and `should not land` were left alone. The temp API build and the Vite dev server started for
verification were stopped afterwards; ports 5289 and 5173 are free.

Harness: `%TEMP%\opencode\step17-e2e.ps1`, `sigtest\step17-test.mjs`, `s17b-cleanup.ps1 [-Apply]`.

## Open questions

- Mobile parity for Step 17: the mobile client must publish its own device key and decrypt the same envelope
  (the wrap list makes this additive — the server and the format do not change). Key backup/recovery across a
  cleared browser profile is still open: today a wiped IndexedDB means the historical ciphertext for that
  device is unreadable.

## Incidents

- **Interference by a second agent (during Step 3).** A different model reverted
  `Controllers/MessagesController.cs` to its pre-Step-3 state and left two scratch files (`probe.js`,
  `smoke.js`) in the repo root; it also created a verified `smoketest` user in the dev database. The scratch
  files were deleted, the controller change was re-applied, and everything else was verified untouched (no
  stashes, no extra commits, mobile repo clean). The `smoketest` user is still in the dev database and is
  currently used by the harness as the restricted recipient.

## Known cleanups (not yet scheduled)

- A dev API instance may be holding port 5289 (`VITE_BASE_URL` in `.env.local` points there). If the port is
  busy, either stop that instance or point the frontend at the port you are running.
- `bob_builder.LastSeenAt` was set by the presence checks (12 minutes ago, then ~1 minute ago) to exercise the
  wording. The next time he connects it is overwritten with a real value; until then his row reads a
  plausible-but-invented time.
- Alice's conversation with `erin_photo` (`5929a15c`) is now **empty**: Step 17 deleted the harness rows that were
  its only messages, so `LastMessageAt` points at a message that no longer exists. Left as it is — an empty
  conversation is worse to repair than to leave visible, and it will be filled by the next real message. The
  conversation with `gina_travel` (`1d98b7cd`) kept its 3 real messages and was repaired.
- An earlier cleanup deleted the newest message of Alice's thread with `testuser` without repairing
  `LastMessageAt`, which is why that column was stale. Any future row deletion needs the same repair — the
  cleanup script in the section above shows the shape.
