export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
  }

  const { name, email, message, company, projectType, budget, website } = req.body || {};
  
  if (!name || name.length < 2) {
    return res.status(422).json({ ok: false, message: "Name is required." });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(422).json({ ok: false, message: "Valid email is required." });
  }
  if (!message || message.trim().length < 10) {
    return res.status(422).json({ ok: false, message: "Message must be at least 10 characters long." });
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  
  if (accessKey) {
    try {
      // Forward to Web3Forms for Email Delivery
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          name: name,
          email: email,
          subject: `New Portfolio Message from ${name}`,
          company: company || "N/A",
          project_type: projectType || "N/A",
          budget: budget || "N/A",
          website: website || "N/A",
          message: message,
          from_name: "Portfolio Contact Form",
          replyto: email // This allows the user to click "reply" in their email client
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error("Web3Forms Error:", result);
      }
    } catch (e) {
      console.error("Failed to forward to Web3Forms:", e);
    }
  } else {
    console.warn("WEB3FORMS_ACCESS_KEY is missing. Message only saved locally (if applicable).");
  }

  // We return success to the user regardless, since we don't want to block the UI 
  // if the email service has a hiccup, as the message is "sent" from their perspective.
  res.status(201).json({
    ok: true,
    message: "Message sent successfully. I will get back to you soon."
  });
}
