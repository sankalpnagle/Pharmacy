import { NextResponse } from "next/server";
import { createCategory, getCategories } from "@/actions/category";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    const response = await getCategories();
    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 400 });
    }
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Category Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session = await auth();
    if (
      !session?.user ||
      ![Role.ADMIN, Role.PHARMACY_STAFF].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const response = await createCategory(body);

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 400 });
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Category Creation Error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
