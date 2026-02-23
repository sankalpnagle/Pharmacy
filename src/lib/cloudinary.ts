import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true,
});

/**
 * Upload a file to Cloudinary (replaces uploadToS3).
 * @param file - File or Buffer to upload
 * @param key - Folder path (e.g. "prescriptions/uuid" or "products/123-filename")
 * @returns The secure URL of the uploaded asset
 */
export async function uploadToCloudinary(
  file: File | Buffer,
  key: string,
  contentType?: string
): Promise<string> {
  const [folder, ...rest] = key.split("/");
  const publicId = rest.length > 0 ? rest.join("/").replace(/\.[^.]+$/, "") : key;

  let dataUri: string;

  if (Buffer.isBuffer(file)) {
    const mime = contentType || "image/jpeg";
    const base64 = file.toString("base64");
    dataUri = `data:${mime};base64,${base64}`;
  } else {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    dataUri = `data:${file.type};base64,${base64}`;
  }

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: folder || "pharmacy",
    public_id: publicId,
    overwrite: true,
  });

  return result.secure_url;
}

/**
 * Delete an asset from Cloudinary by URL.
 * Extracts public_id from the Cloudinary URL.
 */
export async function deleteFromCloudinary(imageUrl: string): Promise<void> {
  if (!imageUrl || !imageUrl.includes("cloudinary.com")) return;

  try {
    // Extract public_id from URL: .../upload/v1234567890/folder/id.jpg -> folder/id
    const publicIdMatch = imageUrl.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp|avif)(\?.*)?$/i);
    if (publicIdMatch) {
      const publicId = publicIdMatch[1];
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
  }
}
