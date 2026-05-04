import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  followers: [],
  following: [],
  loading: false,
  error: null,
};

const socialSlice = createSlice({
  name: "social",
  initialState,
  reducers: {
    setFollowers: (state, action) => {
      state.followers = action.payload || [];
    },
    setFollowing: (state, action) => {
      state.following = action.payload || [];
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearSocial: (state) => {
      state.followers = [];
      state.following = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const { setFollowers, setFollowing, setLoading, setError, clearSocial } = socialSlice.actions;
export default socialSlice.reducer;
