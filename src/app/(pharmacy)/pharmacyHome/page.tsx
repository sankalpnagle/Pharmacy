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
  orderColumns,
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

import { register } from "@/actions/register";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SearchInput from "@/components/custom_components/SearchInput";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/custom_components/date_range_picker";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { getAllOrder, getAllPaidOrder } from "@/services/order";
import { formatDate } from "@/utils/formatDate";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Box, TextField } from "@mui/material";
import { useLoading } from "@/context/LoadingContext";
import { enGB } from "date-fns/locale";
import { t } from "@/utils/translate";

export type Orders = {
  id: string;
  orderNumber: string;
  patient?: {
    name: string;
  };
  user?: {
    name: string;
    role: string;
  };
  totalPrice: number;
  createdAt: string;
  date?: string;
  status: string;
  updatedAt?: Date;
};

export default function PharmacyHome() {
  const router = useRouter();
  const [selectedViewOrders, setSelectedViewOrders] = useState<
    string | undefined
  >(undefined);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [isNewViewOrdersOpen, setIsNewViewOrdersOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  const [orders, setOrders] = useState<Orders[]>([]);
  const { showLoader, hideLoader } = useLoading();

  const handleViewOrdersSelect = (ViewOrdersId: string) => {
    setSelectedViewOrders(ViewOrdersId);
    console.log(`Selected ID: ${ViewOrdersId}`);
    router.push(`/pharmacyHome/${ViewOrdersId}`);
  };

  const columns: ColumnDef<Orders>[] = [
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
      accessorKey: "date",
      header: t("date"),
      cell: ({ row }) => (
        <div>{formatDate(row.original?.createdAt).shortFormat}</div>
      ),
    },
    {
      accessorFn: (row) => row?.patient?.name || row?.user?.name || "",
      accessorKey: "patient",
      header: t("name"),
      cell: ({ row }) => (
        <div className="lowercase">{`${
          row.original?.patient?.name
            ? row.original?.patient?.name
            : row.original?.user?.name
        }`}</div>
      ),
    },

    {
      accessorKey: "userType",
      header: t("user_type"),
      cell: ({ row }) => <div>{t(row.original?.user?.role)}</div>,
    },
    {
      accessorKey: "total",
      header: t("total"),
      cell: ({ row }) => (
        <div>
          $
          {Number(row.original?.totalPrice)
            ? Number(row.original.totalPrice)
            : Number(row.original.totalPrice).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => (
        <div className="uppercase">{t(row.original?.status)}</div>
      ),
    },
  ];

  const table = useReactTable({
    data: orders,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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

  // Fetch orders once on mount. Do not include loader functions in deps
  // to avoid re-running when context functions change.
  useEffect(() => {
    let mounted = true;
    const fetchAllOrders = async () => {
      try {
        showLoader();
        const res = await getAllPaidOrder();
        if (!mounted) return;
        // FIX: Use status === 200 instead of statusText
        if (res.status === 200 && res.data?.data) {
          setOrders(res.data.data);
        } else {
          console.error("Failed to fetch orders", res);
        }
      } catch (err) {
        console.error("Error fetching orders", err);
      } finally {
        hideLoader();
      }
    };

    fetchAllOrders();

    return () => {
      mounted = false;
    };
  }, []);

  // Socket listeners in separate effect so they attach only once
  /*
  useEffect(() => {
    const handlePayment = (newOrder: Partial<Orders> & { id?: string }) => {
      if (!newOrder?.id) return;

      setOrders((prevOrders) => {
        const idx = prevOrders.findIndex((o) => o.id === newOrder.id);
        if (idx !== -1) {
          const existing = prevOrders[idx];
          // shallow compare small set of fields to avoid unnecessary updates
          const changed =
            existing.status !== newOrder.status ||
            existing.totalPrice !== (newOrder as Orders).totalPrice ||
            existing.orderNumber !== (newOrder as Orders).orderNumber;

          if (!changed) return prevOrders;

          const updated = [...prevOrders];
          updated[idx] = { ...existing, ...(newOrder as Orders) };
          updated.sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));
          return updated;
        }

        // New order: prepend and sort
        const added = [newOrder as Orders, ...prevOrders];
        added.sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));
        return added;
      });
    };

    const handleOrderStatusChange = (data: any) => {
      console.log("📊 Order status changed via socket:", data);
      handlePayment({ id: data.orderId, status: data.status });
    };

    socket.on("payment", handlePayment);
    socket.on("orderStatusUpdate", handleOrderStatusChange);

    return () => {
      socket.off("payment", handlePayment);
      socket.off("orderStatusUpdate", handleOrderStatusChange);
    };
  }, []);
  */

  console.log(orders, "orders");

  return (
    <div className="w-full">
      <div className="flex my-5 gap-5 items-center justify-start mb-8">
        {/* <SearchInput
          placeholder="Search by patient name / order number"
          value={
            (table.getColumn("orderNumber")?.getFilterValue() as string)
              ? (table.getColumn("orderNumber")?.getFilterValue() as string)
              : (table.getColumn("patient")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) => {
            const value = event.target.value;

            if (value === "") {
              table.getColumn("orderNumber")?.setFilterValue("");
              table.getColumn("patient")?.setFilterValue("");
              return;
            }

            if (/^\d+$/.test(value)) {
              table.getColumn("orderNumber")?.setFilterValue(value);
              table.getColumn("patient")?.setFilterValue("");
            } else {
              table.getColumn("patient")?.setFilterValue(value);
              table.getColumn("orderNumber")?.setFilterValue("");
            }
          }}
        />

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <DatePicker
              label="From"
              value={fromDate}
              onChange={(date) => setFromDate(date)}
              slotProps={{ 
                textField: { size: "small" },
                inputAdornment: {
                  sx: { '& .MuiInputAdornment-root': { marginRight: 1 } }
                }
              }}
              format="dd/MM/yyyy"
            />
            <DatePicker
              label="To"
              value={toDate}
              onChange={(date) => setToDate(date)}
              slotProps={{ 
                textField: { size: "small" },
                inputAdornment: {
                  sx: { '& .MuiInputAdornment-root': { marginRight: 1 } }
                }
              }}
              format="dd/MM/yyyy"
            />
          </Box>
        </LocalizationProvider> */}

        <h1 className="text-primary mx-2 text-2xl font-semibold mt-2">
          {t("orders_waiting_fulfillment")}
        </h1>
      </div>
      <div className="rounded-md h-dvh overflow-y-scroll py-2">
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
                          header.getContext(),
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
                        cell.getContext(),
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

        {/* Pagination Controls */}
        <div className="sm:flex items-center  justify-between px-2 py-4">
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
    </div>
  );
}
