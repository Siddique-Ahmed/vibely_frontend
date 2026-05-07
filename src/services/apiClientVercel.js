import axios from "axios";

const API_BASE_URL_VERCEL = import.meta.env.VITE_API_URL_VERCEL || "https://vibely-backend-xi.vercel.app/api/v1";

const apiClientVercel = axios.create({
  baseURL: API_BASE_URL_VERCEL,
  withCredentials: true, // sends the httpOnly refreshToken cookie automatically
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor — attach access token ────────────────────────────────
apiClientVercel.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For FormData, remove Content-Type header so browser sets it with proper boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — auto-refresh on 401 ───────────────────────────────
apiClientVercel.interceptors.response.use(
  (response) => response,
  async (error) => {
    // For Vercel endpoints, we don't auto-refresh. Just return the error.
    // This is simpler since Vercel is typically a backup/external endpoint
    return Promise.reject(error);
  },
);

export default apiClientVercel;
