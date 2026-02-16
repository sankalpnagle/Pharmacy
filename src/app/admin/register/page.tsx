"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserSchema } from "@/schemas";
import { z } from "zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createUser } from "@/services/auth";
import { LuEye, LuEyeClosed } from "react-icons/lu";

// Frontend validation schema
const AdminRegisterSchema = UserSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof AdminRegisterSchema>;

const AdminRegisterPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(AdminRegisterSchema),
    defaultValues: {
      role: "ADMIN",
    },
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();

      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("contactNo", data.contactNo);
      formData.append("role", "PHARMACY_STAFF");

      const response = await createUser(formData);

      if (response.status === 201) {
        toast.success("PHARMACY STAFF account created successfully!");
        router.push("/");
        reset();
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "An unexpected error occurred";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create PHARMACY STAFF Account
          </h2>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                type="text"
                {...register("name")}
                placeholder="Enter name"
                className="w-full"
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                type="email"
                {...register("email")}
                placeholder="Enter email"
                className="w-full"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Enter password"
                  className="w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <LuEye className="h-4 w-4" />
                  ) : (
                    <LuEyeClosed className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="Confirm password"
                  className="w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <LuEye className="h-4 w-4" />
                  ) : (
                    <LuEyeClosed className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Contact Number
              </label>
              <Input
                type="tel"
                {...register("contactNo")}
                placeholder="Enter contact number"
                className="w-full"
              />
              {errors.contactNo && (
                <p className="text-red-500 text-sm">
                  {errors.contactNo.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#10847E] hover:bg-[#0d6e69] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#10847E]"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
