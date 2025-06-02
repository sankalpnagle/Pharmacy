import { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { createSelector } from "reselect";
import { RootState } from "@/redux/store";

type SliceKey = keyof RootState;
type StorageType = "localStorage" | "sessionStorage";

const useStorageSync = (
  keys: { sliceKey: SliceKey; storageKey: string }[],
  storageType: StorageType = "localStorage"
) => {
  // Memoized selector
  const selectSlices = useMemo(() => {
    return createSelector(
      (state: RootState) => state,
      (state) =>
        keys.reduce((acc, { sliceKey }) => {
          acc[sliceKey] = state[sliceKey];
          return acc;
        }, {} as Partial<RootState>)
    );
  }, [keys]);

  const selectedData = useSelector(selectSlices);

  useEffect(() => {
    if (typeof window !== "undefined") {
      keys.forEach(({ sliceKey, storageKey }) => {
        const dataToSave =
          sliceKey === "patient"
            ? (selectedData[sliceKey] as any)?.PatientData
            : selectedData[sliceKey];
        try {
          window[storageType].setItem(storageKey, JSON.stringify(dataToSave));
        } catch (err) {
          console.error(`Error saving ${storageKey} to ${storageType}:`, err);
        }
      });
    }
  }, [selectedData, keys, storageType]);
};

export default useStorageSync;
