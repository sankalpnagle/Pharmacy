"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import SearchInput from "../custom_components/SearchInput";
import { Input } from "../ui/input";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import SelectorInput from "../custom_components/SelectorInput";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { addPatient, getAllPatient } from "@/services/doctor";
import { useModal } from "@/hooks/useModal";
import { useDispatch } from "react-redux";
import { addPatientData } from "@/redux/slices/patientSlice";
import { t } from "@/utils/translate";

// Define the schema for form validation
const addressSchema = z.object({
  addressLine: z.string().min(1, "Address line is required"),
  town: z.string().min(1, "Town is required"),
  municipality: z.string().min(1, "Municipality is required"),
  province: z.string().min(1, "Province is required"),
  country: z.string().min(1, "Country is required"),
  manualInstructions: z.string().optional(),
});

const patientSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: addressSchema,
});

export type Patient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    addressLine: string;
    town: string;
    municipality: string;
    province: string;
    country: string;
    manualInstructions?: string;
  };
};

export function PatientTable() {
  const dispatch = useDispatch();
  const [selectedPatient, setSelectedPatient] = useState<string | undefined>(
    undefined
  );
  const [sorting, setSorting] = useState<SortingState>([]);
  const { activeModal, openModal, closeModal } = useModal();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientData, setSelectedPatientData] =
    useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [provinceList, setProvinceList] = useState<
    { label: string; value: string }[]
  >([]);
  const [municipalityList, setMunicipalityList] = useState<
    { label: string; value: string }[]
  >([]);
  const [municipalityData, setMunicipalityData] = useState<
    Record<string, string[]>
  >({});
  const countryList = [{ label: "Cuba", value: "Cuba" }];

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<z.infer<typeof patientSchema>>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      address: {
        country: "Cuba",
      },
    },
  });

  const selectedProvince = watch("address.province");

  const fetchData = async () => {
    try {
      const res = await fetch("/municipalities-cuba.json");
      const data = await res.json();
      setMunicipalityData(data);

      const provinces = Object.keys(data).map((province) => ({
        label: province,
        value: province,
      }));
      setProvinceList(provinces);

      const patientsRes = await getAllPatient();
      if (patientsRes?.data?.patients) {
        setPatients(patientsRes.data.patients);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update municipalities when province changes
  useEffect(() => {
    if (selectedProvince && municipalityData[selectedProvince]) {
      const munList = municipalityData[selectedProvince].map((m) => ({
        label: m,
        value: m,
      }));
      setMunicipalityList(munList);
      setValue("address.municipality", "");
    }
  }, [selectedProvince, municipalityData, setValue]);

  const onSubmit = async (data: z.infer<typeof patientSchema>) => {
    setLoading(true);
    try {
      const response = await addPatient(data);

      if (!response.data) {
        throw new Error("Failed to create patient");
      }

      await fetchData(); // Refresh the patient list
      toast.success(t("Patient created successfully"));
      setIsNewPatientOpen(false);
      reset();
    } catch (error) {
      console.error("Error:", error);
      toast.error(error?.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  // Track window size for responsive adjustments
  useEffect(() => {
    const handleResize = () => {
      setColumnVisibility((prev) => ({
        ...prev,
        address: window.innerWidth > 768,
      }));
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Set initial state

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePatientSelect = (patientId: string) => {
    const selected = patients.find((patient) => patient.id === patientId);
    setSelectedPatient(patientId);
    setSelectedPatientData(selected || null);
  };
  const handleDone = () => {
    if (selectedPatientData) {
      dispatch(addPatientData(selectedPatientData));
      closeModal();
    } else {
      toast.error("Please select a patient");
    }
  };

  const columns: ColumnDef<Patient>[] = [
    {
      id: "select",
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <RadioGroupItem
            value={row.original.id}
            id={`radio-${row.original.id}`}
            className="h-4 w-4"
            checked={selectedPatient === row.original.id}
            onClick={(e) => {
              e.stopPropagation();
              handlePatientSelect(row.original.id);
            }}
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: t("patient_name"),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "email",
      header: t("email"),
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("email")}</div>
      ),
    },
    {
      accessorKey: "phone",
      header: t("phone"),
      cell: ({ row }) => <div>{row.getValue("phone")}</div>,
    },
    {
      accessorKey: "address",
      header: t("address"),
      cell: ({ row }) => {
        const address = row.getValue("address") as Patient["address"];
        return (
          <>
            {address ? (
              <div className="truncate max-w-xs">
                {`${address.addressLine}, ${address.town}, ${address.municipality}, ${address.province}, ${address.country}`}
              </div>
            ) : (
              <div className="text-gray-500 italic">
                {t("no_address_available")}
              </div>
            )}
          </>
        );
      },
    },
  ];

  const table = useReactTable({
    data: patients,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  return (
    <>
      <div className="w-full px-2 md:px-4">
        <div className="flex flex-col md:flex-row gap-3 md:gap-5 items-start md:items-center justify-start mb-4 md:mb-8">
          <SearchInput
            placeholder={t("filter_emails")}
            value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("email")?.setFilterValue(event.target.value)
            }
            className="w-full md:w-auto"
          />

          <Button
            type="button"
            variant={"outline"}
            className="bg-[#10847E]/10 text-[#10847E] rounded-full w-full md:w-auto"
            onClick={() => setIsNewPatientOpen(true)}
          >
            {t("new_patient")}
          </Button>
        </div>

        {isNewPatientOpen && (
          <section className="mb-6 md:mb-12 p-4 bg-gray-50 rounded-lg">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2 text-[#10847E]">
                  <label className="block text-sm">{t("full_name")}</label>
                  <Input
                    type="text"
                    {...register("name")}
                    placeholder={t("enter_your_full_name")}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs">
                      {errors.name.message}
                    </p>
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
                    <p className="text-red-500 text-xs">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-[#10847E]">
                  <label className="block text-sm">{t("phone_number")}</label>
                  <Input
                    type="tel"
                    {...register("phone")}
                    placeholder={t("enter_your_phone_number")}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2 text-[#10847E]">
                  <label className="block text-sm font-medium">
                    {t("address_line")}
                  </label>
                  <Input
                    {...register("address.addressLine")}
                    placeholder={t("ex._street")}
                    className={
                      errors.address?.addressLine ? "border-red-500" : ""
                    }
                  />
                  {errors.address?.addressLine && (
                    <p className="text-sm text-red-500">
                      {errors.address.addressLine.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-[#10847E]">
                  <label className="block text-sm font-medium">
                    {t("town")}
                  </label>
                  <Input
                    {...register("address.town")}
                    placeholder={t("ex._town")}
                    className={errors.address?.town ? "border-red-500" : ""}
                  />
                  {errors.address?.town && (
                    <p className="text-sm text-red-500">
                      {errors.address.town.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2 text-[#10847E]">
                  <label className="block text-sm font-medium">
                    {t("province")}
                  </label>
                  <Controller
                    name="address.province"
                    control={control}
                    render={({ field }) => (
                      <SelectorInput
                        options={provinceList}
                        placeholder={t("select_province")}
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        className={
                          errors.address?.province ? "border-red-500" : ""
                        }
                      />
                    )}
                  />
                  {errors.address?.province && (
                    <p className="text-sm text-red-500">
                      {errors.address.province.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-[#10847E]">
                  <label className="block text-sm font-medium">
                    {t("municipality")}
                  </label>
                  <Controller
                    name="address.municipality"
                    control={control}
                    render={({ field }) => (
                      <SelectorInput
                        options={municipalityList}
                        placeholder={t("select_municipality")}
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        className={
                          errors.address?.municipality ? "border-red-500" : ""
                        }
                      />
                    )}
                  />
                  {errors.address?.municipality && (
                    <p className="text-sm text-red-500">
                      {errors.address.municipality.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2 text-[#10847E]">
                  <label className="block text-sm font-medium">
                    {t("country")}
                  </label>
                  <Controller
                    name="address.country"
                    control={control}
                    render={({ field }) => (
                      <SelectorInput
                        options={countryList}
                        placeholder={t("select_country")}
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                        className={
                          errors.address?.country ? "border-red-500" : ""
                        }
                      />
                    )}
                  />
                  {errors.address?.country && (
                    <p className="text-sm text-red-500">
                      {errors.address.country.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 text-[#10847E]">
                  <label className="block text-sm font-medium">
                    {t("manual_instructions")}
                  </label>
                  <Input
                    {...register("address.manualInstructions")}
                    placeholder={t("ex._apt_details")}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <Button
                  type="submit"
                  className="bg-[#10847E] flex justify-center text-white w-full sm:w-auto min-w-24 rounded-full"
                  disabled={loading}
                >
                  {loading ? t("creating") : t("submit")}
                </Button>
                <Button
                  type="button"
                  className="bg-[#F62626] flex justify-center text-white w-full sm:w-auto min-w-24 rounded-full"
                  onClick={() => {
                    setIsNewPatientOpen(false);
                    reset();
                  }}
                  disabled={loading}
                >
                  {t("cancel")}
                </Button>
              </div>
            </form>
          </section>
        )}

        <div className="overflow-x-auto rounded-md">
          <RadioGroup value={selectedPatient}>
            <Table className="border-collapse border-t border-[#10847E] w-full text-black min-w-full">
              <TableHeader className="border-t border-[#10847E]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      {t("no_results")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </RadioGroup>
        </div>
      </div>
      <Button
        type="button"
        className="bg-[#10847E] mt-6 flex justify-center text-white mx-auto w-[200px] rounded-full"
        onClick={handleDone}
      >
        Done
      </Button>
    </>
  );
}
