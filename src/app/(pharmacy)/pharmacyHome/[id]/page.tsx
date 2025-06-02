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
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/useModal";
import GlobalAuthModal from "@/components/auth/GlobalAuthModal";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { setOrder } from "@/redux/slices/orderSlice";
import { getOrderByOrderId } from "@/services/order";
import { RootState } from "@/redux/store";
import { useParams } from "next/navigation";
import { formatDate } from "@/utils/formatDate";
import { updateOrderStatus } from "@/services/payment";
import { useLoading } from "@/context/LoadingContext";
import { t } from "@/utils/translate";

const SingleOrderById = () => {
  const params = useParams();
  const id = params.id as string;
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const { activeModal, openModal, closeModal } = useModal();
  const OrderData = useSelector((state: RootState) => state.order.orderData);
  const [statuesData, setStatuesData] = useState([]);
  const [paymentData, setPaymentData] = useState();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const dispatch = useDispatch();
  const { showLoader, hideLoader } = useLoading();
  const router = useRouter();

  const fetchOrderData = async () => {
    try {
      showLoader();
      const res = await getOrderByOrderId(id);
      setData(res?.data?.orderItems);
      setStatuesData(res?.data?.statusChanges);
      setPaymentData(res?.data?.payment);
      dispatch(setOrder(res?.data));
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    fetchOrderData();
    if (shouldRefetch) {
      fetchOrderData();
      setShouldRefetch(false);
    }
  }, [shouldRefetch]);

  console.log(data, "data");

  const handleFullfill = async () => {
    try {
      showLoader();
      const res = await updateOrderStatus(id, "fulfill");
      if (res?.status === 200) {
        router.push(`/pharmacyHome`);
        fetchOrderData();
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      hideLoader();
    }
  };

  const columns = [
    {
      accessorKey: "id",
      header: t("ndc_product_id"),
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

  console.log(OrderData?.status);

  const renderActionButtons = () => {
    const status = OrderData?.status;
    const hasPaidStatus = statuesData.some(
      (change) => change.action === "PAID"
    );

    // Show all buttons if status is PLACED
    if (status === "PLACED") {
      return (
        <Button
          variant="outline"
          className="text-dangerous border-2 rounded-xl"
          onClick={() => {
            setShowModal(true);
            openModal("rejectOrder");
          }}
        >
          {t("reject")}
        </Button>
      );
    }

    // Default handling for other statuses
    switch (status) {
      case "PAID":
        return (
          <>
            <Button onClick={handleFullfill} className="text-white rounded-xl">
              {t("fulfill")}
            </Button>
            <Button
              variant="outline"
              className="text-primary border-2 rounded-xl"
              onClick={() => {
                setShowModal(true);
                openModal("refundOrder");
              }}
            >
              {t("refund")}
            </Button>
            <Button
              variant="outline"
              className="text-dangerous border-2 rounded-xl"
              onClick={() => {
                setShowModal(true);
                openModal("rejectOrder");
              }}
            >
              {t("reject")}
            </Button>
          </>
        );

      case "FULFILLED":
      case "REFUND":
        return null;

      case "REJECT":
      case "CANCEL":
        return hasPaidStatus ? (
          <Button
            variant="outline"
            className="text-primary border-2 rounded-xl"
            onClick={() => {
              setShowModal(true);
              openModal("refundOrder");
            }}
          >
            {t("refund")}
          </Button>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <>
      <div className=" mx-3 my-7 space-y-3 min-w-[300px]">
        <div className="sm:flex justify-between">
          <div className="space-y-1">
            <h1 className="font-semibold text-lg">
              {t("ordered_by")}: {OrderData?.user?.name}
            </h1>
            <h1 className="font-semibold text-lg">
              {t("for")}:{" "}
              {OrderData?.patient?.name ? OrderData?.patient?.name : ""}
            </h1>
          </div>
          {OrderData?.prescription && (
            <Button
              variant={"default"}
              onClick={() => {
                setIsDialogOpen(true);
                openModal("prescriptionView");
              }}
              className="rounded-[12px] text-white sm:mt-0 mt-4 bg-primary border-2 h-[40px]"
            >
              {t("view_prescription")}
            </Button>
          )}
        </div>
        <div className="flex">
          <div className="mt-4 sm:block hidden overflow-x-auto">
            <table className="min-w-[700px] w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4">{t("date_time")}</th>
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
                      <td className="py-3 px-4">{t(order.action)}</td>
                      <td className="py-3 px-4">{order.comment}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <ul className="w-full block sm:hidden  space-y-4">
          {statuesData.map((order, index) => {
            const { longFormat, shortFormat } = formatDate(order.actionDate);

            return (
              <li key={index} className=" p-4">
                <div className="mb-2">
                  <span className="font-medium text-gray-700">
                    {t("date_time")}:
                  </span>
                  <div className="text-sm text-gray-900">{shortFormat}</div>
                  <div className="text-xs text-gray-500">{longFormat}</div>
                </div>

                <div className="mb-2">
                  <span className="font-medium text-gray-700">
                    {t("status")}:
                  </span>
                  <div className="text-sm text-gray-900">{order.action}</div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">
                    {t("comments")}:
                  </span>
                  <div className="text-sm text-gray-900">{order.comment}</div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex gap-x-5">{renderActionButtons()}</div>
        <div className="mt-10">
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
                    {t("no_results")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {/* <table className="ml-auto relative right-56 mt-8 w-fit">
            <tbody>
              <tr>
                <td className="font-semibold py-1 pr-7">Delivery Amount:</td>
                <td className="py-1">${OrderData?.deliveryPrice}</td>
              </tr>
              <tr>
                <td className="font-semibold py-1 pr-7">Total Amount:</td>
                <td className="py-1">${OrderData?.totalPrice}</td>
              </tr>
            </tbody>
          </table> */}
        </div>
      </div>

      {showModal && <GlobalAuthModal setShouldRefetch={setShouldRefetch} />}
    </>
  );
};

export default SingleOrderById;
