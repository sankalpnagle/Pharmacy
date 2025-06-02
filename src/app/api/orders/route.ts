// app/api/orders/route.ts
import { createOrder, getAllOrder } from "@/actions/orders";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

// Create Order
export async function POST(req: Request) {
  const session = await auth();
     if (
       !session?.user ||
       ![Role.USER, Role.DOCTOR].includes(session.user.role)
     ) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
     }
  const formData = await req.formData();
  try {
    const result = await createOrder(
      formData,
      session.user.id,
      session.user.role,
      session.user.email,
      session.user.name,
      session.user.phone
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json(
      { error: "Order creation failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const result = await getAllOrder();
  const session = await auth();
  if (
    !session?.user ||
    ![Role.ADMIN, Role.PHARMACY_STAFF].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
