const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOtpEmail(to, code) {
  console.log("to, code", to, code);
  const mins = Number(process.env.OTP_EXP_MINUTES || 2);
  const mailOptions = {
    from: process.env.EMAIL_FROM || "no-reply@example.com",
    to,
    subject: "Your Evangadi verification code",
    text: `Your verification code is ${code}. It expires in ${mins} minute(s).`,
    html: `<p>Your verification code is <b style="font-size:18px">${code}</b>.<br/>It expires in ${mins} minute(s).</p>`,
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };