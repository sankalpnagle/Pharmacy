"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Confetti from "react-confetti";
import { useEffect, useState } from "react";
import { confirmOrder } from "@/services/payment";
import { t } from "@/utils/translate";

export default function PaymentStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(false);

  // Get parameters from URL
  const paymentIntent = searchParams.get("payment_intent");
  const paymentStatus = searchParams.get("redirect_status");

  const isSuccess = paymentStatus === "succeeded";
  const message = isSuccess
    ? t("your_order_has_been_paid!")
    : t("there_was_an_issue_processing_your_payment.");

  useEffect(() => {
    if (!paymentIntent || paymentStatus !== "succeeded") return;

    let isMounted = true;
    const abortController = new AbortController();

    const confirmPayment = async () => {
      try {
        const res = await confirmOrder({ paymentIntentId: paymentIntent });

        if (!isMounted) return;

        if (res.status === 200) {
          console.log(t("payment_confirmed_and_order_updated"));
        } else {
          console.warn(t("failed_to_update_order_status"));
        }
      } catch (err) {
        if (!isMounted) return;
        if (err.name !== "AbortError") {
          console.error(t("error_confirming_payment"), err);
        }
      }
    };

    confirmPayment();

    return () => {
      isMounted = false;
      abortController.abort(); // Cancel the request if component unmounts
    };
  }, [paymentIntent, paymentStatus]);

  // Confetti effect - optimized with cleanup
  useEffect(() => {
    if (!isSuccess) return;

    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 5000);

    return () => {
      clearTimeout(timer);
      setShowConfetti(false); // Immediate cleanup
    };
  }, [isSuccess]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-gray-50">
      {showConfetti && (
        <Confetti
          width={typeof window !== "undefined" ? window.innerWidth : 0}
          height={typeof window !== "undefined" ? window.innerHeight : 0}
        />
      )}

      <div
        className={`flex flex-col items-center p-6 rounded-xl shadow-lg max-w-md w-full ${
          isSuccess
            ? "bg-green-50 border border-green-200"
            : "bg-red-50 border border-red-200"
        }`}
      >
        {isSuccess ? (
          <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
        ) : (
          <XCircle className="w-16 h-16 text-red-600 mb-4" />
        )}

        <h1
          className={`text-2xl font-bold mb-2 ${
            isSuccess ? "text-green-700" : "text-red-700"
          }`}
        >
          {isSuccess ? t("payment_successful!") : t("payment_failed")}
        </h1>

        <p className="text-gray-700 text-lg mb-4">{message}</p>

        {paymentIntent && (
          <p className="text-sm text-gray-500 mb-4">
            {t("payment_id")}:{" "}
            <span className="font-mono">{paymentIntent}</span>
          </p>
        )}

        <button
          onClick={() => router.push("/")}
          className={`px-6 py-2 rounded transition font-semibold ${
            isSuccess
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          {t("back_to_home")}
        </button>
      </div>
    </div>
  );
}
