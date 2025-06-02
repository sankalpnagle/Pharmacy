import { configureStore } from "@reduxjs/toolkit";
import productReducer from "./slices/productSlice";
import cartReducer from "./slices/cartSlice";
import patientReducer from "./slices/patientSlice";
import refetchReducer from "./slices/refetchSlice";
import orderReducer, { orderSlice } from "./slices/orderSlice";

export const store = configureStore({
  reducer: {
    product: productReducer,
    cart: cartReducer,
    patient: patientReducer,
    order: orderReducer,
    refetch: refetchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
