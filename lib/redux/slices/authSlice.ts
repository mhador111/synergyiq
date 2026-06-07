import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Role } from "@/lib/auth/roles";

export interface AuthState {
  userId: string | null;
  name: string | null;
  email: string | null;
  role: Role | null;
}

const initialState: AuthState = {
  userId: null,
  name: null,
  email: null,
  role: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthState>) {
      state.userId = action.payload.userId;
      state.name = action.payload.name;
      state.email = action.payload.email;
      state.role = action.payload.role;
    },
    clearUser(state) {
      state.userId = null;
      state.name = null;
      state.email = null;
      state.role = null;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
