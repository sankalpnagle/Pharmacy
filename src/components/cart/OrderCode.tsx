"use client";

import { useState, useRef, useEffect } from "react";
import { t } from "@/utils/translate";

interface OrderCodeProps {
  length?: number;
  initialCode?: string;
  onComplete?: (code: string) => void;
}

export default function OrderCode({
  length = 4,
  initialCode = "",
  onComplete,
}: OrderCodeProps) {
  const [otp, setOtp] = useState<string>("");
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    inputsRef.current = inputsRef.current.slice(0, length);
    if (initialCode) handlePrefillCode(initialCode);
  }, [length, initialCode]);

  const handlePrefillCode = (code: string) => {
    const upperCode = code.toUpperCase();
    setOtp(upperCode);
    upperCode.split("").forEach((char, index) => {
      if (index < length && inputsRef.current[index]) {
        inputsRef.current[index]!.value = char;
      }
    });
    inputsRef.current[Math.min(code.length, length) - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text/plain").toUpperCase();
    if (pasteData.length === length && /^[A-Z0-9]+$/.test(pasteData)) {
      handlePrefillCode(pasteData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;

    if (!/^[a-zA-Z0-9]*$/.test(value)) {
      e.target.value = "";
      return;
    }

    e.target.value = value.slice(-1).toUpperCase();

    const newOtp = inputsRef.current
      .slice(0, length)
      .map((input) => input?.value || "")
      .join("");
    setOtp(newOtp);

    if (value && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    if (onComplete) {
      onComplete(otp);
    }
  };

  return (
    <div className="border-2 sm:w-1/2 flex flex-col content-center text-center justify-center h-[20rem] rounded-xl border-primary mx-auto border-dotted">
      <h1 className="text-2xl font-bold mb-8 text-primary">
        {t("enter_code")}
      </h1>

      <div className="flex justify-center gap-2 mb-8">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            type="text"
            inputMode="text"
            autoComplete="one-time-code"
            maxLength={1}
            className="w-12 h-12 text-center text-primary bg-[#EFEFEF] border-2 border-primary-light rounded text-xl focus:outline-none focus:border-primary uppercase"
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            ref={(el) => (inputsRef.current[index] = el)}
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={otp.length !== length}
        className={`px-14 py-2 w-fit mx-auto rounded-3xl ${
          otp.length === length
            ? "bg-primary hover:bg-primary text-white"
            : "bg-primary-light text-white cursor-not-allowed"
        } transition-colors cursor-pointer`}
      >
        {t("submit")}
      </button>
    </div>
  );
}
