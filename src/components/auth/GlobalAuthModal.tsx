import React, { JSX } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/hooks/useModal";
import SignInModal from "./SignInModal";
import SignUpModal from "./SignUpModal";
import { ForgetPasswordModal } from "./ForgetPasswordModal";
import { OtpModal } from "./OtpModal";
import { ResetModal } from "./ResetModal";
import EditAddressModal from "../profile/EditAddressModal";
import EditProfileModal from "../profile/EditProfileModal";
import AddPatientModal from "../profile/AddPatientModal";
import RefundModal from "../pharmacyModal/RefundModal";
import RejectModal from "../pharmacyModal/RejectModal";
import PrescriptionModal from "../pharmacyModal/PrescriptionModal";
import { t } from "@/utils/translate";

const GlobalAuthModal = ({
  setShouldRefetch,
}: {
  setShouldRefetch: (val: boolean) => void;
}) => {
  const { activeModal, closeModal } = useModal();
  const modalKey = activeModal?.type ?? "";

  const modalComponents: Record<
    string,
    { title: string; component: () => JSX.Element }
  > = {
    signin: { title: t("login"), component: () => <SignInModal /> },
    register: { title: t("signup_as"), component: () => <SignUpModal /> },
    forgetPassword: {
      title: t("forgot_password?"),
      component: () => <ForgetPasswordModal />,
    },
    verifyOtp: {
      title: t("enter_code"),
      component: () => <OtpModal />,
    },
    resetPassword: {
      title: t("reset_password"),
      component: () => <ResetModal />,
    },
    editProfile: {
      title: t("edit_profile_info"),
      component: () => <EditProfileModal setShouldRefetch={setShouldRefetch} />,
    },
    addPatient: {
      title: t("choose_patient"),
      component: () => <AddPatientModal />,
    },
    editAddress: {
      title: t("add_delivery_address"),
      component: () => <EditAddressModal />,
    },
    refundOrder: {
      title: t("refunding_order_id"),
      component: () => <RefundModal setShouldRefetch={setShouldRefetch} />,
    },
    rejectOrder: {
      title: t("rejecting_order_id"),
      component: () => <RejectModal setShouldRefetch={setShouldRefetch} />,
    },
    prescriptionView: {
      title: t("prescription"),
      component: () => <PrescriptionModal />,
    },
  };

  const ModalComponent = modalComponents[modalKey]?.component;
  const title = modalComponents[modalKey]?.title || "";

  return (
    <Dialog open={Boolean(activeModal)} onOpenChange={closeModal}>
      {ModalComponent && (
        <DialogContent className="bg-white border-none py-6 max-h-[95vh] h-auto w-full overflow-scroll scroll">
          <DialogHeader>
            <DialogTitle
              className={`${
                activeModal?.type === "rejectOrder"
                  ? "text-dangerous px-3"
                  : "text-[#10847E] px-3"
              }`}
            >
              {title}
            </DialogTitle>
          </DialogHeader>
          <ModalComponent />
        </DialogContent>
      )}
    </Dialog>
  );
};

export default GlobalAuthModal;
