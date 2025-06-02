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

import { useRouter } from "next/navigation";
import { getOrderByUser } from "@/services/order";
import { useRole } from "@/hooks/useRole";
import SearchInput from "@/components/custom_components/SearchInput";
import { formatDate } from "@/utils/formatDate";
import { t } from "@/utils/translate";

export type Orders = {
  id: string;
  orderNumber: string;
  patient: string;
  totalPrice: string;
  createdAt: string;
  status: "pending" | "processing" | "Fulfilled" | "failed";
};

export default function ViewOrders() {
  const [selectedViewOrders, setSelectedViewOrders] = React.useState<
    string | undefined
  >(undefined);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const { role, isDoctor, isUser } = useRole();
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [data, setData] = React.useState<Orders[]>([]);
  const router = useRouter();

  // Add pagination state
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(0);

  const handleViewOrdersSelect = (ViewOrdersId: string) => {
    setSelectedViewOrders(ViewOrdersId);
    console.log(`${t("selected_id")} ${ViewOrdersId}`);
  };

  const fetchOrderByUser = async () => {
    const res = await getOrderByUser();
    setData(res?.data?.data || []);
  };

  React.useEffect(() => {
    fetchOrderByUser();
  }, []);

  const columns: ColumnDef<Orders>[] = React.useMemo(() => {
    const baseColumns: ColumnDef<Orders>[] = [
      {
        id: "select",
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "orderNumber",
        header: t("order_number"),
        cell: ({ row }) => (
          <div className="capitalize">{row.getValue("orderNumber")}</div>
        ),
      },
      {
        accessorKey: "totalPrice",
        header: t("total"),
        cell: ({ row }) => <div>$ {row.getValue("totalPrice")}</div>,
      },
      {
        accessorKey: "createdAt",
        header: t("date"),
        cell: ({ row }) => (
          <div>{formatDate(row.original?.createdAt).shortFormat}</div>
        ),
      },
      {
        accessorKey: "status",
        header: t("status"),
        cell: ({ row }) => <div>{t(row.original?.status)}</div>,
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div
            onClick={() =>
              router.push(`/profile/viewOrders/${row.original.id}`)
            }
            className="cursor-pointer text-blue-500 hover:underline"
          >
            {t("view_order")}
          </div>
        ),
      },
    ];

    if (isDoctor) {
      baseColumns.splice(2, 0, {
        accessorKey: "patient",
        header: t("patient"),
        cell: ({ row }) => (
          <div className="lowercase">
            {row.original.patient?.name || t("na")}
          </div>
        ),

        filterFn: (row, columnId, filterValue) => {
          const patientName = row.original.patient?.name?.toLowerCase() || "";
          return patientName.includes(filterValue.toLowerCase());
        },
      });
    }

    return baseColumns;
  }, [isDoctor, router]);

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
      pagination: {
        pageIndex: currentPage,
        pageSize: pageSize,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater({
          pageIndex: currentPage,
          pageSize: pageSize,
        });
        setCurrentPage(newState.pageIndex);
        setPageSize(newState.pageSize);
      }
    },
  });

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-5 items-center justify-start mb-8">
        <SearchInput
          className="w-1/3"
          placeholder={t("search_by_patient_name_or_order_number")}
          value={
            (table.getColumn("orderNumber")?.getFilterValue() as string) ||
            (table.getColumn("patient")?.getFilterValue() as string) ||
            ""
          }
          onChange={(event) => {
            const value = event.target.value;

            if (value === "") {
              table.getColumn("orderNumber")?.setFilterValue("");
              table.getColumn("patient")?.setFilterValue("");
              return;
            }

            if (/^\d+$/.test(value)) {
              // If the input is numeric, search by order number
              table.getColumn("orderNumber")?.setFilterValue(value);
              table.getColumn("patient")?.setFilterValue("");
            } else {
              // If the input is text, search by patient name
              table.getColumn("patient")?.setFilterValue(value);
              table.getColumn("orderNumber")?.setFilterValue("");
            }
          }}
        />
      </div>
      <div className="mt-7">
        <Button
          variant={"outline"}
          className="text-primary border-2 rounded-[12px] w-[150px] mb-8"
        >
          {t("total_orders")}: {data.length}
        </Button>
      </div>
      <div className="rounded-md min-w-[800px]">
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
                  onClick={() => handleViewOrdersSelect(row.original.id)}
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

      {/* Pagination Controls */}
      <div className="sm:flex items-center justify-between px-2 py-4">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-700">
            {t("page")} {currentPage + 1} {t("of")} {table.getPageCount()}
          </p>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(0);
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

        <div className="flex w-full sm:w-auto justify-center mt-4 sm:mt-0 items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 text-sm border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50"
          >
            {"<<"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => prev - 1)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 text-sm border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50"
          >
            {"<"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 text-sm border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-50"
          >
            {">"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(table.getPageCount() - 1)}
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
