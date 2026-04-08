import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../hooks/useAuth";
import { loadGoogleIdentityScript } from "../utils/googleIdentity";

const GOOGLE_CLIENT_ID = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
const GOOGLE_CLIENT_CONFIGURED =
  GOOGLE_CLIENT_ID.length > 0 &&
  GOOGLE_CLIENT_ID !== "your_google_oauth_client_id";

export function LoginPage() {
  const { login, oauthGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (payload) => {
    setLoading(true);
    setError("");
    try {
      await login({ email: payload.email, password: payload.password });
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let disposed = false;

    const bootGoogle = async () => {
      if (!GOOGLE_CLIENT_CONFIGURED || !googleButtonRef.current) {
        return;
      }

      try {
        await loadGoogleIdentityScript();
        if (disposed || !window.google || !googleButtonRef.current) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            const credential = response?.credential;
            if (!credential) {
              setError("Google authentication failed. Please try again.");
              return;
            }

            setLoading(true);
            setError("");
            try {
              await oauthGoogle(credential);
              navigate(location.state?.from || "/dashboard", { replace: true });
            } catch (err) {
              setError(err.message || "Google sign-in failed.");
            } finally {
              setLoading(false);
            }
          },
        });

        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          text: "continue_with",
          shape: "pill",
          size: "large",
          width: Math.min(360, googleButtonRef.current.clientWidth || 320),
        });
      } catch {
        if (!disposed) {
          setError("Google sign-in is unavailable right now.");
        }
      }
    };

    bootGoogle();
    return () => {
      disposed = true;
    };
  }, [location.state, navigate, oauthGoogle]);

  return (
    <LoginForm
      loading={loading}
      error={error}
      onSubmit={onSubmit}
      googleButtonRef={googleButtonRef}
      googleEnabled={GOOGLE_CLIENT_CONFIGURED}
    />
  );
}
