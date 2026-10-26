# CircleHub Web

The modern social platform for communities, creators, and conversations. CircleHub connects users through topic-based communities, rich multimedia posts, real-time messaging, and profile customization.

Built with **React 19**, **Vite**, **Tailwind CSS v4**, and backed by the ASP.NET Core **CircleHub.Api**.

---

## Features

- **Authentication & Onboarding**: Username/email login, registration with binary gender selection, avatar upload, and email verification.
- **Feed & Interactions**: Chronological post feed, like reactions with animations, threaded comments, and universal sharing.
- **Communities**: Topic-based community discovery, member roles, join requests, community avatars, and custom covers.
- **Direct Messaging & E2EE**: Real-time 1-on-1 chats powered by SignalR with end-to-end encryption (WebCrypto ECDH + AES-GCM) and BIP39 12-word passphrase recovery.
- **Social Reach & Interactivity**: Rich text auto-linking (@mentions, #hashtags, URLs), universal Copy Link / Share post dropdown, and private post bookmarking.
- **User Profiles**: Custom banners, avatars, bios, tabbed views (Posts, Media, Liked, Saved, About), and profile privacy controls.
- **Theme Support**: Seamless light and dark mode toggling.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| **Framework** | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + custom design tokens |
| **Icons & UI** | [Lucide React](https://lucide.dev/), [Radix UI](https://www.radix-ui.com/), [Motion](https://motion.dev/) |
| **Data Fetching** | [TanStack React Query v5](https://tanstack.com/query) + [Axios](https://axios-http.com/) |
| **Real-Time** | [@microsoft/signalr](https://www.npmjs.com/package/@microsoft/signalr) |
| **Forms & Validation** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/CircleHub.git
cd CircleHub

# Install dependencies
npm install

# Start local development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Configuration

Create a `.env` or `.env.local` file in the project root:

```env
VITE_BASE_URL=https://circlehub.runasp.net
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server with Hot Module Replacement |
| `npm run build` | Compile and bundle production assets to `/dist` |
| `npm run preview` | Locally preview production build |
| `npm run lint` | Run ESLint checks across codebase |

---

## Release History

### v1.2.0 (Current Release)
- **Universal Sharing & "Copy Link to Post"**:
  - Universal post dropdown menu (`...`) accessible to all users across the feed and post details.
  - One-click "Copy link" action with clipboard copy and toast notification.
  - Native browser sharing via `navigator.share` with automatic fallback.
- **Rich Interactive Text (`RichText`)**:
  - Auto-parsing URLs (`https?://...`) into clickable web links with propagation isolation.
  - Auto-detecting `@username` mentions linking directly to user profiles (`/profile/{username}`).
  - Auto-detecting `#hashtags` linking directly to filtered Explore views.
  - Supported across post content and comment threads.
- **Post Bookmarks / Saved Posts**:
  - Per-account client-side bookmarking hook (`useBookmarks`) with cross-tab/cross-component synchronization.
  - Bookmark toggle action button with instant optimistic feedback.
  - Dedicated "Saved" tab on the user's profile displaying all bookmarked posts with empty state.

### v1.1.0
- **Real-Time SignalR E2EE Messaging**: Full WebCrypto ECDH + AES-GCM encrypted direct messaging, SignalR chat hub, online/last-seen presence, and live typing indicators.
- **12-Word Passphrase Backup & Recovery**: BIP39 English mnemonic key wrap (PBKDF2-HMAC-SHA256) allowing users to restore conversation history across browsers and devices.
- **Real-Time Feed Sync & Floating Indicator**: Live post creation broadcasts with an animated drop-in `X New Posts` pill indicator when scrolled down.
- **In-App Notification Feed**: Live count badges, audio chimes, row-level read tracking, and toast notifications.
- **Asset Optimization**: Converted heavy PNG assets to modern WebP (hero, signin, register), achieving a 96.7% size reduction (saving 4.3 MB).
- **UI & Accessibility Polish**: Added `CommunitiesListSkeleton`, linked profile media grid thumbnails, and aligned binary gender selection (Male / Female).

### v1.0.0
- Initial web release: Community network, accounts, profiles, post feed, likes, comments, communities, and light/dark theme.

---

## Upcoming (v1.3.0 — Package 2: Media & Community Experience)

The upcoming **v1.3.0** release will focus on rich media and community engagement:

1. **Full-Screen Media Lightbox**: Pinch-to-zoom, high-res previews, and swipe-to-dismiss for post images.
2. **Community Polls & Rich Post Types**: Interactive community polls and multi-image galleries.
3. **Enhanced Search Filters**: Categorical search facets and advanced discovery tools.
