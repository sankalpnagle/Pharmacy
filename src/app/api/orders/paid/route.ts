import { getOrders } from "@/actions/orders";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
    if (
       !session?.user ||
       ![Role.ADMIN, Role.PHARMACY_STAFF].includes(session.user.role)
     ) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
     }
  
  try {
    const result = await getOrders("PAID");

    if (result.success) {
      return NextResponse.json({ data: result.data }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to fetch paid orders" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API error fetching paid orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
