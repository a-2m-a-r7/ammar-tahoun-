import { readFile } from "node:fs/promises";

const projectsFileUrl = new URL("../../data/projects.json", import.meta.url);

const cachedPlainExplanations = {
  "datacamp-student-club":
    "An interactive web platform that lets university students write and run Python code right in their browser without installing anything, accompanied by a bilingual AI tutor that answers their programming questions.",
  "circuit-sim-pro":
    "A virtual physics lab for Windows where students can design electrical circuits and safely test real-time electricity measurements like voltage and current on a live screen.",
  "smartmall-ai-os":
    "A blueprint for a smart shopping mall system that uses artificial intelligence to predict customer crowds, automate inventory restocking, and optimize electricity and lighting.",
  "ai-quest-engineer-path":
    "A gamified desktop app that turns learning Artificial Intelligence into an RPG game, giving students XP points, levels, and badges as they master math, machine learning, and AI models.",
  "base-calc-2":
    "A high-speed desktop calculator that helps computer engineering students convert numbers and do math across binary, decimal, and hexadecimal formats simultaneously with step-by-step proofs.",
  "dino-game-pro":
    "A fast-paced desktop runner game built natively for Windows that proves high-performance, smooth 60-frames-per-second animation can run on desktop .NET without heavy game engines."
};

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  const slug = req.query?.slug || req.body?.slug || "";

  if (slug && cachedPlainExplanations[slug]) {
    return res.status(200).json({
      ok: true,
      explanation: cachedPlainExplanations[slug]
    });
  }

  try {
    const raw = await readFile(projectsFileUrl, "utf8");
    const projects = JSON.parse(raw);
    const match = projects.find((p) => p.slug === slug || p.id === slug);

    if (match) {
      const fallbackText = `${match.title} solves: ${match.details?.problem || match.summary} by ${match.details?.solution || match.summary}`;
      return res.status(200).json({
        ok: true,
        explanation: fallbackText
      });
    }

    return res.status(404).json({ ok: false, message: "Project not found" });
  } catch (err) {
    return res.status(500).json({ ok: false, message: "Internal server error" });
  }
}
