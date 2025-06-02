import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addUserAddress, getUserAddress, updateUserAddress } from "@/actions/user";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const addressData = await req.json();
  const response = await addUserAddress(session.user.id, addressData);

  return NextResponse.json(response, { status: response.error ? 400 : 200 });
}
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await getUserAddress(session.user.id);
  return NextResponse.json(response, { status: response.error ? 400 : 200 });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const response = await updateUserAddress(session.user.id, body);
  return NextResponse.json(response, { status: response.error ? 400 : 200 });
}