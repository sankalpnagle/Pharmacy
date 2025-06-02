import { NextResponse } from "next/server";
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "@/actions/category";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const response = await getCategoryById(params.id);

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 404 });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Fetch Category Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (
    !session?.user ||
    ![Role.ADMIN, Role.PHARMACY_STAFF].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const params = await props.params;
  try {
    const body = await req.json();
    const response = await updateCategory(params.id, body);

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 400 });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Update Category Error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const session = await auth();
  if (
    !session?.user ||
    ![Role.ADMIN, Role.PHARMACY_STAFF].includes(session.user.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const response = await deleteCategory(params.id);

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 400 });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Delete Category Error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
