// lib/ses.ts - Gmail + Nodemailer (replaces AWS SES)
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER!,
    pass: process.env.GMAIL_APP_PASSWORD!,
  },
});

export async function sendEmail({
  to,
  subject,
  bodyHtml,
  bodyText,
}: {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}) {
  const from =
    process.env.GMAIL_USER || process.env.EMAIL_FROM || "noreply@example.com";

  try {
    const result = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "Pharmacy"}" <${from}>`,
      to,
      subject,
      html: bodyHtml,
      ...(bodyText && { text: bodyText }),
    });
    console.log("✅ Email sent:", result.messageId);
    return { success: true, data: result };
  } catch (err) {
    console.error("❌ Failed to send email:", err);
    return { success: false, error: err };
  }
}
