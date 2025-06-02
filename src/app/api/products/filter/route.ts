// app/api/products/filter/route.ts
import { getProducts } from "@/actions/product";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await getProducts(body);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result.products, { status: 200 });
  } catch (error) {
    console.error("API Filter Products Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
