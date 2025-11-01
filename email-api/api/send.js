import { Resend } from "resend";

// Debug logging
console.log("API Debug Info:");
console.log("- RESEND_API_KEY:", process.env.RESEND_API_KEY ? "✅ Present" : "❌ Missing");
console.log("- NODE_ENV:", process.env.NODE_ENV);

// Initialize Resend with detailed error if key missing
const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.error("❌ Missing RESEND_API_KEY environment variable");
  console.error("Please add RESEND_API_KEY to your Vercel environment variables");
}

const resend = new Resend(RESEND_API_KEY);

export default async function handler(req, res) {
  console.log("📧 Received email request:", {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  if (req.method !== "POST") {
    console.log("❌ Wrong method:", req.method);
    return res.status(405).json({ 
      error: "Method Not Allowed",
      allowed: "POST" 
    });
  }

  const { to, subject, message } = req.body;

  // Validate required fields
  if (!to || !subject || !message) {
    console.log("❌ Missing required fields:", { to, subject, message });
    return res.status(400).json({ 
      error: "Missing required fields",
      required: ["to", "subject", "message"],
      received: { to, subject, message }
    });
  }

  try {
    console.log("📨 Attempting to send email to:", to);
    const result = await resend.emails.send({
      from: "event-app@resend.dev",
      to,
      subject,
      text: message,
    });
    console.log("✅ Email sent successfully:", result);
    res.status(200).json({ success: true, id: result.id });
  } catch (e) {
    console.error("❌ Email send error:", {
      name: e.name,
      message: e.message,
      stack: e.stack
    });
    res.status(500).json({ 
      error: e.message,
      name: e.name,
      details: e.response?.data || "No additional details"
    });
  }
}
