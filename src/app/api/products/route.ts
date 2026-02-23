import { NextResponse } from "next/server";
import { createProduct, getProducts } from "@/actions/product";
import { auth } from "@/lib/auth";
import { ProductSchema } from "@/schemas";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Get All Product
export async function GET() {
  const response = await getProducts();
  return NextResponse.json(response);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session?.user || session?.user?.role !== "PHARMACY_STAFF") {
    return { error: "Only pharmacy staff can add products!" };
  }

  const formData = await req.formData();
  const imageFile = formData.get("image") as File | null;

  // 🔹 Extract form fields
  const productData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    details: formData.get("details") as string,
    price: parseFloat(formData.get("price") as string),
    availability: formData.get("availability") as string,
    requiresPrescription: formData.get("requiresPrescription") === "true",
    categoryId: formData.get("categoryId") as string,
    imageUrl: null as string | null,
    medicineCode: formData.get("medicineCode") as string,
    weight: parseFloat(formData.get("weight") as string),
  };

  // 🔹 Upload image to Cloudinary if present
  if (imageFile) {
    try {
      const fileName = `products/${Date.now()}-${imageFile.name.replace(/\s+/g, "-")}`;
      productData.imageUrl = await uploadToCloudinary(imageFile, fileName);
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      return NextResponse.json(
        { error: "Failed to upload image!" },
        { status: 500 }
      );
    }
  }

  // 🔹 Validate Product Data
  const validation = ProductSchema.safeParse(productData);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid product data!", details: validation.error },
      { status: 400 }
    );
  }

  // Create product
  const result = await createProduct(session.user.id, productData);

  if (result.success) {
    return NextResponse.json(result, { status: 201 });
  } else {
    return NextResponse.json(
      {
        error: result.error,
        details: result.details ?? undefined,
      },
      { status: 400 }
    );
  }
}
