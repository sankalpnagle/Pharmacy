"use server";

import { prisma } from "@/lib/prisma";
import { AddressSchema } from "@/schemas";
import * as z from "zod";
import { v4 as uuidv4 } from "uuid";
import { UserSchema } from "@/schemas";

// ✅ User Adds Address
export const addUserAddress = async (
  userId: string,
  addressData: z.infer<typeof AddressSchema>
) => {
  // Validate address input
  const validateAddress = AddressSchema.safeParse(addressData);

  if (!validateAddress.success) {
    return { error: "Invalid address data!" };
  }

  try {
    // Ensure user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { deliveryAddress: true }, // Include address to check
    });
    if (!user) {
      return { error: "User not found!" };
    }
    // If user already has an address, block creation
    if (user.deliveryAddress) {
      return {
        error: "You already added an address. Please update it instead.",
      };
    }
    // Create address for user
    const address = await prisma.deliveryAddress.create({
      data: {
        ...validateAddress.data,
        userId, // Link address to the user
      },
    });

    return { success: true, address };
  } catch (error) {
    console.error("Add Address Error:", error);
    return { error: "Failed to add address!" };
  }
};
export const getUserAddress = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { deliveryAddress: true },
    });
    if (!user) return { error: "User not found!" };
    const { password, ...safeUser } = user;

    return { success: true, user: safeUser };
  } catch (error) {
    console.error("Get User Address Error:", error);
    return { error: "Failed to fetch address!" };
  }
};

export const updateUserAddress = async (
  userId: string,
  addressData: z.infer<typeof AddressSchema>
) => {
  const validate = AddressSchema.safeParse(addressData);
  if (!validate.success) return { error: "Invalid address data!" };

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { error: "User not found!" };

    const existing = await prisma.deliveryAddress.findUnique({
      where: { userId },
    });

    const address = existing
      ? await prisma.deliveryAddress.update({
          where: { userId },
          data: validate.data,
        })
      : await prisma.deliveryAddress.create({
          data: {
            ...validate.data,
            userId,
          },
        });

    return { success: true, address };
  } catch (error) {
    console.error("Update Address Error:", error);
    return { error: "Failed to update address!" };
  }
};


export const updateUserInfo = async (formData: FormData, id: string) => {
  const userId = id;
  const RoleEnum = z.enum(["USER", "DOCTOR", "PHARMACY_STAFF", "ADMIN"]);
  const UserSchemaForUpdateInfo = z.object({
    name: z.string().min(1, "Name is required"),
    contactNo: z.string().min(10, "Contact number is required"),
    role: RoleEnum,
  });

  const updatedData = {
    name: formData.get("name") as string,
    contactNo: formData.get("contactNo") as string,
    role: formData.get("role") as string,
  };

  const validateFields = UserSchemaForUpdateInfo.safeParse(updatedData);
  if (!validateFields.success) {
    const errors = validateFields.error.flatten().fieldErrors;
    return { error: "Validation error", details: errors };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: updatedData.name,
        phone: updatedData.contactNo,
        role: updatedData.role,
      },
    });
    return { success: "User info updated" };
  } catch (error) {
    console.error("Update User Info Error:", error);
    return { error: "Failed to update user info!" };
  }
};
