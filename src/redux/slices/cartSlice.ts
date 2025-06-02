import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CartItem {
  id: string;
  quantity: number;
  totalWeight: number;
  weight: number;
  price: number;
  name: string;
  imageUrl: string;
  requiresPrescription: boolean;
  isManuallyUpdated?: boolean;
  [key: string]: any;
}

interface CartState {
  items: CartItem[];
  productQuantity: number;
}

const loadCartFromLocalStorage = (): CartState => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("cart");
    if (stored) return JSON.parse(stored);
  }
  return { items: [], productQuantity: 0 };
};

const initialState: CartState = loadCartFromLocalStorage();

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id
      );
      if (existingItem) {
        existingItem.quantity += action.payload.quantity || 1;
        existingItem.totalWeight = parseFloat(
          (existingItem.quantity * action.payload.weight).toFixed(2)
        );
      } else {
        state.items.push({
          ...action.payload,
          quantity: action.payload.quantity || 1,
          totalWeight: parseFloat(
            (action.payload.quantity * action.payload.weight).toFixed(2)
          ),
        });
      }
      state.productQuantity = state.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      if (typeof window !== "undefined") {
        localStorage.setItem("cart", JSON.stringify(state));
      }
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      state.productQuantity = state.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      if (typeof window !== "undefined") {
        localStorage.setItem("cart", JSON.stringify(state));
      }
    },

    updateQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number; weight: number }>
    ) => {
      const { id, quantity, weight } = action.payload;
      const item = state.items.find((item) => item.id === id);
      if (item) {
        item.quantity = quantity;
        item.totalWeight = parseFloat((quantity * weight).toFixed(2));
        item.isManuallyUpdated = true;
      }
      state.productQuantity = state.items.reduce(
        (total, item) => total + item.quantity,
        0
      );
      if (typeof window !== "undefined") {
        localStorage.setItem("cart", JSON.stringify(state));
      }
    },

    // New action to update multiple cart items at once
    updateCartItems: (state, action: PayloadAction<CartItem[]>) => {
      const updatedItems = action.payload;

      // Preserve manually updated items unless they're being explicitly updated
      const preservedItems = state.items.filter(
        (item) =>
          item.isManuallyUpdated &&
          !updatedItems.some((updated) => updated.id === item.id)
      );

      // Combine preserved items with updated items
      state.items = [...preservedItems, ...updatedItems];

      // Recalculate totals
      state.productQuantity = state.items.reduce(
        (total, item) => total + item.quantity,
        0
      );

      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("cart", JSON.stringify(state));
      }
    },

    repeatOrder: (state, action: PayloadAction<CartItem>) => {
      const repeatQuantity = action.payload.quantity || 1;
      const repeatWeight = action.payload.weight || 0;

      const existingItemIndex = state.items.findIndex(
        (item) => item.id === action.payload.id
      );

      if (existingItemIndex !== -1) {
        const existingItem = state.items[existingItemIndex];
        if (!existingItem.isManuallyUpdated) {
          state.items[existingItemIndex] = {
            ...existingItem,
            ...action.payload,
            quantity: repeatQuantity,
            totalWeight: parseFloat((repeatQuantity * repeatWeight).toFixed(2)),
          };
        }
      } else {
        state.items.push({
          ...action.payload,
          quantity: repeatQuantity,
          totalWeight: parseFloat((repeatQuantity * repeatWeight).toFixed(2)),
          isManuallyUpdated: false,
        });
      }

      state.productQuantity = state.items.reduce(
        (total, item) => total + item.quantity,
        0
      );

      if (typeof window !== "undefined") {
        localStorage.setItem("cart", JSON.stringify(state));
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.productQuantity = 0;
      if (typeof window !== "undefined") {
        localStorage.removeItem("cart");
      }
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  updateCartItems, // Export the new action
  repeatOrder,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
