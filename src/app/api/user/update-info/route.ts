import { updateUserInfo } from "@/actions/user";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      ![Role.DOCTOR, Role.USER].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const formData = await req.formData();
    const result = await updateUserInfo(formData, session.user.id);

    if (result.error) {
      return NextResponse.json(
        { error: result.error, details: result?.details },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: result.success }, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
