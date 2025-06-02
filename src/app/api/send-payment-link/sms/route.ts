import { NextRequest, NextResponse } from "next/server";
import { sendSMS } from "@/lib/sns";

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    if (!phone || !code) {
      return NextResponse.json(
        { error: "Missing phone or code" },
        { status: 400 }
      );
    }
    const paymentLink = `https://www.saluspharmacy.com/payOrder?code=${code}`;
    const message = `You can pay for your order using this link: ${paymentLink} (Code: ${code})`;
    await sendSMS({ phoneNumber: phone, message });
    return NextResponse.json({ success: true, message: "SMS sent" });
  } catch (error) {
    console.error("Failed to send payment link SMS:", error);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
