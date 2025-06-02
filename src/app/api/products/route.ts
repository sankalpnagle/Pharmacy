import { NextResponse } from "next/server";
import { createProduct, getProducts } from "@/actions/product";
import { auth } from "@/lib/auth";
import { ProductSchema } from "@/schemas";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Get All Product
export async function GET() {
  const response = await getProducts();
  return NextResponse.json(response);
}

// S3 Client Setup
const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

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

  // 🔹 Upload image to S3 if present
  if (imageFile) {
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `products/${Date.now()}-${imageFile.name}`;

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: imageFile.type,
      // ACL: "public-read",
    };

    try {
      await s3.send(new PutObjectCommand(uploadParams));
      productData.imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    } catch (error) {
      console.error("S3 Upload Error:", error);
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
