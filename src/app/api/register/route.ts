import { register } from "@/actions/register";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const response = await register(formData);

    if (response.error) {
      return NextResponse.json(
        { error: response.error, details: response?.details },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: response.success }, { status: 201 });
  } catch (error: any) {
    console.error("Register API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
