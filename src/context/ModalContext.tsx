"use client";

import { createContext, useState, ReactNode } from "react";

// Define modal state type
interface ModalState {
  type: string;
  data?: any;
}

// Define context type
interface ModalContextType {
  activeModal: ModalState | null;
  openModal: (modalName: string, data?: any) => void;
  closeModal: () => void;
}

export const ModalContext = createContext<ModalContextType | undefined>(
  undefined
);

// Provider component
export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [activeModal, setActiveModal] = useState<ModalState | null>(null);

  const openModal = (modalName: string, data?: any) => {
    setActiveModal({ type: modalName, data });
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <ModalContext.Provider value={{ activeModal, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
};
