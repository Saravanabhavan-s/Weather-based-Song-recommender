import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { fadeUp } from "../animations/motionPresets";
import { AnimatedBackground } from "../components/AnimatedBackground";
import { Navbar } from "../components/Navbar";

export function MainLayout({ children, weatherType = "clear" }) {
  const [activeWeather, setActiveWeather] = useState(weatherType);

  useEffect(() => {
    setActiveWeather(weatherType);
  }, [weatherType]);

  useEffect(() => {
    const onWeatherChange = (event) => {
      const nextWeather = event?.detail?.weatherType;
      if (nextWeather) {
        setActiveWeather(nextWeather);
      }
    };

    window.addEventListener("vibecast:dashboard-weather", onWeatherChange);
    return () => {
      window.removeEventListener("vibecast:dashboard-weather", onWeatherChange);
    };
  }, []);

  return (
    <div className="relative min-h-screen pb-24">
      <AnimatedBackground weatherType={activeWeather} />
      <Navbar />
      <motion.main
        className="mx-auto w-full max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        {children}
      </motion.main>
    </div>
  );
}
