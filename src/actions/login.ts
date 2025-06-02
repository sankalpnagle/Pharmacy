"use server";

import { signIn } from "@/lib/auth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { LoginSchema } from "@/schemas";
import { AuthError } from "next-auth";
import * as z from "zod";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  // Validate input fields
  const validateFields = LoginSchema.safeParse(values);
  if (!validateFields.success) {
    return { error: "Invalid field input!" };
  }

  const { email, password } = validateFields.data;

  try {
    // Authenticate user
    const response = await signIn("credentials", {
      email,
      password,
      redirect: false, // Prevent automatic redirection
    });

    console.log("Sign-in Response:", response);

    if (response?.error) {
      return { error: "Invalid credentials!" };
    }

    return { success: true, redirectUrl: DEFAULT_LOGIN_REDIRECT };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password!" };
        default:
          return { error: "Please confirm your email address" };
      }
    }
    console.error("Unexpected Login Error:", error);
    return { error: "Something went wrong! Please try again." };
  }
};
