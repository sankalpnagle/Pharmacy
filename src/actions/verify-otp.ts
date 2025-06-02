"use server";

import { prisma } from "@/lib/prisma";
import { getUserByEmail } from "@/data/user";
import bcrypt from "bcryptjs";

export async function verifyOtp(email: string, otp: string) {
  try {
    const user = await getUserByEmail(email);
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      return { error: "Invalid or expired OTP" };
    }

    // Check if OTP is expired
    if (new Date() > user.resetPasswordExpires) {
      return { error: "OTP has expired" };
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, user.resetPasswordToken);
    if (!isValid) {
      return { error: "Invalid OTP" };
    }

    return { success: "OTP verified successfully" };
  } catch (error) {
    console.error("Verify OTP error:", error);
    return { error: "Something went wrong" };
  }
}
