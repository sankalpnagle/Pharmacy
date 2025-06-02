import { ModalContext } from "@/context/ModalContext";
import { useContext } from "react";

interface ModalState {
  type: string;
  data?: any;
}

interface ModalContextType {
  activeModal: ModalState | null;
  openModal: (modalName: string, data?: any) => void;
  closeModal: () => void;
}

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
