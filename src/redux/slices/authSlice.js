import { createSlice } from "@reduxjs/toolkit";

// Safely parse stored user
const getStoredUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const storedToken = localStorage.getItem("token") || null;
const storedUser  = getStoredUser();

const initialState = {
  user:            storedUser,
  token:           storedToken,
  // Authenticated = token exists AND user object loaded
  isAuthenticated: !!(storedToken && storedUser),
  loading:         false,
  error:           null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
      if (action.payload) {
        localStorage.setItem("token", action.payload);
        // isAuthenticated only becomes true once user is also set
        // so don't change it here alone
      } else {
        localStorage.removeItem("token");
        state.isAuthenticated = false;
      }
    },

    setUser: (state, action) => {
      state.user            = action.payload;
      state.isAuthenticated = !!(state.token && action.payload);
      if (action.payload) {
        localStorage.setItem("user", JSON.stringify(action.payload));
      } else {
        localStorage.removeItem("user");
      }
    },

    // Call this together to set both at once (e.g. from SSO or future flows)
    setAuth: (state, action) => {
      const { token, user } = action.payload;
      state.token           = token;
      state.user            = user;
      state.isAuthenticated = !!(token && user);
      if (token) localStorage.setItem("token", token);
      if (user)  localStorage.setItem("user", JSON.stringify(user));
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },

    logout: (state) => {
      state.user            = null;
      state.token           = null;
      state.isAuthenticated = false;
      state.error           = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
});

export const {
  setToken,
  setUser,
  setAuth,
  setLoading,
  setError,
  logout,
} = authSlice.actions;

export default authSlice.reducer;
