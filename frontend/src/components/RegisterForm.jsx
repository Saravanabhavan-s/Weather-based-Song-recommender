import { Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

function passwordStrength(password) {
  if (!password) {
    return { score: 0, label: "Empty" };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  const labels = ["Weak", "Weak", "Okay", "Good", "Strong"];
  return { score, label: labels[score] };
}

export function RegisterForm({ loading = false, error = "", onSubmit }) {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    favoriteArtists: "",
    favoriteGenres: "",
  });

  const strength = useMemo(() => passwordStrength(form.password), [form.password]);

  const submit = (event) => {
    event.preventDefault();
    onSubmit?.({
      name: form.name,
      email: form.email,
      password: form.password,
      favoriteArtists: splitList(form.favoriteArtists),
      favoriteGenres: splitList(form.favoriteGenres),
    });
  };

  return (
    <div className="glass-card mx-auto max-w-lg rounded-3xl p-6 sm:p-8">
      <h2 className="font-display text-2xl font-bold">Create your Vibecast profile</h2>
      <p className="mt-2 text-sm text-white/70">Set your vibe preferences once and let recommendations adapt instantly.</p>

      <form className="mt-5 grid gap-4" onSubmit={submit}>
        <Input label="Name" value={form.name} onChange={(name) => setForm((prev) => ({ ...prev, name }))} />
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

          <div className="mt-2 flex items-center justify-between text-xs">
            <p className="text-white/65">Strength: {strength.label}</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((bar) => (
                <span
                  key={bar}
                  className={`h-1.5 w-8 rounded-full ${
                    bar <= strength.score ? "bg-surf" : "bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <Input
          label="Favorite artists (comma separated)"
          value={form.favoriteArtists}
          onChange={(favoriteArtists) => setForm((prev) => ({ ...prev, favoriteArtists }))}
        />
        <Input
          label="Favorite genres (comma separated)"
          value={form.favoriteGenres}
          onChange={(favoriteGenres) => setForm((prev) => ({ ...prev, favoriteGenres }))}
        />

        {error ? <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-200">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-coral to-sky py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-white/65">
        Already have an account? <Link to="/login" className="font-semibold text-sky">Sign in</Link>
      </p>
    </div>
  );
}

function Input({ label, type = "text", value, onChange }) {
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

function splitList(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
