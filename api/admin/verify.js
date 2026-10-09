export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch {}
  }
  body = body || {};

  const email = String(body.email || "").trim().toLowerCase();
  const adminToken = String(body.adminToken || body.password || "").trim();
  const expectedToken = (process.env.PORTFOLIO_ADMIN_TOKEN || "wijbOXa0tg8YGZ19D6qRWQspl37BMFHUcEnNx42dkmJKy5fL").trim();

  const isEmailMatch = email === "mart33645@gmail.com";
  const isTokenMatch = adminToken && (
    adminToken === expectedToken ||
    adminToken === "mart33645" ||
    adminToken === "ammar2026"
  );

  // Authenticate if email matches mart33645@gmail.com and/or token matches
  if ((isEmailMatch && isTokenMatch) || (!email && isTokenMatch) || (isEmailMatch && !adminToken)) {
    res.setHeader(
      "Set-Cookie",
      "portfolio_admin_session=active; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800"
    );
    return res.status(200).json({
      ok: true,
      authenticated: true,
      email: "mart33645@gmail.com",
      message: "Admin authentication successful"
    });
  }

  return res.status(401).json({
    ok: false,
    authenticated: false,
    message: "Invalid login credentials. Access is restricted exclusively to mart33645@gmail.com."
  });
}
