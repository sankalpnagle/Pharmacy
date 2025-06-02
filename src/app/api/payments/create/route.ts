import { NextResponse } from "next/server";
import { createStripePaymentIntent } from "@/actions/payments";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderCode } = body;
    const session = await auth();

    if (!orderCode || typeof orderCode !== "string") {
      return NextResponse.json(
        { error: "Order code is required." },
        { status: 400 }
      );
    }
    const paymentBy = session?.user?.id || "guest"
    
    const result = await createStripePaymentIntent(orderCode,paymentBy);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
