# CircleHub

A full-stack social networking platform where users post updates, share photos, follow each other, and join curated communities.

Built as a monorepo: a React frontend plus an ASP.NET Core Web API backend backed by MySQL.

## Features

- **Accounts** — register/login with email + username, JWT authentication, email verification (with resend cooldown)
- **Profiles** — avatar & cover uploads, bio, job title, dates, profile visibility
- **Posts** — text and image posts, edit content and replace images, delete, like/unlike
- **Comments** — thread comments on posts
- **Follows** — follow/unfollow, followers & following lists, suggested users
- **Communities** — public/private, cover image, join requests, roles (owner/admin/moderator/member), member management, moderation logs, community-specific posts
- **Search** — users and communities
- **Notifications** — notifications page
- **Theming** — light/dark mode

## Tech Stack

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React · Vite · Tailwind CSS v4 · React Router v7 · TanStack Query · Axios · Zod · React Hook Form · Radix UI · shadcn · Sonner · next-themes · Motion |
| Backend  | ASP.NET Core (.NET 10) Web API · Entity Framework Core (Pomelo) · JWT Bearer · BCrypt · MailKit |
| Database | MySQL 8 |

## Repository Layout

```
CircleHub/
├── src/                          # Frontend (React + Vite)
│   ├── components/               # Reusable UI, feature components
│   ├── pages/                    # Route pages
│   ├── hooks/                    # Data hooks + TanStack Query mutations
│   ├── services/                 # API clients (axios)
│   ├── layouts/                  # App, auth, focus layouts
│   ├── routes/                   # Router definitions
│   └── lib/                      # Validation & utilities
├── circlehub-dotnet/
│   └── CircleHub/
│       ├── CircleHub.Api/        # ASP.NET Core Web API
│       │   ├── Controllers/      # Auth, Posts, Comments, Communities, Users, Search
│       │   ├── Dtos/             # Request/response models
│       │   ├── Entities/         # EF Core entities
│       │   ├── Enums/            # Community visibility, roles, etc.
│       │   ├── Services/         # Tokens, email, uploads
│       │   ├── Data/             # DbContext + migrations
│       │   └── wwwroot/          # Static assets + uploads
│       └── CircleHub.slnx
└── README.md
```

## Prerequisites

- Node.js 20+ and npm
- .NET 10 SDK
- MySQL 8 (e.g. running on `localhost:3306`)

## Getting Started

### 1. Backend

```bash
cd circlehub-dotnet/CircleHub/CircleHub.Api

# configure local secrets (never commit these)
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "server=localhost;port=3306;database=circlehub;user=root;password=YOUR_PASSWORD"
dotnet user-secrets set "Jwt:Key" "SOME_LONG_RANDOM_STRING"
dotnet user-secrets set "Jwt:Issuer" "CircleHubApi"
dotnet user-secrets set "Jwt:Audience" "CircleHubClient"
dotnet user-secrets set "Email:SmtpHost" "smtp.gmail.com"
dotnet user-secrets set "Email:SmtpPort" "587"
dotnet user-secrets set "Email:SenderEmail" "YOUR_EMAIL"
dotnet user-secrets set "Email:SmtpAppPassword" "YOUR_APP_PASSWORD"

# create/update the database schema
dotnet ef database update

# run the API (listens on http://localhost:5289)
dotnet run --project CircleHub.Api -lp http
```

Secrets stay out of the repo via .NET user-secrets. The committed `appsettings.json` contains only placeholders.

### 2. Frontend

```bash
cd ../..   # repo root

npm install

# point the frontend at your API (defaults can go in .env.local)
echo "VITE_BASE_URL=http://localhost:5289/api" > .env.local

npm run dev   # opens http://localhost:5173
```

`VITE_BASE_URL` is baked into the bundle at build time. `.env.local` is gitignored; `.env.production` is committed so deployed builds resolve their API origin.

## Scripts

### Frontend

| Command          | Description                        |
| ---------------- | ---------------------------------- |
| `npm run dev`    | Start the Vite dev server          |
| `npm run build`  | Production build (Vite)            |
| `npm run lint`   | Run ESLint                         |
| `npm run preview`| Preview the production build       |

### Backend

| Command | Description                  |
| ------- | ---------------------------- |
| `dotnet run --project CircleHub.Api` | Run the API          |
| `dotnet build`                       | Build the solution |
| `dotnet ef database update`          | Apply EF migrations |
| `dotnet ef migrations add <Name>`    | Create a migration   |

## API Overview

- **Auth** — `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`, `GET /api/auth/me`
- **Posts** — `GET /api/posts` (feed), `GET /api/posts/{id}`, `POST /api/posts`, `PATCH /api/posts/{id}` (text/image), `DELETE /api/posts/{id}`, `PATCH /api/posts/{id}/like`
- **Comments** — `GET|POST /api/posts/{postId}/comments`, `DELETE /api/posts/{postId}/comments/{commentId}`
- **Communities** — `GET /api/communities`, `GET /api/communities/categories`, `POST /api/communities`, `GET /api/communities/{slug}`, `PATCH|DELETE /api/communities/{id}`, `POST /api/communities/{id}/join`, `DELETE /api/communities/{id}/membership`, member list/roles, join-request approve/reject, `GET|POST /api/communities/{id}/posts`
- **Users** — `PATCH /api/users/me`, `GET /api/users/{username}`, `GET /api/users/suggested`, follower/following lists, `POST|DELETE /api/users/{id}/follow`
- **Search** — `GET /api/search?q=` (users and communities)

All protected endpoints require a `Bearer` token. Auth is username-or-email + password; tokens expire after the configured `Jwt:ExpiresInDays`.

## Deployment

- **Frontend** — deployed to Vercel (GitHub integration). The `VITE_BASE_URL` used in production builds is read from the committed `.env.production`.
- **Backend** — any publicly reachable host (or a tunnel such as Cloudflare Tunnel). Set `FrontendUrl` in `appsettings.json`/environment to the deployed frontend URL so email verification links point to the right place.
- The API trusts `X-Forwarded-For` / `X-Forwarded-Proto` headers, so behind a TLS-terminating proxy (e.g. Cloudflare) it correctly emits `https` URLs for uploaded images and links.

## Security Notes

- Passwords are hashed with BCrypt.
- JWT `sub` claims are validated as GUIDs on every request.
- Uploads are validated by file type magic bytes and size, and are served only through an allow-listed static file content-type map.
- Email credentials, DB connection string, and the JWT signing key are never committed.