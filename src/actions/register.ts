"use server";

import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/data/user";
import { prisma } from "@/lib/prisma";
import { UserSchema } from "@/schemas";

export const register = async (formData: FormData) => {
  const userData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    contactNo: formData.get("contactNo") as string,
    role: formData.get("role") as string,
  };

  const validateFields = UserSchema.safeParse(userData);
  if (!validateFields.success) {
    const errors = validateFields.error.flatten().fieldErrors;
    return { error: "Validation error", details: errors };
  }

  const { email, password, name, contactNo, role } = validateFields.data;

  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return { error: "Email already in use!" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      phone: contactNo,
      role,
      password: hashedPassword,
    },
  });

  return { success: "User registered successfully" };
};
