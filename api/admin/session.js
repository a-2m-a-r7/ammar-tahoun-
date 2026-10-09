export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  const cookies = req.headers.cookie || "";
  const authHeader = req.headers.authorization || req.headers["x-admin-token"] || "";
  const token = (process.env.PORTFOLIO_ADMIN_TOKEN || "wijbOXa0tg8YGZ19D6qRWQspl37BMFHUcEnNx42dkmJKy5fL").trim();

  const isSessionCookie = cookies.includes("portfolio_admin_session=active");
  const isAuthValid = token && (authHeader === token || authHeader === `Bearer ${token}`);

  if (isSessionCookie || isAuthValid) {
    return res.status(200).json({
      ok: true,
      authenticated: true,
      email: "mart33645@gmail.com"
    });
  }

  return res.status(200).json({ ok: true, authenticated: false });
}
