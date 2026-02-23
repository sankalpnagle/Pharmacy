import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderCode, amount, payerName, cardLast4, transactionId } = body;
    const session = await auth();

    if (!orderCode || typeof orderCode !== "string") {
      return NextResponse.json(
        { error: "Order code is required." },
        { status: 400 },
      );
    }

    if (!amount || !transactionId) {
      return NextResponse.json(
        { error: "Invalid payment data." },
        { status: 400 },
      );
    }

    // Find order by code
    const orderCodeRecord = await prisma.orderCode.findUnique({
      where: { code: orderCode },
      include: {
        order: {
          include: {
            payment: true,
            user: true,
          },
        },
      },
    });

    if (!orderCodeRecord || !orderCodeRecord.order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const order = orderCodeRecord.order;

    // Check if already paid
    if (order.payment?.paymentStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "Order already paid." },
        { status: 400 },
      );
    }

    // Update or create payment record
    try {
      const payment = await prisma.payment.upsert({
        where: { orderId: order.id },
        update: {
          paymentStatus: "COMPLETED",
          transactionId,
          payerName: payerName || order.user?.name,
          payerEmail: order.user?.email,
        },
        create: {
          orderId: order.id,
          amount: new Decimal(String(amount)),
          paymentStatus: "COMPLETED",
          transactionId,
          paymentMethod: "STRIPE",
          payerName: payerName || order.user?.name,
          payerEmail: order.user?.email,
        },
      });

      // Update order status to PAID
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
        },
      });

      return NextResponse.json(
        {
          success: true,
          payment,
          message: "Payment processed successfully",
        },
        { status: 200 },
      );
    } catch (dbError) {
      console.error("Database Error during payment creation:", dbError);
      throw dbError;
    }
  } catch (error) {
    console.error("Payment API Error:", error);

    // Extract meaningful error message
    let errorMessage = "Internal server error.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
