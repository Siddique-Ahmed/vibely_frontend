import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [],
  unreadCount: 0,
  showNotificationPanel: false,
  isDarkMode: localStorage.getItem("darkMode") === "true" || false,
  showModal: false,
  modalType: null,
  modalData: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
    },
    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
    toggleNotificationPanel: (state) => {
      state.showNotificationPanel = !state.showNotificationPanel;
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
      localStorage.setItem("darkMode", state.isDarkMode);
    },
    openModal: (state, action) => {
      state.showModal = true;
      state.modalType = action.payload.type;
      state.modalData = action.payload.data;
    },
    closeModal: (state) => {
      state.showModal = false;
      state.modalType = null;
      state.modalData = null;
    },
  },
});

export const {
  setNotifications,
  setUnreadCount,
  toggleNotificationPanel,
  toggleDarkMode,
  openModal,
  closeModal,
} = uiSlice.actions;
export default uiSlice.reducer;
