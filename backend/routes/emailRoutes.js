const express = require('express');
const { verifyEmail, resendOtp, sendOtpAfterRegister } = require('../controllers/verificationController');
const { verifyTransport, sendTestEmail } = require('../services/emailService');

const router = express.Router();

// Route to send verification email
router.post('/verify-email', verifyEmail);

// Route to verify email with token
router.post('/resend-otp', resendOtp);
router.get('/resend-otp', resendOtp); // optional: supports ?email=... via controller fallback

// Health check for email transport
router.get('/health', async (req, res) => {
	try {
		const info = await verifyTransport();
		res.json({ success: true, info });
	} catch (e) {
		res.status(500).json({ success: false, msg: e.message });
	}
});

// Test endpoint to send a simple email
router.post('/test', async (req, res) => {
	try {
		const to = req.body?.to || req.query?.to;
		if (!to) return res.status(400).json({ success: false, msg: 'Provide ?to= or body.to email' });
		const r = await sendTestEmail(to);
		res.json({ success: true, messageId: r?.messageId });
	} catch (e) {
		res.status(500).json({ success: false, msg: e.message });
	}
});


module.exports = router;