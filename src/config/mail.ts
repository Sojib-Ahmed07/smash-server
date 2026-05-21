import "dotenv/config";

export async function sendMail(
  to: string,
  subject: string,
  htmlContent: string,
) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    throw new Error(
      "Missing BREVO_API_KEY or SENDER_EMAIL in environment variables.",
    );
  }

  // Send via Brevo HTTP REST API (Bypasses all SMTP IP Whitelist restrictions)
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "SMASH Arena",
        email: senderEmail,
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(`Brevo API Error: ${JSON.stringify(errorBody)}`);
  }

  return await response.json();
}
