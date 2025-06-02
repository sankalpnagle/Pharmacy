// lib/ses.ts
import {
    SESClient,
    SendEmailCommand,
  } from "@aws-sdk/client-ses";
  
  const sesClient = new SESClient({
    region: "us-east-1", // or your SES region
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
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
    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: bodyHtml },
          ...(bodyText && { Text: { Data: bodyText } }),
        },
      },
      Source: process.env.EMAIL_FROM!,
    });
  
    try {
      const response = await sesClient.send(command);
      console.log("✅ Email sent:", response);
      return { success: true, data: response };
    } catch (err) {
      console.error("❌ Failed to send email:", err);
      return { success: false, error: err };
    }
  }
  