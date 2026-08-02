# Ammar Tahoon Portfolio

AI-focused portfolio with:

- React 19 + Vite
- Tailwind CSS 4
- Framer Motion + React Parallax Tilt
- Secure Node.js backend
- Private `/admin` dashboard for content management

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

## Public site

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

The admin dashboard can now:

- update profile content
- upload or clear the profile photo
- add, edit, delete, and upload covers for projects
- add, edit, and delete certificates
- download a profile backup
- show readiness and improvement suggestions

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

The backend currently includes:

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

For production behind HTTPS, set:

```text
PORTFOLIO_SECURE_COOKIE=true
```

Recommended production setup:

1. Serve the site behind HTTPS.
2. Set a strong `PORTFOLIO_ADMIN_TOKEN`.
3. Set `ALLOWED_ORIGINS` to your real domain, for example `https://yourdomain.com`.
4. Keep `/admin` private and do not share the admin key.
5. Restart the server after changing `.env`.

## Environment variables

Copy `.env.example` to `.env` and adjust only what you need:

- `PORT`
- `MAX_BODY_SIZE`
- `MAX_ADMIN_BODY_SIZE`
- `MAX_PROFILE_IMAGE_BYTES`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `ADMIN_RATE_LIMIT_WINDOW_MS`
- `ADMIN_RATE_LIMIT_MAX_REQUESTS`
- `ADMIN_SESSION_TTL_MS`
- `ADMIN_REMEMBER_TTL_MS`
- `ALLOWED_ORIGINS`
- `CONTACT_WEBHOOK_URL`
- `CONTACT_WEBHOOK_TOKEN`
- `MEDIA_STORAGE_DIR`
- `PORTFOLIO_ADMIN_TOKEN`
- `PORTFOLIO_SECURE_COOKIE`

## Notes

- Static assets live in `static/` and are copied into `dist/` during build.
- The Node server serves the built React app from `dist/`.
- Project cover uploads are stored locally and exposed through `/media/projects/...`.
- Profile photos are stored locally and exposed through `/media/profile/...`.
