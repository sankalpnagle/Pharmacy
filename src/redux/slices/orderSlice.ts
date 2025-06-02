// store/slices/productSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProductState {
orderData: null;
}

const initialState: ProductState = {
orderData: null,
};

export const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    setOrder: (state, action) => {
      state.orderData = action.payload;
    },
    resetOrder: (state) => {
      state.orderData = null;
    },
  },
});

export const { setOrder, resetOrder } = orderSlice.actions;

export default orderSlice.reducer;
