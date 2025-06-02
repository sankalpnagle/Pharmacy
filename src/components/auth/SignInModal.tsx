"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation"; // Import router for redirection
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoginSchema } from "@/schemas";
import { login } from "@/actions/login";
import { useModal } from "@/hooks/useModal";
import toast from "react-hot-toast";
import { LuEyeClosed } from "react-icons/lu";
import { LuEye } from "react-icons/lu";
import { t } from "@/utils/translate";

const SignInModal = () => {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null); // Store API errors
  const [showPassword, setShowPassword] = useState(false);
  const { activeModal, openModal, closeModal } = useModal();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof LoginSchema>) => {
    setServerError(null);
    const response = await login(data);
    if (response.success) {
      toast.success(t("login_successfully"));
      window.location.href = response.redirectUrl;
    } else {
      toast.error(response.error);
      console.error(response.error);
    }
    closeModal();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:w-96 px-3">
      {/* Email Field */}
      <div className="space-y-2 text-[#10847E]">
        <label className="block text-sm font-medium">{t("email")}</label>
        <Input
          type="email"
          {...register("email")}
          placeholder={t("enter_your_email")}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2 text-[#10847E]">
        <label className="block text-sm font-medium">{t("password")}</label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder={t("enter_your_password")}
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
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Forgot Password */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => openModal("forgetPassword")}
          className="text-sm font-[500] text-[#10847E] hover:underline"
        >
          {t("forgot_password?")}
        </button>
      </div>

      {/* Display Server Errors */}
      {serverError && (
        <p className="text-red-500 text-sm text-center">{serverError}</p>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="bg-[#10847E] mt-3 flex justify-center text-white mx-auto w-1/2 rounded-full"
        disabled={isSubmitting} // Disable button while submitting
      >
        {isSubmitting ? t("logging_in") : t("login")}
      </Button>

      {/* Signup Link */}
      <div className="w-fit mx-auto text-sm">
        <h6 className="font-[500]">
          {t("dont_have_an_account")}
          <button
            type="button"
            onClick={() => {
              openModal("register");
            }}
            className="text-[#10847E] ml-1.5 cursor-pointer hover:underline"
          >
            {t("signup")}
          </button>
        </h6>
      </div>
    </form>
  );
};

export default SignInModal;
