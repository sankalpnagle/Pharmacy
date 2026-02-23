"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import StripePaymentForm from "@/components/StripePaymentForm";
import { getOrderByCode } from "@/services/order";
import toast from "react-hot-toast";

export default function StripePaymentPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        if (code) {
          const res = await getOrderByCode(code);
          setOrderData(res?.data);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [code]);

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
    }, 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Order not found</p>
        </div>
      </div>
    );
  }

  const amount = Number(orderData.totalAmount);
  const subtotal = Number(orderData.totalSubAmount);
  const deliveryPrice = Number(orderData.deliveryPrice || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment</h1>
          <p className="text-gray-600">Complete your purchase securely</p>
        </div>

        {/* Payment Card Container */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Order Summary */}
          <div className="mb-8 pb-6 border-b">
            <div className="mb-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Order Code</p>
              <p className="font-mono font-bold text-lg text-indigo-600">
                {code}
              </p>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Delivery</span>
              <span className="text-gray-900">${deliveryPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span className="text-indigo-600">${amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Form */}
          <StripePaymentForm
            amount={amount}
            onPaymentSuccess={handlePaymentSuccess}
            orderCode={code}
          />

          {/* Success Message */}
          {paymentSuccess && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold">
                ✓ Payment Successful!
              </p>
              <p className="text-green-700 text-sm mt-1">
                Your order has been confirmed.
              </p>
            </div>
          )}

          {/* Secure Badge */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <span>🔒</span>
              Your payment information is secure and encrypted
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Secure payment processing for {orderData.orderPlacedBy?.name}
        </p>
      </div>
    </div>
  );
}
