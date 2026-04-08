import { motion } from "framer-motion";
import {
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  FastForward,
  Pause,
  Play,
  Rewind,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { normalizeWeatherTheme } from "../utils/weatherTheme";

const accentClassMap = {
  clear: "from-[#ffd6e6] to-[#f7b7cf] text-[#4d1f35]",
  rain: "from-[#6bb6f6] to-[#3b78ba] text-white",
  cloud: "from-[#b8c7d6] to-[#7f95ab] text-white",
  mist: "from-[#d7e8eb] to-[#98bbc3] text-[#17353d]",
  thunder: "from-[#7464ae] to-[#272545] text-white",
  snow: "from-[#d9edff] to-[#9dcaf2] text-[#11324b]",
};

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remaining}`;
}

export function FloatingMusicPlayer({
  song,
  weatherType = "clear",
  queue = [],
  onSelectSong,
}) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.78);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  const title = song?.title || song?.name || "Unknown Song";
  const streamUrl = song?.audio || song?.soundcloudUrl || "";
  const normalizedWeather = normalizeWeatherTheme(weatherType);
  const accentClass = accentClassMap[normalizedWeather] || accentClassMap.clear;
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const activeIndex = queue.findIndex((item) => String(item?.id) === String(song?.id));
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex >= 0 && activeIndex < queue.length - 1;

  useEffect(() => {
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
  }, [streamUrl]);

  useEffect(() => {
    if (!audioRef.current || !streamUrl) {
      return;
    }

    if (isPlaying) {
      audioRef.current.play().catch(() => {
        // Browsers can block autoplay without user gesture.
      });
      return;
    }

    audioRef.current.pause();
  }, [isPlaying, streamUrl]);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.volume = Math.max(0, Math.min(1, volume));
    audioRef.current.muted = isMuted;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return undefined;
    }

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const onEnded = () => {
      if (hasNext && onSelectSong) {
        onSelectSong(queue[activeIndex + 1], queue, activeIndex + 1);
        return;
      }
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [activeIndex, hasNext, onSelectSong, queue, streamUrl]);

  const seekAudio = (event) => {
    if (!audioRef.current || !duration) {
      return;
    }

    const nextPercent = Number(event.target.value);
    const nextTime = (nextPercent / 100) * duration;
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const seekBySeconds = (delta) => {
    if (!audioRef.current || !duration) {
      return;
    }
    const nextTime = Math.max(0, Math.min(duration, (audioRef.current.currentTime || 0) + delta));
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const goToPrevious = () => {
    if (!hasPrevious || !onSelectSong) {
      return;
    }
    onSelectSong(queue[activeIndex - 1], queue, activeIndex - 1);
  };

  const goToNext = () => {
    if (!hasNext || !onSelectSong) {
      return;
    }
    onSelectSong(queue[activeIndex + 1], queue, activeIndex + 1);
  };

  const onVolumeChange = (event) => {
    const nextVolume = Number(event.target.value);
    setVolume(nextVolume);
    if (nextVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  if (!song) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-x-0 z-40 flex justify-center px-1.5 sm:px-2"
      style={{ bottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      initial={{ y: 48, opacity: 0, scale: 0.98 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
    >
      <div className="relative w-full max-w-[980px] overflow-hidden rounded-3xl border border-white/20 bg-[linear-gradient(135deg,rgba(8,24,32,0.9),rgba(14,35,47,0.92))] p-4 shadow-[0_25px_80px_rgba(4,12,20,0.6)] backdrop-blur-2xl sm:p-5">
        <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-sky/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-surf/20 blur-3xl" />

        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr),auto,minmax(0,1fr)] lg:items-center">
          <div className="flex min-w-0 items-center justify-center gap-3 lg:justify-start">
            <img
              src={song?.albumArt || "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&q=80&auto=format&fit=crop"}
              alt={title}
              className="h-14 w-14 rounded-2xl border border-white/20 object-cover shadow-lg shadow-black/40 sm:h-16 sm:w-16"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />

            <div className="min-w-0 text-center lg:text-left">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/55">Now Playing</p>
              <p className="truncate text-sm font-semibold text-white sm:text-base">{title}</p>
              <p className="truncate text-xs text-white/65 sm:text-sm">{song.artist}</p>
            </div>
          </div>

          <div className="mx-auto flex w-full flex-wrap items-center justify-center gap-2 sm:flex-nowrap lg:w-auto">
            <ControlButton
              icon={<ChevronsLeft size={16} />}
              label="Previous track"
              onClick={goToPrevious}
              disabled={!hasPrevious}
            />
            <ControlButton
              icon={<Rewind size={16} />}
              label="Backward 10 seconds"
              onClick={() => seekBySeconds(-10)}
              disabled={!streamUrl}
            />
            <button
              type="button"
              onClick={() => setIsPlaying((value) => !value)}
              disabled={!streamUrl}
              className={`rounded-2xl bg-gradient-to-br px-3 py-3 shadow-lg shadow-black/35 transition hover:scale-[1.02] disabled:opacity-50 ${accentClass}`}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <ControlButton
              icon={<FastForward size={16} />}
              label="Forward 10 seconds"
              onClick={() => seekBySeconds(10)}
              disabled={!streamUrl}
            />
            <ControlButton
              icon={<ChevronsRight size={16} />}
              label="Next track"
              onClick={goToNext}
              disabled={!hasNext}
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-end">
            {[0, 1, 2, 3].map((bar) => (
              <span
                key={bar}
                className={`player-eq-bar ${isPlaying ? "is-playing" : ""}`}
                style={{ animationDelay: `${bar * 0.16}s` }}
              />
            ))}

            <button
              type="button"
              onClick={() => setIsMuted((value) => !value)}
              className="inline-flex items-center justify-center rounded-xl border border-white/20 p-2 text-white/80 hover:bg-white/10"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={onVolumeChange}
              className="player-volume h-1.5 w-20 sm:w-24"
              aria-label="Volume"
            />

            {streamUrl ? (
              <a
                href={streamUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1 rounded-2xl border border-white/25 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10 lg:inline-flex"
              >
                Source <ExternalLink size={13} />
              </a>
            ) : null}
          </div>
        </div>

        <div className="relative mt-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={seekAudio}
            className="player-progress h-1.5 w-full"
            aria-label="Playback progress"
          />
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-white/60">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {streamUrl ? <audio ref={audioRef} controls src={streamUrl} className="sr-only" /> : null}
      </div>
    </motion.div>
  );
}

function ControlButton({ icon, label, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 p-2 text-white/85 transition hover:bg-white/10 disabled:opacity-45"
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
