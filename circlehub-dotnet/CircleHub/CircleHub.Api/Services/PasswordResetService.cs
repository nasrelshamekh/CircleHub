using CircleHub.Api.Data;
using CircleHub.Api.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace CircleHub.Api.Services
{
    public enum RequestPasswordResetResult
    {
        Sent,
        UnknownEmail,
        EmailNotVerified,
        TooSoon
    }

    public enum ResetPasswordResult
    {
        Reset,
        InvalidToken
    }

    public class PasswordResetService
    {
        private readonly AppDbContext _db;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PasswordResetService> _logger;

        public PasswordResetService(
            AppDbContext db,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<PasswordResetService> logger)
        {
            _db = db;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
        }

        private string FrontendUrl => _configuration["FrontendUrl"] ?? "http://localhost:5173";

        private int TokenLifetimeHours =>
            int.TryParse(_configuration["PasswordReset:TokenLifetimeHours"], out var v) ? v : 1;

        private int ResendCooldownSeconds =>
            int.TryParse(_configuration["PasswordReset:ResendCooldownSeconds"], out var v) ? v : 60;

        public async Task<RequestPasswordResetResult> RequestAsync(string email)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email.Trim().ToLowerInvariant());
            if (user is null)
                return RequestPasswordResetResult.UnknownEmail;

            if (!user.EmailVerified)
                return RequestPasswordResetResult.EmailNotVerified;

            if (user.PasswordResetEmailSentAt is DateTime lastSent
                && lastSent.AddSeconds(ResendCooldownSeconds) > DateTime.UtcNow)
            {
                return RequestPasswordResetResult.TooSoon;
            }

            var rawToken = GenerateToken();
            user.PasswordResetTokenHash = HashToken(rawToken);
            user.PasswordResetTokenExpires = DateTime.UtcNow.AddHours(TokenLifetimeHours);
            user.PasswordResetEmailSentAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var resetUrl = $"{FrontendUrl}/reset-password?userId={user.Id}&token={rawToken}";
            await SendResetEmailAsLoggedAsync(user, resetUrl);

            return RequestPasswordResetResult.Sent;
        }

        public async Task<ResetPasswordResult> ResetAsync(Guid userId, string token, string newPassword)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user is null)
                return ResetPasswordResult.InvalidToken;

            if (string.IsNullOrEmpty(token)
                || user.PasswordResetTokenHash is null
                || user.PasswordResetTokenExpires is null
                || user.PasswordResetTokenExpires.Value < DateTime.UtcNow
                || !SafeEquals(user.PasswordResetTokenHash, HashToken(token)))
            {
                return ResetPasswordResult.InvalidToken;
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.PasswordResetTokenHash = null;
            user.PasswordResetTokenExpires = null;
            user.PasswordResetEmailSentAt = null;
            user.TokenVersion++;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return ResetPasswordResult.Reset;
        }

        private async Task SendResetEmailAsLoggedAsync(User user, string resetUrl)
        {
            try
            {
                await _emailService.SendAsync(
                    user.Email,
                    "Reset your CircleHub password",
                    EmailTemplates.PasswordReset(user.Name, resetUrl));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {Email}.", user.Email);
            }
        }

        private static string GenerateToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
                .TrimEnd('=')
                .Replace('+', '-')
                .Replace('/', '_');
        }

        private static string HashToken(string token) =>
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

        private static bool SafeEquals(string a, string b)
        {
            var left = Encoding.ASCII.GetBytes(a.ToUpperInvariant());
            var right = Encoding.ASCII.GetBytes(b.ToUpperInvariant());
            return left.Length == right.Length && CryptographicOperations.FixedTimeEquals(left, right);
        }
    }
}
