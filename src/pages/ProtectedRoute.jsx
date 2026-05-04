import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setUser, logout } from "../redux/slices/authSlice";
import apiClient from "../services/apiClient";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, token } = useSelector((state) => state.auth);
  const [checking, setChecking] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    // If token exists but no user loaded — fetch profile to restore session
    if (token && !user && !checking) {
      setChecking(true);
      apiClient
        .get("/users/my-profile")
        .then((res) => {
          const userData = res.data?.data;
          if (userData) {
            dispatch(setUser(userData));
          } else {
            dispatch(logout());
            setAuthFailed(true);
          }
        })
        .catch(() => {
          dispatch(logout());
          setAuthFailed(true);
        })
        .finally(() => setChecking(false));
    }
  }, [token, user]);

  // Show loading while restoring session
  if (token && !user && checking) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ background: "linear-gradient(135deg, #0f0117 0%, #1a0533 100%)" }}
      >
        <div
          className="relative flex-shrink-0"
          style={{
            padding: "2px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #7C3AED, #EC4899, #F97316)",
            boxShadow: "0 0 24px rgba(124,58,237,0.5)",
            marginBottom: "8px",
          }}
        >
          <div
            className="w-12 h-12 rounded-[14px] overflow-hidden flex items-center justify-center"
            style={{ background: "#ffffff" }}
          >
            <img src="/vibely_logo.png" alt="Vibely" className="w-10 h-10 object-contain" />
          </div>
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    );
  }

  // No token or auth failed → login
  if (!token || authFailed || (!isAuthenticated && !user)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
