// store/slices/productSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProductState {
  productData: null;
}

const initialState: ProductState = {
  productData: null,
};

export const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    getProduct: (state, action) => {
      state.productData = action.payload;
    },
    resetProduct: (state) => {
      state.productData = null;
    },
  },
});

export const { getProduct, resetProduct } = productSlice.actions;

export default productSlice.reducer;
