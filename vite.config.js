import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

function localApiPlugin() {
  const setupMiddleware = (middlewares) => {
    middlewares.use((req, res, next) => {
      const url = req.url?.split("?")[0];

      if (url === "/api/profile" && req.method === "GET") {
        try {
          const profilePath = path.resolve(process.cwd(), "data/profile.json");
          const raw = fs.readFileSync(profilePath, "utf8");
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          return res.end(JSON.stringify({ ok: true, data: JSON.parse(raw) }));
        } catch {
          res.statusCode = 500;
          return res.end(JSON.stringify({ ok: false, error: "Failed to read profile" }));
        }
      }

      if (url === "/api/admin/verify" && req.method === "POST") {
        let body = "";
        req.on("data", (chunk) => { body += chunk; });
        req.on("end", () => {
          try {
            const parsed = JSON.parse(body || "{}");
            const email = String(parsed.email || "").trim().toLowerCase();
            const password = String(parsed.adminToken || parsed.password || "").trim();

            if (email === "mart33645@gmail.com" && password === "aaaasss443") {
              res.setHeader("Set-Cookie", "portfolio_admin_session=active; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800");
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              return res.end(JSON.stringify({
                ok: true,
                authenticated: true,
                email: "mart33645@gmail.com",
                message: "تم تسجيل الدخول بنجاح"
              }));
            }

            res.statusCode = 401;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            return res.end(JSON.stringify({
              ok: false,
              authenticated: false,
              message: "بيانات الدخول غير صحيحة. الوصول مقتصر حصرياً على mart33645@gmail.com بكلمة السر المعتمدة."
            }));
          } catch {
            res.statusCode = 400;
            return res.end(JSON.stringify({ ok: false, message: "Invalid payload" }));
          }
        });
        return;
      }

      if (url === "/api/admin/session") {
        const cookie = req.headers.cookie || "";
        const isAuth = cookie.includes("portfolio_admin_session=active");
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.end(JSON.stringify({
          ok: true,
          authenticated: isAuth,
          email: isAuth ? "mart33645@gmail.com" : null
        }));
      }

      if (url === "/api/admin/logout" && req.method === "POST") {
        res.setHeader("Set-Cookie", "portfolio_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.end(JSON.stringify({ ok: true, authenticated: false, message: "Logged out" }));
      }

      if (url === "/api/health") {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        return res.end(JSON.stringify({ ok: true, status: "healthy", timestamp: new Date().toISOString() }));
      }

      next();
    });
  };

  return {
    name: "local-api-middleware",
    configureServer(server) {
      setupMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      setupMiddleware(server.middlewares);
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localApiPlugin()],
  publicDir: "static",
  server: {
    port: 5173
  },
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
