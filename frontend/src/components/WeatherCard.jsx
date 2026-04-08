import { motion } from "framer-motion";
import { CloudFog, CloudLightning, CloudRain, CloudSnow, Sun, Wind } from "lucide-react";

const weatherIconByType = {
  clear: Sun,
  rain: CloudRain,
  cloud: CloudFog,
  mist: Wind,
  snow: CloudSnow,
  thunder: CloudLightning,
};

export function WeatherCard({ weather }) {
  const key = weather?.condition || "clear";
  const Icon = weatherIconByType[key] || Sun;

  return (
    <motion.article
      className="glass-card rounded-2xl p-6"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Current Weather</p>
          <h3 className="mt-2 font-display text-2xl font-bold">{weather?.city || "Unknown"}</h3>
          <p className="text-white/70">{weather?.description || "No weather data"}</p>
        </div>
        <div className="rounded-2xl bg-white/15 p-3">
          <Icon size={30} className="text-amber-200" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <Stat title="Temperature" value={`${Math.round(weather?.temperature || 0)}°C`} />
        <Stat title="Humidity" value={`${weather?.humidity || 0}%`} />
        <Stat title="Wind" value={`${weather?.windSpeed || 0} m/s`} />
      </div>
    </motion.article>
  );
}

function Stat({ title, value }) {
  return (
    <div className="rounded-xl bg-black/20 p-3">
      <p className="text-white/60">{title}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
