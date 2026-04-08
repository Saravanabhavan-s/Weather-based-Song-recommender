import { Link, Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();
  const normalizedRole = String(user?.role || "").trim().toLowerCase();

  if (loading) {
    return <div className="mx-auto mt-24 max-w-md text-center text-sm text-white/70">Checking session...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && normalizedRole !== "admin") {
    return (
      <div className="mx-auto mt-24 w-full max-w-xl rounded-2xl border border-white/15 bg-black/35 p-6 text-center shadow-xl backdrop-blur-xl">
        <h2 className="font-display text-2xl font-bold text-white">Admin Access Required</h2>
        <p className="mt-2 text-sm text-white/75">
          Your current role is <span className="font-semibold text-white">{normalizedRole || "user"}</span>.
          Contact an administrator to enable admin access for this account.
        </p>
        <div className="mt-5">
          <Link
            to="/dashboard"
            className="inline-flex rounded-xl border border-white/20 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10"
          >
            Back To Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
