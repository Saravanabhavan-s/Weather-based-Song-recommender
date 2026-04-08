import { motion } from "framer-motion";
import { CloudSun, LogOut, Music2, UserRound } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/search", label: "Search" },
  { to: "/profile", label: "Profile" },
  { to: "/admin", label: "Admin" },
];

export function Navbar() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <motion.header
      className="sticky top-0 z-30 border-b border-white/10 bg-[#09161e]/75 backdrop-blur-xl"
      initial={{ y: -36, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-white">
          <span className="rounded-xl bg-gradient-to-br from-surf to-sky p-2 shadow-lg shadow-sky-500/20">
            <Music2 size={18} />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">Vibecast</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm transition ${
                  isActive ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {token ? (
            <>
              <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 md:flex">
                <UserRound size={15} />
                <span className="text-sm">{user?.name || "User"}</span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-3 py-2 text-sm text-white/80 hover:bg-white/10">
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-coral to-sky px-4 py-2 text-sm font-semibold text-white"
              >
                <CloudSun size={15} /> Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
