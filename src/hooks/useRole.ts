// hooks/useRole.ts
"use client";

import { useSession } from "next-auth/react";

export const useRole = () => {
  const { data: session, status } = useSession();
  const role = session?.user?.role;

  return {
    role,
    isUser: role === "USER",
    isDoctor: role === "DOCTOR",
    isPharmacyStaff: role === "PHARMACY_STAFF",
    isAdmin: role === "ADMIN",
    loading: status === "loading",
  };
};
