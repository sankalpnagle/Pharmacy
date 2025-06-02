"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { DoctorSchema, LoginSchema, UserSchema } from "@/schemas";
import { useModal } from "@/hooks/useModal";
import { editProfile, getUserAddressByUserId } from "@/services/user";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { triggerRefetch } from "@/redux/slices/refetchSlice";
import toast from "react-hot-toast";
import { t } from "@/utils/translate";

export const UserSchema = z.object({
  name: z
    .string()
    .min(2, { message: t("name_must_be_at_least_2_characters_long") }),
  contactNo: z
    .string()
    .min(10, { message: t("contact_number_must_be_at_least_10_digits") })
    .regex(/^[0-9+ ]+$/, { message: t("invalid_contact_number_format") }),
});

const EditProfileModal = () => {
  const [view, setView] = useState<"doctor" | "user">("user");
  const { activeModal, openModal, closeModal } = useModal();
  const [userAddress, setUserAddress] = useState("");
  const session = useSession();
  const user = session.data?.user;
  const dispatch = useDispatch();

  const selectedSchema = view === "user" ? UserSchema : UserSchema;
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(selectedSchema),
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userRes = await getUserAddressByUserId();
        const user = userRes?.data?.user;
        setUserAddress(userRes?.data);
        if (user) {
          reset({
            name: user?.name || "",
            contactNo: user?.phone || "",
          });
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchUser();
  }, [reset]);

  const onSubmit = async (data: any) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("contactNo", data.contactNo);
    formData.append("role", user?.role);
    const res = await editProfile(formData);
    console.log("Submitted Data:", data);
    toast.success("Profile Updated Successfully");
    dispatch(triggerRefetch());
    closeModal();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 px-4 w-full">
      {view == "user" ? (
        <div>
          <div className="grid grid-cols-2 gap-x-5 space-y-5">
            <div className="space-y-2 sm:col-span-1 col-span-2 w-full text-[#10847E]">
              <label className="block text-sm">{t("name")}</label>
              <Input
                type="text"
                {...register("name")}
                placeholder={t("ex._john_doe")}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-1 col-span-2 w-full text-[#10847E]">
              <label className="block text-sm">{t("contact_no")}</label>
              <Input
                type="tel"
                {...register("contactNo")}
                placeholder={t("ex._1234567890")}
              />
              {errors.contactNo && (
                <p className="text-red-500 text-sm">
                  {errors.contactNo.message}
                </p>
              )}
            </div>
          </div>

          {/* <div className="grid sm:grid-cols-2  gap-x-5 mt-2">
          <div className="space-y-2 text-[#10847E]">
            <label className="block text-sm">Password</label>
            <Input
              type="password"
              {...register("password")}
              placeholder="Ex. #joe@123"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="space-y-2 text-[#10847E]">
            <label className="block text-sm">Confirm Password</label>
            <Input
              type="password"
              {...register("password")}
              placeholder="Ex. #joe@123"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">
                {errors.password.message}
              </p>
            )}
          </div>
        </div> */}
        </div>
      ) : (
        <div>
          <div className="sm:grid sm:grid-cols-2 gap-x-5">
            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">{t("name")}</label>
              <Input
                type="text"
                {...register("name")}
                placeholder={t("ex._john_doe")}
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
                placeholder={t("ex._1234567890")}
              />
              {errors.contactNo && (
                <p className="text-red-500 text-sm">
                  {errors.contactNo.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2  gap-x-5 mt-2">
            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">{t("speciality")}</label>
              <Input type="text" placeholder={t("internal_medicine")} />
            </div>
            <div className="space-y-2 text-[#10847E]">
              <label className="block text-sm">{t("group")}</label>
              <Input type="text" placeholder={t("cardiology_department")} />
            </div>
          </div>
          <div className="space-y-2 mt-2 text-[#10847E]">
            <label className="block text-sm">{t("organisation_name")}</label>
            <Input type="text" placeholder={t("example_organization")} />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="bg-[#10847E] mt-6 flex justify-center text-white mx-auto w-[200px] rounded-full"
      >
        {t("update")}
      </Button>
    </form>
  );
};

export default EditProfileModal;
