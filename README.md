## EvangadiForum

EvangadiForum is a web-based Q&A platform for collaborative learning among students and developers. Users can ask and answer questions, reply in threads, vote on helpful content, and get real-time notifications.

## Key Features

- Authentication: JWT-based signup/login with email verification (OTP)
- Questions & Answers: Post questions, write answers, and reply in threads
- Voting: Upvote/downvote answers and replies
- Profiles: Update profile, avatar, and bio; view activity stats
- Real-time notifications: Socket.IO-based updates
- Rich text editing: Images, formatting, and code blocks
- Responsive UI: Optimized for desktop and mobile
- Email verification UX:
  - Resend OTP with rate-limit and attempt tracking on the server
  - Live countdown timer showing time until OTP expires
  - Health/test endpoints for email transport
  - Optional demo mode (fixed OTP) to simplify portfolio trials

## Architecture & Tech Stack

- Frontend: React + Vite, React Router, Context API, Axios, React-Toastify, Bootstrap
- Backend: Node.js, Express.js, Socket.IO
- Database: PostgreSQL (Supabase-hosted)
- Storage: Supabase Storage (S3) for images (profile pictures, etc.)
- Auth: JWT
- Email: Nodemailer with SMTP (Mailtrap/SendGrid/Gmail, etc.) and branded HTML template

## Email Verification Flow

Backend routes (all prefixed by `/api`):

- `POST /email/verify-email` — verify email with `{ email, otp }`
- `POST /email/resend-otp` — request a new code `{ email }` (returns `expiresAt`)
- `GET  /email/health` — checks SMTP transport (useful for debugging)
- `POST /email/test` — sends a simple test email `{ to }`
- `GET  /email/demo-config` — returns `{ enabled, code, ttlSeconds }` when demo mode is enabled

Server behavior:

- OTPs are stored hashed with bcrypt and expire after `OTP_EXP_MINUTES`.
- Attempts are tracked; used/expired codes are rejected.
- Branded HTML emails are sent with a modern, responsive template with logo and footer.

Demo mode (portfolio only):

- When `OTP_BYPASS_ENABLED=true`, users can verify using `OTP_BYPASS_CODE` (e.g., `123456`).
- The Verify page shows a non-intrusive banner explaining demo mode and the fixed code.
- Turn this off in real environments.

## Environment Variables

Backend (`backend/.env`):

- Core
  - `PORT=3000`
  - `ALLOWED_ORIGINS=https://your-frontend-url,http://localhost:5173`
  - `JWT_SECRET=your-jwt-secret`
- Database (Supabase)
  - `DATABASE_URL=postgresql://...` (Use the connection string for your DB)
  - `PGSSL=true`
- Supabase Storage
  - `SUPABASE_URL=...`
  - `SUPABASE_SERVICE_ROLE_KEY=...`
- Email (SMTP)
  - `EMAIL_HOST` (e.g., `smtp.mailtrap.io`, `live.smtp.mailtrap.io`, `smtp.sendgrid.net`, `smtp.gmail.com`)
  - `EMAIL_PORT` (e.g., `2525` or `587`; `465` for implicit TLS)
  - `EMAIL_USER`
  - `EMAIL_PASS`
  - `EMAIL_FROM` (verified sender address)
  - `EMAIL_DEBUG=true|false`
  - `EMAIL_TLS_REJECT_UNAUTHORIZED=true|false` (dev only; set `false` to bypass TLS validation if a proxy intercepts SSL)
- OTP
  - `OTP_EXP_MINUTES=2`
  - `OTP_BYPASS_ENABLED=false` (demo only)
  - `OTP_BYPASS_CODE=123456` (demo only)
- Optional branding
  - `EMAIL_BRAND_NAME`, `EMAIL_BRAND_URL`, `EMAIL_BRAND_LOGO`
  - `EMAIL_SUPPORT`
  - `EMAIL_SOCIAL_FACEBOOK`, `EMAIL_SOCIAL_TWITTER`, `EMAIL_SOCIAL_LINKEDIN`

Frontend (`client/.env`):

- `VITE_API_BASE_URL=https://your-backend-host/api`

## Local Development

Prerequisites:

- Node.js 16+ (18+ recommended)
- npm or yarn

Install and run:

```bash
git clone https://github.com/Gadisa16/EvangadiForum.git
cd EvangadiForum

# Backend
cd backend
npm install
# create backend/.env from backend/.env.example and fill values
npm run dev   # or nodemon app

# Frontend (in another terminal)
cd ../client
npm install
# create client/.env -> VITE_API_BASE_URL=http://localhost:3000/api
npm run dev
```

### CORS

Set `ALLOWED_ORIGINS` on the backend to include your frontend dev URL (e.g., `http://localhost:5173`) and any deployed frontend.

## Deployment Notes

- Frontend: Netlify (or any static host)
- Backend: Render (or any Node host)
- Configure `VITE_API_BASE_URL` on the frontend to point to `https://<your-backend>/api`.
- On some PaaS providers, outbound SMTP to Gmail can time out or be blocked. Prefer:
  - Mailtrap Email Sending (SMTP on port 2525) or
  - A transactional provider (SendGrid/Mailgun/Brevo) via HTTP API (most reliable) or SMTP on allowed ports.
- Use `/api/email/health` and `/api/email/test` to validate email configuration after deploy.

## Using the App

1. Sign up with email and password.
2. You’ll be redirected to the Verify Email page.
   - A 6‑digit code is sent (when SMTP is configured) and a live mm:ss countdown shows remaining time.
   - You can resend after it expires.
3. After verification, log in and start asking/answering questions.

### Demo Mode

For portfolio/demo environments without a custom email domain:

- Set `OTP_BYPASS_ENABLED=true` and `OTP_BYPASS_CODE=123456`.
- The Verify page shows a small banner explaining demo mode and the fixed code.
- Turn this off when you add a real email sender/domain.

## Troubleshooting

- Email not sending locally: check `/api/email/health` and logs (`EMAIL_DEBUG=true`).
- “self-signed certificate in certificate chain”: set `EMAIL_PORT=587` and optionally `EMAIL_TLS_REJECT_UNAUTHORIZED=false` for dev (don’t use in prod), or disable SSL inspection on your antivirus/proxy.
- ETIMEDOUT to Gmail SMTP on Render: use Mailtrap Sending (`live.smtp.mailtrap.io:2525`) or a provider’s HTTP API (e.g., SendGrid) instead of Gmail.
- CORS errors: ensure your frontend URL is listed in `ALLOWED_ORIGINS`.

## License

This project is for educational and portfolio purposes.
