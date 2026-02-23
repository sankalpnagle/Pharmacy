"use server";

import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { v4 as uuidv4 } from "uuid";
import { OrderStatus, PaymentMethod } from "@prisma/client";
import { stripe } from "@/lib/stripe"; // Assuming you have the Stripe setup in the lib folder
import { sendEmail } from "@/lib/ses";
import { sendSMS } from "@/lib/sns";

type OrderItem = {
  productId: string;
  quantity: number;
};

function generate4CharCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase(); // e.g., "4FDX"
}

type NotificationTarget = {
  name: string;
  email?: string | null;
  phone?: string | null;
};

export async function createOrder(
  formData: FormData,
  userId: string,
  role: "USER" | "DOCTOR" | "PHARMACY_STAFF" | "ADMIN",
  email: string,
  name: string,
  phone: string,
) {
  const deliveryAddressId = formData.get("deliveryAddressId") as string;
  const patientId = formData.get("patientId") as string | null;
  const itemsRaw = formData.get("items") as string;
  const prescriptionFile = formData.get("prescription") as File | null;
  const io = global.io;

  if (!deliveryAddressId || !itemsRaw) {
    throw new Error("Missing delivery address or items");
  }

  if (role === "DOCTOR" && !patientId) {
    throw new Error("Patient ID is required for doctor orders");
  }

  let items: OrderItem[];
  try {
    items = JSON.parse(itemsRaw);
  } catch {
    throw new Error("Invalid items JSON");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No items provided");
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== items.length) {
    throw new Error("Some products not found");
  }

  // Calculate total weight and product prices
  let totalProductCost = 0;
  let totalWeight = 0;
  items.forEach((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const price = Number(product.price);
    const weight = Number(product.weight || 0); // fallback to 0 if not set

    totalProductCost += price * item.quantity;
    totalWeight += weight * item.quantity;
  });
  // Get delivery address to determine province
  const deliveryAddress = await prisma.deliveryAddress.findUnique({
    where: { id: deliveryAddressId },
    select: { province: true },
  });

  if (!deliveryAddress) {
    throw new Error("Delivery address not found");
  }

  // Calculate delivery cost
  const isHavana = deliveryAddress.province.toLowerCase() === "la habana";
  const baseDeliveryCost = isHavana ? 5 : 7;
  let deliveryCost = baseDeliveryCost;

  if (totalWeight > 5) {
    const extraWeight = totalWeight - 5;
    deliveryCost += extraWeight * 2;
  }

  const totalPrice = totalProductCost + deliveryCost;

  const prescriptionRequired = products.some(
    (product) => product.requiresPrescription,
  );
  let prescriptionImageUrl: string | null = null;

  if (prescriptionFile) {
    prescriptionImageUrl = await uploadToCloudinary(
      prescriptionFile,
      `prescriptions/${uuidv4()}`,
    );
  } else if (prescriptionRequired) {
    throw new Error("Prescription image is required");
  }

  let orderResult: any;
  let orderCodeValue;
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        patientId: role === "DOCTOR" ? patientId : null,
        deliveryAddressId,
        totalPrice,
        deliveryPrice: deliveryCost,
      },
    });

    await tx.orderStatusChange.create({
      data: {
        orderId: order.id,
        changeById: userId,
        action: "PLACED",
        comment: "Order placed",
      },
    });

    await tx.orderItem.createMany({
      data: items.map((item) => {
        const product = products.find((p) => p.id === item.productId)!;
        return {
          orderId: order.id,
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
          productDetails: {
            medicineCode: product.medicineCode,
            name: product.name,
            description: product.description,
            price: product.price,
            imageUrl: product.imageUrl,
            requiresPrescription: product.requiresPrescription,
            weight: product.weight,
          },
        };
      }),
    });

    if (prescriptionImageUrl) {
      await tx.prescription.create({
        data: {
          orderId: order.id,
          prescriptionImageUrl,
        },
      });
    }

    const orderCode = await tx.orderCode.create({
      data: {
        orderId: order.id,
        code: generate4CharCode(),
      },
    });
    orderResult = order;
    orderCodeValue = orderCode.code;
  });

  if (!orderResult) {
    throw new Error("Order creation failed (no order result)");
  }

  // Fetch user and patient info for notification
  const orderWithUser = await prisma.order.findUnique({
    where: { id: orderResult.id },
    select: {
      user: { select: { email: true, name: true, phone: true } },
      patient: { select: { email: true, name: true, phone: true } },
    },
  });

  // Emit WebSocket event for new order
  if (global.io) {
    global.io.emit("newOrder", {
      id: orderResult.id,
      orderNumber: orderResult.orderNumber.toString(),
      user: {
        id: userId,
        name,
        role,
      },
      totalPrice,
      status: "PLACED",
      createdAt: orderResult.createdAt,
      updatedAt: orderResult.updatedAt,
      ...(orderWithUser?.patient ? { patient: orderWithUser.patient } : {}),
    });
  }

  const notifyTargets: NotificationTarget[] = [];
  if (orderWithUser?.patient) {
    notifyTargets.push({
      name: orderWithUser.patient.name,
      email: orderWithUser.patient.email,
      phone: orderWithUser.patient.phone,
    });
  }
  if (orderWithUser?.user) {
    notifyTargets.push({
      name: orderWithUser.user.name,
      email: orderWithUser.user.email,
      phone: orderWithUser.user.phone,
    });
  }

  // Send email to all targets
  for (const target of notifyTargets) {
    if (target.email) {
      await sendEmail({
        to: target.email,
        subject: "Your order has been placed!",
        bodyHtml: `
          <p>Hi ${target.name},</p>
          <p>Your order has been placed successfully.</p>
          <p><b>Order Code:</b> ${orderCodeValue}</p>
          <p><b>Total Product Cost:</b> $${totalProductCost.toFixed(2)}</p>
          <p><b>Delivery Cost:</b> $${deliveryCost.toFixed(2)}</p>
          <p><b>Total Weight:</b> ${totalWeight.toFixed(2)} lbs</p>
          <p><b>Total Order Cost:</b> $${totalPrice.toFixed(2)}</p>
          ${
            orderWithUser?.patient
              ? `<p><b>Patient Name:</b> ${orderWithUser.patient.name}</p>`
              : ""
          }
        `,
      });
    }

    // Send SMS if phone number exists
    if (target.phone) {
      await sendSMS({
        phoneNumber: target.phone,
        message: `Hi ${
          target.name
        }, your order (#${orderCodeValue}) has been placed. Total: $${totalPrice.toFixed(
          2,
        )} (Products: $${totalProductCost.toFixed(
          2,
        )}, Delivery: $${deliveryCost.toFixed(
          2,
        )}, Weight: ${totalWeight.toFixed(2)} lbs)`,
      });
    }
  }

  return {
    orderId: orderResult.id,
    message: "Order placed successfully",
    orderCode: orderCodeValue,
    date: orderResult.createdAt,
    totalProductCost,
    deliveryCost,
    totalWeight,
    totalPrice,
  };
}
export async function getOrderDetailsById(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        patient: true,
        deliveryAddress: true,
        prescription: true,
        orderCode: true,
        payment: true,
        orderItems: true,
        statusChanges: {
          include: {
            changedBy: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: {
            actionDate: "asc",
          },
        },
      },
    });

    if (!order) {
      return {
        success: false,
        error: "Order not found",
        message: "No order exists with the provided ID",
      };
    }

    const convertedOrder = {
      ...order,
      orderNumber: order.orderNumber.toString(), // if it's BigInt
    };

    return { success: true, data: convertedOrder };
  } catch (error) {
    console.error("❌ Failed to fetch order:", error);
    return {
      success: false,
      error: "Failed to retrieve order details",
      message: (error as Error).message,
    };
  }
}
export async function getOrders(status: string, userId?: string) {
  try {
    const orders = await prisma.order.findMany({
      where: {
        ...(status !== "ALL" && { status: status as OrderStatus }),
        ...(userId && { userId }),
      },
      include: {
        orderCode: true,
        orderItems: {
          include: {
            product: true,
          },
        },
        user: true,
        patient: true,
        deliveryAddress: true,
        payment: true,
        prescription: true,
        // statusChanges: {
        //   orderBy: { changedAt: "desc" },
        // },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedOrders = orders.map((order) => ({
      ...order,
      orderNumber: order.orderNumber.toString(), // ✅ Fix BigInt issue here
    }));
    return { success: true, data: formattedOrders };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("❌ Error fetching  orders:", error);
    return {
      success: false,
      error: "Failed to fetch orders",
      message: error?.message || "Unknown error",
    };
  }
}

