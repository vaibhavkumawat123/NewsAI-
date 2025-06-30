import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { auth, googleAuthProvider } from './../../config/firebase.js';
import { signInWithPopup } from 'firebase/auth';
import { getCookie, setCookie, removeCookie } from '../../utils/utils';
import { toast } from 'sonner';

// Get base API URL from environment
const API_BASE = import.meta.env.VITE_API_URL;

// Initial state setup with cookies/localStorage fallback
const initialState = {
  loading: false,
  authenticated: getCookie('isAuthenticated') === 'true',
  name: getCookie('name') || null,
  id: getCookie('id') || null,
  preferences: JSON.parse(localStorage.getItem('preferences') || '[]'),
};

// REGISTER
export const SignUp = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, data);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Registration failed' });
    }
  }
);

// LOGIN
export const login = createAsyncThunk(
  'auth/login',
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, data, {
        withCredentials: true,
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Login failed' });
    }
  }
);

// GOOGLE LOGIN
export const signInWithGoogle = createAsyncThunk(
  'auth/googleLogin',
  async (_, { rejectWithValue }) => {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();

      const res = await axios.post(`${API_BASE}/auth/google`, { idToken }, {
        withCredentials: true,
      });

      return res.data;
    } catch (error) {
      console.error('Google Login Error:', error);
      return rejectWithValue(error.response?.data || { message: 'Google Sign-In failed' });
    }
  }
);

// AUTH SLICE
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signOut: (state) => {
      state.authenticated = false;
      state.id = null;
      state.name = null;
      state.preferences = [];
      removeCookie('isAuthenticated');
      removeCookie('email');
      removeCookie('name');
      removeCookie('id');
      localStorage.removeItem('preferences');
    },
  },
  extraReducers: (builder) => {
    builder
      // SIGNUP
      .addCase(SignUp.pending, (state) => {
        state.loading = true;
      })
      .addCase(SignUp.fulfilled, (state, action) => {
        state.loading = false;
        toast.success(action.payload.message || 'Registered successfully');
      })
      .addCase(SignUp.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.payload.message || 'Registration failed');
      })

      // LOGIN
      .addCase(login.pending, (state) => {
        state.loading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        const { authenticated, name, email, id, preferences, message } = action.payload;
        state.loading = false;
        state.authenticated = authenticated;
        state.name = name;
        state.id = id;
        state.preferences = preferences;

        setCookie('isAuthenticated', authenticated);
        setCookie('email', email);
        setCookie('name', name);
        setCookie('id', id);
        localStorage.setItem('preferences', JSON.stringify(preferences));
        toast.success(message || 'Login successful');
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.payload.message || 'Login failed');
      })

      // GOOGLE LOGIN
      .addCase(signInWithGoogle.pending, (state) => {
        state.loading = true;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        const { authenticated, name, email, id, preferences, message } = action.payload;
        state.loading = false;
        state.authenticated = authenticated;
        state.name = name;
        state.id = id;
        state.preferences = preferences;

        setCookie('isAuthenticated', authenticated);
        setCookie('email', email);
        setCookie('name', name);
        setCookie('id', id);
        localStorage.setItem('preferences', JSON.stringify(preferences));
        toast.success(message || 'Google login successful');
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.payload.message || 'Google Sign-In failed');
      });
  },
});

// Export reducer & actions
export default authSlice.reducer;
export const { signOut } = authSlice.actions;
