using System.Security.Claims;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using System.Net;
using CircleHub.Api.Data;
using CircleHub.Api.Dtos;
using CircleHub.Api.Entities;
using CircleHub.Api.Filters;
using CircleHub.Api.Hubs;
using CircleHub.Api.Services;
using CircleHub.Api.Services.Storage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Globalization;
using System.IO.Compression;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMemoryCache();
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

builder.Services.AddControllers(options =>
    {
        options.Filters.Add(new ResolveAbsoluteUrlFilter());
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new UtcDateTimeConverter());
    });
builder.Services.AddOpenApi();

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()?
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Select(origin => origin.Trim().TrimEnd('/'))
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray()
    ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    // REST does not need credentials, so an empty list can safely fall back to any origin
    // (local development, Expo web preview). Production sets Cors:AllowedOrigins.
    options.AddPolicy("AllowAll", policy =>
    {
        if (allowedOrigins.Length > 0)
            policy.WithOrigins(allowedOrigins).AllowAnyMethod().AllowAnyHeader();
        else
            policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });

    // SignalR needs credentials on the cross-origin negotiation request, and
    // AllowAnyOrigin can't be combined with AllowCredentials. Echo only the configured
    // origins; an empty list keeps the development behaviour.
    // See "Security considerations in ASP.NET Core SignalR".
    options.AddPolicy("SignalR", policy =>
    {
        if (allowedOrigins.Length > 0)
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .WithMethods("GET", "POST", "DELETE")
                .AllowCredentials();
        else
            policy.SetIsOriginAllowed(_ => true)
                .AllowAnyHeader()
                .WithMethods("GET", "POST", "DELETE")
                .AllowCredentials();
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// MonsterASP's "MySQL 8.0" database is actually MariaDB 10.10. Pomelo generates
// different SQL for the two servers, so the host chooses the dialect instead of
// hard-coding MySQL 8. Development keeps the local MySQL 8 default.
var serverVersion = BuildServerVersion(builder.Configuration["Database:ServerVersion"]);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, serverVersion));

static ServerVersion BuildServerVersion(string? configured)
{
    if (string.IsNullOrWhiteSpace(configured))
        return new MySqlServerVersion(new Version(8, 0, 46));

    var value = configured.Trim();
    if (value.Contains("mariadb", StringComparison.OrdinalIgnoreCase))
    {
        var number = value
            .Replace("-mariadb", "", StringComparison.OrdinalIgnoreCase)
            .Replace("mariadb", "", StringComparison.OrdinalIgnoreCase)
            .Trim();

        return new MariaDbServerVersion(Version.Parse(number));
    }

    return new MySqlServerVersion(Version.Parse(value));
}
builder.Services.Configure<R2Options>(
    builder.Configuration.GetSection(R2Options.SectionName));
builder.Services.AddSingleton<IObjectStorage, R2ObjectStorage>();

builder.Services.AddSingleton<TokenVersionCache>();
builder.Services.AddScoped<TokenService>();
builder.Services.AddScoped<UploadService>();
builder.Services.AddScoped<StorageMigrationService>();
builder.Services.AddScoped<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<EmailVerificationService>();
builder.Services.AddScoped<PasswordResetService>();
builder.Services.AddScoped<MessagePolicyService>();
builder.Services.AddHttpClient<ExpoPushService>();
builder.Services.AddScoped<MessageDeliveryService>();
builder.Services.AddScoped<PresenceService>();
builder.Services.AddScoped<NotificationService>();

builder.Services.AddSignalR();
// Routes Clients.User(id) to the "sub" claim, the same id the REST API uses.
builder.Services.AddSingleton<IUserIdProvider, CircleHubUserIdProvider>();
// Connection state is per-instance; see IConnectionTracker for the scale-out caveat.
builder.Services.AddSingleton<IConnectionTracker, ConnectionTracker>();
// Per-connection typing buckets: hub-wide state, so it must be a singleton like the tracker above.
builder.Services.AddSingleton<TypingRateLimiter>();
builder.Services.AddSingleton<MessageRelayRateLimiter>();

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var message = context.ModelState
            .Where(entry => entry.Value?.Errors.Count > 0)
            .SelectMany(entry => entry.Value!.Errors)
            .Select(error => error.ErrorMessage)
            .FirstOrDefault() ?? "Validation failed";

        return new BadRequestObjectResult(
            new ApiErrorResponse { Success = false, Message = message });
    };
});

