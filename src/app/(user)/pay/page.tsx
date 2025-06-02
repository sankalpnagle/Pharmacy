"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { t } from "@/utils/translate";

export default function PayPage() {
  const [orderCode, setOrderCode] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [amount, setAmount] = useState(0);
  const [step, setStep] = useState<"ENTER_CODE" | "PAY">("ENTER_CODE");

  const stripe = useStripe();
  const elements = useElements();

  const handleGetPaymentIntent = async () => {
    const res = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderCode }),
    });

    const data = await res.json();
    if (data.error) return alert(data.error);

    setClientSecret(data.clientSecret);
    setAmount(data.amount);
    setStep("PAY");
  };

  const handlePayment = async () => {
    if (!stripe || !elements) return alert(t("stripe_not_loaded"));

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href, // Or a custom thank-you page
      },
    });

    if (result.error) {
      alert(t("payment_failed", { message: result.error.message }));
    } else {
      // No need to check status here if you're using return_url
      alert(t("payment_confirmed"));
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 mt-10 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">{t("pay_for_your_order")}</h2>

      {step === "ENTER_CODE" ? (
        <>
          <input
            type="text"
            placeholder={t("enter_4_digit_order_code")}
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          />
          <button
            onClick={handleGetPaymentIntent}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {t("proceed_to_payment")}
          </button>
        </>
      ) : (
        <>
          <p className="mb-4">
            {t("order_amount")}: ₹{amount}
          </p>

          <PaymentElement />
          {/* className="p-2 border rounded mb-4" /> */}
          <button
            onClick={handlePayment}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {t("pay_now")}
          </button>
        </>
      )}
    </div>
  );
}
