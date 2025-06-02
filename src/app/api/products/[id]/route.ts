import { NextRequest, NextResponse } from "next/server";
import {
  getProductById,
  updateProduct,
  deleteProduct,
  getProducts,
} from "@/actions/product";
import { auth } from "@/lib/auth";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { ProductSchema } from "@/schemas";
import { prisma } from "@/lib/prisma";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id?: string }> }
) {
  const params = await props.params;
  if (params?.id) {
    const response = await getProductById(params.id);
    return NextResponse.json(response, { status: response.error ? 404 : 200 });
  }

  const response = await getProducts();
  return NextResponse.json(response);
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const productId = params.id;
    const formData = await req.formData();

    const imageData = formData.get("image");
    let updateData: Record<string, any> = {
      name: formData.get("name"),
      price: parseFloat(formData.get("price") as string),
      description: formData.get("description"),
      details: formData.get("details"),
      availability: formData.get("availability") as string,
      requiresPrescription: formData.get("requiresPrescription") === "true",
      categoryId: formData.get("categoryId"),
      medicineCode: formData.get("medicineCode"),
      weight: parseFloat(formData.get("weight") as string),
    };

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (imageData) {
      if (typeof imageData === "object" && "size" in imageData) {
        if (imageData.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Image size must be less than 5MB" },
            { status: 400 }
          );
        }

        try {
          const arrayBuffer = await imageData.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const fileName = `products/${Date.now()}-${imageData.name.replace(
            /\s+/g,
            "-"
          )}`;

          await s3.send(
            new PutObjectCommand({
              Bucket: BUCKET_NAME,
              Key: fileName,
              Body: buffer,
              ContentType: imageData.type,
            })
          );

          updateData.imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
        } catch (error) {
          console.error("S3 Upload Error:", error);
          return NextResponse.json(
            { error: "Failed to upload image to storage" },
            { status: 500 }
          );
        }
      } else if (typeof imageData === "string" && imageData.trim() !== "") {
        updateData.imageUrl = imageData;
      }
    } else {
      updateData.imageUrl = existingProduct.imageUrl;
    }

    const response = await updateProduct(
      session.user.id,
      productId,
      updateData
    );

    if (response.error) {
      return NextResponse.json(
        {
          error: response.error,
          details: response.details,
          message: response.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, product: response.product },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the product first to get its image URL
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  // Delete the image from S3 if it exists
  if (product.imageUrl) {
    try {
      const imageKey = product.imageUrl.split(".com/")[1];
      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: imageKey,
        })
      );
    } catch (error) {
      console.error("Error deleting image from S3:", error);
      // Continue with product deletion even if image deletion fails
    }
  }

  const response = await deleteProduct(session.user.id, params.id);
  return NextResponse.json(response, { status: response.error ? 400 : 200 });
}
