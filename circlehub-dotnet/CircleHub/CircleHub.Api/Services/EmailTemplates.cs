using System.Net;

namespace CircleHub.Api.Services
{
    public static class EmailTemplates
    {
        public static string Verification(string name, string verifyUrl, string iconUrl)
        {
            var safeName = WebUtility.HtmlEncode(name);
            var safeUrl = WebUtility.HtmlEncode(verifyUrl);
            var safeIconUrl = WebUtility.HtmlEncode(iconUrl);

            return $"""
                <!DOCTYPE html>
                <html lang="en" xmlns="http://www.w3.org/1999/xhtml">
                <body style="margin:0;padding:0;background-color:#faf8ff;-webkit-font-smoothing:antialiased;">
                  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
                    Confirm your email address to activate your CircleHub account.
                  </div>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf8ff;">
                    <tr>
                      <td align="center" style="padding:40px 16px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;font-family:'Inter','Segoe UI',Helvetica,Arial,sans-serif;">
                          <tr>
                            <td align="center" style="background-color:#6d5df6;background-image:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:16px 16px 0 0;padding:28px 40px;">
                              <img src="{safeIconUrl}" width="42" height="42" alt="CircleHub" border="0" style="display:inline-block;width:42px;height:auto;border:0;outline:none;">
                            </td>
                          </tr>
                          <tr>
                            <td style="background-color:#ffffff;border-radius:0 0 16px 16px;padding:40px 40px 32px;">
                              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td align="center" style="padding-bottom:20px;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" style="width:72px;height:72px;background-color:#e1e0ff;border-radius:9999px;">
                                      <tr>
                                        <td align="center" style="font-size:32px;line-height:72px;color:#4648d4;">&#10003;</td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding-bottom:12px;font-size:24px;font-weight:700;line-height:32px;color:#131b2e;letter-spacing:-0.01em;">
                                    Verify your email address
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:0 8px 8px;font-size:15px;line-height:24px;color:#464554;">
                                    Hi {safeName},
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:0 8px 28px;font-size:15px;line-height:24px;color:#464554;">
                                    Thanks for joining CircleHub. Confirm your email address to activate your account and start building your network.
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding-bottom:24px;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:#6d5df6;background-image:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;">
                                      <tr>
                                        <td style="border-radius:12px;">
                                          <a href="{safeUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;line-height:20px;color:#ffffff;text-decoration:none;border-radius:12px;">Verify email</a>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:0 16px 4px;font-size:12px;line-height:18px;color:#767586;">
                                    Button not working? Copy and paste this link into your browser:
                                  </td>
                                </tr>
                                <tr>
                                  <td align="center" style="padding:0 16px;font-size:12px;line-height:18px;">
                                    <a href="{safeUrl}" style="color:#4648d4;text-decoration:underline;word-break:break-all;">{safeUrl}</a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td align="center" style="padding:20px 16px 0;font-size:12px;line-height:18px;color:#767586;">
                              You're receiving this because a CircleHub account was created using this email address.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """;
        }
    }
}
