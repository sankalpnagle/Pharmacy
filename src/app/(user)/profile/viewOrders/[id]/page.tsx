"use client";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { getOrderByOrderId, cancelOrder } from "@/services/order";
import { useParams, useRouter } from "next/navigation";
import { formatDate } from "@/utils/formatDate";
import { useRole } from "@/hooks/useRole";
import GlobalAuthModal from "@/components/auth/GlobalAuthModal";
import { useModal } from "@/hooks/useModal";
import { useDispatch, useSelector } from "react-redux";
import { setOrder } from "@/redux/slices/orderSlice";
import { RootState } from "@/redux/store";
import { addToCart, repeatOrder } from "@/redux/slices/cartSlice";
import toast from "react-hot-toast";
import { t } from "@/utils/translate";

type Products = {
  id: string;
  name: string;

  quantity: string;
};

const SingleOrderPage = () => {
  const params = useParams();
  const id = params.id as string;

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [data, setData] = useState([]);
  const OrderData = useSelector((state: RootState) => state.order.orderData);
  const [statuesData, setStatuesData] = useState([]);
  const [paymentData, setPaymentData] = useState();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { activeModal, openModal, closeModal } = useModal();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isDoctor } = useRole();
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchOrderData = async () => {
    try {
      const res = await getOrderByOrderId(id);

      if (res?.data) {
        setData(res.data.orderItems);
        setStatuesData(res.data.statusChanges);
        setPaymentData(res.data.payment);
        dispatch(setOrder(res.data));
      } else {
        console.error(t("no_order_data_found"));
      }
    } catch (error) {
      console.error(t("error_fetching_order_data"), error);
      toast.error(t("failed_to_fetch_order_data"));
    }
  };

  useEffect(() => {
    fetchOrderData();
  }, []);

  console.log(data, "data");

  const columns: ColumnDef<Products>[] = [
    {
      accessorKey: "id",
      header: t("ndc_(product_id)"),
      cell: ({ row }) => (
        <div className="lowercase">
          {row.original.productDetails?.medicineCode || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => (
        <div className="lowercase">
          {row.original.productDetails?.name || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: t("quantity"),
      cell: ({ row }) => <div>{row.getValue("quantity")}</div>,
    },
    {
      accessorKey: "price",
      header: t("price"),
      cell: ({ row }) => (
        <div className="lowercase">
          ${row.original.productDetails?.price || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "subtotal",
      header: t("subtotal_price"),
      cell: ({ row }) => (
        <div className="lowercase">
          ${row.original.productDetails?.price * row.original.quantity || "N/A"}
        </div>
      ),
    },
  ];

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

  const handleCart = () => {
    data.forEach((item) => {
      dispatch(
        repeatOrder({
          id: item.productId, // using productId as cart item ID
          quantity: item.quantity,
          name: item?.productDetails?.name,
          price: item?.productDetails?.price,
          imageUrl: item.productDetails?.imageUrl,
          requiresPrescription: item.productDetails?.requiresPrescription,
          weight: item.productDetails?.weight || 0,
        })
      );
    });

    router.push("/cart");
  };

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      const response = await cancelOrder(params.id);

      if (!response.data.success) {
        throw new Error(response.data.message || t("failed_to_cancel_order"));
      }

      toast.success(t("order_cancelled_successfully"));
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || t("failed_to_cancel_order"));
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <main className="h-screen px-6">
      <div className="sm:flex justify-between gap-4 my-7  font-medium">
        <div className="basis-1/5 sm:block hidden ml-5">
          <div>
            <h1 className="text-xl mb-4">
              {t("order_status_history")} ({t("order_no")}{" "}
              {OrderData?.orderNumber})
            </h1>
            <div className="mt-2">
              <table className="min-w-[700px] w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">{t("date/time")}</th>
                    <th className="text-left py-3 px-4">{t("status")}</th>
                    <th className="text-left py-3 px-4">{t("comments")}</th>
                  </tr>
                </thead>
                <tbody>
                  {statuesData.map((order, index) => {
                    const { longFormat, shortFormat } = formatDate(
                      order.actionDate
                    );

                    return (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div>
                            <div>{shortFormat}</div>
                            <div className="text-black opacity-50 text-xs">
                              {longFormat}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{order.action}</td>
                        <td className="py-3 px-4">{order.comment}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="basis-1/5 ml-5 block sm:hidden">
          <div>
            <h1 className="text-xl mb-4">{t("order_status_history")}</h1>
            <div className="mt-2 space-y-4">
              {statuesData.map((order, index) => {
                const { longFormat, shortFormat } = formatDate(
                  order.actionDate
                );

                return (
                  <div key={index} className="border-b p-4  space-y-1">
                    <div className="text-sm font-medium text-gray-800">
                      {shortFormat}
                    </div>
                    <div className="text-xs text-gray-500">{longFormat}</div>
                    <div className="text-sm text-primary font-semibold">
                      {order.action}
                    </div>
                    <div className="text-sm text-gray-700">{order.comment}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="basis-1/7 flex flex-col justify-between">
          <div className="flex sm:flex-col gap-x-4">
            <h1 className="sm:text-2xl">{t("paid_by")}</h1>
            <h2 className="text-[18px]">{paymentData?.payerName}</h2>
          </div>
          {isDoctor && (
            <div className="flex sm:flex-col gap-x-4">
              <h1 className="sm:text-2xl">{t("patient")}</h1>
              <h2 className="text-[18px]">{OrderData?.patient?.name}</h2>
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between mb-7">
        <div className="flex gap-2">
          <Button
            variant={"outline"}
            onClick={handleCart}
            className="rounded-[12px] text-primary border-2 w-[100px]"
          >
            {t("repeat")}
          </Button>
          {(OrderData?.status === "PAID" || OrderData?.status === "PLACED") && (
            <Button
              variant={"outline"}
              className="rounded-[12px] text-dangerous border-2 w-[100px]"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? t("cancelling") : t("cancel")}
            </Button>
          )}
        </div>
        {!OrderData?.prescription == null && (
          <Button
            variant={"default"}
            onClick={() => {
              setIsDialogOpen(true);
              openModal("prescriptionView");
            }}
            className="rounded-[12px] text-white bg-primary border-2 h-[40px]"
          >
            {t("view_prescription")}
          </Button>
        )}
      </div>
      <div className="rounded-md">
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
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {/* <table className="ml-auto relative right-48 mt-8 w-fit">
          <tbody>
            <tr>
              <td className="font-semibold py-1 pr-7">{t("delivery_amount")}</td>
              <td className="py-1">${OrderData?.deliveryPrice}</td>
            </tr>
            <tr>
              <td className="font-semibold py-1 pr-7">{t("total_amount")}</td>
              <td className="py-1">${OrderData?.totalPrice}</td>
            </tr>
          </tbody>
        </table> */}
      </div>
      {isDialogOpen && <GlobalAuthModal />}
    </main>
  );
};

export default SingleOrderPage;
