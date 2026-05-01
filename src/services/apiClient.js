import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:9000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends the httpOnly refreshToken cookie automatically
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor — attach access token ────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For FormData, remove Content-Type header so browser sets it with proper boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    // DEBUG: log outgoing /likes/toggle payloads
    try {
      if (config && config.method === "post" && config.url && config.url.includes("/likes/toggle")) {
        console.debug("[apiClient] Outgoing /likes/toggle body:", config.data);
      }
    } catch (e) {
      // ignore
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ── Token refresh state ───────────────────────────────────────────────────────
let isRefreshing   = false;
let failedQueue    = []; // requests waiting for the new token

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else       resolve(token);
  });
  failedQueue = [];
};

// ── Response interceptor — auto-refresh on 401 ───────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 and avoid infinite loops
    if (
      error.response?.status !== 401 ||
      originalRequest._retry              // already retried once
    ) {
      return Promise.reject(error);
    }

    // Don't try to refresh if the failing call IS the refresh endpoint itself
    if (originalRequest.url?.includes("/users/refresh-token")) {
      console.log("[apiClient] 401 on refresh token endpoint — logging out");
      forceLogout();
      return Promise.reject(error);
    }

    // If a refresh is already in-flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    // Mark this request so we don't retry it again
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      console.log("[apiClient] Attempting to refresh access token...");
      
      // Use bare axios to avoid triggering apiClient's own interceptors (which would attach the expired token)
      const res = await axios.post(
        `${API_BASE_URL}/users/refresh-token`,
        {},
        { withCredentials: true }
      );
      
      const newToken = res.data?.data?.accessToken || res.data?.accessToken;

      if (!newToken) throw new Error("No access token in refresh response");

      console.log("[apiClient] Token refreshed successfully.");

      // Persist the new token
      localStorage.setItem("token", newToken);

      // Update the Authorization header for future requests
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;

      // Also update the Redux store so components see the new token
      // (import store lazily to avoid circular deps)
      try {
        const { default: store } = await import("../redux/store.js");
        const { setToken } = await import("../redux/slices/authSlice.js");
        store.dispatch(setToken(newToken));
      } catch {
        // Store import failed — token is already in localStorage, that's fine
      }

      // Unblock all queued requests with the new token
      processQueue(null, newToken);

      // Retry the original failed request with new token
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);

    } catch (refreshError) {
      console.error("[apiClient] Refresh token failed:", refreshError.message);
      // Refresh token is expired or invalid — force logout
      processQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Force logout helper ──────────────────────────────────────────────────────
function forceLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  // Use a small delay so any in-flight UI updates can finish
  setTimeout(() => {
    window.location.href = "/login";
  }, 100);
}

export default apiClient;
