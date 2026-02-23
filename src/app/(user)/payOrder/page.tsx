"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { getOrderByCode } from "@/services/order";
import OrderCode from "@/components/cart/OrderCode";
import { useLoading } from "@/context/LoadingContext";
import toast from "react-hot-toast";
import { t } from "@/utils/translate";

const PayOrder = () => {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [products, setProducts] = useState<any>(null);
  const { showLoader, hideLoader } = useLoading();
  const router = useRouter();

  const fetchOrderData = async () => {
    try {
      showLoader();
      const res = await getOrderByCode(code || "");
      setProducts(res?.data);
    } catch (error) {
      console.error(t("error_fetching_order"), error);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    if (code) {
      fetchOrderData();
    }
  }, [code]);

  const handlePayNow = async () => {
    try {
      // Redirect to the payment page with order code
      router.push(`/stripe-payment?code=${code}`);
    } catch (error) {
      console.error(t("payment_initialization_error"), error);
      toast.error(t("payment_initialization_error"));
    }
  };

  const handleCodeSubmit = async (submittedCode: string) => {
    try {
      const res = await getOrderByCode(submittedCode);
      const order = res?.data;

      if (!order) {
        toast.error(t("invalid_code"));
        return;
      }

      if (order.status === "PAID" || order.isPaid === true) {
        toast.error(t("this_order_has_already_been_paid."));
        return;
      }

      router.push(`/payOrder?code=${submittedCode}`);
    } catch (error) {
      console.error(t("error_verifying_code"), error);
      toast.error(t("invalid_code"));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {code ? (
        products ? (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:flex-1">
              <div className="space-y-4">
                {products.items.map((product: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-lg flex gap-4 border-2 border-primary-light p-4 px-6"
                  >
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={120}
                      height={120}
                      className="rounded-md object-cover"
                    />
                    <div className="flex-1 border-l-2 pl-5 border-gray-200">
                      <h2 className="font-medium text-lg">{product.name}</h2>
                      <div className="flex justify-between mt-2">
                        <span className="text-gray-600">
                          {t("quantity")}: {product.quantity}
                        </span>
                        <span className="font-semibold">
                          ${product.productPrice}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {t("subtotal")}: $
                          {Number(product.totalSubPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:w-80">
              <div className="border-primary-light border-2 rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">{t("order_summary")}</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span>{t("subtotal")}</span>
                    <span>${Number(products.totalSubAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("delivery_charge")}</span>
                    <span>${Number(products.deliveryPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t("total")}</span>
                    <span>${Number(products.totalAmount).toFixed(2)}</span>
                  </div>
                </div>

                <div className="mb-6 space-y-2">
                  <p className="font-medium flex justify-between">
                    {t("placed_by")}: <p>{products.orderPlacedBy?.name}</p>
                  </p>

                  <p className="font-medium mt-2 flex justify-between">
                    {t("order_code")}: <p className="font-mono">{code}</p>
                  </p>
                </div>

                <Button onClick={handlePayNow} className="w-full text-white">
                  {t("proceed_to_payment")}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <h1 className="text-xl font-medium text-gray-700">
                {t("order_not_found")}
              </h1>
              <Button onClick={() => router.push("/payOrder")} className="mt-4">
                {t("try_another_code")}
              </Button>
            </div>
          </div>
        )
      ) : (
        <div className="">
          <OrderCode onComplete={handleCodeSubmit} />
        </div>
      )}
    </div>
  );
};

export default PayOrder;
