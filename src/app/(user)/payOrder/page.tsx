"use client";
import { Button } from "@/components/ui/button";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { callCreatePaymentApi } from "@/services/payment";
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { getOrderByCode } from "@/services/order";
import OrderCode from "@/components/cart/OrderCode";
import { useLoading } from "@/context/LoadingContext";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { t } from "@/utils/translate";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

function CheckoutForm({
  clientSecret,
  amount,
}: {
  clientSecret: string;
  amount: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";
  const { data: session } = useSession();

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/payOrder/status`;

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
      });
    } catch (error) {
      console.error(t("payment_error"), error);
      alert(t("payment_failed_please_try_again"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">{t("complete_payment")}</h2>
        <p className="mb-4">
          {t("order_amount")}: ${amount}
        </p>
        <PaymentElement />
        <Button
          onClick={handleSubmit}
          className="mt-4 text-white w-full"
          disabled={!stripe || loading}
        >
          {loading ? t("processing") : t("pay_now")}
        </Button>
      </div>
    </div>
  );
}

const PayOrder = () => {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(0);
  const [products, setProducts] = useState<any>(null);
  const { showLoader, hideLoader } = useLoading();
  const router = useRouter();
  const { data: session } = useSession();

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
      showLoader();
      const { data } = await callCreatePaymentApi({ orderCode: code || "" });
      setClientSecret(data?.clientSecret);
      setAmount(data?.amount);
    } catch (error) {
      console.error(t("payment_initialization_error"), error);
      const message = error?.response?.data?.error;
      toast.error(message);
    } finally {
      hideLoader();
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
      {clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} amount={amount} />
        </Elements>
      ) : code ? (
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
