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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { register } from "@/actions/register";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import SearchInput from "@/components/custom_components/SearchInput";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/custom_components/date_range_picker";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useMemo } from "react";
import { socket } from "@/lib/socket";
import { getAllOrder } from "@/services/order";
import { formatDate } from "@/utils/formatDate";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Box, TextField } from "@mui/material";
import { updateOrderStatus } from "@/services/payment";
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
};
const statusMap: Record<string, string> = {
  PLACED: "placed",
  PAID: "paid",
  FULFILLED: "fulfill",
  // MISSING_PRESCRIPTION: "missing_prescription",
  // REFUND: "refund",
  REJECT: "reject",
};

export default function Dashboard() {
  const router = useRouter();
  const [selectedViewOrders, setSelectedViewOrders] = useState<
    string | undefined
  >(undefined);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [isNewViewOrdersOpen, setIsNewViewOrdersOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrders] = useState<Orders[]>([]);
  const [dateFilter, setDateFilter] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: null,
    to: null,
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  const handleDateChange = (type: "from" | "to", date: Date | null) => {
    setDateFilter((prev) => ({
      ...prev,
      [type]: date,
    }));
  };

  const handleResetFilters = () => {
    setDateFilter({ from: null, to: null });
    setStatusFilter(null);
    setFromDate(null);
    setToDate(null);
  };

  const filteredOrders = useMemo(() => {
    if (!order.length) return [];

    let filtered = [...order];

    if (statusFilter) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    if (dateFilter.from && dateFilter.to) {
      const from = new Date(dateFilter.from);
      from.setHours(0, 0, 0, 0);
      const to = new Date(dateFilter.to);
      to.setHours(23, 59, 59, 999);

      filtered = filtered.filter((order) => {
        const orderTime = new Date(order.createdAt || order.date || "");
        return orderTime >= from && orderTime <= to;
      });
    }

    return filtered;
  }, [order, statusFilter, dateFilter]);

  const fetchAllOrders = async () => {
    try {
      setIsLoading(true);
      const res = await getAllOrder();

      console.log("fetchAllOrders response:", res);

      // Handle different response formats
      if (res?.data) {
        let ordersData = [];

        // Check various possible response structures
        if (Array.isArray(res.data)) {
          ordersData = res.data;
        } else if (Array.isArray(res.data.data)) {
          ordersData = res.data.data;
        } else if (res.data.success && Array.isArray(res.data.data)) {
          ordersData = res.data.data;
        } else if (res.data.orders) {
          ordersData = res.data.orders;
        }

        console.log("Processed orders data:", ordersData);

        if (Array.isArray(ordersData) && ordersData.length > 0) {
          setOrders(ordersData);
        } else {
          console.warn("No orders found in response:", res.data);
          setOrders([]);
        }
      } else {
        console.error("Unexpected response structure:", res);
        setOrders([]);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
      }
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Always fetch orders from API on component mount
    fetchAllOrders();

    // Real-time updates via socket
    const handleNewOrder = (newOrder: Orders) => {
      console.log("New order received via socket:", newOrder);
      setOrders((prevOrders) => {
        const exists = prevOrders.some((o) => o.id === newOrder.id);
        if (exists) {
          return prevOrders.map((o) => (o.id === newOrder.id ? newOrder : o));
        }
        return [newOrder, ...prevOrders];
      });
    };

    const handleOrderUpdated = (updatedOrder: Orders) => {
      console.log("Order updated via socket:", updatedOrder);
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
      );
    };

    socket.on("newOrder", handleNewOrder);
    socket.on("orderUpdated", handleOrderUpdated);
    socket.on("payment", handleNewOrder);

    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("orderUpdated", handleOrderUpdated);
      socket.off("payment", handleNewOrder);
    };
  }, []);

  const filterData = [
    {
      name: t("total_orders"),
      value: order.length,
      onClick: () => setStatusFilter(null),
      active: statusFilter === null,
    },
    {
      name: t("fulfilled"),
      value: order.filter((order) => order.status === "FULFILLED").length,
      onClick: () => setStatusFilter("FULFILLED"),
      active: statusFilter === "FULFILLED",
    },
    {
      name: t("paid"),
      value: order.filter((order) => order.status === "PAID").length,
      onClick: () => setStatusFilter("PAID"),
      active: statusFilter === "PAID",
    },
  ];

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
      cell: ({ row }) => <div>{row.original?.user?.role}</div>,
    },
    {
      accessorKey: "total",
      header: t("total"),
      cell: ({ row }) => <div>${row.original?.totalPrice}</div>,
    },
    {
      accessorKey: "status",
      header: () => t("status"),
      cell: ({ row }) => {
        const currentStatus = row.original?.status;
        return (
          <div className="w-32 text-sm rounded-md uppercase">
            {statusMap[currentStatus]
              ? t(statusMap[currentStatus])
              : t(currentStatus)}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredOrders,
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

  console.log(order, "order");

  return (
    <div className="w-full min-w-[350px]">
      <div className="sm:flex my-5 space-y-5 sm:space-y-0 gap-5 items-center justify-start mb-8">
        <SearchInput
          className="w-full"
          placeholder={t("Search_by_patient_name_/_order_number")}
          value={
            (table.getColumn("orderNumber")?.getFilterValue() as string)
              ? (table.getColumn("orderNumber")?.getFilterValue() as string)
              : ((table.getColumn("patient")?.getFilterValue() as string) ?? "")
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
              label={t("from")}
              value={dateFilter.from}
              onChange={(date) => handleDateChange("from", date)}
              slotProps={{
                textField: { size: "small" },
                inputAdornment: {
                  sx: { "& .MuiInputAdornment-root": { marginRight: 1 } },
                },
              }}
              format="dd/MM/yyyy"
            />
            <DatePicker
              label={t("to")}
              value={dateFilter.to}
              onChange={(date) => handleDateChange("to", date)}
              slotProps={{
                textField: { size: "small" },
                inputAdornment: {
                  sx: { "& .MuiInputAdornment-root": { marginRight: 1 } },
                },
              }}
              format="dd/MM/yyyy"
            />
            <Button
              onClick={handleResetFilters}
              variant="outline"
              className="h-10 px-4 py-2 border-primary text-primary hover:bg-primary hover:text-white"
            >
              {t("reset_filters")}
            </Button>
          </Box>
        </LocalizationProvider>
      </div>
      <div className="sm:p-4 p-0 space-y-2 sm:space-x-5 space-x-2">
        {filterData.map((action, index) => (
          <button
            key={index}
            className={`text-primary cursor-pointer w-fit rounded-lg px-6 font-semibold py-2 border-[1.7px] border-primary ${
              (action.name === "Paid" && statusFilter === "PAID") ||
              (action.name === "Fulfilled" && statusFilter === "FULFILLED") ||
              (action.name === "Total Orders" && statusFilter === null)
                ? "bg-primary text-white"
                : ""
            }`}
            onClick={action.onClick}
          >
            {action.name} : {action.value}
          </button>
        ))}
      </div>
      <div className="rounded-md h-dvh overflow-y-scroll py-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-primary">Loading...</div>
          </div>
        ) : (
          <>
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
                      onClick={() => handleViewOrdersSelect(row.original.id)}
                      className="border-t border-[#10847E] hover:bg-gray-100 cursor-pointer"
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
            <div className="sm:flex items-center justify-between px-2 py-4">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-700">
                  {t("page")} {currentPage + 1} of {table.getPageCount()}
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
          </>
        )}
      </div>
    </div>
  );
}
