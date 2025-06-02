"use client";

import { newVerification } from "@/actions/new-verification";
import { useSearchParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const VerifyEmailPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [success, setSuccess] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );

  const onSubmit = useCallback(async () => {
    if (success || error) return;

    if (!token) {
      setError("No verification token found");
      setStatus("error");
      return;
    }

    try {
      const data = await newVerification(token);

      if (data.success) {
        setSuccess(data.success);
        setStatus("success");
      } else if (data.error) {
        setError(data.error);
        setStatus("error");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError("An unexpected error occurred");
      setStatus("error");
    }
  }, [token, success, error]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex flex-col items-center text-center space-y-4">
          {status === "verifying" && (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <h2 className="text-xl font-semibold">Verifying your email...</h2>
              <p className="text-gray-500">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <h2 className="text-xl font-semibold text-green-600">
                Email Verified!
              </h2>
              <p className="text-gray-600">{success}</p>
              <Button
                onClick={() => router.push("/")}
                className="mt-4 bg-primary hover:bg-primary/90"
              >
                Continue to Login
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-12 w-12 text-red-500" />
              <h2 className="text-xl font-semibold text-red-600">
                Verification Failed
              </h2>
              <p className="text-gray-600">{error}</p>
              <Button
                onClick={() => router.push("/register")}
                className="mt-4 bg-primary hover:bg-primary/90"
              >
                Back to Registration
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;
