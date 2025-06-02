import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/ses";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json(
        { error: "Missing email or code" },
        { status: 400 }
      );
    }
    const paymentLink = `https://www.saluspharmacy.com/payOrder?code=${code}`;
    const subject = "Pay for your order";
    const bodyHtml = `<p>Hello,</p><p>You can pay for your order using the following link:</p><p><a href='${paymentLink}'>${paymentLink}</a></p><p>Your 4-digit code: <b>${code}</b></p>`;
    await sendEmail({ to: email, subject, bodyHtml });
    return NextResponse.json({ success: true, message: "Email sent" });
  } catch (error) {
    console.error("Failed to send payment link email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
