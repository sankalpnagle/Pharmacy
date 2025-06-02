import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { z } from "zod";

interface ProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  subCategory: string;
  availability: "IN_STOCK" | "OUT_OF_STOCK";
  requiresPrescription: boolean;
  details: string;
  medicineCode: string;
  weight: number;
}

interface ExcelRow {
  "Product Name (Required)": string;
  Description: string;
  "Price (Required)": string;
  "Category Name (Required) - Will be created if not exists": string;
  "Subcategory Name (Required) - Will be created if not exists": string;
  "Availability (IN_STOCK/OUT_OF_STOCK)": string;
  "Requires Prescription (true/false)": string;
  Details: string;
  "Medicine Code (Required)": string;
  "Weight (Required)": string;
}

interface ProductResult {
  status: "created" | "reactivated" | "skipped";
  reason?: string;
  product: any;
}

// Helper function to validate and transform Excel data
function transformExcelData(row: ExcelRow, rowNumber: number): ProductData {
  try {
    const productData: ProductData = {
      name: row["Product Name (Required)"]?.toString().trim(),
      description: row["Description"]?.toString().trim() || "",
      price: parseFloat(row["Price (Required)"]),
      category: row["Category Name (Required) - Will be created if not exists"]
        ?.toString()
        .trim(),
      subCategory: row[
        "Subcategory Name (Required) - Will be created if not exists"
      ]
        ?.toString()
        .trim(),
      availability:
        row["Availability (IN_STOCK/OUT_OF_STOCK)"] === "OUT_OF_STOCK"
          ? "OUT_OF_STOCK"
          : "IN_STOCK",
      requiresPrescription:
        row["Requires Prescription (true/false)"]?.toString().toLowerCase() ===
        "true",
      details: row["Details"]?.toString().trim() || "",
      medicineCode: row["Medicine Code (Required)"]?.toString().trim(),
      weight: parseFloat(row["Weight (Required)"]),
    };

    // Required fields validation
    const requiredFields = [
      "name",
      "price",
      "medicineCode",
      "weight",
      "category",
      "subCategory",
    ];
    const missingFields = requiredFields.filter(
      (field) => !productData[field as keyof ProductData]
    );
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Validate numeric fields
    if (isNaN(productData.price) || productData.price < 0) {
      throw new Error("Price must be a positive number");
    }
    if (isNaN(productData.weight) || productData.weight < 0) {
      throw new Error("Weight must be a positive number");
    }

    return productData;
  } catch (error) {
    throw new Error(
      `Row ${rowNumber}: Invalid data format - ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Helper function to handle category creation
async function handleCategory(
  categoryName: string,
  parentId: string | null = null
) {
  try {
    // First try to find existing category
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: categoryName,
        parentId: parentId,
      },
    });

    if (existingCategory) {
      return existingCategory;
    }

    // If category doesn't exist, create it
    return await prisma.category.create({
      data: {
        name: categoryName,
        parentId: parentId,
      },
    });
  } catch (error) {
    console.error(`Error handling category ${categoryName}:`, error);
    throw error;
  }
}

// Helper function to handle product creation/update
async function handleProduct(product: ProductData): Promise<ProductResult> {
  try {
    // Check if product with same medicineCode exists
    const existingProduct = await prisma.product.findFirst({
      where: { medicineCode: product.medicineCode },
    });

    // Handle category and subcategory
    const parentCategory = await handleCategory(product.category);
    const subCategory = await handleCategory(
      product.subCategory,
      parentCategory.id
    );

    const {
      category: categoryName,
      subCategory: subCategoryName,
      ...productData
    } = product;

    if (existingProduct) {
      // If product exists and is active, skip it
      if (
        existingProduct.availability === "IN_STOCK" &&
        !existingProduct.deletedAt
      ) {
        return {
          status: "skipped",
          reason: "A product with the same Product Id already exists",
          product: existingProduct,
        };
      }

      // If product exists but is deleted, reactivate it
      if (
        existingProduct.availability === "OUT_OF_STOCK" &&
        existingProduct.deletedAt
      ) {
        const updatedProduct = await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            weight: productData.weight,
            medicineCode: productData.medicineCode,
            requiresPrescription: productData.requiresPrescription,
            details: productData.details,
            categoryId: subCategory.id,
            availability: "IN_STOCK",
            deletedAt: null,
          },
        });
        return { status: "reactivated", product: updatedProduct };
      }
    }

    // If no existing product or it's not in a state we can handle, create new
    const newProduct = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        weight: productData.weight,
        medicineCode: productData.medicineCode,
        requiresPrescription: productData.requiresPrescription,
        details: productData.details,
        categoryId: subCategory.id,
        availability: "IN_STOCK",
      },
    });
    return { status: "created", product: newProduct };
  } catch (error) {
    console.error(`Error handling product ${product.name}:`, error);
    throw error;
  }
}

// Update the results interface to ensure type safety
interface SkippedProduct {
  name: string;
  medicineCode: string;
  reason: string;
}

// Update the results object type
const results = {
  created: [] as any[],
  reactivated: [] as any[],
  skipped: [] as SkippedProduct[],
  errors: [] as Array<{ productName: string; error: string }>,
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "PHARMACY_STAFF") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
      raw: false,
    });

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      try {
        const productData = transformExcelData(row, i + 2);
        const result = await handleProduct(productData);

        switch (result.status) {
          case "created":
            results.created.push(result.product);
            break;
          case "reactivated":
            results.reactivated.push(result.product);
            break;
          case "skipped":
            results.skipped.push({
              name: productData.name,
              medicineCode: productData.medicineCode,
              reason: result.reason || "No reason provided",
            });
            break;
        }
      } catch (error: unknown) {
        console.error(`Error processing row:`, row, error);
        results.errors.push({
          productName: row["Product Name (Required)"] || "Unknown Product",
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${jsonData.length} products`,
      details: {
        created: results.created.length,
        reactivated: results.reactivated.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
      products: {
        created: results.created,
        reactivated: results.reactivated,
      },
      skippedProducts: results.skipped,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error: unknown) {
    console.error("Error processing bulk upload:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process bulk upload",
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
