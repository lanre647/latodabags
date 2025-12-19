import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  total: 0,
};

const cart = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem(state, action) {
      const existingItem = state.items.find(
        (i) => i._id === action.payload._id
      );
      if (existingItem) {
        existingItem.quantity += action.payload.quantity || 1;
      } else {
        state.items.push({
          ...action.payload,
          quantity: action.payload.quantity || 1,
        });
      }
      state.total = state.items.reduce((sum, item) => {
        const price = item.price || item.basePrice || 0;
        const itemPrice = Number(price) || 0;
        return sum + itemPrice * item.quantity;
      }, 0);
      console.log('Cart state after addItem:', {
        items: state.items,
        total: state.total,
      });
    },
    removeItem(state, action) {
      state.items = state.items.filter((i) => i._id !== action.payload);
      state.total = state.items.reduce((sum, item) => {
        const price = item.price || item.basePrice || 0;
        const itemPrice = Number(price) || 0;
        return sum + itemPrice * item.quantity;
      }, 0);
    },
    updateQuantity(state, action) {
      const item = state.items.find((i) => i._id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
      }
      state.total = state.items.reduce((sum, item) => {
        const price = item.price || item.basePrice || 0;
        const itemPrice = Number(price) || 0;
        return sum + itemPrice * item.quantity;
      }, 0);
    },
    clearCart(state) {
      state.items = [];
      state.total = 0;
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart } = cart.actions;
export default cart.reducer;