export async function markOrderAsFulfilled(orderId: string, staffId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
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
            email: true,
            name: true,
            phone: true,
          },
        },
        orderCode: {
          select: {
            code: true,
          },
        },
      },
    });
    // const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order)
      return {
        success: false,
        error: "Order not found",
        message: "No order exists with the provided ID",
      };

    if (order.status !== OrderStatus.PAID)
      return {
        success: false,
        error: "Invalid order status",
        message: "Only orders with status PAID can be marked as fulfilled",
      };
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.FULFILLED,
      },
    });
    // Create status change log
    await prisma.orderStatusChange.create({
      data: {
        orderId,
        changeById: staffId,
        action: OrderStatus.FULFILLED,
        comment: "Marked as fulfilled by staff", // Optional, can be dynamic
      },
    });
    const convertedOrder = {
      ...updatedOrder,
      orderNumber: updatedOrder.orderNumber.toString(),
    };
    const email = order.patient?.email || order.user?.email;
    const name = order.patient?.name || order.user?.name;
    const phone = order.patient?.phone || order.user?.phone;
    const orderCode = order.orderCode?.code;

    await sendEmail({
      to: email,
      subject: "Your order has been fulfilled",
      bodyHtml: `<p>Hi ${name},</p><p>Your order has been <b>fulfilled successfully</b>. <b>Order Code: ${orderCode}</b>.</p>`,
    });

    return { success: true, data: convertedOrder };
  } catch (error) {
    console.error("Error marking order as fulfilled:", error);
    return { success: false, error: "Failed to mark as fulfilled" };
  }
}

