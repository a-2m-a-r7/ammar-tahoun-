import { readFile } from "node:fs/promises";
import { GoogleGenerativeAI } from "@google/generative-ai";

const profileFileUrl = new URL("../../data/profile.json", import.meta.url);
const defaultGeminiTimeoutMs = 25000;
const fallbackChatMessage = "The AI assistant is taking longer than expected. Please try again in a moment.";

function createTimeoutError() {
  const error = new Error("Gemini request timed out.");
  error.code = "GEMINI_TIMEOUT";
  return error;
}

function withTimeout(promise, timeoutMs) {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(createTimeoutError()), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === "string") {
    return req.body.trim() ? JSON.parse(req.body) : {};
  }

  if (Buffer.isBuffer(req.body)) {
    const bodyText = req.body.toString("utf8").trim();
    return bodyText ? JSON.parse(bodyText) : {};
  }

  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const bodyText = Buffer.concat(chunks).toString("utf8").trim();
  return bodyText ? JSON.parse(bodyText) : {};
}

async function loadProfile() {
  const rawProfile = await readFile(profileFileUrl, "utf8");
  return JSON.parse(rawProfile);
}

function sanitizeMessage(value, maxLength = 4000) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .slice(-6)
    .map((item) => {
      const role = item?.role === "ai" ? "model" : "user";
      const content = sanitizeMessage(item?.content, 2000);

      if (!content) {
        return null;
      }

      return {
        role,
        parts: [{ text: content }]
      };
    })
    .filter(Boolean);
}

function buildSystemPrompt(profile) {
  const personal = profile?.personal || {};
  const compactProfile = [
    `Name: ${personal.fullName || "Ammar Tahoon"} | Role: ${personal.role || "AI Engineer"} | Location: ${personal.location || "Egypt"}`,
    `Availability: ${personal.availability || "Available"} | Email: ${personal.email || ""}`,
    `Summary: ${personal.heroSummary || ""}`,
    `Skills: ${(profile?.skillGroups || []).map((group) => `${group.title}: ${(group.items || []).join(", ")}`).join(" | ")}`,
    `Tech Spotlight: ${(profile?.spotlightTech || []).map((item) => item.name).join(", ")}`,
    `Projects: ${(profile?.projects || []).map((project) => `${project.title} (${project.category}) - ${project.summary}`).join(" | ")}`,
    `Experience: ${(profile?.experience || []).map((item) => `${item.role} @ ${item.company} (${item.period})`).join(" | ")}`,
    `Certificates: ${(profile?.certificates || []).map((item) => `${item.title} by ${item.issuer}`).join(", ")}`,
    `Services: ${(profile?.services || []).map((item) => item.title).join(", ")}`,
    `Socials: ${(profile?.socials || []).map((item) => `${item.label}: ${item.url}`).join(" | ")}`
  ]
    .filter(Boolean)
    .join("\n");

  return `You are an extremely smart, fast, and futuristic AI assistant for Ammar Tahoon's portfolio.
CRITICAL: You MUST reply in the EXACT SAME LANGUAGE and DIALECT as the user's question (e.g., if asked in Egyptian Arabic, reply naturally in Egyptian Arabic; if English, reply in English).
Answer visitor questions about Ammar's skills, projects, experience, and availability.
Be concise (1-3 sentences), professional, yet welcoming. Never invent facts.
Only answer portfolio-related questions. Redirect others politely.

${compactProfile}`;
}

function writeSseEvent(res, payload) {
  if (res.writableEnded || res.destroyed) {
    return false;
  }

  try {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);

    if (typeof res.flush === "function") {
      res.flush();
    }

    return true;
  } catch {
    return false;
  }
}

function endSseResponse(res) {
  if (!res.writableEnded && !res.destroyed) {
    res.end();
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(503).json({ ok: false, message: "AI Intelligence is currently offline (Key missing)." });
  }

  try {
    const body = await readJsonBody(req);
    const message = sanitizeMessage(body?.message);

    if (!message) {
      return res.status(400).json({ ok: false, message: "Message is required." });
    }

    const timeoutMs = Math.max(
      1000,
      Number.parseInt(process.env.GEMINI_TIMEOUT_MS || `${defaultGeminiTimeoutMs}`, 10) || defaultGeminiTimeoutMs
    );
    const profile = await loadProfile();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: buildSystemPrompt(profile) }] },
        { role: "model", parts: [{ text: "Ready. Ask me anything about Ammar." }] },
        ...sanitizeHistory(body?.history)
      ]
    });

    const streamResult = await withTimeout(chat.sendMessageStream(message), timeoutMs);
    const iterator = streamResult.stream[Symbol.asyncIterator]();
    let fullText = "";

    while (true) {
      const nextChunk = await withTimeout(iterator.next(), timeoutMs);
      if (nextChunk.done) {
        break;
      }

      const chunkText = typeof nextChunk.value?.text === "function" ? nextChunk.value.text() : "";
      if (!chunkText) {
        continue;
      }

      fullText += chunkText;

      if (!writeSseEvent(res, { chunk: chunkText })) {
        return undefined;
      }
    }

    writeSseEvent(res, {
      done: true,
      response: fullText || fallbackChatMessage
    });
    endSseResponse(res);

    return undefined;
  } catch (error) {
    console.error("[ai] Gemini Error:", error);

    const statusCode = error instanceof SyntaxError ? 400 : error?.code === "GEMINI_TIMEOUT" ? 504 : 500;
    const message =
      statusCode === 400
        ? "Invalid request payload."
        : statusCode === 504
          ? fallbackChatMessage
          : "AI core sync error. Try again.";

    if (res.headersSent) {
      writeSseEvent(res, { error: true, message });
      endSseResponse(res);
      return undefined;
    }

    return res.status(statusCode).json({ ok: false, message });
  }
}
