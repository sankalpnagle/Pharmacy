import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "../store";

// Define the slice state
interface RefetchState {
  shouldRefetch: boolean;
}

// Initial state
const initialState: RefetchState = {
  shouldRefetch: false,
};

// Create the slice
const refetchSlice = createSlice({
  name: "refetch",
  initialState,
  reducers: {
    // Action to set shouldRefetch to true
    triggerRefetch(state) {
      state.shouldRefetch = true;
    },
    // Action to reset shouldRefetch to false
    resetRefetch(state) {
      state.shouldRefetch = false;
    },
  },
});

// Export actions
export const { triggerRefetch, resetRefetch } = refetchSlice.actions;

// Thunk example: fetch data when shouldRefetch is true
export const fetchDataIfNeeded =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    const { shouldRefetch } = getState().refetch;
    if (shouldRefetch) {
      // Perform your fetch here
      // await dispatch(fetchUserData());

      // After fetching, reset the flag
      dispatch(resetRefetch());
    }
  };

// Selector
export const selectShouldRefetch = (state: RootState) =>
  state.refetch.shouldRefetch;

// Export reducer
export default refetchSlice.reducer;
