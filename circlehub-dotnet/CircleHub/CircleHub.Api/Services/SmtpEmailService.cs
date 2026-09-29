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

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_configuration["Email:SenderName"] ?? "CircleHub", senderEmail));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;
            message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(
                _configuration["Email:SmtpHost"] ?? "smtp.gmail.com",
                int.TryParse(_configuration["Email:SmtpPort"], out var port) ? port : 587,
                SecureSocketOptions.StartTlsWhenAvailable,
                cancellationToken);

            await client.AuthenticateAsync(senderEmail, _configuration["Email:SmtpAppPassword"] ?? "", cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
        }
    }
}
