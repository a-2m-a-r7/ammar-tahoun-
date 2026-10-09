# Ammar Tahoon Portfolio

AI-focused portfolio built with:

- React 19 + Vite
- Tailwind CSS 4
- Framer Motion + React Parallax Tilt
- Secure Node.js backend
- Private `/admin` dashboard for content management
- AI assistant powered by Google Gemini
- Contact form with optional email delivery (Resend or Web3Forms)

## Live site

```text
https://ammartahoun.online
```

## Local run

Frontend development:

```powershell
npm.cmd run dev
```

Backend development:

```powershell
npm.cmd run dev:server
```

Production build check:

```powershell
npm.cmd run build
```

Serve the production build:

```powershell
npm.cmd start
```

Then open:

```text
http://localhost:3005
```

## Routes

Public portfolio:

```text
/
```

Private admin dashboard:

```text
/admin
```

## Where to edit content

Main source of portfolio content:

```text
data/profile.json
```

Stored contact submissions:

```text
data/contact-submissions.json
```

Uploaded media files:

```text
media/profile
media/projects
```

If the project lives inside OneDrive on Windows, uploaded media is automatically moved to a safer local runtime folder to avoid file-lock issues, while still being served from the same `/media/...` URLs.

## Admin dashboard

The admin dashboard at `/admin` can:

- update all profile content
- upload or clear the profile photo
- add, edit, delete, and upload covers for projects
- add, edit, and delete certificates
- download a profile backup
- show readiness and improvement suggestions
- view and manage contact form submissions

## AI assistant

The portfolio includes a floating AI chatbot powered by Google Gemini.

It reads `data/profile.json` at runtime and answers visitor questions about Ammar's skills, projects, and availability.

To enable it, set `GEMINI_API_KEY` in your environment (see below).

## Admin auth

Set an admin key in `.env`:

```text
PORTFOLIO_ADMIN_TOKEN=your-secret-key
```

Start the app, then open:

```text
http://localhost:3005/admin
```

The dashboard uses a server-side admin session cookie instead of storing the key in the browser.

## Production security

The backend includes:

- Content Security Policy
- `HttpOnly` admin session cookie
- `SameSite=Strict` cookie protection
- admin login rate limiting
- session expiry and cleanup
- same-origin checks for admin requests
- strict cache prevention for `/admin` and admin APIs
- image upload validation and size limits
- secure file write flow for uploaded media
- contact form validation, honeypot, and rate limiting
- frame, MIME, referrer, and permissions protection headers
- AES-256 encryption key support for sensitive vault data

For production behind HTTPS, set:

```text
PORTFOLIO_SECURE_COOKIE=true
```

Recommended production setup:

1. Serve the site behind HTTPS.
2. Set a strong `PORTFOLIO_ADMIN_TOKEN`.
3. Set `ALLOWED_ORIGINS` to your real domain, for example `https://ammartahoun.online`.
4. Keep `/admin` private and do not share the admin key.
5. Restart the server after changing `.env`.

## Vercel deployment

The project is configured for Vercel serverless deployment.

Serverless API routes live in `api/`:

- `api/contact.js` — contact form handler
- `api/ai/chat.js` — AI assistant (Gemini streaming)
- `api/media.js` — media file serving
- `api/profile.js` — profile data endpoint

Build output goes to `dist/`. The `vercel.json` file handles rewrites, security headers, and long-term caching for assets.

## Environment variables

Copy `.env.example` to `.env` and adjust only what you need:

### Server

- `PORT` — local server port (default `3005`)
- `ALLOWED_ORIGINS` — comma-separated allowed origins
- `MAX_BODY_SIZE` — max request body in bytes
- `MAX_ADMIN_BODY_SIZE` — max admin request body in bytes
- `MAX_PROFILE_IMAGE_BYTES` — max profile image upload size

### Rate limiting

- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `ADMIN_RATE_LIMIT_WINDOW_MS`
- `ADMIN_RATE_LIMIT_MAX_REQUESTS`

### Admin security

- `PORTFOLIO_ADMIN_TOKEN` — required, your secret admin key
- `PORTFOLIO_SECURE_COOKIE` — set `true` behind HTTPS
- `ADMIN_SESSION_TTL_MS` — session duration (default 8 hours)
- `ADMIN_REMEMBER_TTL_MS` — remember-me duration (default 7 days)
- `ENCRYPTION_KEY` — AES-256 key for encrypted vault data
- `AUDIT_LOG_PASSWORD` — optional password to protect audit logs

### Contact form / email delivery

Pick one provider. If both are set, Resend is tried first.

- `RESEND_API_KEY` — Resend API key
- `RESEND_FROM_EMAIL` — sender address (default `Portfolio <onboarding@resend.dev>`)
- `CONTACT_NOTIFICATION_EMAIL` — email to receive contact messages
- `WEB3FORMS_ACCESS_KEY` — Web3Forms access key (free alternative)
- `CONTACT_WEBHOOK_URL` — optional webhook URL for contact events
- `CONTACT_WEBHOOK_TOKEN` — optional bearer token for the webhook

### AI assistant

- `GEMINI_API_KEY` — Google Gemini API key (get one free at aistudio.google.com)
- `GEMINI_MODEL` — model to use (default `gemini-2.5-flash`)
- `GEMINI_TIMEOUT_MS` — request timeout in ms (default `30000`)

### Storage

- `MEDIA_STORAGE_DIR` — override the local media storage path

## Notes

- Static assets live in `static/` and are copied into `dist/` during build.
- The Node server serves the built React app from `dist/`.
- Project cover uploads are stored locally and exposed through `/media/projects/...`.
- Profile photos are stored locally and exposed through `/media/profile/...`.
- The AI chatbot gracefully disables itself if `GEMINI_API_KEY` is not set.
- The contact form gracefully degrades if no email provider is configured.
