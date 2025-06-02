"use client";

import OrderCode from "@/components/cart/OrderCode";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function OrderCodePage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <OrderCode
        initialCode={code}
        onComplete={(code) => router.push(`/payOrder?code=${code}`)}
      />
    </div>
  );
}
