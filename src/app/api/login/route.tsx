import { login } from "@/actions/login";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // console.log("Login Request Body:", body);

    const response = await login(body);
    // console.log("Login Response:", response);

    if (response?.error) {
      return NextResponse.json({ error: response.error }, { status: 400 });
    }
    console.log(response, "res");

    return NextResponse.json(
      { message: "Login successful!", response: response },
      { status: 200 }
    );
  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
