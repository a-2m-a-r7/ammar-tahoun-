import { readFile } from "node:fs/promises";
import { Resend } from "resend";

const profileFileUrl = new URL("../data/profile.json", import.meta.url);

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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function getPortfolioEmail() {
  try {
    const rawProfile = await readFile(profileFileUrl, "utf8");
    const profile = JSON.parse(rawProfile);
    return String(profile?.personal?.email || "").trim();
  } catch (error) {
    console.error("[contact] Failed to read profile email:", error);
    return "";
  }
}

async function sendWithResend(payload) {
  const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
  if (!resendApiKey) {
    return false;
  }

  const resend = new Resend(resendApiKey);
  const ownerEmail =
    (process.env.CONTACT_NOTIFICATION_EMAIL || "").trim() ||
    (await getPortfolioEmail()) ||
    "mart33645@gmail.com";
  const fromEmail = (process.env.RESEND_FROM_EMAIL || "Portfolio <onboarding@resend.dev>").trim();

  const response = await resend.emails.send({
    from: fromEmail,
    to: ownerEmail,
    replyTo: payload.email,
    subject: `Portfolio: New message from ${payload.name}`,
    html: `
      <h2>New portfolio contact message</h2>
      <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
      <p><strong>Company:</strong> ${escapeHtml(payload.company || "N/A")}</p>
      <p><strong>Project Type:</strong> ${escapeHtml(payload.projectType || "N/A")}</p>
      <p><strong>Budget:</strong> ${escapeHtml(payload.budget || "N/A")}</p>
      <p><strong>Website:</strong> ${escapeHtml(payload.website || "N/A")}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(payload.message).replace(/\n/g, "<br />")}</p>
    `
  });

  if (response?.error) {
    throw new Error(response.error.message || "Resend failed to deliver the message.");
  }

  return true;
}

async function sendWithWeb3Forms(payload) {
  const accessKey = (process.env.WEB3FORMS_ACCESS_KEY || "").trim();
  if (!accessKey) {
    return false;
  }

  const response = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: accessKey,
      name: payload.name,
      email: payload.email,
      subject: `New Portfolio Message from ${payload.name}`,
      company: payload.company || "N/A",
      project_type: payload.projectType || "N/A",
      budget: payload.budget || "N/A",
      website: payload.website || "N/A",
      message: payload.message,
      from_name: "Portfolio Contact Form",
      replyto: payload.email
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.success) {
    throw new Error(result.message || `Web3Forms request failed with status ${response.status}.`);
  }

  return true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    const body = await readJsonBody(req);
    const payload = {
      name: body?.name,
      email: body?.email,
      message: body?.message,
      company: body?.company,
      projectType: body?.projectType,
      budget: body?.budget,
      website: body?.website
    };

    if (!payload.name || payload.name.trim().length < 2) {
      return res.status(422).json({ ok: false, message: "Name is required." });
    }

    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      return res.status(422).json({ ok: false, message: "Valid email is required." });
    }

    if (!payload.message || payload.message.trim().length < 10) {
      return res.status(422).json({ ok: false, message: "Message must be at least 10 characters long." });
    }

    let delivered = false;
    let lastError;

    try {
      delivered = await sendWithResend(payload);
    } catch (error) {
      lastError = error;
      console.error("[contact] Resend delivery failed:", error);
    }

    if (!delivered) {
      try {
        delivered = await sendWithWeb3Forms(payload);
      } catch (error) {
        lastError = error;
        console.error("[contact] Web3Forms delivery failed:", error);
      }
    }

    if (!delivered) {
      return res.status(503).json({
        ok: false,
        message: "Contact delivery is not configured right now.",
        details: lastError instanceof Error ? lastError.message : undefined
      });
    }

    return res.status(201).json({
      ok: true,
      message: "Message sent successfully. I will get back to you soon."
    });
  } catch (error) {
    console.error("[contact] Unhandled error:", error);

    if (error instanceof SyntaxError) {
      return res.status(400).json({ ok: false, message: "Invalid JSON payload." });
    }

    return res.status(500).json({
      ok: false,
      message: "Unable to process the contact request right now."
    });
  }
}
