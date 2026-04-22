import { readFile } from "node:fs/promises";

const profileFileUrl = new URL("../data/profile.json", import.meta.url);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    const rawProfile = await readFile(profileFileUrl, "utf8");
    const profile = JSON.parse(rawProfile);

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60");

    return res.status(200).json({ ok: true, data: profile });
  } catch (error) {
    console.error("[profile] Failed to load profile data:", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to process profile data",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
