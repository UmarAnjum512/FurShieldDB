import nodemailer from "nodemailer";

// Returns true if an email was sent, false if SMTP is not configured or sending failed.
export async function sendMail({ to, subject, text }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) return false;

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
    await transporter.sendMail({ from: SMTP_FROM || SMTP_USER, to, subject, text });
    return true;
  } catch (err) {
    console.error("Email send failed:", err.message);
    return false;
  }
}
