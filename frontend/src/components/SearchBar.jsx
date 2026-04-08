import { LocateFixed, Search } from "lucide-react";
import { useState } from "react";

export function SearchBar({ onSearch, onUseLocation, loading = false }) {
  const [city, setCity] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (!city.trim()) {
      return;
    }
    onSearch(city.trim());
  };

  return (
    <form onSubmit={submit} className="glass-card rounded-2xl p-4 sm:p-5">
      <p className="mb-3 text-sm text-white/70">Search by city or use your location for instant recommendations.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 text-white/50" size={17} />
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Enter city: Chennai, Coimbatore, Mumbai"
            className="w-full rounded-xl border border-white/15 bg-black/20 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:border-sky/50 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-surf to-sky px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Loading..." : "Find Vibe"}
        </button>
        <button
          type="button"
          onClick={onUseLocation}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
        >
          <LocateFixed size={16} /> Live
        </button>
      </div>
    </form>
  );
}
