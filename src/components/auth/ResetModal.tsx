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
import { resetPassword } from "@/actions/reset-password";
import toast from "react-hot-toast";
import { forgetPassord } from "@/services/auth";
import { t } from "@/utils/translate";

const formSchema = z
  .object({
    password: z.string().min(6, t("password_must_be_at_least_6_characters")),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t("passwords_do_not_match"),
    path: ["confirmPassword"],
  });

export const ResetModal = () => {
  const { activeModal, closeModal } = useModal();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      const payload = {
        email: activeModal?.data?.email,
        newPassword: values.password,
      };
      const result = await forgetPassord(payload);

      if (result.status === 200) {
        toast.success(t("password_reset_successfully"));
        closeModal();
      } else {
        toast.error(t("failed_to_reset_password"));
      }
    } catch (error) {
      toast.error(t("failed_to_reset_password"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={activeModal?.type === "resetPassword"}
      onOpenChange={closeModal}
    >
      <DialogContent className="bg-white border-none py-6 max-h-[95vh] h-auto w-full overflow-scroll scroll">
        <DialogHeader>
          <DialogTitle className="text-[#10847E] px-3">
            {t("reset_password")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 px-3"
          >
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("new_password")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t("enter_new_password")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("confirm_password")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t("confirm_new_password")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-[#10847E] hover:bg-[#10847E]/90"
              disabled={isLoading}
            >
              {isLoading ? t("resetting") : t("reset_password")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
