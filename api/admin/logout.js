export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader(
    "Set-Cookie",
    "portfolio_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  );
  return res.status(200).json({ ok: true, authenticated: false, message: "Logged out successfully" });
}
