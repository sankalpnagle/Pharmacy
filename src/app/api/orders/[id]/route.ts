import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { getOrderDetailsById } from "@/actions/orders";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (
    !session?.user
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const result = await getOrderDetailsById(params.id);
    if (result.success) {
      return NextResponse.json(result.data, { status: 200 });
    } else {
      return NextResponse.json(
        {
          error: result.error || "Something went wrong",
          message: result.message || "Could not retrieve order details",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("❌ Error retrieving order details:", error);
    return NextResponse.json(
      { error: "Server error", message: (error as Error).message },
      { status: 500 }
    );
  }
}