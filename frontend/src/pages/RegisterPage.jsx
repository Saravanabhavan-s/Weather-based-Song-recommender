import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { RegisterForm } from "../components/RegisterForm";
import { useAuth } from "../hooks/useAuth";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (payload) => {
    setLoading(true);
    setError("");
    try {
      await register(payload);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return <RegisterForm loading={loading} error={error} onSubmit={onSubmit} />;
}
