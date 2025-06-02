"use client";
import { useSession } from "next-auth/react";
import React from "react";
import Home from "./(user)/home/page";
import PharmacyHome from "./(pharmacy)/pharmacyHome/page";


const page = () => {
  const session = useSession();
  const role = session?.data?.user?.role;
  return <>{role === "PHARMACY_STAFF" ? <PharmacyHome /> : <Home />}</>;
};

export default page;
