import { AlertCircle } from "lucide-react";

export function EmptyState({ title = "Nothing here yet", description = "Try another search or refresh." }) {
  return (
    <div className="glass-card rounded-2xl p-8 text-center">
      <AlertCircle className="mx-auto mb-3 text-white/70" size={28} />
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-white/70">{description}</p>
    </div>
  );
}