export async function rejectOrder(
  orderId: string,
  staffId: string,
  comment?: string,
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
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
            email: true,
            name: true,
            phone: true,
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
      return {
        success: false,
        error: "Order not found",
        message: "No order exists with the provided ID",
      };
    }

    if (
      order.status !== OrderStatus.PAID &&
      order.status !== OrderStatus.PLACED
    ) {
      return {
        success: false,
        error: "Invalid order status",
        message: "Only orders with status PAID can be rejected",
      };
    }

    // Update order status to REJECT
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.REJECT,
      },
    });

    // Create status change log
    await prisma.orderStatusChange.create({
      data: {
        orderId,
        changeById: staffId,
        action: OrderStatus.REJECT,
        comment: comment || "Rejected by staff",
      },
    });

    // Send notifications
    const notifyTarget = order.patient || order.user;
    if (notifyTarget?.email) {
      await sendEmail({
        to: notifyTarget.email,
        subject: "Your order has been rejected",
        bodyHtml: `<p>Hi ${notifyTarget.name},</p><p>We're sorry to inform you that your order <b>has been rejected</b>.</p><p><b>Order Code:</b> ${order.orderCode?.code}</p><p><b>Reason:</b> ${comment}</p>`,
      });
    }

    return {
      success: true,
      data: {
        ...updatedOrder,
        orderNumber: updatedOrder.orderNumber.toString(),
      },
    };
  } catch (error) {
    console.error("Error rejecting order:", error);
    return { success: false, error: "Failed to reject order" };
  }
}

