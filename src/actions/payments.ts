import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/ses";

export const getOrderDetailsByCode = async (code: string) => {
  try {
    const orderCode = await prisma.orderCode.findUnique({
      where: { code },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
            prescription: true,
            payment: true,
            user: true,
            patient: true,
            deliveryAddress: true,
          },
        },
      },
    });

    if (!orderCode || !orderCode.order) {
      return { error: "Order not found" };
    }

    const order = orderCode.order;
    const formattedItems = order.orderItems.map((item) => {
      const details = item.productDetails as Record<string, any>;
      return {
        ...details,
        productPrice: item.product.price,
        quantity: item.quantity,
        totalSubPrice: Number(item.product.price) * item.quantity,
      };
    });

    const total = formattedItems.reduce(
      (sum, item) => sum + item.totalSubPrice,
      0
    );

    const response: any = {
      orderId: order.id,
      code: orderCode.code,
      status: order.status,
      prescriptionUrl: order.prescription?.url || null,
      items: formattedItems,
      totalSubAmount: total,
      deliveryPrice: order.deliveryPrice ?? null,
      totalAmount: order.totalPrice,
      isPaid: order.payment?.status === "PAID",
      orderPlacedBy: {
        name: order.user.name,
        email: order.user.email,
        contact: order.user.phone,
      },
    };
    // 👨‍⚕️ Add patient details if available
    if (order.patient) {
      response.patientDetails = {
        name: order.patient.name,
        email: order.patient.email,
        contact: order.patient.phone,
        birthDate: order.patient.birthDate,
      };
    }

    return response;
  } catch (error) {
    console.error("Order Fetch Error:", error);
    return { error: "Something went wrong!" };
  }
};
export const createStripePaymentIntent = async (
  orderCode: string,
  paymentBy: string
) => {
  try {
    const orderCodeRecord = await prisma.orderCode.findUnique({
      where: { code: orderCode },
      include: {
        order: {
          include: {
            payment: true,
          },
        },
      },
    });

    if (!orderCodeRecord || !orderCodeRecord.order) {
      return { error: "Invalid order code." };
    }

    const order = orderCodeRecord.order;

    if (order?.status === "PAID") {
      return { error: "This order is already paid." };
    }

    // Convert to smallest currency unit (e.g., cents for INR)
    const amountInCents = Math.round(Number(order.totalPrice) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: order.id,
        orderCode: orderCode,
        paymentBy: paymentBy,
      },
    });

    // Save PaymentIntent details
    const payment = await prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        paymentStatus: "PENDING",
      },
      create: {
        orderId: order.id,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        paymentStatus: "PENDING",
        amount: order.totalPrice,
        paymentMethod: "STRIPE",
        payerName: "Guest",
      },
    });

    return {
      clientSecret: payment.clientSecret,
      amount: order.totalPrice,
    };
  } catch (error) {
    console.error("Stripe PaymentIntent Error:", error);
    return { error: "Failed to create payment intent." };
  }
};

export const confirmStripePayment = async (
  paymentIntentId: string,
  paymentBy: string
) => {
  try {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { paymentIntentId },
        include: { order: true },
      });

      if (!payment || !payment.order) {
        return {
          error: "Order not found for this payment.",
          statusCode: 404,
        };
      }

      const order = payment.order;

      if (order.status === "PAID") {
        return {
          message: "Order already marked as paid.",
          statusCode: 200,
        };
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });

      await tx.orderStatusChange.create({
        data: {
          orderId: order.id,
          changeById: paymentBy,
          action: "PAID",
          comment: "Order paid via Stripe",
        },
      });

      // Fetch user and order code for notification
      const orderWithUser = await tx.order.findUnique({
        where: { id: order.id },
        select: {
          user: {
            select: {
              email: true,
              name: true,
              phone: true,
              id: true,
              role: true,
            },
          },
          patient: { select: { email: true, name: true, phone: true } },
          orderCode: { select: { code: true } },
        },
      });

      if (global.io) {
        global.io.emit("payment", {
          id: order.id,
          orderNumber: order.orderNumber.toString(),
          user: {
            id: orderWithUser?.user?.id,
            name: orderWithUser?.user?.name,
            role: orderWithUser?.user?.role,
          },
          totalPrice:order?.totalPrice,
          status: "PAID",
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          ...(orderWithUser?.patient ? { patient: orderWithUser.patient } : {}),
        });
      }

      if (orderWithUser && orderWithUser.orderCode) {
        // Send notifications
        if (orderWithUser.patient) {
          // Send to patient
          if (orderWithUser.patient.email) {
            await sendEmail({
              to: orderWithUser.patient.email,
              subject: "Your order has been paid!",
              bodyHtml: `<p>Hi ${orderWithUser.patient.name},</p><p>Your order has been <b>paid successfully</b>. <b>Order Code: ${orderWithUser.orderCode.code}</b>.</p>`,
            });
          }

          // Send to user (doctor)
          if (orderWithUser.user.email) {
            await sendEmail({
              to: orderWithUser.user.email,
              subject: "Payment received for patient's order",
              bodyHtml: `<p>Hi ${orderWithUser.user.name},</p><p>Payment has been received for your patient ${orderWithUser.patient.name}'s order. <b>Order Code: ${orderWithUser.orderCode.code}</b>.</p>`,
            });
          }
        } else {
          // If no patient, just send to user
          if (orderWithUser.user.email) {
            await sendEmail({
              to: orderWithUser.user.email,
              subject: "Your order has been paid!",
              bodyHtml: `<p>Hi ${orderWithUser.user.name},</p><p>Your order has been <b>paid successfully</b>. <b>Order Code: ${orderWithUser.orderCode.code}</b>.</p>`,
            });
          }
        }
      }

      return {
        message: "Order marked as paid successfully.",
        statusCode: 200,
      };
    });

    return {
      message: "Order marked as paid successfully.",
      statusCode: 200,
    };
  } catch (error) {
    console.error("ConfirmStripePayment Error:", error);
    return {
      error: "Internal server error.",
      statusCode: 500,
    };
  }
};
