import { NextResponse } from "next/server";
import { confirmStripePayment } from "@/actions/payments";
import { auth } from "@/lib/auth";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

interface ConfirmPaymentRequest {
  paymentIntentId: string;
}

export async function POST(req: Request) {
  try {
    const body: ConfirmPaymentRequest = await req.json();
    const { paymentIntentId } = body;

    const session = await auth();
    const paymentBy = session?.user?.id || "guest";

    if (!paymentIntentId || typeof paymentIntentId !== "string") {
      return NextResponse.json(
        { error: "Valid PaymentIntent ID is required." },
        { status: 400 }
      );
    }

    const result = await confirmStripePayment(paymentIntentId, paymentBy);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 400 }
      );
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
