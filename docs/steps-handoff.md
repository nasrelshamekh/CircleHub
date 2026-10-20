# Steps Handoff & Implementation Record

> [!NOTE]
> Both **Step 18 (Key Recovery — `0c17ba0`)** and **Step 19 (Web Quality of Life & Layout Alignment — `020dcd2`)** are **complete, linted, built, and documented** in [`AGENTS.md`](../AGENTS.md), [`TASKS.md`](../TASKS.md), and [`docs/steps-plan.md`](./steps-plan.md).

---

## 1. Context & Motivation (Step 18 — Key Recovery)

In **Step 17**, end-to-end encryption (WebCrypto ECDH P-256 + AES-GCM) was implemented on the web client. The device private key was generated non-extractable and persisted exclusively in IndexedDB (`circlehub-keyvault`).
- **The Problem:** Clearing browser data, reinstalling the OS, or opening CircleHub on a new device/machine permanently wiped the device private key, causing all previously received/sent encrypted messages to show as `[Can't decrypt this message]`.
- **The Solution (Step 18):** User-held **12-word BIP39 recovery phrase** wrapping a random 32-byte account key and device keyring (PBKDF2-HMAC-SHA-256 derivation — 100,000 iterations for new backups per the server's `KdfIterations` floor, restores honor the stored value so older 310,000-iteration backups still unlock — with per-user salt). The server stores only opaque ciphertext in `UserKeyBackups` via `PUT /api/keys/backup` and cannot decrypt messages or recover the phrase.

---

## 2. Completed Implementation — Step 18 (`0c17ba0`)

### Backend (.NET 10 / ASP.NET Core)
1. **Entity:** `circlehub-dotnet/CircleHub/CircleHub.Api/Entities/UserKeyBackup.cs`
   - Columns: `Id`, `UserId`, `WrappedAccountKey` (`varchar(500)`), `Salt` (`varchar(100)`), `KdfIterations`, `KdfAlgorithm` (`varchar(40)`), `CreatedAt`, `UpdatedAt`.
   - Index: Unique index on `UserId`.
2. **Migration:** `circlehub-dotnet/CircleHub/CircleHub.Api/Migrations/20261020112344_AddUserKeyBackups.cs` applied to `AppDbContext`.
3. **DTOs:** `circlehub-dotnet/CircleHub/CircleHub.Api/Dtos/KeyBackupDtos.cs`
   - `SaveKeyBackupRequest` and `KeyBackupDto`.
4. **Controller:** `circlehub-dotnet/CircleHub/CircleHub.Api/Controllers/KeyBackupController.cs`
   - `GET /api/keys/backup`: Returns the caller's backup or 404.
   - `PUT /api/keys/backup`: One-statement `INSERT ... ON DUPLICATE KEY UPDATE` upsert.
   - `DELETE /api/keys/backup`: Removes the caller's backup row.

### Frontend Crypto & UI (React 19 / Vite)
1. **BIP39 Wordlist:** `src/services/bip39Words.js` — Official 2048-word English list frozen locally.
2. **Key Recovery Service:** `src/services/keyRecovery.js` — `generateRecoveryPhrase`, `validatePhrase`, `setUpRecovery`, `unlockBackup`, `initializeRecovery`, `restoreRecovery`, `getBackupInfo`, `removeBackup`.
3. **Message Crypto Service:** `src/services/messageCrypto.js` — Exported `publishKey`, `createRecoverableDeviceKey`, `importDeviceKey`.
4. **UI Components:**
   - `src/components/messages/RecoverySetupDialog.jsx`: Numbered 12-word grid, copy-to-clipboard, safety acknowledgement checkbox.
   - `src/components/messages/RecoveryRestoreDialog.jsx`: Live word counter (`x / 12`), BIP39 checksum validation, and key restore.
   - `src/components/editprofile/MessageRecoveryCard.jsx`: Settings status card ("Recovery is active", timestamp, unlock, regenerate, remove).
   - `src/pages/EditProfile/EditProfile.jsx`: Integrated `MessageRecoveryCard` in the Settings tab.
   - `src/components/messages/DeviceKeyPublisher.jsx`: Prompts to unlock history via Sonner toast on new devices when a backup exists for a different `deviceId`.

---

## 3. Completed Implementation — Step 19: Web Quality of Life & Layout Alignment (`020dcd2`)

1. **Categorized Native Emoji Picker:** `src/components/messages/EmojiPicker.jsx`
   - Dependency-free native Unicode emoji picker across 4 categories (`Smileys & Emotion`, `Hands & Gestures`, `Hearts & Symbols`, `Animals & Food`) with keyword search, click-outside dismissal, and <kbd>Esc</kbd> support.
2. **Auto-Resizing Multiline Composer & Character Counter:** `src/components/messages/MessageComposer.jsx`
   - Replaced single-line `<input>` with an auto-expanding `<textarea>` (`42px` to `160px`, `placeholder="Write a message..."`).
   - <kbd>Enter</kbd> sends the message; <kbd>Shift</kbd>+<kbd>Enter</kbd> inserts a newline.
   - Displays a subtle character counter (`x / 4000`) above 2,500 characters (turning red above 3,800) to guard against `MAX_PLAINTEXT_LENGTH`.
3. **Failed Message State & 1-Click Retry:** `src/components/messages/MessageThread.jsx` & `src/components/messages/MessageComposer.jsx`
   - Failed sends remain visible with an error border and a **Retry** button that immediately re-transmits the message.
4. **Audio Alert Mute Toggles:** `src/components/editprofile/ProfileSettingsForm.jsx`, `src/lib/messageChime.js`, `src/lib/notificationChime.js`
   - Added **Message Alert Sounds** (`circlehub-mute-message-sound`) and **Notification Alert Sounds** (`circlehub-mute-notification-sound`) toggles in Profile Settings.
5. **Messages & Notifications Width and Layout Consistency:** `src/pages/Messages/Messages.jsx`, `src/components/messages/ConversationList.jsx`, `src/pages/Notifications/Notifications.jsx`
   - Aligned `Messages.jsx` with the shared `content-stack` page header (`type-headline-responsive` title + subtitle, `Conversations` card header with count pill, rounded list rows, unified empty states) while keeping `RightSidebar` omitted on `/messages` (`src/layouts/AppLayout.jsx`) and centering the two-pane workspace at `max-w-[96rem]` (`h-[calc(100dvh-10rem)] lg:h-[calc(100dvh-5rem)]`).
   - Widened `Notifications.jsx` from `max-w-5xl` to `max-w-7xl` to match `Explore`, `Communities`, `Followers`, and `EditProfile`.
6. **New Message Dialog:** `src/components/messages/NewMessageDialog.jsx`, `src/pages/Messages/Messages.jsx`
   - Added a **New Message** button in the Messages header to search connections (`useMessageRecipients`), jump straight to an existing conversation, or compose and send an opening encrypted message to start a new thread.
7. **Mark All as Read on Notifications:** `src/pages/Notifications/Notifications.jsx`
   - Added a **Mark all as read** button in the `Recent Activity` header when `visitUnreadCount > 0` (`markNotificationsSeen` + `notifications()` query invalidation).
8. **Route-Level & Vendor Code Splitting:** `src/routes/lazyPages.jsx`, `src/routes/router.jsx`, `vite.config.js`
   - Converted all 18 route pages to `React.lazy` chunks inside `<Suspense>` and configured Rolldown vendor chunk splitting (`vendor-react`, `vendor-ui`, `vendor-signalr`), dropping the entry bundle from ~1,117 kB to 259 kB (84 kB gzip) with zero chunk warnings.

---

## 4. Mobile Phase (`circlehub-mobile` — Steps 5, 6, 8) & Post-Implementation Fixes

1. **Expo Push Fallback & Device Tokens (`CircleHub.Api`):**
   - `DeviceToken` entity (`20261020144854_AddDeviceTokens`), `DevicesController` (`POST /api/devices`, `DELETE /api/devices`), and `ExpoPushService` batch delivery to `https://exp.host/--/api/v2/push/send` with automatic `DeviceNotRegistered` token pruning and E2EE-safe generic push banners.
2. **Mobile Real-Time, Notifications, E2EE & 12-Word Key Recovery (`circlehub-mobile`):**
   - SignalR connection context (`src/context/chatconnectioncontext.tsx`), presence (`PresenceLabel`, `PresenceDot`), typing indicators (header `TypingLabel` + thread bottom animated `TypingBubble`, case-insensitive user ID normalization), categorized native emoji picker (`src/components/messages/emojipicker.tsx`), `/notifications` screen, WebCrypto-interoperable `ENC:v1:` E2EE (`src/services/messageCrypto.ts`), and 12-word BIP39 recovery (`src/services/keyRecovery.ts`, `src/components/profile/messagerecoverycard.tsx`).
3. **Bug Fixes & UX Polish (Web & Mobile):**
   - **Multi-key historical keyring (`KeyBackupBundleV1.keys`):** Preserved `pkcs8B64` across key generation and recovery setup (`createAndStoreKey` / `createRecoverableDeviceKey`) and backed up/restored all historical device keys (`device-keys:<userId>`) on both web and mobile so pre-backup messages remain readable across devices.
   - **Fast mobile PBKDF2 unlock & live re-decryption:** Replaced slow `pbkdf2Async` (300+ `setTimeout` yields) with a single 30ms UI yield + tight-loop `pbkdf2`, stopped caching `UNREADABLE_PLACEHOLDER` in `settledCache`, and wired `useSyncExternalStore` (`subscribeDecryptCache` / `getDecryptCacheVersion`) into `useDecryptedContent` on both mobile and web so messages immediately re-decrypt upon unlocking a recovery phrase.
   - **Web IndexedDB minimize/focus fix (`src/services/messageCrypto.js`):** Removed the `if (memoryFallback) return Promise.resolve(null);` short-circuit in `openStore()` that permanently disabled IndexedDB after `saveStoredKey()` or background tab throttling, and cached merged keys in `memoryKeys` `Map`.
   - **Mobile seamless optimistic send handoff (`src/components/messages/messagethread.tsx`, `src/services/messageCrypto.ts`):** Pre-seeded `settledCache` on encrypt and transitioned optimistic `pendingMessages` entries to the server's `response.data.message.id` (`pending: false`) until the conversation query cache includes that message ID, eliminating send flicker.
   - **Mobile UI fixes:** Wrapped `"Encrypted Message\nRecovery"` title in `MessageRecoveryCard` to prevent badge overlap; replaced transparent icon with 1024×1024 opaque `#FFFFFF` `circlehub-app-icon.png` for Expo Go; updated Create Post (`compose` in `src/app/_layout.tsx` & `src/app/compose.tsx`) to use `presentation: "transparentModal"`, `animation: "slide_from_bottom"`, `bg-background`, and the circular `X` close button matching `SharePostModal`.

---

## 5. Verification Summary

| Check | Tool / Command | Result |
|---|---|---|
| C# Backend Compilation | `dotnet build CircleHub.Api.csproj -o <temp>` | **0 Warnings, 0 Errors** |
| Web Frontend Linting | `npm run lint` (`eslint .`) | **0 Errors, 0 Warnings** |
| Web Frontend Production Build | `npm run build` (`vite build`) | **Success in ~640ms**, 0 errors |
| Mobile TypeScript & Linting | `npx tsc --noEmit && npm run lint` | **0 Errors, 0 Warnings** |
| Mobile Jest Test Suite | `npm test -- --watchAll=false` | **10/10 suites passed (74/74 tests)** |
