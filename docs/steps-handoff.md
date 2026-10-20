# Steps Handoff & Implementation Record

> [!NOTE]
> Both **Step 18 (Key Recovery — `0c17ba0`)** and **Step 19 (Web Quality of Life & Layout Alignment — `020dcd2`)** are **complete, linted, built, and documented** in [`AGENTS.md`](../AGENTS.md), [`TASKS.md`](../TASKS.md), and [`docs/steps-plan.md`](./steps-plan.md).

---

## 1. Context & Motivation (Step 18 — Key Recovery)

In **Step 17**, end-to-end encryption (WebCrypto ECDH P-256 + AES-GCM) was implemented on the web client. The device private key was generated non-extractable and persisted exclusively in IndexedDB (`circlehub-keyvault`).
- **The Problem:** Clearing browser data, reinstalling the OS, or opening CircleHub on a new device/machine permanently wiped the device private key, causing all previously received/sent encrypted messages to show as `[Can't decrypt this message]`.
- **The Solution (Step 18):** User-held **12-word BIP39 recovery phrase** wrapping a random 32-byte account key and device private key (PBKDF2-HMAC-SHA-256 derivation with 310,000 iterations and per-user salt). The server stores only opaque ciphertext in `UserKeyBackups` via `PUT /api/keys/backup` and cannot decrypt messages or recover the phrase.

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

---

## 4. Verification Summary

| Check | Tool / Command | Result |
|---|---|---|
| C# Backend Compilation | `dotnet build CircleHub.Api.csproj -o <temp>` | **0 Warnings, 0 Errors** |
| Frontend Linting | `npm run lint` (`eslint .`) | **0 Errors, 0 Warnings** |
| Frontend Production Build | `npm run build` (`vite build`) | **Success in ~640ms**, 0 errors |
| StrictMode & Hooks Compliance | `react-hooks/set-state-in-effect` | Compliant |
