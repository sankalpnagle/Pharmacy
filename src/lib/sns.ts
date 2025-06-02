// lib/sns.ts
import {
  SNSClient,
  PublishCommand,
  PublishCommandInput,
} from "@aws-sdk/client-sns";

// Helper function to validate phone number format
function isValidE164(phoneNumber: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

// Initialize SNS client
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function sendSMS({
  phoneNumber,
  message,
}: {
  phoneNumber: string; // E.164 format, e.g., +919876543210
  message: string;
}) {
  try {
    const command = new PublishCommand({
      Message: message,
      PhoneNumber: phoneNumber,
    });

    try {
      const response = await snsClient.send(command);
      console.log("✅ SMS sent:", response);
      return { success: true, data: response };
    } catch (err) {
      console.error("❌ Failed to send SMS:", err);
      return { success: false, error: err };
    }
  } catch (err) {
    console.error("❌ Failed to create SMS command:", err);
    return { success: false, error: err };
  }
}
