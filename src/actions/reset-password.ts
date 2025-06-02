"use server";

import { prisma } from "@/lib/prisma";
import { getUserByEmail } from "@/data/user";
import bcrypt from "bcryptjs";

export async function resetPassword(email: string, newPassword: string) {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return { error: "User not found" };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { success: "Password reset successfully" };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error: "Something went wrong" };
  }
}
