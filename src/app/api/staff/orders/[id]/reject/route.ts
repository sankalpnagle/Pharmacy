import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rejectOrder } from "@/actions/orders";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (
    !session?.user ||
    ![Role.ADMIN, Role.PHARMACY_STAFF].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { comment } = await req.json();
    const result = await rejectOrder(params.id, session.user.id, comment);

    if (result.success) {
      return NextResponse.json(result.data, { status: 200 });
    } else {
      return NextResponse.json(
        {
          error: result.error || "Something went wrong",
          message: result.message || "The order could not be rejected",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Reject order failed:", error);
    return NextResponse.json(
      { error: "Something went wrong!", message: (error as Error).message },
      { status: 500 }
    );
  }
}
