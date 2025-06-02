import { NextResponse } from "next/server";
import { cancelOrder } from "@/actions/orders";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (
       !session?.user ||
       ![Role.DOCTOR, Role.USER].includes(session.user.role)
     ) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
     }

    const result = await cancelOrder(params.id, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: result.message }, { status: 200 });
  } catch (error) {
    console.error("Cancel Order API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
