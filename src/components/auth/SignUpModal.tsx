"use client";
import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DoctorSchema, LoginSchema, UserSchema } from "@/schemas";
import { useModal } from "@/hooks/useModal";
import { register as SignUp } from "@/actions/register";
import { z } from "zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { createUser } from "@/services/auth";
import { LuEye, LuEyeClosed } from "react-icons/lu";
import ReCAPTCHA from "react-google-recaptcha";
import { t } from "@/utils/translate";

// Add styles for mobile-friendly reCAPTCHA
const recaptchaStyles = `
  .g-recaptcha {
    transform: scale(1);
    transform-origin: 0 0;
  }
  
  @media (max-width: 768px) {
    .g-recaptcha {
      transform: scale(1.1);
      transform-origin: 0 0;
    }
    
    .g-recaptcha iframe {
      width: 100% !important;
      height: auto !important;
      min-height: 78px !important;
    }
    
    .g-recaptcha > div {
      width: 100% !important;
      height: auto !important;
    }
  }
  
  /* Ensure touch-friendly interaction */
  .g-recaptcha * {
    touch-action: manipulation;
  }
`;

// Define base form data type (without confirmPassword for backend)
type BaseFormData = {
  name: string;
  email: string;
  password: string;
  contactNo: string;
  role: "USER" | "DOCTOR";
  image?: File;
};

// Define doctor-specific form data type
type DoctorFormData = BaseFormData & {
  licenseNumber: string;
  speciality: string;
  group?: string;
  organisationName: string;
};

// Frontend form data type (includes confirmPassword)
type FrontendFormData = (BaseFormData | DoctorFormData) & {
  confirmPassword: string;
};

