export const weatherThemeMap = {
  clear: {
    className: "sunny",
    gradient: "from-[#ffdce9]/45 via-[#f6cfde]/30 to-[#efbdd1]/35",
    label: "Sunny",
  },
  rain: {
    className: "rainy",
    gradient: "from-sky-900/35 via-blue-800/30 to-slate-900/35",
    label: "Rainy",
  },
  cloud: {
    className: "cloudy",
    gradient: "from-slate-500/30 via-slate-700/25 to-slate-900/35",
    label: "Cloudy",
  },
  thunder: {
    className: "thunder",
    gradient: "from-zinc-900/45 via-indigo-950/35 to-black/50",
    label: "Thunderstorm",
  },
  mist: {
    className: "mist",
    gradient: "from-slate-300/20 via-cyan-100/10 to-slate-600/20",
    label: "Mist",
  },
  snow: {
    className: "snowy",
    gradient: "from-cyan-200/25 via-blue-100/20 to-sky-200/25",
    label: "Snow",
  },
};

export function normalizeWeatherTheme(value = "") {
  const key = String(value).toLowerCase();
  if (key.includes("thunder") || key.includes("storm")) {
    return "thunder";
  }
  if (key.includes("rain") || key.includes("drizzle") || key.includes("shower")) {
    return "rain";
  }
  if (key.includes("snow") || key.includes("sleet")) {
    return "snow";
  }
  if (key.includes("mist") || key.includes("fog") || key.includes("haze")) {
    return "mist";
  }
  if (key.includes("cloud")) {
    return "cloud";
  }
  return "clear";
}
