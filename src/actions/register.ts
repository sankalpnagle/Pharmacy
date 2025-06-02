"use server";

import bcrypt from "bcryptjs";
// import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { prisma } from "@/lib/prisma";
import { UserSchema } from "@/schemas";
import { uploadToS3 } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";
import { generateVerificationToken } from "@/lib/token";
import { sendVerificationEmail } from "./verify-mail";

async function verifyRecaptcha(token: string) {
  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
      {
        method: "POST",
      }
    );
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}

export const register = async (formData: FormData) => {
  // Verify reCAPTCHA first
  const recaptchaToken = formData.get("recaptchaToken") as string;
  if (!recaptchaToken) {
    return { error: "reCAPTCHA verification required" };
  }

  const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
  if (!isValidRecaptcha) {
    return { error: "reCAPTCHA verification failed" };
  }

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

  const verificationToken = await generateVerificationToken(email);

  await sendVerificationEmail(email, verificationToken?.token);

  return { success: "Email Verification was sent" };
};
