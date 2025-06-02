import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface PatientState {
  PatientData: any | null;
}

const loadPatientDataFromLocalStorage = (): PatientState => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("patient");
    if (stored) return { PatientData: JSON.parse(stored) };
  }
  return { PatientData: null };
};

const initialState: PatientState = loadPatientDataFromLocalStorage();

const patientSlice = createSlice({
  name: "patient",
  initialState,
  reducers: {
    addPatientData: (state, action: PayloadAction<any>) => {
      state.PatientData = action.payload;
      if (typeof window !== "undefined") {
        localStorage.setItem("patient", JSON.stringify(state.PatientData));
      }
    },
    resetPatient: (state) => {
      state.PatientData = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("patient");
      }
    },
  },
});

export const { addPatientData, resetPatient } = patientSlice.actions;

export default patientSlice.reducer;