// Frontend validation schema
const FrontendUserSchema = UserSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const FrontendDoctorSchema = DoctorSchema.extend({
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const SignUpModal = () => {
  const [view, setView] = useState<"DOCTOR" | "USER">("USER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showUserConfirmPassword, setShowUserConfirmPassword] = useState(false);
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);
  const [showDoctorConfirmPassword, setShowDoctorConfirmPassword] =
    useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { activeModal, openModal, closeModal } = useModal();
  const router = useRouter();

  const selectedSchema =
    view === "USER" ? FrontendUserSchema : FrontendDoctorSchema;
  type FormData = z.infer<typeof selectedSchema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(selectedSchema),
    defaultValues: {
      role: view,
    } as FormData,
  });

  // Watch password fields for real-time validation
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  // Reset form when view changes
  useEffect(() => {
    reset({
      role: view,
    } as FormData);
  }, [view, reset]);

  const onSubmit = async (data: FormData) => {
    if (!recaptchaToken) {
      toast.error("Please complete the reCAPTCHA verification");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();

      // Common fields (excluding confirmPassword)
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("contactNo", data.contactNo);
      formData.append("role", data.role);
      formData.append("recaptchaToken", recaptchaToken);

      // Doctor-specific fields
      if (view === "DOCTOR") {
        const doctorData = data as z.infer<typeof FrontendDoctorSchema>;
        formData.append("licenseNumber", doctorData.licenseNumber);
        formData.append("speciality", doctorData.speciality);
        formData.append("group", doctorData.group || "");
        formData.append("organisationName", doctorData.organisationName);
      }

      if (data.image) {
        formData.append("image", data.image);
      }

      const response = await createUser(formData);
      console.log(response?.data);

      if (response.status === 201) {
        toast.success("User Created Successfully!");
        openModal("signin");
        closeModal();
        // Reset reCAPTCHA
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "An unexpected error occurred";
      toast.error(errorMessage);
      // Reset reCAPTCHA on error
      recaptchaRef.current?.reset();
      setRecaptchaToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 px-4 ">
      {/* Add mobile-friendly reCAPTCHA styles */}
      <style dangerouslySetInnerHTML={{ __html: recaptchaStyles }} />

      {/* User / Doctor Toggle Buttons */}
      <div className="flex gap-x-2">
        <Button
          type="button"
          onClick={() => setView("USER")}
          variant="outline"
          className={`border-[#10847E] h-8 rounded-xl w-20 border-2 text-[#10847E] ${
            view === "USER" ? "bg-[#10847E1A]" : ""
          }`}
        >
          {t("user")}
        </Button>
        <Button
          type="button"
          onClick={() => setView("DOCTOR")}
          variant="outline"
          className={`border-[#10847E] h-8 rounded-xl w-20 border-2 text-[#10847E] ${
            view === "DOCTOR" ? "bg-[#10847E1A]" : ""
          }`}
        >
          {t("doctor")}
        </Button>
      </div>

      {/* User Form Fields */}
      {view === "USER" && (
        <div>
          <div className="grid sm:grid-cols-2 gap-x-5">
            {/* <div className="space-y-2 col-span-2 mb-3 text-[#10847E]">
              <label className="block text-sm">Image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setValue("image", file); // Set the file using React Hook Form
                  }
                }}
              />
              {errors.image && (
                <p className="text-red-500 text-sm">{errors.image.message}</p>
              )}
            </div> */}

            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">{t("name")}</label>
              <Input
                type="text"
                {...register("name")}
                placeholder={t("enter_your_name")}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">{t("email")}</label>
              <Input
                type="email"
                {...register("email")}
                placeholder={t("enter_your_email")}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-5 mt-2">
            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">{t("password")}</label>
              <div className="relative">
                <Input
                  type={showUserPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder={t("enter_your_password")}
                />
                <button
                  type="button"
                  onClick={() => setShowUserPassword(!showUserPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showUserPassword ? (
                    <LuEye className="h-4 w-4" />
                  ) : (
                    <LuEyeClosed className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message as string}
                </p>
              )}
            </div>
            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">{t("confirm_password")}</label>
              <div className="relative">
                <Input
                  type={showUserConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder={t("enter_your_confirm_password")}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowUserConfirmPassword(!showUserConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showUserConfirmPassword ? (
                    <LuEye className="h-4 w-4" />
                  ) : (
                    <LuEyeClosed className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-sm">
                  {t("passwords_do_not_match")}
                </p>
              )}
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">
                  {errors.confirmPassword.message as string}
                </p>
              )}
            </div>
            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">{t("contact_no")}</label>
              <Input
                type="tel"
                {...register("contactNo")}
                placeholder={t("enter_your_contact_no")}
              />
              {errors.contactNo && (
                <p className="text-red-500 text-sm">
                  {errors.contactNo.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Doctor Form Fields */}
      {view === "DOCTOR" && (
        <div>
          <div className="grid sm:grid-cols-3 gap-x-7 mt-2.5">
            {/* <div className="space-y-2 col-span-3 mb-3 text-[#10847E]">
              <label className="block text-sm">Image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setValue("image", file); // Set the file using React Hook Form
                  }
                }}
              />
              {errors.image && (
                <p className="text-red-500 text-sm">{errors.image.message}</p>
              )}
            </div> */}
            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">
                {t("doctor_license_number")}
              </label>
              <Input
                type="text"
                {...register("licenseNumber" as any)}
                placeholder={t("enter_your_license_number")}
              />
              {(errors as any).licenseNumber && (
                <p className="text-red-500 text-sm">
                  {(errors as any).licenseNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">{t("name")}</label>
              <Input
                type="text"
                {...register("name")}
                placeholder={t("enter_your_name")}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">{t("contact_no")}</label>
              <Input
                type="tel"
                {...register("contactNo")}
                placeholder={t("enter_your_contact_no")}
              />
              {errors.contactNo && (
                <p className="text-red-500 text-sm">
                  {errors.contactNo.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-7 mt-2.5">
            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">{t("email")}</label>
              <Input
                type="email"
                {...register("email")}
                placeholder={t("enter_your_email")}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">{t("password")}</label>
              <div className="relative">
                <Input
                  type={showDoctorPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder={t("enter_your_password")}
                />
                <button
                  type="button"
                  onClick={() => setShowDoctorPassword(!showDoctorPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showDoctorPassword ? (
                    <LuEye className="h-4 w-4" />
                  ) : (
                    <LuEyeClosed className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message as string}
                </p>
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-7 mt-2.5">
            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">{t("confirm_password")}</label>
              <div className="relative">
                <Input
                  type={showDoctorConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder={t("enter_your_confirm_password")}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowDoctorConfirmPassword(!showDoctorConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showDoctorConfirmPassword ? (
                    <LuEye className="h-4 w-4" />
                  ) : (
                    <LuEyeClosed className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-sm">
                  {t("passwords_do_not_match")}
                </p>
              )}
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm">
                  {errors.confirmPassword.message as string}
                </p>
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-7 mt-2.5">
            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">{t("speciality")}</label>
              <Input
                type="text"
                {...register("speciality" as any)}
                placeholder={t("enter_your_speciality")}
              />
              {(errors as any).speciality && (
                <p className="text-red-500 text-sm">
                  {(errors as any).speciality.message}
                </p>
              )}
            </div>

            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">{t("group")}</label>
              <Input
                type="text"
                {...register("group" as any)}
                placeholder={t("enter_your_group")}
              />
              {(errors as any).group && (
                <p className="text-red-500 text-sm">
                  {(errors as any).group.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 text-[#10847E] mt-2.5">
            <label className="block text-sm">{t("organisation_name")}</label>
            <Input
              type="text"
              {...register("organisationName" as any)}
              placeholder={t("enter_your_organisation_name")}
            />
            {(errors as any).organisationName && (
              <p className="text-red-500 text-sm">
                {(errors as any).organisationName.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Add reCAPTCHA before the submit button */}
      <div className="flex justify-center my-4">
        <div className="transform scale-110 sm:scale-100 md:scale-100 lg:scale-100 xl:scale-100 min-w-[320px] max-w-[450px] touch-manipulation">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
            onChange={handleRecaptchaChange}
            theme="light"
            size="normal"
            data-theme="light"
            data-size="normal"
            data-badge="inline"
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="bg-[#10847E] mt-6 flex justify-center text-white mx-auto w-[200px] rounded-full"
        disabled={isSubmitting || !recaptchaToken}
      >
        {isSubmitting ? t("signing_up") : t("sign_up")}
      </Button>

      {/* Switch to Sign In */}
      <div className="w-fit mx-auto text-sm">
        <h6 className="font-medium">
          {t("already_have_an_account")}
          <button
            type="button"
            onClick={() => openModal("signin")}
            className="text-primary ml-1"
            disabled={isSubmitting}
          >
            {t("sign_in")}
          </button>
        </h6>
      </div>
    </form>
  );
};

export default SignUpModal;
