import { Sparkles } from "lucide-react";

export function MoodCard({ mood = "calm", weather = "clear", timeOfDay = "evening" }) {
  return (
    <article className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-coral/30 p-2 text-coral">
          <Sparkles size={18} />
        </span>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Detected Vibe</p>
          <h3 className="font-display text-xl font-semibold capitalize">{mood}</h3>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Chip label="Weather" value={weather} />
        <Chip label="Time" value={timeOfDay} />
      </div>
    </article>
  );
}

function Chip({ label, value }) {
  return (
    <div className="rounded-xl border border-white/15 bg-black/20 px-3 py-2">
      <p className="text-xs text-white/55">{label}</p>
      <p className="mt-1 font-medium capitalize text-white">{value}</p>
    </div>
  );
}
