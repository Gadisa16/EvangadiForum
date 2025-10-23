const express = require('express');
const { verifyEmail, resendOtp, sendOtpAfterRegister } = require('../controllers/verificationController');

const router = express.Router();

// Route to send verification email
router.post('/verify-email', verifyEmail);

// Route to verify email with token
router.get('/resend-otp', resendOtp);


module.exports = router;