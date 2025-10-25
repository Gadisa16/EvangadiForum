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
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@example.com",
    to,
    subject: "Your Evangadi verification code",
    text: `Your verification code is ${code}. It expires in ${mins} minute(s).`,
    html: `<p>Your verification code is <b style="font-size:18px">${code}</b>.<br/>It expires in ${mins} minute(s).</p>`,
  };
  return transporter.sendMail(mailOptions);
}

async function sendTestEmail(to) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@example.com",
    to,
    subject: "Evangadi email test",
    text: `This is a test email sent at ${new Date().toISOString()}.`,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail, verifyTransport, sendTestEmail };