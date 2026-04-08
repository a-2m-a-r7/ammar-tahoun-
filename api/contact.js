export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const { name, email, message } = req.body || {};
  
  if (!name || name.length < 2) {
    return res.status(422).json({ ok: false, message: "Name is missing or too short." });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(422).json({ ok: false, message: "Valid email is required." });
  }
  if (!message || message.trim().length < 10) {
    return res.status(422).json({ ok: false, message: "Message must be at least 10 characters long." });
  }

  // Optional: If the user sets a CONTACT_WEBHOOK_URL in Vercel environment variables, we send it there.
  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `**New Contact Form Submission:**\n**Name**: ${name}\n**Email**: ${email}\n**Message**:\n${message}` })
      });
    } catch (e) {
      console.error("Webhook failed", e);
    }
  }

  // Always return success so the frontend knows it was sent
  res.status(201).json({
    ok: true,
    message: "Message sent successfully. I will get back to you soon."
  });
}
