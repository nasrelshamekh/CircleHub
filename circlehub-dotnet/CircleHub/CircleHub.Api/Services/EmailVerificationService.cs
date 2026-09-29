using CircleHub.Api.Data;
using CircleHub.Api.Entities;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace CircleHub.Api.Services
{
    public enum VerifyEmailResult
    {
        Verified,
        AlreadyVerified,
        InvalidLink
    }

    public enum ResendVerificationResult
    {
        Sent,
        UnknownEmail,
        AlreadyVerified,
        TooSoon
    }

    public class EmailVerificationService
    {
        private readonly AppDbContext _db;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailVerificationService> _logger;

        public EmailVerificationService(
            AppDbContext db,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<EmailVerificationService> logger)
        {
            _db = db;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
        }

        private string FrontendUrl => _configuration["FrontendUrl"] ?? "http://localhost:5173";

        private int TokenLifetimeHours =>
            int.TryParse(_configuration["Verification:TokenLifetimeHours"], out var v) ? v : 24;

        private int ResendCooldownSeconds =>
            int.TryParse(_configuration["Verification:ResendCooldownSeconds"], out var v) ? v : 60;

        public async Task IssueVerificationAsync(User user)
        {
            var rawToken = GenerateToken();
            user.EmailVerified = false;
            user.EmailVerificationTokenHash = HashToken(rawToken);
            user.EmailVerificationTokenExpires = DateTime.UtcNow.AddHours(TokenLifetimeHours);
            user.VerificationEmailSentAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var verifyUrl = $"{FrontendUrl}/verify-email?userId={user.Id}&token={rawToken}";
            await SendVerificationEmailAsLoggedAsync(user, verifyUrl);
        }

        public async Task<VerifyEmailResult> VerifyAsync(Guid userId, string token)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user is null)
                return VerifyEmailResult.InvalidLink;

            if (user.EmailVerified)
                return VerifyEmailResult.AlreadyVerified;

            if (string.IsNullOrEmpty(token)
                || user.EmailVerificationTokenHash is null
                || user.EmailVerificationTokenExpires is null
                || user.EmailVerificationTokenExpires.Value < DateTime.UtcNow
                || !SafeEquals(user.EmailVerificationTokenHash, HashToken(token)))
            {
                return VerifyEmailResult.InvalidLink;
            }

            user.EmailVerified = true;
            user.EmailVerificationTokenHash = null;
            user.EmailVerificationTokenExpires = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return VerifyEmailResult.Verified;
        }

        public async Task<ResendVerificationResult> ResendAsync(string email)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email.Trim().ToLowerInvariant());
            if (user is null)
                return ResendVerificationResult.UnknownEmail;

            if (user.EmailVerified)
                return ResendVerificationResult.AlreadyVerified;

            if (user.VerificationEmailSentAt is DateTime lastSent
                && lastSent.AddSeconds(ResendCooldownSeconds) > DateTime.UtcNow)
            {
                return ResendVerificationResult.TooSoon;
            }

            await IssueVerificationAsync(user);
            return ResendVerificationResult.Sent;
        }

        private async Task SendVerificationEmailAsLoggedAsync(User user, string verifyUrl)
        {
            try
            {
                await _emailService.SendAsync(
                    user.Email,
                    "Verify your CircleHub email",
                    EmailTemplates.Verification(user.Name, verifyUrl));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send verification email to {Email}.", user.Email);
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
