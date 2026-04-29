import { createSlice } from "@reduxjs/toolkit";

const bgSlice = createSlice({
  name: "bgChanger",
  initialState: {
    background: "bg-blue-500",
  },
  reducers: {
    changeBG: (state) => {
      state.background =
        state.background === "bg-blue-500" ? "bg-red-500" : "bg-blue-500";
    },
  },
});

export const { changeBG } = bgSlice.actions;
export default bgSlice.reducer;
