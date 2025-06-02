"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/hooks/useModal";
import { verifyOtp } from "@/actions/verify-otp";
import toast from "react-hot-toast";
import { t } from "@/utils/translate";

export const OtpModal = () => {
  const { activeModal, openModal, closeModal } = useModal();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(0, 1);
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 4);
    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < 4) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);
  };

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      const otpString = otp.join("");
      if (otpString.length !== 4) {
        toast.error(t("please_enter_a_valid_4_digit_otp"));
        return;
      }

      const result = await verifyOtp(activeModal?.data?.email, otpString);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(t("otp_verified_successfully"));
      openModal("resetPassword", { email: activeModal?.data?.email });
    } catch (error) {
      toast.error(t("failed_to_verify_otp"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={activeModal?.type === "verifyOtp"} onOpenChange={closeModal}>
      <DialogContent className="bg-white border-none py-6 max-h-[95vh] h-auto w-full overflow-scroll scroll">
        <DialogHeader>
          <DialogTitle className="text-[#10847E] px-3">
            {t("enter_code")}
          </DialogTitle>
        </DialogHeader>
        <div className="px-3">
          <p className="text-sm text-gray-500 mb-4">
            {t("please_enter_the_4_digit_code")}
          </p>
          <div className="flex justify-center space-x-2 mb-6">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                  return undefined;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-12 text-center text-lg"
              />
            ))}
          </div>
          <Button
            onClick={onSubmit}
            className="w-full bg-[#10847E] hover:bg-[#10847E]/90"
            disabled={isLoading}
          >
            {isLoading ? t("verifying") : t("verify_otp")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
