import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { getOrders } from "@/actions/orders";

export async function GET(req: Request) {
  const session = await auth();
  if (
    !session?.user ||
    ![Role.USER, Role.DOCTOR].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "ALL";

  const result = await getOrders(status,session?.user?.id);
  if (result.success) {
    return NextResponse.json(result, { status: 200 });
  } else {
    return NextResponse.json(result, { status: 500 });
  }
}