var jwt = builder.Configuration.GetSection("Jwt");
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!))
        };

        options.Events = new JwtBearerEvents
        {
            // Browsers can't set an Authorization header on WebSocket or Server-Sent Events
            // requests, so the SignalR JS client sends the token as "?access_token=...".
            // Read it here, but only for the hub paths.
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];

                if (!string.IsNullOrEmpty(accessToken) &&
                    context.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            },
            OnTokenValidated = async context =>
            {
                var sub = context.Principal?.FindFirst("sub");
                if (sub is null || !Guid.TryParse(sub.Value, out var userId))
                {
                    context.Fail("Invalid sub claim");
                    return;
                }

                var tokenVersion = 0;
                var versionClaim = context.Principal?.FindFirst("tokenVersion");
                if (versionClaim is not null)
                    int.TryParse(versionClaim.Value, out tokenVersion);

                var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                var versionCache = context.HttpContext.RequestServices.GetRequiredService<TokenVersionCache>();
                var currentVersion = await versionCache.GetAsync(
                    userId,
                    db,
                    context.HttpContext.RequestAborted);

                if (currentVersion is null || currentVersion.Value != tokenVersion)
                    context.Fail("Token has been revoked");
            },
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new ApiErrorResponse
                {
                    Success = false,
                    Message = "Not authorized, token failed"
                });
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new ApiErrorResponse
                {
                    Success = false,
                    Message = "Forbidden"
                });
            }
        };
    });

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.ForwardLimit = 1;

    var forwardedSection = builder.Configuration.GetSection("ForwardedHeaders");
    var knownProxies = forwardedSection.GetSection("KnownProxies").Get<string[]>();
    if (knownProxies is { Length: > 0 })
    {
        foreach (var proxy in knownProxies)
        {
            if (IPAddress.TryParse(proxy, out var ip))
                options.KnownProxies.Add(ip);
        }
    }

    var knownNetworks = forwardedSection.GetSection("KnownNetworks").Get<string[]>();
    if (knownNetworks is { Length: > 0 })
    {
        foreach (var network in knownNetworks)
        {
            if (System.Net.IPNetwork.TryParse(network, out var ipNet))
                options.KnownIPNetworks.Add(ipNet);
        }
    }
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/json";

        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString(CultureInfo.InvariantCulture);
        }

        await context.HttpContext.Response.WriteAsJsonAsync(new ApiErrorResponse
        {
            Success = false,
            Message = "Too many requests. Please try again later."
        }, cancellationToken);
    };

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var partitionKey = httpContext.User.FindFirstValue("sub")
            ?? httpContext.Connection.RemoteIpAddress?.ToString()
            ?? "anonymous";

        return RateLimitPartition.GetSlidingWindowLimiter(
            partitionKey,
            _ => new SlidingWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                SegmentsPerWindow = 4,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 10
            });
    });

    options.AddPolicy("auth", httpContext =>
    {
        var partitionKey = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown_client";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    options.AddPolicy("upload", httpContext =>
    {
        var partitionKey = httpContext.User.FindFirstValue("sub")
            ?? httpContext.Connection.RemoteIpAddress?.ToString()
            ?? "unknown_uploader";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 15,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    options.AddPolicy("messages", httpContext =>
    {
        var partitionKey = httpContext.User.FindFirstValue("sub")
            ?? httpContext.Connection.RemoteIpAddress?.ToString()
            ?? "unknown_sender";

        return RateLimitPartition.GetTokenBucketLimiter(
            partitionKey,
            _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit = 20,
                QueueLimit = 0,
                ReplenishmentPeriod = TimeSpan.FromSeconds(2),
                TokensPerPeriod = 1,
                AutoReplenishment = true
            });
    });
});

// Fail fast on a misconfigured host. An empty Jwt:Key otherwise only surfaces as
// "IDX10703" on the first sign-in, which is much harder to diagnose on shared hosting.
if (!builder.Environment.IsDevelopment())
{
    var jwtKey = builder.Configuration["Jwt:Key"];
    if (string.IsNullOrWhiteSpace(jwtKey) || Encoding.UTF8.GetByteCount(jwtKey) < 32)
    {
        throw new InvalidOperationException(
            "Jwt:Key is missing or shorter than 32 bytes. Configure it in the host's environment variables.");
    }

    if (string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("DefaultConnection")))
    {
        throw new InvalidOperationException(
            "ConnectionStrings:DefaultConnection is missing. Configure it in the host's environment variables.");
    }
}

var app = builder.Build();

