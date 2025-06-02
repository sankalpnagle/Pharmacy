"use server";

import { prisma } from "@/lib/prisma";
import { CategorySchema } from "@/schemas";
import * as z from "zod";

// Create a new category
export const createCategory = async (
  values: z.infer<typeof CategorySchema>
) => {
  const validateFields = CategorySchema.safeParse(values);
  if (!validateFields.success) {
    return { error: "Invalid category data!" };
  }

  try {
    const { name, parentId } = validateFields.data;

    const category = await prisma.category.create({
      data: {
        name,
        parentId,
      },
    });

    return { success: true, category };
  } catch (error) {
    console.error("Create Category Error:", error);
    return { error: "Failed to create category!" };
  }
};

// Get all categories
export const getCategories = async () => {
  try {
    const categories = await prisma.category.findMany({
      where: {
        parentId: null,
      },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true,
                products: {
                  where: {
                    deletedAt: null,
                  },
                  select: {
                    imageUrl: true,
                  },
                },
              },
            },
            products: {
              where: {
                deletedAt: null,
              },
              select: {
                imageUrl: true,
              },
            },
          },
        },
        products: {
          where: {
            deletedAt: null,
          },
          select: {
            imageUrl: true,
          },
        },
      },
    });

    const getFirstAvailableImage = (
      products: { imageUrl: string | null }[]
    ) => {
      return products.find((product) => product.imageUrl)?.imageUrl || null;
    };

    const transformedCategories = categories.map((category) => {
      // Get image from children's products first
      const childrenImages = category.children
        .map((child) => getFirstAvailableImage(child.products))
        .filter(Boolean);

      // If no children images, try parent's products
      const parentImage =
        childrenImages[0] || getFirstAvailableImage(category.products);

      // Transform children with their images
      const transformedChildren = category.children.map((child) => {
        const childImage = getFirstAvailableImage(child.products);

        // Transform grandchildren with their images
        const transformedGrandChildren = child.children.map((grandChild) => {
          const grandChildImage = getFirstAvailableImage(grandChild.products);
          return {
            ...grandChild,
            imageUrl: grandChildImage,
          };
        });

        return {
          ...child,
          imageUrl: childImage,
          children: transformedGrandChildren,
        };
      });

      return {
        ...category,
        imageUrl: parentImage,
        children: transformedChildren,
      };
    });

    return { success: true, categories: transformedCategories };
  } catch (error) {
    console.error("Get Categories Error:", error);
    return { error: "Failed to fetch categories!" };
  }
};

// Get category by ID
export const getCategoryById = async (id: string) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true, // Extend for deeper levels if needed
              },
            },
          },
        },
      },
    });

    if (!category) return { error: "Category not found!" };

    return { success: true, category };
  } catch (error) {
    console.error("Get Category Error:", error);
    return { error: "Failed to fetch category!" };
  }
};

// Update category
export const updateCategory = async (
  id: string,
  values: z.infer<typeof CategorySchema>
) => {
  const validateFields = CategorySchema.safeParse(values);
  if (!validateFields.success) {
    return { error: "Invalid category data!" };
  }

  try {
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: validateFields.data,
    });

    return { success: true, updatedCategory };
  } catch (error) {
    console.error("Update Category Error:", error);
    return { error: "Failed to update category!" };
  }
};

// Delete category
export const deleteCategory = async (id: string) => {
  try {
    await prisma.category.delete({
      where: { id },
    });

    return { success: true, message: "Category deleted successfully!" };
  } catch (error) {
    console.error("Delete Category Error:", error);
    return { error: "Failed to delete category!" };
  }
};
