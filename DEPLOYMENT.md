# Deploying CircleHub to MonsterASP.NET

This is the production checklist for the API and database. The frontend stays on
Vercel; only its `VITE_BASE_URL` changes.

## 1. Create the database

This deployment uses database `db74743` (public host `db74743.databaseasp.net`) and
website `circlehub.runasp.net`. The backend server for WebFTP/Visual Studio publishing
is `site100367.siteasp.net`. The plan is currently **Free**: 1 GB database, no
automatic backups, no `AlwaysRunning`.

1. Control Panel → **Databases** → **Add database** → **MySQL 8.0**.
   MonsterASP runs this on **MariaDB 10.10**, which is why the API reads
   `Database:ServerVersion` (`10.10.0-mariadb`) instead of hard-coding MySQL 8.
2. Open the database's **Overview** page and copy the **Local access** connection
   string. That is the one the website uses. `db74743.databaseasp.net` is the
   **remote** host — use it only for migrations from your PC, never as the website's
   connection string.
3. Enable **Remote access** only while running migrations from your PC, then turn it
   back off. The remote string needs `SslMode=Preferred`.
4. The free plan has a 1 GB database and **no automatic backups**; take a backup after
   the first migration.

## 2. Publish the API

From `circlehub-dotnet/CircleHub/CircleHub.Api`:

```powershell
dotnet publish -c Release -o C:\Projects\circlehub-dotnet-publish
```

Upload the contents of the publish folder to the site root (Visual Studio publish or
WebFTP). Keep the generated `web.config` — it already uses the supported
`dotnet .\CircleHub.Api.dll` in-process model.

In the Control Panel → **Scripting**, set the site's ASP.NET Core runtime to **.NET 10**
before the first request, otherwise IIS returns HTTP 500.30.

Do **not** upload `wwwroot/uploads` from your development machine; those are local test
images. Uploaded media will move to Cloudflare R2 in the next step.

Until R2 is enabled, the app pool identity must be able to write to `wwwroot/uploads`,
otherwise avatar/post uploads fail with HTTP 500. This is the main reason R2 is the
next step rather than an optional improvement.

## 3. Configure environment variables

Control Panel → **Websites** → your site → **Scripting** → **Environment variables**.
ASP.NET Core maps `__` to `:` and these values override `appsettings.json`.

| Name | Value |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__DefaultConnection` | the **Local access** string from step 1 |
| `Jwt__Key` | at least 32 random bytes (64+ chars) |
| `Jwt__Issuer` | `CircleHubApi` |
| `Jwt__Audience` | `CircleHubClient` |
| `Jwt__ExpiresInDays` | `7` |
| `Email__SmtpHost` | `smtp.gmail.com` (or MonsterASP's mail host) |
| `Email__SmtpPort` | `587` |
| `Email__SenderName` | `CircleHub` |
| `Email__SenderEmail` | the sending address |
| `Email__SmtpAppPassword` | the SMTP app password |
| `FrontendUrl` | `https://circle-hub-nu.vercel.app` |
| `AllowedHosts` | `circlehub.runasp.net;site100367.siteasp.net` |

`appsettings.Production.json` already sets `AllowedHosts` to
`circlehub.runasp.net;site100367.siteasp.net` and `Database:ServerVersion` to
`10.10.0-mariadb`. Add a custom domain to `AllowedHosts` (or set the env var) when you
attach one.

`Jwt:Key` and the connection string are validated at startup in non-Development
environments, so a missing value fails immediately with a clear message instead of
`IDX10703` on the first sign-in.

## 4. Apply migrations

The API does not migrate automatically. Choose one:

**Option A — import through the dashboard (no credentials leave your PC)**

1. Run `dotnet ef migrations script -o deploy/migrate.sql` (or use the checked-in
   `deploy/migrate.sql`, regenerated after any new migration).
2. Open the database in **WebMySQL** and import `deploy/migrate.sql`.
3. Confirm `__EFMigrationsHistory` contains every migration.

**Option B — run EF against the remote database**

```powershell
$env:ConnectionStrings__DefaultConnection = "Server=dbXXXX.public.databaseasp.net;Port=3306;Database=dbXXXX;Uid=dbXXXX;Pwd=...;SslMode=Preferred"
dotnet ef database update --project .\circlehub-dotnet\CircleHub\CircleHub.Api
```

Pomelo does not support `--idempotent` scripts, so do not pass that flag.

## 5. Verify

- `GET https://circlehub.runasp.net/health` → `{"status":"ok"}` (503 means the API is
  up but cannot reach MySQL). Right now that URL still serves the MonsterASP
  "Your site is ready" page, so publish the API first.
- Sign in, then check that `/api/auth/me` works and that SignalR connects
  (`/hubs/chat`). On IIS in-process, WebSockets must be enabled on the site.
- Trigger a verification email and confirm the link points at `FrontendUrl`.

## 6. Frontend

Update `CircleHub/.env.production` so production builds call the deployed API:

```text
VITE_BASE_URL=https://circlehub.runasp.net/api
```

Rebuild/redeploy on Vercel. If the API is behind a custom domain, use that instead.
`Cors:AllowedOrigins` in `appsettings.json` must contain the Vercel origin.

## 7. Proxy and HTTPS notes

- MonsterASP terminates TLS at IIS. `HttpsRedirection:Enabled` is `false`; enable it
  only if the app owns the HTTPS endpoint.
- `circlehub.runasp.net` currently resolves directly to MonsterASP (IIS headers, no
  `CF-Ray`), so **no forwarded-header configuration is needed**. If you later put a
  custom domain behind Cloudflare (orange cloud), set
  `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true` **or** list Cloudflare's ranges under
  `ForwardedHeaders:KnownProxies`. Otherwise `X-Forwarded-For` is ignored and every
  request is rate-limited as if it came from the same Cloudflare IP.
- Keep `AllowedHosts` set; it blocks requests with arbitrary `Host` headers.
- SignalR on the free plan: the app pool sleeps after 3 hours idle and `AlwaysRunning`
  is Premium-only. Clients reconnect (10 s retry), but presence/typing will be stale
  until the first request wakes the site.

## 8. After R2 is enabled

Once media lives in Cloudflare R2, `wwwroot/uploads` is only legacy data. Do not rely
on the site folder for uploads: shared hosting can overwrite it on redeploy and it is
not a durable or private store.
