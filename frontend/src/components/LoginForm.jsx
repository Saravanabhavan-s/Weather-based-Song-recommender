import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export function LoginForm({
  loading = false,
  error = "",
  onSubmit,
  googleButtonRef,
  googleEnabled = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = (event) => {
    event.preventDefault();
    onSubmit?.({ ...form, remember });
  };

  return (
    <div className="glass-card mx-auto max-w-md rounded-3xl p-6 sm:p-8">
      <h2 className="font-display text-2xl font-bold">Welcome back</h2>
      <p className="mt-2 text-sm text-white/70">Log in to continue your personalized weather playlist journey.</p>

      <form className="mt-5 space-y-4" onSubmit={submit}>
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(email) => setForm((prev) => ({ ...prev, email }))}
        />

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-white/60">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 text-sm outline-none focus:border-sky/60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-2 rounded-lg p-1 text-white/70 hover:bg-white/10"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-white/70">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={remember} onChange={() => setRemember((value) => !value)} />
            Remember me
          </label>
          <button type="button" className="hover:text-white">
            Forgot password?
          </button>
        </div>

        {error ? <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-surf to-sky py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-5 space-y-2">
        <p className="text-center text-xs uppercase tracking-[0.16em] text-white/60">Or continue with</p>
        {googleEnabled ? (
          <div className="rounded-xl border border-white/15 bg-white px-2 py-2">
            <div ref={googleButtonRef} className="google-oauth-button min-h-10" />
          </div>
        ) : (
          <button
            type="button"
            disabled
            className="w-full rounded-xl border border-white/20 py-2 text-sm text-white/55"
          >
            Continue with Google (not configured)
          </button>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-white/65">
        New here? <Link to="/register" className="font-semibold text-sky">Create account</Link>
      </p>
    </div>
  );
}

function Input({ label, type, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-white/60">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2.5 text-sm outline-none focus:border-sky/60"
      />
    </div>
  );
}
