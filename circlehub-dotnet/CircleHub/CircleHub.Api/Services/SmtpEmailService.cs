using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace CircleHub.Api.Services
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SmtpEmailService> _logger;

        public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
        {
            var senderEmail = _configuration["Email:SenderEmail"];
            if (string.IsNullOrWhiteSpace(senderEmail))
            {
                _logger.LogWarning("Email:SenderEmail is not configured; skipping send to {To}.", to);
                return;
            }

            var appPassword = _configuration["Email:SmtpAppPassword"];
            if (string.IsNullOrWhiteSpace(appPassword))
            {
                _logger.LogWarning("Email:SmtpAppPassword is not configured; skipping send to {To}.", to);
                return;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_configuration["Email:SenderName"] ?? "CircleHub", senderEmail));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;
            message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

            var port = int.TryParse(_configuration["Email:SmtpPort"], out var configuredPort) ? configuredPort : 587;

            using var client = new SmtpClient();
            // Never fall back to plaintext: 465 is implicit TLS, 587 must STARTTLS.
            // StartTlsWhenAvailable would allow a downgrade/stripping attack.
            await client.ConnectAsync(
                _configuration["Email:SmtpHost"] ?? "smtp.gmail.com",
                port,
                port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls,
                cancellationToken);

            await client.AuthenticateAsync(senderEmail, appPassword, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
        }
    }
}
