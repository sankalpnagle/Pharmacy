"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/useModal";
import { Checkbox } from "@/components/ui/checkbox";
import { changeOrderStatus } from "@/services/payment";
import { t } from "@/utils/translate";

// Define form schema
const RejectSchema = z.object({
  comment: z.string().min(1, t("comment_is_required")),
});

type RejectFormValues = z.infer<typeof RejectSchema>;

const RejectModal = ({
  setShouldRefetch,
}: {
  setShouldRefetch: (val: boolean) => void;
}) => {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { closeModal } = useModal();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RejectFormValues>({
    resolver: zodResolver(RejectSchema),
  });

  const onSubmit = async (data: RejectFormValues) => {
    try {
      const payload = {
        comment: data.comment,
      };
      const res = await changeOrderStatus(id, "reject", payload);

      if (res.status === 200) {
        setShouldRefetch(true);
        closeModal();
      }
    } catch (error) {
      console.error("Error rejecting order:", error);
      setServerError("Failed to reject order. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:w-96 px-3">
      {/* Comment Field */}
      <div className="space-y-2 text-[#10847E]">
        <label htmlFor="comment" className="block text-xs">
          {t("why_is_it_being_rejected")}
        </label>
        <textarea
          id="comment"
          rows={6}
          className={`w-full text-xs mt-2 focus:outline-primary border-[1.5px] p-2 rounded-xl ${
            errors.comment ? "border-red-500" : "border-primary-light"
          }`}
          {...register("comment")}
          placeholder={t("we_are_rejecting_it_because")}
        />
        {errors.comment && (
          <p className="text-red-500 text-xs">{errors.comment.message}</p>
        )}
      </div>

      <div className="flex items-center gap-x-1.5 text-primary text-xs">
        <Checkbox checked disabled />
        <p>{t("Notify via Email & SMS")}</p>
      </div>

      {/* Display Server Errors */}
      {serverError && (
        <p className="text-red-500 text-sm text-center">{serverError}</p>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="bg-[#10847E] mt-3 flex justify-center text-white mx-auto w-1/2 rounded-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? t("rejecting") : t("reject")}
      </Button>
    </form>
  );
};

export default RejectModal;
