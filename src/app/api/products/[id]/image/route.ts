import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("Starting image upload process...");

    const session = await auth();
    console.log("Auth session:", session ? "Found" : "Not found");

    if (!session?.user) {
      console.error("No authenticated user found");
      return NextResponse.json(
        { error: "Unauthorized - Please log in to continue" },
        { status: 401 }
      );
    }

    if (!session.user.accessToken) {
      console.error("No access token found in session");
      return NextResponse.json(
        { error: "Unauthorized - Invalid session" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const image = formData.get("image") as File;
    const medicineCode = params.id;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Validate image type
    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image file." },
        { status: 400 }
      );
    }

    // Validate image size (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image size should be less than 5MB" },
        { status: 400 }
      );
    }

    console.log(`Uploading image for medicine code: ${medicineCode}`);
    console.log(
      `Image details: ${image.name}, ${image.type}, ${image.size} bytes`
    );

    // Create a new FormData for the backend API
    const backendFormData = new FormData();
    backendFormData.append("image", image);

    // Get the base URL for the backend API
    const baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    console.log(`Using backend URL: ${baseUrl}`);

    // Call your backend API to update the product image
    const response = await fetch(
      `${baseUrl}/api/products/${medicineCode}/image`,
      {
        method: "POST",
        body: backendFormData,
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error(`Failed to update image for ${medicineCode}:`, error);
      return NextResponse.json(
        { error: error.message || "Failed to update image" },
        { status: response.status }
      );
    }

    console.log(
      `Successfully updated image for medicine code: ${medicineCode}`
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating product image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
