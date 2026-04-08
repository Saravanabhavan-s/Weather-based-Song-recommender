import { createContext, useEffect, useMemo, useState } from "react";

import { authService } from "../services/authService";
import { setAuthToken } from "../services/api";

export const AuthContext = createContext(null);

const TOKEN_KEY = "vibecast_token";
const USER_KEY = "vibecast_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthToken(token || "");
  }, [token]);

  useEffect(() => {
    let active = true;

    const boot = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await authService.me();
        if (!active) {
          return;
        }
        setUser(profile);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
      } catch {
        if (!active) {
          return;
        }
        logout();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    boot();
    return () => {
      active = false;
    };
  }, [token]);

  const persistAuth = (payload) => {
    setToken(payload.access_token);
    setUser(payload.user);
    localStorage.setItem(TOKEN_KEY, payload.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  };

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    persistAuth(response);
    return response;
  };

  const oauthGoogle = async (credential) => {
    const response = await authService.oauthGoogle({ credential });
    persistAuth(response);
    return response;
  };

  const register = async (details) => {
    const response = await authService.register(details);
    persistAuth(response);
    return response;
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAuthToken("");
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      oauthGoogle,
      register,
      logout,
      setUser,
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
