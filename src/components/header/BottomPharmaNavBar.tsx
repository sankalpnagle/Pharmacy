"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MdHome } from "react-icons/md";
import { BiEdit } from "react-icons/bi";
import { RxDashboard } from "react-icons/rx";
import { BsPerson } from "react-icons/bs";
import { IoTriangle } from "react-icons/io5";
import UserIcon from "@/../public/icons/faUserCircle.svg";
import RightArrow from "@/../public/icons/Primary.svg";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSession, signOut } from "next-auth/react";
import { useModal } from "@/hooks/useModal";
import GlobalAuthModal from "../auth/GlobalAuthModal";
import toast from "react-hot-toast";
import { t } from "@/utils/translate";

const BottomPharmaNavBar = () => {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;
  const { openModal } = useModal();
  const session = useSession();
  const router = useRouter();

  const handleLogout = () => {
    signOut({ callbackUrl: process.env.NEXT_PUBLIC_BASE_URL });
    localStorage.clear();
    toast.success(t("logout_successfully"));
  };

  const navLinks = [
    { label: t("home"), path: "/", Icon: MdHome },
    { label: t("edit_product"), path: "/addProduct", Icon: BiEdit },
    { label: t("dashboard"), path: "/dashboard", Icon: RxDashboard },
  ];

  return (
    <>
      <nav className="bg-[#10847E] rounded-t-[14px] sm:hidden block fixed bottom-0 left-0 w-full z-50 shadow-lg">
        <ul className="flex justify-around items-center w-full h-20 px-4 text-white">
          {navLinks.map(({ label, path, Icon }) => (
            <li key={label}>
              <Link
                href={path}
                className={`flex flex-col items-center text-xs gap-1 transition-all px-2 py-1 rounded-md ${
                  isActive(path)
                    ? "bg-white text-[#10847E]"
                    : "hover:text-gray-200"
                }`}
              >
                <Icon className="text-2xl" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
          {/* 
          <li className="hover:cursor-pointer">
            <Popover>
              <PopoverTrigger>
                {session?.data?.user?.image ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                    <img
                      src={session?.data?.user?.image}
                      alt={t("user")}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <UserIcon className="w-6 h-6" />
                )}
              </PopoverTrigger>
              <PopoverContent className="bg-white rounded-lg border border-[#10847E] py-2 w-36 shadow-xl">
                <IoTriangle
                  className="absolute right-5 -top-4 text-white text-xl"
                  style={{ stroke: "#10847E", strokeWidth: "20" }}
                />
                {session.data?.user ? (
                  <>
                    <button
                      onClick={() => router.push("/profile")}
                      className="flex items-center px-3 py-1 text-sm text-black hover:bg-gray-100 w-full"
                    >
                      <BsPerson className="mr-2" />
                      {t("profile")}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center px-3 py-1 text-sm text-[#F62626] hover:bg-gray-100 w-full"
                    >
                      <RightArrow className="w-4 h-4 rotate-180 mr-2" />
                      {t("logout")}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => openModal("signin")}
                    className="flex items-center px-3 py-1 text-sm text-primary hover:bg-gray-100 w-full"
                  >
                    <RightArrow className="w-4 h-4 mr-2" />
                    {t("login")}
                  </button>
                )}
              </PopoverContent>
            </Popover>
          </li> */}
        </ul>
      </nav>

      <GlobalAuthModal />
    </>
  );
};

export default BottomPharmaNavBar;
