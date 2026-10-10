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
  const password = String(body.adminToken || body.password || "").trim();

  const VALID_EMAIL = "mart33645@gmail.com";
  const VALID_PASSWORD = "aaaasss443";

  // Strict check: Only mart33645@gmail.com with password aaaasss443
  if (email === VALID_EMAIL && password === VALID_PASSWORD) {
    res.setHeader(
      "Set-Cookie",
      "portfolio_admin_session=active; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800"
    );
    return res.status(200).json({
      ok: true,
      authenticated: true,
      email: VALID_EMAIL,
      message: "تم تسجيل الدخول بنجاح"
    });
  }

  return res.status(401).json({
    ok: false,
    authenticated: false,
    message: "بيانات الدخول غير صحيحة. الوصول مقتصر حصرياً على mart33645@gmail.com بكلمة السر المعتمدة."
  });
}