var objectStorage = app.Services.GetRequiredService<IObjectStorage>();
if (!objectStorage.IsConfigured)
{
    app.Logger.LogWarning(
        "Cloudflare R2 is not configured. Uploads will fall back to wwwroot/uploads, " +
        "which is not durable on shared hosting.");
}

app.UseForwardedHeaders();

app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
    context.Response.Headers["Content-Security-Policy"] = "default-src 'self'";

    // Tokens and reset links must never be cached by a proxy or the browser.
    if (context.Request.Path.StartsWithSegments("/api/auth"))
        context.Response.Headers.CacheControl = "no-store";

    await next();
});

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var exceptionFeature = context.Features.Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerPathFeature>();
        var ex = exceptionFeature?.Error;
        if (ex != null)
        {
            var logger = context.RequestServices.GetService<ILogger<Program>>();
            logger?.LogError(ex, "Unhandled exception on {Path}: {Message}", context.Request.Path, ex.Message);
        }

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new ApiErrorResponse
        {
            Success = false,
            Message = ex?.Message ?? "Server Error"
        });
    });
});

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

var webRoot = app.Environment.WebRootPath
    ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");

try
{
    Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "posts"));
}
catch (Exception ex) when (ex is UnauthorizedAccessException or IOException)
{
    // Shared hosting may not allow writes to the site folder. Do not turn that into a
    // startup failure: only uploads are affected, and R2 will remove the dependency.
    app.Logger.LogWarning(ex, "Could not create the uploads directory under {WebRoot}. Image uploads will fail.", webRoot);
}

var contentTypeProvider = new FileExtensionContentTypeProvider();
contentTypeProvider.Mappings.Clear();

contentTypeProvider.Mappings[".jpg"] = "image/jpeg";
contentTypeProvider.Mappings[".jpeg"] = "image/jpeg";
contentTypeProvider.Mappings[".png"] = "image/png";
contentTypeProvider.Mappings[".webp"] = "image/webp";
contentTypeProvider.Mappings[".ico"] = "image/x-icon";

app.UseCors("AllowAll");
app.UseResponseCompression();

// On IIS/MonsterASP TLS terminates at the web server, so a redirect is either a no-op
// or a loop. Enable this only when the app itself owns the HTTPS endpoint.
if (builder.Configuration.GetValue("HttpsRedirection:Enabled", false))
    app.UseHttpsRedirection();

if (!app.Environment.IsDevelopment())
    app.UseHsts();

app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = contentTypeProvider,
    ServeUnknownFileTypes = false
});

app.UseAuthentication();

app.UseAuthorization();

app.UseRateLimiter();

app.MapControllers();

// Anonymous liveness/readiness probe for the host's monitoring (and for
// "the app started but cannot reach MySQL" diagnosis after a deploy).
app.MapGet("/health", async (AppDbContext db, CancellationToken cancellationToken) =>
{
    try
    {
        return await db.Database.CanConnectAsync(cancellationToken)
            ? Results.Ok(new { status = "ok", version = "2.8.0-live-feed-sync" })
            : Results.Json(new { status = "degraded", version = "2.8.0-live-feed-sync" }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }
    catch
    {
        return Results.Json(new { status = "degraded", version = "2.7.0-profile-messaging" }, statusCode: StatusCodes.Status503ServiceUnavailable);
    }
});

app.MapHub<ChatHub>("/hubs/chat", options =>
    {
        // The REST pipeline re-reads User.TokenVersion on every request; this makes hub
        // connections behave the same way by closing them once the JWT expires.
        options.CloseOnAuthenticationExpiration = true;
    })
    .RequireCors("SignalR");

app.MapPost("/api/admin/migrate-storage", async (StorageMigrationService migrationService) =>
{
    var result = await migrationService.RunMigrationAsync();
    return Results.Ok(result);
});

// Run storage initialization & placeholder seeding in background on startup
_ = Task.Run(async () =>
{
    try
    {
        using var scope = app.Services.CreateScope();
        var migrationService = scope.ServiceProvider.GetRequiredService<StorageMigrationService>();
        await migrationService.RunMigrationAsync();
    }
    catch (Exception ex)
    {
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Background storage migration encountered an unhandled error.");
    }
});

app.Run();

public class UtcDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return DateTime.Parse(reader.GetString()!, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal);
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        if (value.Kind == DateTimeKind.Unspecified)
            value = DateTime.SpecifyKind(value, DateTimeKind.Utc);
        writer.WriteStringValue(value.ToUniversalTime());
    }
}
