# Ammar Tahoon Portfolio

AI-focused portfolio built with:

- React
- Vite
- Tailwind CSS
- Framer Motion
- React Parallax Tilt
- Secure Node.js/API contact handling

## Run locally

Development frontend:

```powershell
npm.cmd run dev
```

Development backend:

```powershell
npm.cmd run dev:server
```

Production build:

```powershell
npm.cmd run build
```

Serve the production build with the Node server:

```powershell
npm.cmd start
```

Or, if `dist` is already built:

```powershell
node server.js
```

Open:

```text
http://localhost:3005
```

## Main content file

Update your personal data here:

`data/profile.json`

This file controls:

- name, role, hero copy, and availability
- socials and direct contact links
- stats and about content
- spotlight technologies
- services
- skill groups
- projects and modal details
- experience
- testimonials
- insights
- FAQs

## Contact submissions

Messages from the contact form are stored in:

`data/contact-submissions.json`

Optional webhook forwarding is supported with:

- `CONTACT_WEBHOOK_URL`
- `CONTACT_WEBHOOK_TOKEN`

## Security

The backend includes:

- content security policy
- frame and MIME protection headers
- request size limit
- input validation
- honeypot spam protection
- rate limiting for `/api/contact`

## Environment variables

Copy `.env.example` to `.env` if you want to customize runtime values:

- `PORT`
- `MAX_BODY_SIZE`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `ALLOWED_ORIGINS`
- `CONTACT_WEBHOOK_URL`
- `CONTACT_WEBHOOK_TOKEN`

## Notes

- Static assets live in `static/` and are copied into `dist/` during build.
- The Node server serves the built React app from `dist/`.
