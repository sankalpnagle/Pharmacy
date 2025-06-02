"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { bulkUploadProducts } from "@/services/productService";
import { Download, Info } from "lucide-react";
import * as XLSX from "xlsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLoading } from "@/context/LoadingContext";
import toast from "react-hot-toast";
import { t } from "@/utils/translate";

interface BulkUploadFormProps {
  onSuccess?: () => void;
  ShowModal: (show: boolean) => void;
}

export function BulkUploadForm({ onSuccess, ShowModal }: BulkUploadFormProps) {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<"excel" | "images">("excel");
  const [uploadProgress, setUploadProgress] = useState(0);
  const { showLoader, hideLoader } = useLoading();

  const handleDownloadTemplate = () => {
    // Create sample data with various test cases
    const sampleData = [
      {
        name: "Paracetamol 500mg",
        description: "Pain reliever and fever reducer",
        price: 10.99,
        category: "Pain Relief",
        subCategory: "Tablets",
        availability: "IN_STOCK",
        requiresPrescription: false,
        details: "Take 1-2 tablets every 4-6 hours as needed",
        medicineCode: "TEST001",
        weight: 100,
      },
      {
        name: "Ibuprofen 200mg",
        description: "Anti-inflammatory and pain reliever",
        price: 15.99,
        category: "Pain Relief",
        subCategory: "Tablets",
        availability: "IN_STOCK",
        requiresPrescription: false,
        details: "Take 1 tablet every 6-8 hours with food",
        medicineCode: "TEST002",
        weight: 50,
      },
      {
        name: "Amoxicillin 500mg",
        description: "Antibiotic for bacterial infections",
        price: 25.99,
        category: "Antibiotics",
        subCategory: "Capsules",
        availability: "IN_STOCK",
        requiresPrescription: true,
        details: "Take 1 capsule every 8 hours for 7 days",
        medicineCode: "TEST003",
        weight: 30,
      },
      {
        name: "Vitamin C 1000mg",
        description: "Immune system support supplement",
        price: 12.99,
        category: "Vitamins & Supplements",
        subCategory: "Tablets",
        availability: "IN_STOCK",
        requiresPrescription: false,
        details: "Take 1 tablet daily with food",
        medicineCode: "TEST004",
        weight: 200,
      },
      {
        name: "Omeprazole 20mg",
        description: "Acid reducer for heartburn relief",
        price: 18.99,
        category: "Digestive Health",
        subCategory: "Capsules",
        availability: "IN_STOCK",
        requiresPrescription: false,
        details: "Take 1 capsule daily before breakfast",
        medicineCode: "TEST005",
        weight: 75,
      },
      {
        name: "Aspirin 81mg",
        description: "Low-dose aspirin for heart health",
        price: 8.99,
        category: "Pain Relief",
        subCategory: "Tablets",
        availability: "IN_STOCK",
        requiresPrescription: false,
        details: "Take 1 tablet daily with food",
        medicineCode: "TEST006",
        weight: 100,
      },
      {
        name: "Vitamin D3 1000IU",
        description: "Vitamin D supplement",
        price: 14.99,
        category: "Vitamins & Supplements",
        subCategory: "Softgels",
        availability: "IN_STOCK",
        requiresPrescription: false,
        details: "Take 1 softgel daily with food",
        medicineCode: "TEST007",
        weight: 60,
      },
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    // Add column headers explanation
    const headerInfo: Record<string, string> = {
      A1: "Product Name (Required)",
      B1: "Description",
      C1: "Price (Required)",
      D1: "Category Name (Required) - Will be created if not exists",
      E1: "Subcategory Name (Required) - Will be created if not exists",
      F1: "Availability (IN_STOCK/OUT_OF_STOCK)",
      G1: "Requires Prescription (true/false)",
      H1: "Details",
      I1: "Medicine Code (Required)",
      J1: "Weight (Required)",
    };

    // Set column widths
    const colWidths = [
      { wch: 25 }, // A - Product Name
      { wch: 35 }, // B - Description
      { wch: 12 }, // C - Price
      { wch: 25 }, // D - Category
      { wch: 25 }, // E - Subcategory
      { wch: 15 }, // F - Availability
      { wch: 20 }, // G - Requires Prescription
      { wch: 40 }, // H - Details
      { wch: 15 }, // I - Medicine Code
      { wch: 12 }, // J - Weight
    ];

    worksheet["!cols"] = colWidths;

    // Add the headers
    Object.keys(headerInfo).forEach((key) => {
      worksheet[key] = { v: headerInfo[key], t: "s" };
    });

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    // Generate Excel file
    XLSX.writeFile(workbook, "product_template.xlsx");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile && !zipFile) {
      toast.error(t("please_select_a_file_to_upload"));
      return;
    }

    // Add file size validation for zip file
    if (uploadType === "images" && zipFile) {
      const MAX_ZIP_SIZE = 50 * 1024 * 1024; // 10MB
      if (zipFile.size > MAX_ZIP_SIZE) {
        toast.error(t("zip_file_size_should_be_less_than_10mb"));
        return;
      }
    }

    ShowModal(false);
    showLoader();
    setUploadProgress(0);

    try {
      if (uploadType === "excel" && excelFile) {
        const formData = new FormData();
        formData.append("file", excelFile);

        console.log("Starting bulk upload...");
        const response = await fetch("/api/products/bulk-upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        console.log("Upload response:", data);

        if (response.ok) {
          toast.success(
            t("successfully_uploaded_0_products!").replace(
              "0",
              data.products?.length || 0
            )
          );
          onSuccess?.();
        } else {
          console.error("Upload failed:", data);
          toast.error(
            data.error ||
              t(
                "failed_to_upload_products._please_check_the_console_for_details."
              )
          );
        }
      } else if (uploadType === "images" && zipFile) {
        const formData = new FormData();
        formData.append("zipFile", zipFile);

        console.log("Starting image upload...");
        const response = await fetch("/api/products/bulk-image-upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        console.log("Image upload response:", data);

        if (response.ok) {
          toast.success(data.message);
          onSuccess?.();
        } else {
          console.error("Image upload failed:", data);
          toast.error(data.error || t("failed_to_upload_images"));
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        t(
          "an_error_occurred_during_upload._please_check_the_console_for_details."
        )
      );
    } finally {
      hideLoader();
      setUploadProgress(0);
      // Reset file inputs
      if (uploadType === "excel") {
        setExcelFile(null);
      } else {
        setZipFile(null);
      }
    }
  };

  return (
    <div className="space-y-8 min-w-[250px]">
      <div className="flex flex-col gap-6">
        <div className="sm:flex items-center justify-between">
          <Select
            value={uploadType}
            onValueChange={(value: "excel" | "images") => setUploadType(value)}
          >
            <SelectTrigger className="w-[180px] border-2 py-[1.4rem] text-primary rounded-xl px-5 border-primary-light">
              <SelectValue placeholder={t("select_upload_type")} />
            </SelectTrigger>
            <SelectContent className="bg-white text-primary">
              <SelectItem value="excel" className="hover:bg-primary/10 text-md">
                {t("upload_excel")}
              </SelectItem>
              <SelectItem
                value="images"
                className="hover:bg-primary/10 text-md"
              >
                {t("upload_images")}
              </SelectItem>
            </SelectContent>
          </Select>

          {uploadType === "excel" && (
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="flex sm:mt-0 mt-3 items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t("download_template")}
            </Button>
          )}
        </div>

        <div className="bg-primary/5 p-4 rounded-lg space-y-3">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <div className="space-y-2">
              {uploadType === "excel" ? (
                <>
                  <p className="text-sm font-medium">
                    {t("excel_upload_instructions:")}
                  </p>
                  <ul className="text-sm space-y-1 list-disc list-inside text-gray-600">
                    <li>{t("download_and_use_the_template_provided_above")}</li>
                    <li>{t("fill_in_all_required_fields_(marked_with_*)")}</li>
                    <li>
                      {t(
                        "use_category_and_subcategory_names_(will_be_created_if_they_dont_exist)"
                      )}
                    </li>
                    <li>{t("ensure_medicine_codes_are_unique")}</li>
                    <li>{t("upload_only_.xlsx_or_.xls_files")}</li>
                    <li>{t("maximum_file_size:_10mb")}</li>
                  </ul>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    {t("image_upload_instructions:")}
                  </p>
                  <ul className="text-sm space-y-1 list-disc list-inside text-gray-600">
                    <li>
                      {t("create_a_zip_file_containing_all_product_images")}
                    </li>
                    <li>
                      {t(
                        "name_each_image_file_with_its_corresponding_medicine_code"
                      )}
                    </li>
                    <li>{t("supported_formats:_jpg,_jpeg,_png")}</li>
                    <li>{t("maximum_file_size:_50mb")}</li>
                    <li>{t("recommended_image_size:_800x800_pixels")}</li>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("select_file")}</Label>
            <input
              type="file"
              accept={uploadType === "excel" ? ".xlsx,.xls" : ".zip"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (uploadType === "excel") {
                  // Excel file validation
                  if (file.size > 10 * 1024 * 1024) {
                    // 10MB
                    toast.error(t("maximum_file_size:_10mb"));
                    e.target.value = ""; // Clear the file input
                    return;
                  }
                  setExcelFile(file);
                } else {
                  // Zip file validation
                  if (file.size > 10 * 1024 * 1024) {
                    // 10MB
                    toast.error(t("zip_file_size_should_be_less_than_10mb"));
                    e.target.value = ""; // Clear the file input
                    return;
                  }
                  setZipFile(file);
                }
              }}
              className="sm:w-full w-[250px] p-2 border-2 border-primary-light rounded-xl"
            />
          </div>

          <Button
            type="submit"
            disabled={uploadType === "excel" ? !excelFile : !zipFile}
            className="w-full bg-primary text-white hover:bg-primary/90"
          >
            {uploadType === "excel" ? t("upload_excel") : t("upload_images")}
          </Button>
        </form>
      </div>
    </div>
  );
}
