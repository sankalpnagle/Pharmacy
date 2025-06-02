import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { unzip } from "unzipit";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

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
  try {
    console.log("Starting bulk image upload process...");
    const session = await auth();
    console.log("Auth session:", session ? "Found" : "Not found");

    if (
      !session?.user ||
      ![Role.ADMIN, Role.PHARMACY_STAFF].includes(session.user.role)
    ) {
      console.error("No authenticated user found");
      return NextResponse.json(
        { error: "Unauthorized - Please log in to continue" },
        { status: 401 }
      );
    }

    if (session.user.role !== "PHARMACY_STAFF") {
      console.error("User does not have required role");
      return NextResponse.json(
        { error: "Unauthorized - Only pharmacy staff can upload images" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const zipFile = formData.get("zipFile") as File;

    if (!zipFile) {
      return NextResponse.json(
        { error: "No zip file provided" },
        { status: 400 }
      );
    }

    // Validate zip file size (10MB limit)
    const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 10MB
    if (zipFile.size > MAX_ZIP_SIZE) {
      return NextResponse.json(
        { error: "Zip file size should be less than 10MB" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!zipFile.type.includes("zip") && !zipFile.name.endsWith(".zip")) {
      return NextResponse.json(
        { error: "Please upload a valid ZIP file" },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer with size check
    const arrayBuffer = await zipFile.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_ZIP_SIZE) {
      return NextResponse.json(
        { error: "Zip file size exceeds the maximum allowed size of 10MB" },
        { status: 400 }
      );
    }

    const { entries } = await unzip(arrayBuffer);
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      totalFiles: Object.keys(entries).length,
    };

    // Process each image in the zip file
    for (const [filename, entry] of Object.entries(entries)) {
      try {
        // Skip directories and non-image files
        if (
          filename.endsWith("/") ||
          !filename.match(/\.(jpg|jpeg|png|gif)$/i)
        ) {
          continue;
        }

        // Validate individual image size (5MB limit per image)
        const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
        const imageBuffer = await entry.arrayBuffer();
        if (imageBuffer.byteLength > MAX_IMAGE_SIZE) {
          results.failed++;
          results.errors.push(`Image ${filename} exceeds 5MB size limit`);
          continue;
        }

        // Extract medicineCode from filename (assuming format: medicineCode.jpg)
        const medicineCode = filename.split("/").pop()?.split(".")[0];

        if (!medicineCode) {
          results.failed++;
          results.errors.push(`Invalid filename format: ${filename}`);
          continue;
        }

        // Convert ArrayBuffer to Buffer
        const buffer = Buffer.from(imageBuffer);
        const fileName = `products/${Date.now()}-${filename.replace(
          /\s+/g,
          "-"
        )}`;

        // Upload to S3
        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: entry.type,
          })
        );

        // Generate the S3 URL
        const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

        // Update the product with the new image URL
        const updatedProduct = await prisma.product.update({
          where: { medicineCode },
          data: { imageUrl },
        });

        if (updatedProduct) {
          results.success++;
          console.log(
            `Successfully updated image for medicine code: ${medicineCode}`
          );
        } else {
          results.failed++;
          results.errors.push(
            `Product not found for medicine code: ${medicineCode}`
          );
        }
      } catch (error) {
        results.failed++;
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Error processing ${filename}: ${errorMessage}`);
        console.error(`Error processing ${filename}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.success} images successfully, ${results.failed} failed out of ${results.totalFiles} total files`,
      details: results,
    });
  } catch (error) {
    console.error("Error in bulk image upload:", error);
    return NextResponse.json(
      {
        error: "Failed to process bulk image upload",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "500mb",
    },
  },
};
