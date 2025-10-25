const nodemailer = require("nodemailer");

// Helper: interpret secure flag based on explicit port
function resolveSecure(portFromEnv) {
  const port = Number(portFromEnv || 587);
  // Port 465 is implicit TLS and requires secure=true
  if (port === 465) return true;
  return false; // 587/25 use STARTTLS
}

// Build transporter with optional debug logging
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: resolveSecure(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: String(process.env.EMAIL_DEBUG || "").toLowerCase() === "true",
  debug: String(process.env.EMAIL_DEBUG || "").toLowerCase() === "true",
  // Opt-in TLS relax setting for dev networks with SSL inspection; DO NOT use in prod
  tls: {
    // Default true (verify), can set EMAIL_TLS_REJECT_UNAUTHORIZED=false to bypass
    rejectUnauthorized: String(process.env.EMAIL_TLS_REJECT_UNAUTHORIZED || 'true').toLowerCase() !== 'false',
    minVersion: 'TLSv1.2',
  },
});

// Optional: verify transporter at module load in dev
let lastVerify = null;
async function verifyTransport() {
  try {
    const ok = await transporter.verify();
    lastVerify = {
      ok: !!ok,
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: resolveSecure(process.env.EMAIL_PORT),
      at: new Date().toISOString(),
    };
    return lastVerify;
  } catch (e) {
    lastVerify = {
      ok: false,
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: resolveSecure(process.env.EMAIL_PORT),
      error: e.message,
      at: new Date().toISOString(),
    };
    throw e;
  }
}

async function sendOtpEmail(to, code) {
  const mins = Number(process.env.OTP_EXP_MINUTES || 2);
  const brandName = process.env.EMAIL_BRAND_NAME || 'Evangadi Forum';
  const brandUrl = process.env.EMAIL_BRAND_URL || 'https://example.com';
  const supportEmail = process.env.EMAIL_SUPPORT || (process.env.EMAIL_FROM || process.env.EMAIL_USER || 'support@example.com');

  const subject = `Your ${brandName} verification code`;
  const preview = `Your ${brandName} code is ${code}. Expires in ${mins} minute(s).`;
  const html = buildBrandedEmail({
    brandName,
    brandUrl,
    preview,
    title: 'Verify your email',
    bodyHtml: `
      <p style="margin:0 0 16px; color:#334155">Use the verification code below to finish setting up your account.</p>
      <div style="font-size:32px; letter-spacing:6px; font-weight:700; color:#111827; margin:16px 0 24px">${code}</div>
      <p style="margin:0 0 8px; color:#334155">This code will expire in ${mins} minute(s). If you didn\'t request this, you can safely ignore this email.</p>
      <p style="margin:24px 0 0; color:#64748b">Need help? Contact us at <a href="mailto:${supportEmail}" style="color:#2563eb; text-decoration:none">${supportEmail}</a>.</p>
    `,
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@example.com",
    to,
    subject,
    text: `${preview}\n\nCode: ${code}\n\nIf you did not request this, please ignore this message.`,
    html,
  };
  return transporter.sendMail(mailOptions);
}

async function sendTestEmail(to) {
  const brandName = process.env.EMAIL_BRAND_NAME || 'Evangadi Forum';
  const brandUrl = process.env.EMAIL_BRAND_URL || 'https://example.com';
  const preview = `Test email from ${brandName}`;
  const html = buildBrandedEmail({
    brandName,
    brandUrl,
    preview,
    title: 'Email delivery test',
    bodyHtml: `
      <p style="margin:0 0 12px; color:#334155">This is a sample message to confirm your SMTP configuration.</p>
      <p style="margin:0; color:#475569">Sent at ${new Date().toLocaleString()}.</p>
    `,
  });
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@example.com",
    to,
    subject: `${brandName} email test`,
    text: `${brandName} test email. Sent at ${new Date().toISOString()}.`,
    html,
  };
  return transporter.sendMail(mailOptions);
}

// Build a modern, responsive, email-client-friendly HTML
function buildBrandedEmail({ brandName, brandUrl, title, bodyHtml, preview }) {
  const logoUrl = process.env.EMAIL_BRAND_LOGO || 'https://ecgeanigwekpgnjmteoi.supabase.co/storage/v1/object/public/images/evangadi_logo.jpeg';
  const facebookUrl = process.env.EMAIL_SOCIAL_FACEBOOK || 'https://example.com';
  const twitterUrl = process.env.EMAIL_SOCIAL_TWITTER || 'https://example.com';
  const linkedinUrl = process.env.EMAIL_SOCIAL_LINKEDIN || 'https://example.com';

  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta http-equiv="x-ua-compatible" content="ie=edge"/>
    <title>${escapeHtml(title || brandName)}</title>
    <style>
      /* Preheader hide */
      .preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all; }
      @media (prefers-color-scheme: dark) {
        .bg { background:#0b1220 !important; }
        .card { background:#0f172a !important; }
        .text { color:#e2e8f0 !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#f1f5f9" class="bg">
    <div class="preheader">${escapeHtml(preview || '')}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f1f5f9; padding:24px 0">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:820px;padding-top: 16px;">
            <tr>
              <td style="padding:0 24px 16px" align="left">
                <a href="${brandUrl}" target="_blank" rel="noopener" style="text-decoration:none;display:flex; justify-content:center !important;">
                  <img src="${logoUrl}" alt="${escapeHtml(brandName)}" width="140" height="40" style="display:block; border:0; outline:none; text-decoration:none; margin:auto;"/>
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px;text-align: center;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="card" style="background:#ffffff; border-radius:12px; box-shadow:0 1px 2px rgba(0,0,0,.06);">
                  <tr>
                    <td style="padding:24px 24px 8px; font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
                      <h1 class="text" style="margin:0 0 8px; font-size:20px; line-height:28px; color:#0f172a">${escapeHtml(title || '')}</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 24px 24px; font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#334155" class="text">
                      ${bodyHtml}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px; font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#64748b; font-size:12px;">
                <div style="margin-bottom:8px;">
                  <a href="${facebookUrl}" style="color:#64748b; text-decoration:none; margin:0 8px">Facebook</a>
                  ·
                  <a href="${twitterUrl}" style="color:#64748b; text-decoration:none; margin:0 8px">Twitter</a>
                  ·
                  <a href="${linkedinUrl}" style="color:#64748b; text-decoration:none; margin:0 8px">LinkedIn</a>
                </div>
                <div style="margin-top:8px;">© ${new Date().getFullYear()} ${escapeHtml(brandName)} · <a href="${brandUrl}" style="color:#64748b; text-decoration:none">${brandUrl.replace(/^https?:\/\//,'')}</a></div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = { sendOtpEmail, verifyTransport, sendTestEmail };