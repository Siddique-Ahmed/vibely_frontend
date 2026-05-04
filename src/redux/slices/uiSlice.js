import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [],
  unreadCount: 0,
  unreadMessageCount: 0,
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
      // If payload is an array of new notifications, prepend them
      if (Array.isArray(action.payload)) {
        state.notifications = [...action.payload, ...state.notifications];
      } else {
        // If it's a single update, replace
        state.notifications = action.payload;
      }
    },
    setUnreadCount: (state, action) => {
      if (typeof action.payload === 'function') {
        state.unreadCount = action.payload(state.unreadCount);
      } else {
        state.unreadCount = action.payload;
      }
    },
    setUnreadMessageCount: (state, action) => {
      if (typeof action.payload === 'function') {
        state.unreadMessageCount = action.payload(state.unreadMessageCount);
      } else {
        state.unreadMessageCount = action.payload;
      }
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
  setUnreadMessageCount,
  toggleNotificationPanel,
  toggleDarkMode,
  openModal,
  closeModal,
} = uiSlice.actions;
export default uiSlice.reducer;
