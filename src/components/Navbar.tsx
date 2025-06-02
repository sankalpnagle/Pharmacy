"use client";
import { useSession } from "next-auth/react";
import React from "react";
import UserHeader from "./header/UserHeader";
import PharmacyHeader from "./header/PharmacyHeader";
import BottomNavBar from "./header/BottomNavBar";
import BottomPharmaNavBar from "./header/BottomPharmaNavBar";

const Navbar = () => {
  const session = useSession();
  const role = session?.data?.user?.role;
  return (
    <>
      {role === "PHARMACY_STAFF" ? (
        <>
          <PharmacyHeader /> <BottomPharmaNavBar />
        </>
      ) : (
        <>
          <UserHeader />
          <BottomNavBar />
        </>
      )}
    </>
  );
};

export default Navbar;
