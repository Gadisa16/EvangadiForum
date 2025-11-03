const bcrypt = require("bcryptjs");
const db = require("../db/dbConfig");
const { sendOtpEmail } = require("../services/emailService");

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createOrReplaceOtp(userId, email) {
  const code = genCode();
  const hash = await bcrypt.hash(code, 10);
  const minutes = Number(process.env.OTP_EXP_MINUTES || 2);
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  await db.query("DELETE FROM email_verifications WHERE user_id = ?", [userId]);
  await db.query(
    "INSERT INTO email_verifications (user_id, otp_hash, expires_at) VALUES (?, ?, ?)",
    [userId, hash, expiresAt]
  );
  await sendOtpEmail(email, code);
  return { expiresAt };
}

async function verifyEmail(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, msg: "Email and OTP are required" });
    }

    const [users] = await db.query("SELECT userid, is_verified FROM users WHERE email = ?", [email]);
    if (!users.length) return res.status(404).json({ success: false, msg: "User not found" });
    const user = users[0];
    if (user.is_verified) return res.json({ success: true, msg: "Already verified" });

    // Demo/bypass mode: allow a fixed OTP via env, e.g., OTP_BYPASS_CODE=123456
    const bypassEnabled = String(process.env.OTP_BYPASS_ENABLED || '').toLowerCase() === 'true';
    const bypassCode = (process.env.OTP_BYPASS_CODE || '').trim();
    if (bypassEnabled && bypassCode && otp === bypassCode) {
      try {
        await db.query("UPDATE users SET is_verified = TRUE WHERE userid = ?", [user.userid]);
        // Best-effort: mark last verification as consumed if exists
        await db.query(
          "UPDATE email_verifications SET consumed = TRUE WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
          [user.userid]
        );
      } catch (e) {
        // continue to return success even if cleanup fails
        console.warn('Bypass verify cleanup failed:', e?.message);
      }
      return res.json({ success: true, msg: "Email verified (demo mode)" });
    }
  

    const [rows] = await db.query(
      "SELECT id, otp_hash, expires_at, consumed, attempts FROM email_verifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
      [user.userid]
    );
    if (!rows.length) return res.status(400).json({ success: false, msg: "No OTP found. Please resend." });

    const record = rows[0];
    if (record.consumed) return res.status(400).json({ success: false, msg: "OTP already used" });
    if (record.attempts >= 5) return res.status(429).json({ success: false, msg: "Too many attempts. Please resend code." });
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ success: false, msg: "OTP expired. Please resend." });
    }

    const ok = await bcrypt.compare(otp, record.otp_hash);
    await db.query("UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?", [record.id]);
    if (!ok) return res.status(400).json({ success: false, msg: "Invalid code" });

    await db.query("UPDATE users SET is_verified = TRUE WHERE userid = ?", [user.userid]);
    await db.query("UPDATE email_verifications SET consumed = TRUE WHERE id = ?", [record.id]);

    res.json({ success: true, msg: "Email verified successfully" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, msg: "Server error" });
  }
}

async function resendOtp(req, res) {
  try {
    const email = req.body?.email || req.query?.email; // accept body or query
    if (!email) return res.status(400).json({ success: false, msg: "Email is required" });

    const [users] = await db.query("SELECT userid, is_verified FROM users WHERE email = ?", [email]);
    if (!users.length) return res.status(404).json({ success: false, msg: "User not found" });
    const user = users[0];
    if (user.is_verified) return res.json({ success: true, msg: "Already verified" });

    const info = await createOrReplaceOtp(user.userid, email);
    res.json({ success: true, msg: "OTP sent", expiresAt: info.expiresAt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, msg: "Server error" });
  }
}

async function sendOtpAfterRegister(userId, email) {
  await createOrReplaceOtp(userId, email);
}

module.exports = { verifyEmail, resendOtp, sendOtpAfterRegister };