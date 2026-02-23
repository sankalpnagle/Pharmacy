"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import Copy from "public/icons/copy.svg";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { t } from "@/utils/translate";

const AfterPlacingOrder = () => {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t("copied_to_clipboard!"));
    } catch (err) {
      toast.error(t("failed_to_copy"));
    }
  };
  const handleLinkCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${process.env.NEXT_PUBLIC_BASE_URL}/payOrder/orderCode?code=${code}`
      );
      toast.success(t("copied_to_clipboard!"));
    } catch (err) {
      toast.error(t("failed_to_copy"));
    }
  };

  const handleSendEmail = async () => {
    if (!email || !code) {
      toast.error(
        t("please_enter_a_valid_email_and_ensure_order_code_is_present.")
      );
      return;
    }
    setEmailLoading(true);
    try {
      const res = await fetch("/api/send-payment-link/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("email_sent"));
        setEmail("");
      } else {
        toast.error(data.error || t("failed_to_send_email"));
      }
    } catch (err) {
      toast.error(t("failed_to_send_email"));
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendSMS = async () => {
    if (!phone || !code) {
      toast.error(
        t("please_enter_a_valid_phone_number_and_ensure_order_code_is_present.")
      );
      return;
    }
    setSmsLoading(true);
    try {
      const res = await fetch("/api/send-payment-link/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(t("sms_sent"));
        setPhone("");
      } else {
        toast.error(data.error || t("failed_to_send_sms"));
      }
    } catch (err) {
      toast.error(t("failed_to_send_sms"));
    } finally {
      setSmsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <h1 className="sm:text-xl text-[18px] font-medium">
        {t("your_order_is_now_in_the_system")}
      </h1>
      <h1 className="text-sm font-medium ">
        {t(
          "please_have_your_family_or_friend_pay_for_it_by_using_one_of_these_options:"
        )}
      </h1>
      <section className="sm:w-1/2 flex flex-col gap-5">
        <div className="w-full text-primary ">
          <label htmlFor="email" className="text-sm">
            {t("email")}
          </label>
          <div className="flex gap-5 sm:flex-row items-start flex-col mt-1">
            <Input
              id="email"
              className=""
              placeholder="example@xyz.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={emailLoading}
            />
            <Button
              className="rounded-full text-white w-[150px]"
              onClick={handleSendEmail}
              disabled={emailLoading}
            >
              {emailLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  {t("sending")}
                </>
              ) : (
                <>{t("send_email")}</>
              )}
            </Button>
          </div>
        </div>
        <div className="flex gap-5 sm:w-[75%] sm:left-2 relative  items-center text-black">
          <div className="w-full h-[0.7px] bg-black  " />
          <h1 className="text-sm">{t("or")}</h1>
          <div className="w-full h-[0.7px] bg-black" />
        </div>
        <div className="w-full text-primary ">
          <label htmlFor="ContactNo" className="text-sm">
            {t("contact_no")}
          </label>
          <div className="flex gap-5 sm:flex-row items-start flex-col mt-1">
            <Input
              id="ContactNo"
              className=""
              placeholder="1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={smsLoading}
            />
            <Button
              className="rounded-full text-white w-[150px]"
              onClick={handleSendSMS}
              disabled={smsLoading}
            >
              {smsLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  {t("sending")}
                </>
              ) : (
                <>{t("send_sms")}</>
              )}
            </Button>
          </div>
        </div>
        <div className="flex gap-5 sm:w-[75%] sm:left-2 relative left-2 items-center text-black">
          <div className="w-full h-[0.7px] bg-black  " />
          <h1 className="text-sm">{t("or")}</h1>
          <div className="w-full h-[0.7px] bg-black" />
        </div>
        <section className="flex flex-col gap-2">
          <button
            onClick={handleCopy}
            className="rounded-full border-dashed border-2 w-[150px] py-1 bg-primary/10 flex items-center justify-center border-primary cursor-pointer text-xl font-medium text-primary "
          >
            <Copy className="scale-50" /> <span>{code}</span>{" "}
          </button>
          <h1 className="text-sm font-medium ">
            {t("give_this_code_to_your_relative_to_have_the_order_paid")}
          </h1>
        </section>
        <div className="flex gap-5 sm:w-[75%] sm:left-2 relative left-2 items-center text-black">
          <div className="w-full h-[0.7px] bg-black  " />
          <h1 className="text-sm">{t("or")}</h1>
          <div className="w-full h-[0.7px] bg-black" />
        </div>
        <section className="flex flex-col gap-2">
          <button
            onClick={handleLinkCopy}
            className="rounded-full border-dashed border-2 w-[150px]  bg-primary/10 flex items-center justify-center border-primary text-sm cursor-pointer font-medium text-primary "
          >
            <Copy className="scale-40" /> <span>{t("copy_link")}</span>{" "}
          </button>
          {/* <h1 className="text-sm font-medium ">
                    Give this code to your relative to have the order paid
                </h1> */}
        </section>
        <div className="flex gap-5 sm:w-[75%] sm:left-2 relative left-2 items-center text-black">
          <div className="w-full h-[0.7px] bg-black  " />
          <h1 className="text-sm">{t("or")}</h1>
          <div className="w-full h-[0.7px] bg-black" />
        </div>
        <Button
          onClick={() => router.push(`/payOrder?code=${code}`)}
          className="rounded-full text-white w-[150px]"
        >
          {t("pay_now")}
        </Button>
      </section>
    </div>
  );
};

export default AfterPlacingOrder;
