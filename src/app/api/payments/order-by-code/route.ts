import { getOrderDetailsByCode } from "@/actions/payments";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code || code.length !== 4) {
    return NextResponse.json({ error: "Invalid order code" }, { status: 400 });
  }

  const result = await getOrderDetailsByCode(code);
  return NextResponse.json(result, { status: result?.error ? 400 : 200 });
}
