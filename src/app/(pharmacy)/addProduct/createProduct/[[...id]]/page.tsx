"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FiPlus } from "react-icons/fi";
import SelectorInput from "@/components/custom_components/SelectorInput";
import {
  createCategory,
  getCategories,
  getCategoryById,
} from "@/actions/category";
import { ProductSchema } from "@/schemas";
import axios from "axios";
import toast from "react-hot-toast";
import {
  createProduct,
  editProduct,
  productById,
} from "@/services/productService";
import { useParams, useRouter } from "next/navigation";
import { isNumberOnly } from "@/utils/isNumberOnly";
import { t } from "@/utils/translate";

const requiresPrescriptionOptions = [
  { value: "true", label: "Yes" },
  { value: "false", label: "No" },
];

const availabilityOptions = [
  { value: "IN_STOCK", label: "In Stock" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
];

type FormValues = z.infer<typeof ProductSchema>;

const createProductPage = () => {
  const { id } = useParams<{ id?: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [showCategoryInputField, setShowCategoryInputField] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [showSubCategoryInputField, setShowSubCategoryInputField] =
    useState(false);
  const [newSubCategory, setNewSubCategory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null); // To store the file name
  const fileInputRef = useRef<HTMLInputElement | null>(null); // Reference for the hidden file input

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    getValues,
    reset,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      requiresPrescription: false,
      availability: "IN_STOCK",
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await getCategories();
        setCategories(response?.categories || []);

        if (id) {
          const res = await productById(id);
          const product = res?.data?.product;

          if (res?.data?.product) {
            reset({
              name: product?.name,
              description: product?.description,
              price: product?.price || "",
              availability: product?.availability,
              requiresPrescription: product?.requiresPrescription,
              details: product?.details,
              categoryId: product?.category?.parent?.id,
              imageUrl: product?.imageUrl || "",
              medicineCode: product?.medicineCode,
              weight: product?.weight,
              subCategory: product.category?.id,
            });

            const mainCategoryId = product.category?.parent?.id;
            if (mainCategoryId) {
              const parentCategory = response?.categories?.find(
                (cat: Category) => cat.id === mainCategoryId
              );
              setSubCategories(parentCategory?.children || []);
            }
          }
          if (product?.imageUrl) {
            const urlParts = product.imageUrl.split("/");
            const existingFileName = urlParts[urlParts.length - 1];
            setFileName(existingFileName);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load product data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [id, reset]);

  const handleCategoryChange = async (value: string) => {
    setValue("categoryId", value);
    setValue("subCategory", "");

    try {
      const res = await getCategoryById(value);
      setSubCategories(res?.category?.children || []);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast.error("Failed to load subcategories");
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    setFileName(file.name);
    setValue("imageUrl", file, { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const formData = new FormData();
      const subCategoryId = getValues("subCategory");

      if (!subCategoryId) {
        toast.error("Please select a subcategory");
        return;
      }

      // Add image validation
      if (!data.imageUrl && !id) {
        toast.error("Please select an image");
        return;
      }

      formData.append("categoryId", subCategoryId);

      if (data.imageUrl instanceof File) {
        formData.append("image", data.imageUrl);
      } else if (typeof data.imageUrl === "string") {
        formData.append("imageUrl", data.imageUrl);
      }

      Object.entries(data).forEach(([key, value]) => {
        if (key === "imageUrl" || key === "categoryId") return;
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      if (id) {
        await editProduct(id, formData);
        toast.success("Product updated successfully");
      } else {
        await createProduct(formData);
        toast.success("Product created successfully");
      }
      router.push("/addProduct");
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error?.response?.data?.error);
    }
  };

  const handleCategorySubmit = async () => {
    if (!newCategory.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      const res = await createCategory({ name: newCategory });
      if (res?.success) {
        toast.success("Category Added");
        setNewCategory("");
        const updatedCategories = await getCategories();
        setCategories(updatedCategories?.categories || []);
        setShowCategoryInputField(false);
      }
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to add category");
    }
  };

  const handleSubCategorySubmit = async () => {
    if (!newSubCategory.trim()) {
      toast.error("Subcategory name is required");
      return;
    }

    const parentId = getValues("categoryId");
    if (!parentId) {
      toast.error("Please select a parent category first");
      return;
    }

    try {
      const payload = {
        name: newSubCategory,
        parentId,
      };
      const res = await createCategory(payload);

      if (res?.success) {
        toast.success("Subcategory Added");
        setSubCategories((prev) => [...prev, res.category]);
        setNewSubCategory("");
        setShowSubCategoryInputField(false);
      }
    } catch (error) {
      console.error("Error creating subcategory:", error);
      toast.error("Failed to add subcategory");
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "price" | "weight"
  ) => {
    const value = e.target.value;

    // Allow valid numeric input including starting with ".", like ".5"
    if (/^\d*\.?\d*$/.test(value)) {
      // Don't convert to number here — allow string so user can type freely
      setValue(field, value, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    } else {
      // Revert to last valid value
      const prevValue = getValues(field);
      e.target.value = prevValue?.toString() || "";
      setValue(field, prevValue, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  const handleDecimalInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "price" | "weight"
  ) => {
    const value = e.target.value;

    // Allow digits and at most one decimal point
    const decimalRegex = /^\d*\.?\d{0,2}$/; // Optional: limit to 2 decimal places
    if (decimalRegex.test(value)) {
      const parsed = value === "" ? undefined : parseFloat(value);
      setValue(field, parsed, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    } else {
      const prevValue = getValues(field);
      e.target.value = prevValue?.toString() || "";
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="sm:w-11/12 w-full text-primary-light mx-auto px-4 my-8 sm:p-6 "
    >
      <div className="grid grid-cols-1  md:grid-cols-2 gap-6">
        <div className="space-y-6 sm:w-5/6">
          <div>
            <label className="text-primary font-semibold">
              {t("product_id")}
            </label>
            <input
              type="text"
              placeholder={t("product_id")}
              className="border-[1.5px] border-primary-light rounded-lg w-full px-4 py-2 mt-2"
              {...register("medicineCode")}
            />
            {errors.medicineCode && (
              <p className="text-red-500 text-sm mt-1">
                {errors.medicineCode.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-primary font-semibold">
              {t("product_name")}
            </label>
            <input
              type="text"
              placeholder={t("product_name")}
              className="border-[1.5px] border-primary-light rounded-lg w-full px-4 py-2 mt-2"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="text-primary font-semibold">{t("price")}</label>
            <input
              type="text"
              inputMode="decimal"
              pattern="^\d*\.?\d*$"
              placeholder={t("price")}
              className="border-[1.5px] border-primary-light rounded-lg w-full px-4 py-2 mt-2"
              {...register("price", {
                validate: (value) => {
                  if (value === undefined || value === "")
                    return "Price is required";

                  const numericValue = Number(value);
                  if (isNaN(numericValue)) return "Price must be a number";
                  if (numericValue <= 0)
                    return "Price must be greater than zero";
                  if (!Number.isInteger(numericValue))
                    return "Price must not be a decimal";
                  return true;
                },
              })}
              onChange={(e) => handleNumericInput(e, "price")}
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">
                {errors.price.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-primary font-semibold">
              {t("weight_lb")}
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder={t("weight_lb")}
              className="border-[1.5px] border-primary-light rounded-lg w-full px-4 py-2 mt-2"
              onWheel={(e) => e.currentTarget.blur()}
              {...register("weight", {
                setValueAs: (value) =>
                  value === "" ? undefined : Number(value),
                validate: (value) => {
                  if (value === undefined || value === "")
                    return "Weight is required";
                  if (isNaN(value)) return "Weight must be a number";
                  if (value <= 0) return "Weight must be greater than zero";
                  if (value < 0.01) return "Weight must be at least 0.01";
                  return true;
                },
              })}
            />

            {errors.weight && (
              <p className="text-red-500 text-sm mt-1">
                {errors.weight.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-primary font-semibold">
              {t("availability")}
            </label>
            <SelectorInput
              options={availabilityOptions}
              value={watch("availability")}
              placeholder={t("availability")}
              className="border-[1.5px] border-primary-light rounded-lg w-full px-4 py-5  mt-2"
              onChange={(value) => setValue("availability", value)}
            />
          </div>
          <div className="w-full">
            <label className="text-primary font-semibold">
              {t("category")}
            </label>
            <div className="flex items-center">
              <SelectorInput
                options={categories.map((cat) => ({
                  label: cat.name,
                  value: cat.id,
                }))}
                value={watch("categoryId")}
                placeholder={t("category")}
                className="border-[1.5px] border-primary-light rounded-lg w-full px-4 py-5 mt-2"
                onChange={handleCategoryChange}
              />
              <button
                type="button"
                className="cursor-pointer mt-1.5"
                onClick={() =>
                  setShowCategoryInputField(!showCategoryInputField)
                }
              >
                <FiPlus className="scale-[0.6]" />
              </button>
            </div>
          </div>

          {showCategoryInputField && (
            <div className="flex gap-x-2 items-center w-full">
              <div className="w-10/12">
                <input
                  type="text"
                  placeholder={t("new_category")}
                  className="border-[1.5px] border-primary-light rounded-lg w-full px-4 py-2 mt-2"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="px-7 bg-primary text-white py-2 mt-0.5 rounded-full"
                onClick={handleCategorySubmit}
              >
                {t("add")}
              </button>
            </div>
          )}

          <div className="w-full sm:hidden block">
            <label className="text-primary font-semibold">
              {t("subcategory")}
            </label>
            <div className="flex items-center">
              <SelectorInput
                options={subCategories.map((sub) => ({
                  label: sub.name,
                  value: sub.id,
                }))}
                value={watch("subCategory") ?? ""}
                placeholder={t("subcategory")}
                className="border-[1.5px] border-primary-light rounded-lg w-full px-4 py-5 mt-1"
                onChange={(value) => setValue("subCategory", value)}
                isDisabled={!watch("categoryId")}
              />
              <button
                type="button"
                className="cursor-pointer mt-1"
                onClick={() =>
                  setShowSubCategoryInputField(!showSubCategoryInputField)
                }
                disabled={!watch("categoryId")}
              >
                <FiPlus className="scale-[0.6]" />
              </button>
            </div>
          </div>

          {showSubCategoryInputField && (
            <div className="block sm:hidden">
              <div className="flex gap-x-2 items-center w-full">
                <div className="w-9/12 ">
                  <input
                    type="text"
                    placeholder={t("new_subcategory")}
                    className="border-[1.5px] border-primary-light rounded-lg w-full px-6 py-2 mt-2"
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="px-7 bg-primary text-white py-2 mt-0.5 rounded-full"
                  onClick={handleSubCategorySubmit}
                >
                  {t("add")}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 mx-auto w-full sm:w-5/6">
          <div>
            <label className="text-primary font-semibold">
              {t("product_image")}
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-[1.5px] border-dotted border-primary-light rounded-lg w-full px-4 py-2 mt-2 text-center cursor-pointer"
            >
              {fileName ? (
                <span className="truncate block">{fileName}</span>
              ) : (
                <span>{t("choose_your_file")}</span>
              )}
            </div>
            {/* Show existing image preview if available and no new file selected */}
            {watch("imageUrl") &&
              typeof watch("imageUrl") === "string" &&
              !fileName && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{t("current_image")}</p>
                  <img
                    src={watch("imageUrl")}
                    alt="Current product"
                    className="h-20 object-contain mt-1"
                  />
                </div>
              )}
            {errors.imageUrl && (
              <p className="text-red-500 text-sm mt-1">Upload Image</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
          <div>
            <label className="text-primary font-semibold">{t("details")}</label>
            <textarea
              placeholder={t("details")}
              rows={3}
              className="border-[1.5px] border-primary-light rounded-lg w-full px-4 py-2 mt-2"
              {...register("details")}
            />
          </div>

          <div>
            <label className="text-primary font-semibold">
              {t("description")}
            </label>
            <textarea
              placeholder={t("description")}
              rows={3}
              className="border-[1.5px] border-primary-light rounded-lg w-full px-4 py-2 "
              {...register("description")}
            />
          </div>
          <div>
            <label className="text-primary font-semibold">
              {t("requires_prescription")}
            </label>
            <SelectorInput
              options={requiresPrescriptionOptions}
              placeholder={t("requires_prescription")}
              value={watch("requiresPrescription") ? "true" : "false"}
              className="border-[1.5px] border-primary-light rounded-lg w-full px-4 py-5  mt-1"
              onChange={(value) =>
                setValue("requiresPrescription", value === "true")
              }
            />
          </div>
          <div className="w-full sm:block hidden">
            <label className="text-primary font-semibold">
              {t("subcategory")}
            </label>
            <div className="flex items-center">
              <SelectorInput
                options={subCategories.map((sub) => ({
                  label: sub.name,
                  value: sub.id,
                }))}
                value={watch("subCategory") ?? ""}
                placeholder={t("subcategory")}
                className="border-[1.5px] border-primary-light rounded-lg w-full px-4 py-5 mt-1"
                onChange={(value) => setValue("subCategory", value)}
                isDisabled={!watch("categoryId")}
              />
              <button
                type="button"
                className="cursor-pointer mt-1"
                onClick={() =>
                  setShowSubCategoryInputField(!showSubCategoryInputField)
                }
                disabled={!watch("categoryId")}
              >
                <FiPlus className="scale-[0.6]" />
              </button>
            </div>
          </div>

          {showSubCategoryInputField && (
            <div className="sm:block hidden">
              <div className="flex  gap-x-2 items-center w-full">
                <div className="w-9/12">
                  <input
                    type="text"
                    placeholder={t("new_subcategory")}
                    className="border-[1.5px] border-primary-light rounded-lg w-full px-6 py-2 mt-2"
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="px-7 bg-primary text-white py-2 mt-0.5 rounded-full"
                  onClick={handleSubCategorySubmit}
                >
                  {t("add")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-10">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary cursor-pointer px-16 py-3 rounded-full text-white   hover:bg-primary-dark transition"
        >
          {id
            ? ` ${isSubmitting ? t("editing_product") : t("edit_product")}`
            : ` ${isSubmitting ? t("adding_product") : t("add_product")}`}
        </button>
      </div>
    </form>
  );
};

export default createProductPage;
