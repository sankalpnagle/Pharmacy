"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import logo from "@/../public/logo/logo-2.png";
import Image from "next/image";
import { t } from "@/utils/translate";

const Footer = () => {
  const pathname = usePathname();
  const hideFooterPages = [""];
  const shouldShowFooter = !hideFooterPages.includes(pathname);
  return (
    <>
      {shouldShowFooter && (
        <footer className="bg-primary min-w-[640px] rounded-[14px] my-2  text-white ">
          <section className="sm:flex sm:justify-between w-11/12 mx-auto pt-8 pb-7">
            <div className="">
              <Image width={170} className="" src={logo} alt="Logo" />

              <div className="mt-3 text-sm">
                <p>{t("address")}</p>
                <p>{t("phone")}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 mt-4 sm: sm:mt-0 sm:gap-52  sm:mr-11">
              <div>
                <h1 className="font-semibold">{t("support")}</h1>
                <ul className="mt-2 text-sm space-y-4 leading-6">
                  <li>{t("contact_us")}</li>
                  {/* <li>Link 2</li> */}
                </ul>
              </div>
              <div>
                <h1 className="font-semibold">{t("legal")}</h1>
                <ul className="mt-2 text-sm space-y-4 leading-6 ">
                  <Link href={"/privacy_policy"}>
                    <li>{t("privacy_policy")}</li>
                  </Link>
                  <Link href={"/terms_conditions"}>
                    <li>{t("terms_and_conditions")}</li>
                  </Link>
                </ul>
              </div>
            </div>
          </section>
        </footer>
      )}
    </>
  );
};

export default Footer;
