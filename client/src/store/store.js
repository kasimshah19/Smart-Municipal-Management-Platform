import { configureStore } from '@reduxjs/toolkit';
import complaintsReducer from './complaintsSlice.js';
import uiReducer from './uiSlice.js';
import authReducer from '../features/auth/authSlice.js';
import analyticsReducer from './analyticsSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    complaints: complaintsReducer,
    ui: uiReducer,
    analytics: analyticsReducer,
  },
});