export async function refundOrder(
  orderId: string,
  staffId: string,
  comment?: string,
) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return {
        success: false,
        error: "Order not found",
        message: "No order exists with the provided ID",
      };
    }

    if (
      order.status !== OrderStatus.PAID &&
      order.status !== OrderStatus.CANCEL &&
      order.status !== OrderStatus.REJECT
    ) {
      return {
        success: false,
        error: "Invalid order status",
        message: "Only orders with status PAID or CANCEL can be refunded",
      };
    }

    const paymnetData = await prisma.payment.findUnique({
      where: { orderId: orderId },
    });
    if (!paymnetData) {
      return {
        success: false,
        error: "Payment information not found",
        message: "No Payment details with the provided orderId",
      };
    }

    // Refund through Stripe
    if (paymnetData?.paymentMethod === PaymentMethod.STRIPE) {
      const paymentIntentId = paymnetData.paymentIntentId;

      if (!paymentIntentId) {
        return {
          success: false,
          error: "Payment Intent missing",
          message: "No Stripe payment intent found for this order",
        };
      }

      // Create a refund request to Stripe
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        metadata: {
          data: JSON.stringify({ changeById: staffId, comment: comment }),
          orderId: orderId,
        },
      });

      if (refund.status !== "succeeded") {
        return {
          success: false,
          error: "Stripe refund failed",
          message: "Refund could not be processed by Stripe",
        };
      }
    }

    // Update the order status to REFUND
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.REFUND,
      },
    });

    // Create status change log
    await prisma.orderStatusChange.create({
      data: {
        orderId,
        changeById: staffId,
        action: OrderStatus.REFUND,
        comment: "REFUND by staff",
      },
    });

    // Emit WebSocket event for refund status
    if (global.io) {
      global.io.emit("orderStatusUpdate", {
        orderId,
        status: "REFUND",
        updatedAt: new Date(),
        orderCode: order.orderCode?.code,
        userId: order.userId,
        patientId: order.patientId,
      });
    }

    return { success: true, data: "Refund is processed by Stripe" };
  } catch (error) {
    console.error("Error refunding order:", error);
    return { success: false, error: "Failed to refund order" };
  }
}

export async function getAllOrder() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        patient: true,
        payment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const normalizedOrders = orders.map((order) => ({
      ...order,
      orderNumber: order.orderNumber?.toString?.() || null,
    }));

    return { success: true, data: normalizedOrders };
  } catch (error) {
    console.error("❌ Failed to fetch all orders:", error);
    return {
      success: false,
      message: "Failed to fetch orders",
      error: (error as Error).message,
    };
  }
}

export async function cancelOrder(orderId: string, userId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        user: true,
        patient: true,
        orderCode: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: "Order not found",
        message: "No order exists with the provided ID",
      };
    }

    // Check if order can be cancelled (only PLACED or PAID status)
    if (!["PLACED", "PAID"].includes(order.status)) {
      return {
        success: false,
        error: "Invalid order status",
        message: "Only orders with status PLACED or PAID can be cancelled",
      };
    }

    // Update order status to CANCEL
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCEL" },
    });

    // Create status change log
    await prisma.orderStatusChange.create({
      data: {
        orderId,
        changeById: userId,
        action: "CANCEL",
        comment: "Order cancelled by user",
      },
    });

    // Send notification
    const notifyTarget = order.patient || order.user;
    if (notifyTarget?.email) {
      await sendEmail({
        to: notifyTarget.email,
        subject: "Your order has been cancelled",
        bodyHtml: `<p>Hi ${notifyTarget.name},</p><p>Your order has been <b>cancelled</b>. <b>Order Code: ${order.orderCode?.code}</b>.</p>`,
      });
    }

    // Emit WebSocket event for order cancellation
    const io = global.io;
    if (io) {
      io.emit("orderStatusUpdate", {
        orderId,
        status: "CANCEL",
        updatedAt: new Date(),
        orderCode: order.orderCode?.code,
        userId: order.userId,
        patientId: order.patientId,
      });
    }

    return {
      success: true,
      message: "Order cancelled successfully",
    };
  } catch (error) {
    console.error("Cancel Order Error:", error);
    return {
      success: false,
      error: "Failed to cancel order",
      message: "An error occurred while cancelling the order",
    };
  }
}
