// lib/sns.ts
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

// Helper: Validate E.164 and restrict to U.S. numbers only
function isValidUSPhone(phoneNumber: string): boolean {
  const usE164Regex = /^\+1\d{10}$/; // E.164 format for US: +1 followed by 10 digits
  return usE164Regex.test(phoneNumber);
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
  phoneNumber: string;
  message: string;
}) {
  if (!isValidUSPhone(phoneNumber)) {
    console.error(
      "❌ Only U.S. phone numbers in E.164 format (+1XXXXXXXXXX) are supported."
    );
    return {
      success: false,
      error:
        "Only U.S. phone numbers in E.164 format (+1XXXXXXXXXX) are supported.",
    };
  }

  try {
    const command = new PublishCommand({
      Message: message,
      PhoneNumber: phoneNumber,
    });

    const response = await snsClient.send(command);
    console.log("✅ SMS sent:", response);
    return { success: true, data: response };
  } catch (err) {
    console.error("❌ Failed to send SMS:", err);
    return { success: false, error: err };
  }
}
