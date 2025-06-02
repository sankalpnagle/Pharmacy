"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/hooks/useModal";
import { forgotPassword } from "@/actions/forgot-password";
import toast from "react-hot-toast";
import { t } from "@/utils/translate";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const ForgetPasswordModal = () => {
  const { activeModal, openModal, closeModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const result = await forgotPassword(values.email);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t("OTP_sent_successfully"));
      openModal("verifyOtp", { email: values.email });
    } catch (error) {
      toast.error(t("Failed to send OTP. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={activeModal?.type === "forgetPassword"}
      onOpenChange={closeModal}
    >
      <DialogContent className="bg-white border-none py-6 max-h-[95vh] h-auto w-full overflow-scroll scroll">
        <DialogHeader>
          <DialogTitle className="text-[#10847E] px-3">
            {t("forgot_password?")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 px-3"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("email")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("enter_your_email")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="text-sm text-gray-500">
              {t(
                "otp_will_be_sent_to_your_email_and_phone_number_(if_available)"
              )}
            </p>
            <Button
              type="submit"
              className="w-full bg-[#10847E] hover:bg-[#10847E]/90"
              disabled={isLoading}
            >
              {isLoading ? t("sending") : t("send_otp")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
