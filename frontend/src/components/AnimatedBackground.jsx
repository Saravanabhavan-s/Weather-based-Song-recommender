import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";

import { normalizeWeatherTheme, weatherThemeMap } from "../utils/weatherTheme";

const particleProfiles = {
  clear: { count: 28, minSize: 3, maxSize: 10, minDuration: 8, maxDuration: 16, className: "particle-sunny" },
  rain: { count: 60, minSize: 1.5, maxSize: 3, minDuration: 2.4, maxDuration: 5.4, className: "particle-rainy" },
  cloud: { count: 26, minSize: 3, maxSize: 8, minDuration: 9, maxDuration: 17, className: "particle-cloudy" },
  mist: { count: 34, minSize: 4, maxSize: 12, minDuration: 10, maxDuration: 22, className: "particle-misty" },
  thunder: { count: 20, minSize: 2, maxSize: 7, minDuration: 4, maxDuration: 9, className: "particle-thunder" },
  snow: { count: 46, minSize: 3, maxSize: 9, minDuration: 6, maxDuration: 14, className: "particle-snowy" },
};

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function AnimatedBackground({ weatherType = "clear" }) {
  const normalized = normalizeWeatherTheme(weatherType);
  const theme = weatherThemeMap[normalized] || weatherThemeMap.clear;
  const particleProfile = particleProfiles[normalized] || particleProfiles.clear;

  const particles = useMemo(
    () =>
      Array.from({ length: particleProfile.count }).map((_, index) => ({
        id: index,
        left: randomBetween(0, 100),
        size: randomBetween(particleProfile.minSize, particleProfile.maxSize),
        duration: randomBetween(particleProfile.minDuration, particleProfile.maxDuration),
        delay: randomBetween(0, 2.8),
        opacity: randomBetween(0.16, 0.68),
        driftScale: randomBetween(0.82, 1.24),
      })),
    [normalized, particleProfile]
  );

  const splitIndex = Math.ceil(particles.length * 0.62);
  const backParticles = particles.slice(0, splitIndex);
  const frontParticles = particles.slice(splitIndex);

  return (
    <div className="weather-bg" aria-hidden="true">
      <AnimatePresence mode="sync">
        <motion.div
          key={`weather-layer-${normalized}`}
          className={`weather-layer ${theme.className}`}
          initial={{ opacity: 0, scale: 1.025, filter: "saturate(92%)" }}
          animate={{ opacity: 1, scale: 1, filter: "saturate(104%)" }}
          exit={{ opacity: 0, scale: 0.985, filter: "saturate(88%)" }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            key={`glow-a-${normalized}`}
            className="weather-glow weather-glow-primary"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
          <motion.span
            key={`glow-b-${normalized}`}
            className="weather-glow weather-glow-secondary"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />

          <div className="particle-field particle-field-back">
            {backParticles.map((particle) => (
              <span
                key={`back-${particle.id}`}
                className={`floating-particle ${particleProfile.className} particle-depth-back`}
                style={{
                  left: `${particle.left}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  animationDuration: `${particle.duration}s`,
                  animationDelay: `${particle.delay}s`,
                  "--particle-opacity": particle.opacity,
                  "--particle-scale": particle.driftScale,
                }}
              />
            ))}
          </div>

          <div className="particle-field particle-field-front">
            {frontParticles.map((particle) => (
              <span
                key={`front-${particle.id}`}
                className={`floating-particle ${particleProfile.className} particle-depth-front`}
                style={{
                  left: `${particle.left}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  animationDuration: `${particle.duration * 0.92}s`,
                  animationDelay: `${particle.delay * 0.8}s`,
                  "--particle-opacity": particle.opacity,
                  "--particle-scale": particle.driftScale,
                }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
