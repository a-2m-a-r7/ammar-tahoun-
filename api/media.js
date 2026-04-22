import { readFile } from "node:fs/promises";
import path from "node:path";

const contentTypes = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

const mediaRoot = path.resolve(process.cwd(), "media");

function getRequestedMediaPath(req) {
  const queryPath = Array.isArray(req.query?.path) ? req.query.path[0] : req.query?.path;

  if (typeof queryPath === "string" && queryPath.trim()) {
    return queryPath.trim();
  }

  try {
    const requestUrl = new URL(req.url || "/api/media", "http://localhost");
    return requestUrl.searchParams.get("path") || requestUrl.pathname.replace(/^\/api\/media/, "/media");
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  if (!["GET", "HEAD"].includes(req.method || "")) {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    const requestedPath = getRequestedMediaPath(req).replace(/\\/g, "/");

    if (!requestedPath.startsWith("/media/")) {
      return res.status(403).send("Forbidden");
    }

    const relativePath = requestedPath.slice("/media/".length);
    if (!relativePath || relativePath.includes("..")) {
      return res.status(403).send("Forbidden");
    }

    const filePath = path.resolve(mediaRoot, relativePath);
    if (filePath !== mediaRoot && !filePath.startsWith(`${mediaRoot}${path.sep}`)) {
      return res.status(403).send("Forbidden");
    }

    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    res.setHeader("Content-Type", contentTypes[ext] || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    if (req.method === "HEAD") {
      return res.status(200).end();
    }

    return res.status(200).send(data);
  } catch (error) {
    console.error("[media] Failed to read media asset:", error);
    return res.status(404).send("Media not found");
  }
}
