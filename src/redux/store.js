import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import postReducer from "./slices/postSlice";
import uiReducer from "./slices/uiSlice";
import socialReducer from "./slices/socialSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    posts: postReducer,
    ui: uiReducer,
    social: socialReducer,
  },
});

export default store;
