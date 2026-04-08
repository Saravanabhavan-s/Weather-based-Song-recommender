import { motion } from "framer-motion";
import { CloudRain, Flame, Music, Sparkles, SunMedium, Wind } from "lucide-react";
import { Link } from "react-router-dom";

import { fadeUp, staggerParent } from "../animations/motionPresets";

const weatherPreview = [
  { title: "Sunny", mood: "Happy + Energetic", icon: SunMedium, gradient: "from-[#ffdce8]/55 to-[#f8c8d9]/45" },
  { title: "Rainy", mood: "Romantic + Calm", icon: CloudRain, gradient: "from-blue-400/40 to-sky-500/35" },
  { title: "Mist", mood: "Dreamy + Lo-fi", icon: Wind, gradient: "from-slate-300/40 to-cyan-300/35" },
];

const playlists = [
  { title: "Top Romantic Rainy Songs", subtitle: "Soft vocals, velvet strings" },
  { title: "Morning Motivation", subtitle: "Warm beats and focused energy" },
  { title: "Night Chill Playlist", subtitle: "Lo-fi and ambient textures" },
];

export function LandingPage() {
  return (
    <div className="space-y-10">
      <motion.section
        className="glass-card relative overflow-hidden rounded-3xl p-8 sm:p-12"
        variants={staggerParent}
        initial="hidden"
        animate="visible"
      >
        <div className="absolute -right-24 -top-28 h-64 w-64 rounded-full bg-[#ffd9e6]/65 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-[#ffc9de]/45 blur-3xl" />

        <motion.p variants={fadeUp} className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs uppercase tracking-[0.16em] text-white/85">
          <Sparkles size={14} /> Context-Aware Music Recommender
        </motion.p>
        <motion.h1 variants={fadeUp} className="mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight sm:text-5xl">
          Music that adapts to your weather, mood, and moment.
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-4 max-w-2xl text-base text-white/80">
          Vibecast blends live weather, time of day, and your listening habits to serve songs that feel instantly personal.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-3">
          <Link
            to="/register"
            className="rounded-xl bg-gradient-to-r from-[#f8cfdd] via-[#efbfd2] to-[#e4c0d2] px-5 py-3 text-sm font-semibold text-[#43213a]"
          >
            Get Started
          </Link>
          <Link to="/dashboard" className="rounded-xl border border-white/20 px-5 py-3 text-sm text-white/85 hover:bg-white/10">
            Explore Music
          </Link>
        </motion.div>
      </motion.section>

      <motion.section
        className="grid gap-4 md:grid-cols-3"
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        {weatherPreview.map((item) => {
          const Icon = item.icon;
          return (
            <motion.article key={item.title} variants={fadeUp} className="glass-card rounded-2xl p-5">
              <div className={`mb-3 inline-flex rounded-xl bg-gradient-to-br ${item.gradient} p-3`}>
                <Icon size={20} />
              </div>
              <h3 className="font-display text-xl font-semibold">{item.title} Vibes</h3>
              <p className="mt-1 text-sm text-white/75">{item.mood}</p>
              <p className="mt-4 text-xs text-white/60">Weather to mood mapping powers smart recommendation scoring.</p>
            </motion.article>
          );
        })}
      </motion.section>

      <section className="glass-card rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">Trending Playlists</h2>
          <Music className="text-white/70" size={18} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {playlists.map((item) => (
            <article key={item.title} className="rounded-2xl border border-white/15 bg-black/25 p-4">
              <p className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-[#f7bfd1]">
                <Flame size={13} /> Trending
              </p>
              <h3 className="mt-2 font-display text-lg font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-white/70">{item.subtitle}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
