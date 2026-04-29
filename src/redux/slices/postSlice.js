import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  posts: [],
  singlePost: null,
  loading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  },
};

const postSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    setPosts: (state, action) => {
      state.posts = action.payload.posts || [];
      state.pagination = action.payload.pagination || state.pagination;
    },
    setSinglePost: (state, action) => {
      state.singlePost = action.payload;
    },
    addPost: (state, action) => {
      state.posts.unshift(action.payload);
    },
    updatePost: (state, action) => {
      const index = state.posts.findIndex((p) => p._id === action.payload._id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
    },
    deletePost: (state, action) => {
      state.posts = state.posts.filter((p) => p._id !== action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setPosts,
  setSinglePost,
  addPost,
  updatePost,
  deletePost,
  setLoading,
  setError,
} = postSlice.actions;
export default postSlice.reducer;
