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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    const body = await readJsonBody(req);
    const { name, email, message, company, projectType, budget, website } = body || {};

    if (!name || name.trim().length < 2) {
      return res.status(422).json({ ok: false, message: "Name is required." });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(422).json({ ok: false, message: "Valid email is required." });
    }

    if (!message || message.trim().length < 10) {
      return res.status(422).json({ ok: false, message: "Message must be at least 10 characters long." });
    }

    const accessKey = (process.env.WEB3FORMS_ACCESS_KEY || "").trim();

    if (accessKey) {
      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: accessKey,
            name,
            email,
            subject: `New Portfolio Message from ${name}`,
            company: company || "N/A",
            project_type: projectType || "N/A",
            budget: budget || "N/A",
            website: website || "N/A",
            message,
            from_name: "Portfolio Contact Form",
            replyto: email
          })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.success) {
          console.error("[contact] Web3Forms error:", {
            status: response.status,
            result
          });
        }
      } catch (error) {
        console.error("[contact] Failed to forward to Web3Forms:", error);
      }
    } else {
      console.warn("[contact] WEB3FORMS_ACCESS_KEY is missing. Returning a safe success response.");
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
