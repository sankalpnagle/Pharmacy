"use client";
import useStorageSync from "@/hooks/useStorageSync";

const StorageSync = () => {
  useStorageSync([
    { sliceKey: "cart", storageKey: "cart" },
    { sliceKey: "patient", storageKey: "patient" },
  ]);

  return null;
};

export default StorageSync;
