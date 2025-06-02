import { sendEmail } from "@/lib/ses";

export const sendVerificationEmail = async (email: string, token: string) => {
  try {
    const domain = process.env.NEXTAUTH_URL;
    if (!domain) {
      console.error("NEXTAUTH_URL is not set");
      return { error: "Server configuration error" };
    }

    const confirmationLink = `${domain}/verify-mail?token=${token}`;
    console.log("Sending verification email to:", email);
    console.log("Confirmation link:", confirmationLink);

    const subject = "Verify your email address";
    const bodyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Email Verification</h2>
        <p>Thank you for signing up! To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationLink}" 
             style="background-color: #10847E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">If the button above doesn't work, you can also copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #10847E; font-size: 14px;">${confirmationLink}</p>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you did not create an account, please ignore this email.</p>
      </div>
    `;

    const result = await sendEmail({ to: email, subject, bodyHtml });

    if (!result.success) {
      console.error("Failed to send verification email:", result.error);
      return { error: "Failed to send verification email" };
    }

    return { success: "Verification email sent" };
  } catch (error) {
    console.error("Error in sendVerificationEmail:", error);
    return { error: "Failed to send verification email" };
  }
};
