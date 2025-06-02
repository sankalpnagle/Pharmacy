"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/useModal";
import SelectorInput from "../custom_components/SelectorInput";
import {
  addAddress,
  editAddress,
  getUserAddressByUserId,
} from "@/services/user";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { triggerRefetch } from "@/redux/slices/refetchSlice";
import { useDispatch } from "react-redux";
import { t } from "@/utils/translate";

const AddressSchema = z.object({
  addressLine: z.string(),
  town: z.string(),
  municipality: z.string(),
  province: z.string(),
  country: z.string().default("Cuba"),
  manualInstructions: z.string().optional(),
});

const countryList = [{ label: t("cuba"), value: "Cuba" }];

type AddressFormValues = z.infer<typeof AddressSchema>;

const EditAddressModal = () => {
  const { closeModal } = useModal();
  const [userAddress, setUserAddress] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const [provinceList, setProvinceList] = useState<
    { label: string; value: string }[]
  >([]);
  const [municipalityList, setMunicipalityList] = useState<
    { label: string; value: string }[]
  >([]);
  const [municipalityData, setMunicipalityData] = useState<
    Record<string, string[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(AddressSchema),
    defaultValues: {
      country: "Cuba",
    },
  });

  const selectedProvince = watch("province");

  const fetchData = useCallback(async () => {
    if (!isLoading) return;

    try {
      setIsLoading(true);
      const [municipalityRes, userRes] = await Promise.all([
        fetch("/municipalities-cuba.json"),
        getUserAddressByUserId(),
      ]);

      const data = await municipalityRes.json();
      const userAddressData = userRes?.data?.user?.deliveryAddress;

      // Batch state updates
      const updates = () => {
        setMunicipalityData(data);
        setProvinceList(
          Object.keys(data).map((province) => ({
            label: province,
            value: province,
          }))
        );
        setUserAddress(userRes?.data);

        if (userAddressData) {
          // Find province for municipality if only municipality is provided
          let province = userAddressData.province;
          if (!province && userAddressData.municipality) {
            for (const [prov, municipalities] of Object.entries(data)) {
              if (municipalities.includes(userAddressData.municipality)) {
                province = prov;
                break;
              }
            }
          }

          // Set municipality list if province exists
          if (province && data[province]) {
            const munList = data[province].map((m: string) => ({
              label: m,
              value: m,
            }));
            setMunicipalityList(munList);
          }

          // Reset form with all values including province and municipality
          reset({
            addressLine: userAddressData.addressLine || "",
            town: userAddressData.town || "",
            municipality: userAddressData.municipality || "",
            province: province || "",
            country: userAddressData.country || "Cuba",
            manualInstructions: userAddressData.manualInstructions || "",
          });
        } else {
          reset({
            country: "Cuba",
          });
        }
      };

      updates();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load address data");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, reset]);

  // Single mount effect
  useEffect(() => {
    fetchData();
  }, []);

  // Optimize province change effect
  useEffect(() => {
    if (!selectedProvince || !municipalityData[selectedProvince]) return;

    const munList = municipalityData[selectedProvince].map((m: string) => ({
      label: m,
      value: m,
    }));

    setMunicipalityList(munList);

    // Only clear municipality if province changed from user's address
    if (userAddress?.user?.deliveryAddress?.province !== selectedProvince) {
      setValue("municipality", "");
    }
  }, [selectedProvince, municipalityData, setValue, userAddress]);

  // Add effect to handle initial municipality selection
  useEffect(() => {
    if (
      userAddress?.user?.deliveryAddress?.municipality &&
      userAddress?.user?.deliveryAddress?.province === selectedProvince
    ) {
      setValue("municipality", userAddress.user.deliveryAddress.municipality);
    }
  }, [selectedProvince, userAddress, setValue]);

  // Add validation before submission
  const onSubmit = async (data: AddressFormValues) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Find province for municipality if only municipality is provided
      if (!data.province && data.municipality) {
        for (const [prov, municipalities] of Object.entries(municipalityData)) {
          if (municipalities.includes(data.municipality)) {
            data.province = prov;
            break;
          }
        }
      }

      // Validate province is set
      if (!data.province) {
        toast.error("Please select a province");
        setIsSubmitting(false);
        return;
      }

      const response = userAddress?.user?.deliveryAddress
        ? await editAddress(data)
        : await addAddress(data);

      if (response?.status === 200) {
        dispatch(triggerRefetch());
        toast.success(
          userAddress?.user?.deliveryAddress
            ? "Address Updated Successfully"
            : "Address Added Successfully"
        );
        closeModal();
      }
    } catch (error) {
      console.error("Address submission error:", error);
      toast.error("Failed to save address. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2 px-4">
      <div className="flex flex-col gap-2">
        <div className="sm:flex gap-2">
          <div className="space-y-2 text-[#10847E]">
            <label className="block text-sm font-medium">
              {t("address_line")}
            </label>
            <Input
              className="sm:w-64 w-full"
              placeholder={t("ex._street")}
              {...register("addressLine")}
            />
            {errors.addressLine && (
              <p className="text-sm text-red-500">
                {errors.addressLine.message}
              </p>
            )}
          </div>
          <div className="space-y-2 text-[#10847E]">
            <label className="block text-sm font-medium">
              {t("manual_instructions")}
            </label>
            <Input
              className="sm:w-64 w-full"
              placeholder={t("ex.apt_details")}
              {...register("manualInstructions")}
            />
          </div>
        </div>

        <div className="sm:flex gap-2">
          <div className="space-y-2 text-[#10847E]">
            <label className="block text-sm font-medium">{t("province")}</label>
            <Controller
              name="province"
              control={control}
              render={({ field }) => (
                <SelectorInput
                  options={provinceList}
                  placeholder={t("select_province")}
                  className="sm:w-64 w-full"
                  value={field.value}
                  onChange={(val: string) => field.onChange(val)}
                />
              )}
            />
            {errors.province && (
              <p className="text-sm text-red-500">{errors.province.message}</p>
            )}
          </div>

          <div className="space-y-2 text-[#10847E]">
            <label className="block text-sm font-medium">
              {t("municipality")}
            </label>
            <Controller
              name="municipality"
              control={control}
              render={({ field }) => (
                <SelectorInput
                  options={municipalityList}
                  placeholder={t("select_municipality")}
                  className="sm:w-64 w-full"
                  value={field.value}
                  onChange={(val: string) => field.onChange(val)}
                />
              )}
            />
            {errors.municipality && (
              <p className="text-sm text-red-500">
                {errors.municipality.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="sm:flex gap-2">
        <div className="space-y-2 text-[#10847E]">
          <label className="block text-sm font-medium">{t("town")}</label>
          <Input className="sm:w-64 w-full" type="text" {...register("town")} />
          {errors.town && (
            <p className="text-sm text-red-500">{errors.town.message}</p>
          )}
        </div>

        <div className="space-y-2 text-[#10847E]">
          <label className="block text-sm font-medium">{t("country")}</label>
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <SelectorInput
                options={countryList}
                placeholder={t("select_country")}
                className="sm:w-64 w-full"
                value={field.value}
                onChange={(val: string) => field.onChange(val)}
              />
            )}
          />
          {errors.country && (
            <p className="text-sm text-red-500">{errors.country.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        className="bg-[#10847E] mt-6 flex justify-center text-white mx-auto w-[200px] rounded-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("submitting")}
          </>
        ) : (
          t("submit")
        )}
      </Button>
    </form>
  );
};

export default EditAddressModal;
