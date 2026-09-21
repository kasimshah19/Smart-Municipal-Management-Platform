import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    activeView: 'citizen',
    toast: null,
  },
  reducers: {
    setActiveView: (state, action) => {
      state.activeView = action.payload;
    },
    showToast: (state, action) => {
      state.toast = { message: action.payload, id: Date.now() };
    },
    hideToast: (state) => {
      state.toast = null;
    },
  },
});

export const { setActiveView, showToast, hideToast } = uiSlice.actions;
export default uiSlice.reducer;
