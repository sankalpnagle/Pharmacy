"use server";
export const runtime = "nodejs";

import { prisma } from "@/lib/prisma";
import { getUserByEmail } from "@/data/user";
import { sendEmail } from "@/lib/ses";
import bcrypt from "bcryptjs";

// Helper function to format phone number to E.164 format
function formatPhoneNumber(phone: string): string | null {
  try {
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, "");

    

    // Indian mobile numbers are 10 digits
    // If starts with 0, remove it
    let nationalNumber = digits;
    if (nationalNumber.startsWith("0")) {
      nationalNumber = nationalNumber.slice(1);
    }

    // Check if it's a valid Indian mobile number (10 digits)
    if (nationalNumber.length !== 10) {
      console.error("Invalid phone number length:", nationalNumber.length);
      return null;
    }

    return `${nationalNumber}`;
  } catch (error) {
    console.error("Error formatting phone number:", error);
    return null;
  }
}

export async function forgotPassword(email: string) {
  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return { error: "User not found" };
    }

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000)
      .toString()
      .padStart(4, "0");
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Store OTP in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedOtp,
        resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });

    // Send OTP via email
    await sendEmail({
      to: email,
      subject: "Password Reset OTP",
      bodyHtml: `
        <p>Hi ${user.name},</p>
        <p>Your password reset OTP is: <b>${otp}</b></p>
        <p>This OTP will expire in 15 minutes.</p>
        <p>If you did not request this password reset, please ignore this email.</p>
      `,
    });

    // Send OTP via SMS if phone number exists
    if (user.phone) {
      try {
        const formattedPhone = formatPhoneNumber(user.phone);
        if (!formattedPhone) {
          console.error("Invalid phone number format for user:", user.id);
          return { success: "OTP sent via email" };
        }


        return { success: "OTP sent via email and SMS" };
      } catch (smsError) {
        console.error("SMS sending failed:", smsError);
        return { success: "OTP sent via email" };
      }
    }

    return { success: "OTP sent via email" };
  } catch (error) {
    console.error("Forgot password error:", error);
    return { error: "Something went wrong" };
  }
}

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
