"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FaHome,
  FaBox,
  FaDollarSign,
  FaShoppingCart,
  FaUserCircle,
} from "react-icons/fa";
import { IoChevronForward } from "react-icons/io5";
import { IoTriangle } from "react-icons/io5";
import { BsPerson } from "react-icons/bs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useModal } from "@/hooks/useModal";
import Image from "next/image";
import { useSession, SessionProvider, signOut } from "next-auth/react";
import GlobalAuthModal from "../auth/GlobalAuthModal";
import toast from "react-hot-toast";
import logo from "@/../public/logo/logo-2.png";
import { t } from "@/utils/translate";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const UserHeader = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const { activeModal, openModal, closeModal } = useModal();
  const session = useSession();
  const router = useRouter();

  const productQuantity = useSelector(
    (state: RootState) => state.cart.productQuantity,
  );

  const handleLogout = () => {
    signOut({ callbackUrl: process.env.NEXT_PUBLIC_BASE_URL });
    localStorage.clear();
    toast.success(t("logout_successfully"));
  };

  console.log(session.status, "status");

  return (
    <>
      <nav className="bg-[#10847E] py-2 min-w-[640px] sm:block hidden rounded-[14px] my-2">
        <div className="flex justify-between relative flex-wrap min-w-[320px] items-center text-white px-5 mx-auto">
          <Link href={"/"}>
            <Image
              // width={165}
              className="absolute w-32  -top-1.5"
              src={logo}
              alt={t("logo")}
            />
          </Link>

          <ul className="flex flex-wrap md:gap-x-6 items-center">
            <li>
              <Link
                href="/"
                className={`flex items-center gap-2 px-2 h-10  rounded-lg ${
                  isActive("/")
                    ? " bg-white text-[#10847E]"
                    : "hover:text-gray-200"
                }`}
              >
                <FaHome
                  className={isActive("/") ? "text-yellow-400" : "text-white"}
                />
                <span>{t("home")}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/category"
                className={`flex items-center gap-2 px-2 h-10  rounded-lg ${
                  isActive("/category")
                    ? " bg-white text-[#10847E]"
                    : "hover:text-gray-200"
                }`}
              >
                <FaBox
                  className={
                    isActive("/category") ? "text-[#10847E]" : "text-white"
                  }
                />
                <span>{t("categories")}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/payOrder "
                className={`flex items-center gap-2 px-2 h-10  rounded-lg ${
                  isActive("/payOrder")
                    ? " bg-white text-[#10847E]"
                    : "hover:text-gray-200"
                }`}
              >
                <FaDollarSign
                  className={
                    isActive("/payOrder") ? "text-yellow-400" : "text-white"
                  }
                />
                <span>{t("pay_order")}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/cart"
                className={`relative flex items-center gap-2 px-2 h-10 rounded-lg ${
                  isActive("/cart")
                    ? "bg-white text-[#10847E]"
                    : "hover:text-gray-200"
                }`}
              >
                <FaShoppingCart
                  className={
                    isActive("/cart") ? "text-yellow-400" : "text-white"
                  }
                />

                {/* ✅ LIVE BADGE */}
                {productQuantity > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                    {productQuantity}
                  </span>
                )}

                <span>{t("cart")}</span>
              </Link>
            </li>
            <li className="hover:cursor-pointer">
              <div>
                <Popover>
                  <PopoverTrigger>
                    {session?.data?.user?.image ? (
                      <div className="w-[3.5rem] relative top-1 h-[3.5rem] hover:cursor-pointer rounded-full overflow-hidden">
                        <img
                          className="w-[8rem] h-[4rem] object-cover"
                          src={session?.data?.user?.image}
                          alt={t("user_profile_image")}
                        />
                      </div>
                    ) : (
                      <FaUserCircle className="mt-1.5 hover:cursor-pointer text-2xl" />
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="bg-[#FFFFFF] rounded-lg  border-[#10847E] py-2.5 absolute -right-7 top-[12px] w-[8.5rem] mx-auto">
                    <div>
                      <IoTriangle
                        className="absolute right-4 -top-[19px] text-[#FFFFFF] text-xl"
                        style={{
                          stroke: "#10847E",
                          strokeWidth: "20",
                          zIndex: "",
                        }}
                      />
                      {session.data?.user ? (
                        <>
                          <button
                            onClick={() => router.push("/profile")}
                            className="flex gap-x-1 items-center hover:cursor-pointer"
                          >
                            <BsPerson
                              className="scale-110"
                              style={{ strokeWidth: "0.5" }}
                            />
                            <span className="ml-1.5"> {t("profile")}</span>
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex gap-x-1 items-center hover:cursor-pointer"
                          >
                            <IoChevronForward className="w-4 mt-0.5 text-[#F62626] rotate-180" />
                            <span className="ml-1.5 text-[#F62626] font-medium">
                              {" "}
                              {t("logout")}
                            </span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openModal("signin")}
                          className="flex gap-x-1 items-center hover:cursor-pointer"
                        >
                          <IoChevronForward className="w-4 mt-0.5 text-primary" />
                          <span className="text-primary font-medium ml-1.5">
                            {" "}
                            {t("login")}
                          </span>
                        </button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </li>
          </ul>
        </div>
      </nav>
      <>
        <GlobalAuthModal />
      </>
      <nav className="bg-[#10847E] block sm:hidden rounded-[14px] my-2">
        <div className="flex justify-between relative flex-wrap min-w-[320px] items-center text-white px-5 mx-auto">
          <Link href={"/"}>
            <Image
              // width={150}
              className="absolute w-24 sm:hidden block left-1 -top-1"
              src={logo}
              alt={t("logo")}
            />
          </Link>

          <ul className="flex flex-wrap md:gap-x-6 items-center">
            <li className="hover:cursor-pointer">
              <div>
                <Popover>
                  <PopoverTrigger>
                    {session?.data?.user?.image ? (
                      <div className="w-[3.5rem] relative top-1 h-[3.5rem] hover:cursor-pointer rounded-full overflow-hidden">
                        <img
                          className="w-[8rem] h-[4rem] object-cover"
                          src={session?.data?.user?.image}
                          alt={t("user_profile_image")}
                        />
                      </div>
                    ) : (
                      <FaUserCircle className="mt-1.5 hover:cursor-pointer text-2xl" />
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="bg-[#FFFFFF] rounded-lg  border-[#10847E] py-2.5 absolute -right-7 top-[12px] w-[8.5rem] mx-auto">
                    <div>
                      <IoTriangle
                        className="absolute right-4 -top-[19px] text-[#FFFFFF] text-xl"
                        style={{
                          stroke: "#10847E",
                          strokeWidth: "20",
                          zIndex: "",
                        }}
                      />
                      {session.data?.user ? (
                        <>
                          <button
                            onClick={() => router.push("/profile")}
                            className="flex gap-x-1 items-center hover:cursor-pointer"
                          >
                            <BsPerson
                              className="scale-110"
                              style={{ strokeWidth: "0.5" }}
                            />
                            <span className="ml-1.5"> {t("profile")}</span>
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex gap-x-1 items-center hover:cursor-pointer"
                          >
                            <IoChevronForward className="w-4 mt-0.5 text-[#F62626] rotate-180" />
                            <span className="ml-1.5 text-[#F62626] font-medium">
                              {" "}
                              {t("logout")}
                            </span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openModal("signin")}
                          className="flex gap-x-1 items-center hover:cursor-pointer"
                        >
                          <IoChevronForward className="w-4 mt-0.5 text-primary" />
                          <span className="text-primary font-medium ml-1.5">
                            {" "}
                            {t("login")}
                          </span>
                        </button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
};

export default UserHeader;
