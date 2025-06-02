"use server";

import { prisma } from "@/lib/prisma";
import { ProductSchema } from "@/schemas";
import { Prisma } from "@prisma/client";
import * as z from "zod";
type ProductFilter = {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: "IN_STOCK" | "OUT_OF_STOCK";
  staffId?: string;
};
// ✅ Create Product (Only Pharmacy Staff Can Create)
export const createProduct = async (
  userId: string,
  values: z.infer<typeof ProductSchema>
) => {
  const validateFields = ProductSchema.safeParse(values);
  if (!validateFields.success) {
    return {
      error: "Invalid product data!",
      details: validateFields.error.flatten(),
    };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { error: "User not found!" };
    }

    // Check if there's already an active product with the same medicineCode
    const existingActiveProduct = await prisma.product.findFirst({
      where: {
        medicineCode: values.medicineCode,
        availability: "IN_STOCK",
        deletedAt: null,
      },
    });

    if (existingActiveProduct) {
      return {
        error: "A product with the same Product Id already exists.",
        details: "A product with the same medicineCode is already active.",
      };
    }

    // Check if there's a deleted product with the same medicineCode
    const existingDeletedProduct = await prisma.product.findFirst({
      where: {
        medicineCode: values.medicineCode,
        availability: "OUT_OF_STOCK",
        deletedAt: { not: null },
      },
    });

    if (existingDeletedProduct) {
      // Extract data from validated fields
      const { subCategory, categoryId, imageUrl, ...productData } =
        validateFields.data;
      const finalCategoryId = subCategory || categoryId;
      const imageUrlString =
        typeof imageUrl === "string" ? imageUrl : undefined;

      // Reactivate the existing product
      const updatedProduct = await prisma.product.update({
        where: { id: existingDeletedProduct.id },
        data: {
          ...productData,
          categoryId: finalCategoryId || null,
          availability: "IN_STOCK",
          deletedAt: null,
          pharmacyStaffId: userId,
          imageUrl: imageUrlString,
        },
      });
      return { success: true, product: updatedProduct };
    }

    // Extract data from validated fields
    const { subCategory, categoryId, imageUrl, ...productData } =
      validateFields.data;

    // Use subCategory as categoryId if provided, otherwise use categoryId
    const finalCategoryId = subCategory || categoryId;

    // Verify that the category exists
    if (finalCategoryId) {
      const category = await prisma.category.findUnique({
        where: { id: finalCategoryId },
      });
      if (!category) {
        return { error: "Invalid category ID" };
      }
    }

    // Convert imageUrl to string if it's a File object
    const imageUrlString = typeof imageUrl === "string" ? imageUrl : undefined;

    const product = await prisma.product.create({
      data: {
        ...productData,
        categoryId: finalCategoryId || null,
        pharmacyStaffId: userId,
        imageUrl: imageUrlString,
      },
    });

    return { success: true, product };
  } catch (error) {
    console.error("Create Product Error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          error: "A product with the same Product Id already exists.",
          details: `A product with the same ${error.meta?.target} already exists.`,
        };
      }
    }
    return {
      error: "Unexpected error while creating product",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
// ✅ Get All Products (optionally filtered by categoryId)
export const getProducts = async (filters: ProductFilter = {}) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null, // Only show non-deleted products
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.availability && { availability: filters.availability }),
        ...(filters.staffId && { pharmacyStaffId: filters.staffId }),
        ...(filters.minPrice || filters.maxPrice
          ? {
              price: {
                ...(filters.minPrice && { gte: filters.minPrice }),
                ...(filters.maxPrice && { lte: filters.maxPrice }),
              },
            }
          : {}),
      },
      include: {
        category: {
          include: {
            parent: true,
          },
        },
        pharmacyStaff: { select: { name: true } },
      },
    });

    return { success: true, products };
  } catch (error) {
    console.error("Fetch Products Error:", error);
    return { error: "Failed to fetch products!" };
  }
};

// ✅ Get Product by ID
export const getProductById = async (productId: string) => {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
        deletedAt: null, // Only show non-deleted products
      },
      include: {
        category: {
          include: {
            parent: true,
          },
        },
        pharmacyStaff: { select: { name: true } },
      },
    });

    if (!product) return { error: "Product not found!" };

    return { success: true, product };
  } catch (error) {
    console.error("Get Product Error:", error);
    return { error: "Failed to fetch product!" };
  }
};

export const updateProduct = async (
  userId: string,
  productId: string,
  values: z.infer<typeof ProductSchema>
) => {
  const validateFields = ProductSchema.safeParse(values);
  if (!validateFields.success) {
    const fieldErrors = validateFields.error.flatten().fieldErrors;
    const message = Object.entries(fieldErrors)
      .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
      .join(" | ");
    return { error: "Invalid product data!", details: fieldErrors, message };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) return { error: "Product not found!" };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "PHARMACY_STAFF") {
      return { error: "Only pharmacy staff can update products!" };
    }

    // Extract and process the data
    const { subCategory, categoryId, imageUrl, ...restData } =
      validateFields.data;
    const finalCategoryId = subCategory || categoryId;
    const imageUrlString = typeof imageUrl === "string" ? imageUrl : undefined;

    // Check if name is being updated
    if (restData.name !== product.name) {
      // Use a transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx) => {
        // First delete the current product
        await tx.product.delete({
          where: { id: productId },
        });

        // Then create a new product with the updated data
        const newProduct = await tx.product.create({
          data: {
            ...restData,
            categoryId: finalCategoryId || null,
            imageUrl: imageUrlString,
            medicineCode: product.medicineCode,
            pharmacyStaffId: userId,
          },
        });

        return newProduct;
      });

      return { success: true, product: result };
    }

    // If name is not changed, update the existing product
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...restData,
        categoryId: finalCategoryId || null,
        imageUrl: imageUrlString,
      },
    });

    return { success: true, product: updatedProduct };
  } catch (error) {
    console.error("Update Product Error:", error);
    return { error: "Failed to update product!" };
  }
};

export const deleteProduct = async (userId: string, productId: string) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return { error: "Product not found!" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "PHARMACY_STAFF") {
      return { error: "Only pharmacy staff can delete products!" };
    }

    // Permanently delete the product
    await prisma.product.delete({
      where: { id: productId },
    });

    return {
      success: true,
      message: "Product permanently deleted successfully!",
    };
  } catch (error) {
    console.error("Delete Product Error:", error);
    return { error: "Failed to delete product!" };
  }
};
