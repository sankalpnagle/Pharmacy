// app/api/webhooks/stripe/route.ts

import { NextRequest } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { sendEmail } from "@/lib/ses";
import { confirmStripePayment } from "@/actions/payments";


export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(req: NextRequest) {
  const buf = await req.arrayBuffer();
  const rawBody = Buffer.from(buf);
  const sig = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  // 🎯 Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;
      const paymentBy = paymentIntent.metadata.paymentBy;

      try {
        // Use confirmStripePayment function
        const result = await confirmStripePayment(paymentIntent.id, paymentBy);

        if (result.error) {
          console.error("❌ Payment confirmation failed:", result.error);
          return new Response("Payment confirmation failed", { status: 500 });
        }

        console.log(`✅ Order ${orderId} marked as paid via webhook`);
      } catch (err) {
        console.error("❌ Error handling payment confirmation:", err);
        return new Response("Webhook error during payment confirmation", {
          status: 500,
        });
      }
      break;

    case "payment_intent.payment_failed":
      console.warn("❌ Payment failed.");
      break;
    case "refund.created": {
      const refund = event.data.object as Stripe.Refund;
      try {
        if (refund?.metadata) {
          const orderId = refund.metadata.orderId;
          const data = refund.metadata.data
            ? JSON.parse(refund.metadata.data)
            : {};
          const changeById = data?.changeById;
          const comment = data?.comment;

          // Check if order is already refunded
          const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
            select: { status: true },
          });

          if (existingOrder?.status === "REFUND") {
            console.log(
              `Order ${orderId} is already refunded, skipping webhook processing`
            );
            return new Response("Order already refunded", { status: 200 });
          }

          // Check if refund status change already exists
          const existingRefundStatus = await prisma.orderStatusChange.findFirst(
            {
              where: {
                orderId,
                action: "REFUND",
              },
            }
          );

          // Update your DB with refund info
          await prisma.payment.update({
            where: { orderId },
            data: {
              paymentStatus: "REFUND",
            },
          });

          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: "REFUND",
            },
          });

          // Only create status change if it doesn't exist
          if (!existingRefundStatus) {
            await prisma.orderStatusChange.create({
              data: {
                orderId,
                changeById: changeById,
                action: OrderStatus.REFUND,
                comment: comment || "Order has been refunded",
              },
            });
          }

          const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
              id: true,
              orderNumber: true,
              totalPrice: true,
              createdAt: true,
              updatedAt: true,
              patientId: true,
              userId: true,
              patient: {
                select: {
                  email: true,
                  name: true,
                  phone: true,
                },
              },
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  phone: true,
                  role: true,
                },
              },
              orderCode: {
                select: {
                  code: true,
                },
              },
            },
          });

          if (!order) {
            console.error("❌ Order not found");
            return new Response("Order not found", { status: 404 });
          }

          const email = order.patient?.email || order.user?.email;
          const name = order.patient?.name || order.user?.name;
          const phone = order.patient?.phone || order.user?.phone;
          const orderCode = order.orderCode?.code;

          await sendEmail({
            to: email,
            subject: "Your order has been refunded",
            bodyHtml: `<p>Hi ${name},</p><p>Your order has been <b>refunded successfully</b>. <b>Order Code: ${orderCode}</b>.</p>`,
          });

          console.log(`✅ Order ${orderId} marked as refunded`);
        }
      } catch (err) {
        console.error("❌ Error handling refund:", err);
        return new Response("Refund webhook DB error", { status: 500 });
      }
      break;
    }
    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  return new Response("Webhook received", { status: 200 });
}
