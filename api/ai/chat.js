import { GoogleGenerativeAI } from '@google/generative-ai';
import profile from '../../data/profile.json' assert { type: 'json' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const { message, history } = req.body || {};

  if (!message) {
    return res.status(400).json({ ok: false, message: 'Message is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ ok: false, message: 'AI Intelligence is currently offline (Key missing).' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chatHistory = Array.isArray(history) ? history.slice(-6) : [];

    const p = profile?.personal || {};
    const compactProfile = [
      `Name: ${p.fullName || "Ammar Tahoon"} | Role: ${p.role || "AI Engineer"} | Location: ${p.location || "Egypt"}`,
      `Availability: ${p.availability || "Available"} | Email: ${p.email || ""}`,
      `Summary: ${p.heroSummary || ""}`,
      `Skills: ${(profile?.skillGroups || []).map(g => `${g.title}: ${(g.items || []).join(", ")}`).join(" | ")}`,
      `Tech Spotlight: ${(profile?.spotlightTech || []).map(t => t.name).join(", ")}`,
      `Projects: ${(profile?.projects || []).map(pr => `${pr.title} (${pr.category}) — ${pr.summary}`).join(" | ")}`,
      `Experience: ${(profile?.experience || []).map(e => `${e.role} @ ${e.company} (${e.period})`).join(" | ")}`,
      `Certificates: ${(profile?.certificates || []).map(c => `${c.title} by ${c.issuer}`).join(", ")}`,
      `Services: ${(profile?.services || []).map(s => s.title).join(", ")}`,
      `Socials: ${(profile?.socials || []).map(s => `${s.label}: ${s.url}`).join(" | ")}`,
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are an extremely smart, fast, and futuristic AI assistant for Ammar Tahoon's portfolio.
CRITICAL: You MUST reply in the EXACT SAME LANGUAGE and DIALECT as the user's question (e.g., if asked in Egyptian Arabic, reply naturally in Egyptian Arabic; if English, reply in English).
Answer visitor questions about Ammar's skills, projects, experience, and availability.
Be concise (1-3 sentences), professional, yet welcoming. Never invent facts.
Only answer portfolio-related questions. Redirect others politely.

${compactProfile}`;

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    
    // In Vercel, we need to flush the headers to start the stream
    res.flushHeaders();

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Ready. Ask me anything about Ammar." }] },
        ...chatHistory.map((msg) => ({
          role: msg.role === "ai" ? "model" : "user",
          parts: [{ text: msg.content }]
        }))
      ]
    });

    const streamResult = await chat.sendMessageStream(message);
    let fullText = "";

    for await (const chunk of streamResult.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullText += chunkText;
        res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true, response: fullText })}\n\n`);
    res.end();
  } catch (error) {
    console.error("[ai] Gemini Error:", error);
    try {
      res.write(`data: ${JSON.stringify({ error: true, message: "AI core sync error. Try again." })}\n\n`);
      res.end();
    } catch {}
  }
}
