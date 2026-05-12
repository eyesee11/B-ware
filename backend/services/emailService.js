const nodemailer = require('nodemailer');

// Create reusable transporter using SMTP credentials from .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // TLS via STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send a password reset email with a styled HTML template
 * @param {string} toEmail - Recipient email address
 * @param {string} resetLink - Firebase password reset link
 */
async function sendPasswordResetEmail(toEmail, resetLink) {
  const from = process.env.SMTP_FROM || `"B-Ware Support" <noreply@b-ware.com>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>B-ware Password Reset</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #1e1e1e;max-width:560px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="padding:40px 48px 32px;border-bottom:1px solid #1e1e1e;">
              <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#ef4444;font-weight:700;">
                B-WARE FORENSIC DIVISION
              </p>
              <h1 style="margin:12px 0 0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.02em;line-height:1.1;">
                Password Reset
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;">
              <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;line-height:1.7;">
                A password reset request was submitted for your B-ware account associated with
                <strong style="color:#e4e4e7;">${toEmail}</strong>.
              </p>
              <p style="margin:0 0 32px;color:#a1a1aa;font-size:14px;line-height:1.7;">
                Click the button below to set a new cipher. This link is valid for <strong style="color:#e4e4e7;">1 hour</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#ef4444;padding:0;">
                    <a href="${resetLink}"
                       style="display:inline-block;padding:16px 40px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                      Reset My Password →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;color:#52525b;font-size:12px;line-height:1.6;">
                If you did not request a password reset, disregard this message. Your account remains secure.
                All session interactions are monitored under the B-ware Intelligence Directive.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px;border-top:1px solid #1e1e1e;">
              <p style="margin:0;color:#3f3f46;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;">
                © 2025 B-Ware Forensic Division · Proprietary &amp; Confidential
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: '[B-ware] Password Reset Request',
    html,
    text: `B-ware Password Reset\n\nClick the link to reset your password:\n${resetLink}\n\nThis link expires in 1 hour.\n\nIf you did not request this, ignore this email.`,
  });

  console.log(`[EmailService] Password reset email sent to ${toEmail}`);
}


/**
 * Send a branded email-verification email
 * @param {string} toEmail - Recipient email address
 * @param {string} verifyLink - Firebase email-verification link
 */
async function sendVerificationEmail(toEmail, verifyLink) {
  const from = process.env.SMTP_FROM || `"B-Ware Support" <noreply@b-ware.com>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>B-ware Email Verification</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #1e1e1e;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:40px 48px 32px;border-bottom:1px solid #1e1e1e;">
              <p style="margin:0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#ef4444;font-weight:700;">
                B-WARE FORENSIC DIVISION
              </p>
              <h1 style="margin:12px 0 0;font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.02em;line-height:1.1;">
                Verify Your Email
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 48px;">
              <p style="margin:0 0 8px;color:#a1a1aa;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;font-weight:700;">Welcome to B-Ware</p>
              <p style="margin:0 0 24px;color:#a1a1aa;font-size:14px;line-height:1.7;">
                Your account has been created for
                <strong style="color:#e4e4e7;">${toEmail}</strong>.
                Please confirm your email address to activate your account and begin forensic analysis.
              </p>
              <p style="margin:0 0 32px;color:#a1a1aa;font-size:14px;line-height:1.7;">
                This verification link is valid for <strong style="color:#e4e4e7;">24 hours</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#ef4444;padding:0;">
                    <a href="${verifyLink}"
                       style="display:inline-block;padding:16px 40px;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                      Verify Email Address →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0;color:#52525b;font-size:12px;line-height:1.6;">
                If you did not create a B-ware account, disregard this message. No action is required.
                All session interactions are monitored under the B-ware Intelligence Directive.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 48px;border-top:1px solid #1e1e1e;">
              <p style="margin:0;color:#3f3f46;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;">
                © 2025 B-Ware Forensic Division · Proprietary &amp; Confidential
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from,
    to: toEmail,
    subject: '[B-ware] Verify Your Email Address',
    html,
    text: `B-ware — Verify Your Email\n\nClick the link to verify your email address:\n${verifyLink}\n\nThis link expires in 24 hours.\n\nIf you did not create this account, ignore this email.`,
  });

  console.log(`[EmailService] Verification email sent to ${toEmail}`);
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
