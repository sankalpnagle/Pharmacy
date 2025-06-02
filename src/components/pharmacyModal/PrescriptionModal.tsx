"use client";
import { RootState } from "@/redux/store";
import React, { useState } from "react";
import { useSelector } from "react-redux";
const PrescriptionModal = () => {
  const OrderData = useSelector((state: RootState) => state.order.orderData);
  return (
    <div className="w-full px-3">
      {}
      <img
        src={OrderData?.prescription?.prescriptionImageUrl}
        alt="Prescription"
        className="mt-4 w-full rounded shadow-lg"
      />
    </div>
  );
};

export default PrescriptionModal;
