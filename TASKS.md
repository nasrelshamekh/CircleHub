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
| 11 | Incoming-message sound: committed chime, silent while the reader is looking at that thread | done, verified |

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
| No refetch loop | API calls stable at 4 over 66s; one presence event costs one list + one thread call |

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
chime rather than a sound file they would supply.

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

- A dev API instance may be holding port 5289 (`VITE_BASE_URL` in `.env.local` points there). If the port is
  busy, either stop that instance or point the frontend at the port you are running.
- The browser verification runs left labelled messages in the dev database in Alice's conversation with
  `testuser` (`live-check-1`, `scroll-check`, `scroll-check-2`, `scroll-check-3`, `optimistic check from
  alice`, `title-check`, `reconnect-check`) and one in her `nasrdev` conversation (`badge-check`). They are
  harness artefacts, not seed data; delete them when the thread should look clean again (their unread
  contribution follows the rows, so re-open the conversation afterwards).
- `bob_builder.LastSeenAt` was set by the presence checks (12 minutes ago, then ~1 minute ago) to exercise the
  wording. The next time he connects it is overwritten with a real value; until then his row reads a
  plausible-but-invented time.
