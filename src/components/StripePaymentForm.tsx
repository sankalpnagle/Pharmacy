"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface StripePaymentFormProps {
  amount: number;
  onPaymentSuccess?: () => void;
  orderCode?: string | null;
}

export default function StripePaymentForm({
  amount,
  onPaymentSuccess,
  orderCode,
}: StripePaymentFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvc: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardType, setCardType] = useState<
    "visa" | "mastercard" | "amex" | null
  >(null);

  // Detect card type
  const detectCardType = (cardNumber: string) => {
    const visa = /^4[0-9]{12}(?:[0-9]{3})?$/;
    const mastercard = /^5[1-5][0-9]{14}$/;
    const amex = /^3[47][0-9]{13}$/;

    if (visa.test(cardNumber)) setCardType("visa");
    else if (mastercard.test(cardNumber)) setCardType("mastercard");
    else if (amex.test(cardNumber)) setCardType("amex");
    else setCardType(null);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s/g, "");
    value = value.replace(/[^0-9]/g, "");

    // Add spaces every 4 digits
    const formattedValue = value.replace(/(\d{4})(?=\d)/g, "$1 ");

    setFormData({ ...formData, cardNumber: formattedValue });
    detectCardType(value);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }
    setFormData({ ...formData, expiryDate: value });
  };

  const handleCVCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setFormData({ ...formData, cvc: value });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = "Cardholder name is required";
    }

    const cardNumber = formData.cardNumber.replace(/\s/g, "");
    if (!cardNumber || cardNumber.length < 13) {
      newErrors.cardNumber = "Valid card number is required";
    }

    if (!formData.expiryDate || formData.expiryDate.length !== 5) {
      newErrors.expiryDate = "Valid expiry date is required (MM/YY)";
    } else {
      const [month, year] = formData.expiryDate.split("/");
      if (parseInt(month) > 12) {
        newErrors.expiryDate = "Invalid month";
      }
    }

    if (!formData.cvc || formData.cvc.length < 3) {
      newErrors.cvc = "Valid CVC is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({}); // Clear previous errors

    try {
      // Save payment to database
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderCode,
          amount,
          payerName: formData.cardholderName,
          cardLast4: formData.cardNumber.slice(-4),
          transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Payment API error:", data);
        setErrors({ submit: data.error || "Payment processing failed" });
        setLoading(false);
        return;
      }

      console.log("Payment successful:", data);

      // Clear errors and show success
      setErrors({});
      setFormData({
        cardholderName: "",
        cardNumber: "",
        expiryDate: "",
        cvc: "",
      });

      // Success response
      onPaymentSuccess?.();

      // Redirect after success
      setTimeout(() => {
        router.push(`/payOrder/status?status=success&code=${orderCode}`);
      }, 2000);
    } catch (error) {
      console.error("Payment error:", error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Payment failed. Please try again.",
      });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cardholder Name */}
      <div>
        <label
          htmlFor="cardholderName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Cardholder Name
        </label>
        <input
          type="text"
          id="cardholderName"
          placeholder="John Doe"
          value={formData.cardholderName}
          onChange={(e) =>
            setFormData({ ...formData, cardholderName: e.target.value })
          }
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
            errors.cardholderName
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-indigo-500"
          }`}
          disabled={loading}
        />
        {errors.cardholderName && (
          <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>
        )}
      </div>

      {/* Card Number */}
      <div>
        <label
          htmlFor="cardNumber"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Card Number
        </label>
        <div className="relative">
          <input
            type="text"
            id="cardNumber"
            placeholder="4242 4242 4242 4242"
            value={formData.cardNumber}
            onChange={handleCardNumberChange}
            maxLength={19}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
              errors.cardNumber
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-indigo-500"
            }`}
            disabled={loading}
          />
          {cardType && (
            <div className="absolute right-3 top-3 text-sm font-semibold text-gray-600">
              {cardType.toUpperCase()}
            </div>
          )}
        </div>
        {errors.cardNumber && (
          <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
        )}
      </div>

      {/* Expiry and CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="expiryDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Expiry Date
          </label>
          <input
            type="text"
            id="expiryDate"
            placeholder="MM/YY"
            value={formData.expiryDate}
            onChange={handleExpiryChange}
            maxLength={5}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
              errors.expiryDate
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-indigo-500"
            }`}
            disabled={loading}
          />
          {errors.expiryDate && (
            <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="cvc"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            CVC
          </label>
          <input
            type="text"
            id="cvc"
            placeholder="123"
            value={formData.cvc}
            onChange={handleCVCChange}
            maxLength={4}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
              errors.cvc
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-indigo-500"
            }`}
            disabled={loading}
          />
          {errors.cvc && (
            <p className="text-red-500 text-sm mt-1">{errors.cvc}</p>
          )}
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Pay Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </button>

      {/* Test Card Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <p className="font-semibold mb-1">Test Card Numbers:</p>
        <ul className="text-xs space-y-1">
          <li>Visa: 4242 4242 4242 4242</li>
          <li>Mastercard: 5555 5555 5555 4444</li>
          <li>Amex: 3782 822463 10005</li>
        </ul>
        <p className="mt-2">Expiry: Any future date (MM/YY)</p>
        <p>CVC: Any 3-4 digits</p>
      </div>
    </form>
  );
}
