"use client";

import * as React from "react";
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

import SearchInput from "@/components/custom_components/SearchInput";
import { FiPlus } from "react-icons/fi";
import { SiMicrosoftexcel } from "react-icons/si";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import axios from "axios";
import { getAllProduct, productDeleteId } from "@/services/productService";
import { BulkUploadForm } from "@/components/products/BulkUploadForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import { t } from "@/utils/translate";

export type Orders = {
  id: string;
  productId: string;
  name: string;
  weight: string;
};

const initialData: Orders[] = [
  {
    id: "",
    productId: "",
    name: "",
    weight: "",
  },
];

export default function AddProduct() {
  const router = useRouter();
  const [data, setData] = React.useState<Orders[]>(initialData);
  const [selectedViewOrders, setSelectedViewOrders] = React.useState<
    string | undefined
  >(undefined);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleViewOrdersSelect = (ViewOrdersId: string) => {
    setSelectedViewOrders(ViewOrdersId);
    console.log(`Selected ID: ${ViewOrdersId}`);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (!e.target?.result) return;
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Assuming the first sheet contains the data
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Transform the data to match our Orders type
        const transformedData: Orders[] = jsonData.map((item: any, index) => ({
          // Use the current data length + index + 1 to create a unique ID
          id: (data.length + index + 1).toString(),
          productId: item.productId || item.NDC || item["Product ID"] || "",
          name: item.name || item["Product Name"] || "",
          weight: item.weight || "0",
        }));

        // Append the new data to the existing data instead of replacing it
        setData((prevData) => {
          // Create a map of existing product IDs to detect duplicates
          const existingProductIds = new Map(
            prevData.map((item) => [item.productId, item])
          );

          const newUniqueProducts = transformedData.filter((product) => {
            // If this product ID already exists
            if (existingProductIds.has(product.productId)) {
              return false;
            }
            return true;
          });

          console.log(`Adding ${newUniqueProducts.length} new unique products`);

          return [...prevData, ...newUniqueProducts];
        });

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        setShowUploadModal(false);
      };

      reader.readAsArrayBuffer(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const fetchAllProduct = async () => {
    const res = await getAllProduct();
    console.log(res);

    console.log(res?.data?.products);

    setData(res?.data?.products);
  };

  React.useEffect(() => {
    fetchAllProduct();
  }, []);

  const columns: ColumnDef<Orders>[] = [
    {
      id: "select",
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "medicineCode",
      header: t("ndc_product_id"),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("medicineCode")}</div>
      ),
    },
    {
      accessorKey: "name",
      header: t("product_name"),
      cell: ({ row }) => (
        <div className="lowercase">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "weight",
      header: t("weight"),
      cell: ({ row }) => <div>{row.getValue("weight")}</div>,
    },
    {
      accessorKey: "availability",
      header: t("availability"),
      cell: ({ row }) => <div>{t(row.original?.availability)}</div>,
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/addProduct/createProduct/${row.original.id}`);
            }}
            className="text-blue-600 hover:underline"
          >
            {t("edit")}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original.id);
            }}
            className="text-red-600 hover:underline"
          >
            {t("delete")}
          </button>
        </div>
      ),
    },
  ];

  const handleDelete = async (id: string) => {
    try {
      console.log("Delete user with id:", id);
      const res = await productDeleteId(id);
      if (res?.status === 200) {
        toast.success(t("product_deleted_successfully"));
        fetchAllProduct();
      } else {
        toast.error(t("failed_to_delete_product"));
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(t("failed_to_delete_product"));
    }
  };

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    table.getColumn("name")?.setFilterValue(value);
  };

  const handleBulkUploadSuccess = () => {
    setShowUploadModal(false);
    fetchAllProduct();
  };

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="sm:flex my-5 w-full items-center justify-between mb-8">
        <div className="sm:flex gap-x-3">
          <SearchInput
            placeholder={t("search_by_name_or_order_number")}
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={handleSearchChange}
            className="sm:w-[30rem] w-auto"
          />
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/addProduct/createProduct")}
              className="flex bg-primary  mt-5 sm:mt-0 hover:cursor-pointer items-center rounded-xl text-white justify-center pr-3 pl-1"
            >
              <FiPlus className="text-white scale-50" />
              {t("add_new_product")}
            </button>
          </div>
        </div>
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogTrigger asChild>
            <button
              className="flex bg-primary mt-5 sm:mt-0 hover:cursor-pointer items-center rounded-xl px-4 pb-1 text-white justify-center h-10 "
              onClick={() => setShowUploadModal(true)}
            >
              <SiMicrosoftexcel className="text-white scale-75" />
              <p className="ml-1 mt-1">{t("bulk_upload")}</p>
            </button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>{t("bulk_upload_products")}</DialogTitle>
            </DialogHeader>
            <BulkUploadForm
              onSuccess={handleBulkUploadSuccess}
              ShowModal={setShowUploadModal}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-md py-2">
        <Table className="border-collapse border-t border-[#10847E] w-full text-black">
          <TableHeader className="border-t border-[#10847E]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-t border-[#10847E]"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="border-t border-[#10847E] text-black font-bold"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-t border-[#10847E] hover:bg-gray-100 cursor-pointer"
                  onClick={() =>
                    router.push(`/addProduct/createProduct/${row.original.id}`)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="border-t border-[#10847E]"
                    >
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
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-700">
            {t("page")} {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </p>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {t("show")} {pageSize}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 text-sm border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50"
          >
            {"<<"}
          </Button>
          <Button
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 text-sm border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50"
          >
            {"<"}
          </Button>
          <Button
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 text-sm border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50"
          >
            {">"}
          </Button>
          <Button
            variant="outline"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 text-sm border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50"
          >
            {">>"}
          </Button>
        </div>
      </div>
    </div>
  );
}
