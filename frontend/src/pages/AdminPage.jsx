import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  BellRing,
  CloudSun,
  CreditCard,
  LayoutDashboard,
  ListMusic,
  Menu,
  MessageSquareMore,
  Music2,
  Plus,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AdminSidebar } from "../components/AdminSidebar";
import { EmptyState } from "../components/EmptyState";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { adminService } from "../services/adminService";
import { AnalyticsCharts } from "../components/AnalyticsCharts";

const sections = [
  { key: "overview", label: "Dashboard Overview", icon: LayoutDashboard },
  { key: "users", label: "User Management", icon: Users },
  { key: "music", label: "Music Management", icon: Music2 },
  { key: "recommendations", label: "Recommendation Controls", icon: SlidersHorizontal },
  { key: "weather", label: "Weather Mapping", icon: CloudSun },
  { key: "playlists", label: "Playlist Management", icon: ListMusic },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "feedback", label: "Feedback & Support", icon: MessageSquareMore },
  { key: "notifications", label: "Notifications", icon: BellRing },
  { key: "revenue", label: "Subscription / Revenue", icon: CreditCard },
  { key: "health", label: "System Health", icon: Activity },
  { key: "security", label: "Security & Logs", icon: ShieldCheck },
  { key: "settings", label: "Settings", icon: Settings },
];

const DEFAULT_SETTINGS = {
  appName: "Vibecast",
  supportEmail: "support@vibecast.app",
  featuredCity: "Chennai",
  maintenanceMode: false,
  allowNewRegistrations: true,
  defaultRecommendationLimit: 12,
  weatherRefreshMinutes: 15,
};

const DEFAULT_RECOMMENDATION_CONTROLS = {
  weatherWeight: 5,
  moodWeight: 4,
  timeWeight: 3,
  temperatureWeight: 2,
  artistAffinityWeight: 4,
  popularityWeight: 2,
  recentPenaltyWeight: 3,
  maxCandidatePool: 400,
  diversityBoost: 0.15,
};

const DEFAULT_WEATHER_MAPPING = {
  rain: ["romantic", "calm", "melancholic"],
  clear: ["happy", "energetic"],
  cloud: ["chill", "soft"],
  thunder: ["intense", "emotional"],
  mist: ["dreamy", "lo-fi"],
  snow: ["peaceful", "cozy"],
};

const DEFAULT_SONG_FORM = {
  title: "",
  artist: "",
  genre: "Unknown",
  soundcloudUrl: "",
  albumArt: "",
  moods: "",
  weatherTags: "",
  timeTags: "",
  popularity: 50,
  duration: 180,
};

const DEFAULT_NOTIFICATION_FORM = {
  title: "",
  message: "",
  channel: "in_app",
  pinned: false,
};

const DEFAULT_FEEDBACK_FORM = {
  userEmail: "",
  subject: "",
  message: "",
};

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function toCsv(values = []) {
  return Array.isArray(values) ? values.join(", ") : "";
}

export function AdminPage() {
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);

  const [platformSettings, setPlatformSettings] = useState(DEFAULT_SETTINGS);
  const [settingsUpdatedAt, setSettingsUpdatedAt] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const [recommendationControls, setRecommendationControls] = useState(DEFAULT_RECOMMENDATION_CONTROLS);
  const [recommendationControlsUpdatedAt, setRecommendationControlsUpdatedAt] = useState("");
  const [savingRecommendationControls, setSavingRecommendationControls] = useState(false);

  const [weatherMapping, setWeatherMapping] = useState(DEFAULT_WEATHER_MAPPING);
  const [weatherMappingUpdatedAt, setWeatherMappingUpdatedAt] = useState("");
  const [savingWeatherMapping, setSavingWeatherMapping] = useState(false);

  const [songs, setSongs] = useState([]);
  const [musicSearch, setMusicSearch] = useState("");
  const [savingSong, setSavingSong] = useState(false);
  const [deletingSongId, setDeletingSongId] = useState("");

  const [playlists, setPlaylists] = useState([]);
  const [deletingPlaylistId, setDeletingPlaylistId] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [creatingNotification, setCreatingNotification] = useState(false);
  const [updatingNotificationId, setUpdatingNotificationId] = useState("");

  const [feedbackItems, setFeedbackItems] = useState([]);
  const [creatingFeedback, setCreatingFeedback] = useState(false);
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState("");

  const [revenueData, setRevenueData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [securityData, setSecurityData] = useState({ logs: [], blockedUsers: [] });

  const [search, setSearch] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workingUserId, setWorkingUserId] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        analyticsRes,
        usersRes,
        settingsRes,
        recommendationControlsRes,
        weatherMappingRes,
        songsRes,
        playlistsRes,
        notificationsRes,
        feedbackRes,
        revenueRes,
        healthRes,
        securityRes,
      ] = await Promise.all([
        adminService.analytics(),
        adminService.users(120),
        adminService.settings(),
        adminService.recommendationControls(),
        adminService.weatherMapping(),
        adminService.songs(100, ""),
        adminService.playlists(180),
        adminService.notifications(180),
        adminService.feedback(180),
        adminService.revenue(),
        adminService.systemHealth(),
        adminService.securityLogs(180),
      ]);

      setAnalytics(analyticsRes);
      setUsers(usersRes.items || []);

      setPlatformSettings({ ...DEFAULT_SETTINGS, ...(settingsRes?.settings || {}) });
      setSettingsUpdatedAt(String(settingsRes?.updatedAt || ""));

      setRecommendationControls({
        ...DEFAULT_RECOMMENDATION_CONTROLS,
        ...(recommendationControlsRes?.controls || {}),
      });
      setRecommendationControlsUpdatedAt(String(recommendationControlsRes?.updatedAt || ""));

      setWeatherMapping({ ...DEFAULT_WEATHER_MAPPING, ...(weatherMappingRes?.mapping || {}) });
      setWeatherMappingUpdatedAt(String(weatherMappingRes?.updatedAt || ""));

      setSongs((songsRes?.items || []).slice());
      setPlaylists(playlistsRes?.items || []);
      setNotifications(notificationsRes?.items || []);
      setFeedbackItems(feedbackRes?.items || []);
      setRevenueData(revenueRes || null);
      setHealthData(healthRes || null);
      setSecurityData({
        logs: securityRes?.logs || [],
        blockedUsers: securityRes?.blockedUsers || [],
      });
    } catch (err) {
      setError(err.message || "Failed to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return users;
    }

    return users.filter((item) => {
      const name = String(item.name || "").toLowerCase();
      const email = String(item.email || "").toLowerCase();
      const role = String(item.role || "").toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [search, users]);

  const blockToggle = async (user) => {
    const nextBlocked = !user.blocked;
    const reason = nextBlocked ? window.prompt("Reason for blocking user (optional):", user.blockedReason || "") || "" : "";

    setWorkingUserId(user.id);
    setError("");
    setNotice("");

    try {
      const response = await adminService.setUserBlocked(user.id, nextBlocked, reason);
      setUsers((prev) =>
        prev.map((entry) =>
          entry.id === user.id
            ? {
                ...entry,
                blocked: response?.user?.blocked,
                blockedReason: response?.user?.blockedReason || null,
                blockedAt: response?.user?.blockedAt || null,
              }
            : entry
        )
      );
      setNotice(response?.detail || "User status updated.");

      const analyticsRes = await adminService.analytics();
      setAnalytics(analyticsRes);
    } catch (err) {
      setError(err.message || "Could not update user status.");
    } finally {
      setWorkingUserId("");
    }
  };

  const saveSettings = async (nextSettings) => {
    setSavingSettings(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        appName: String(nextSettings.appName || "").trim(),
        supportEmail: String(nextSettings.supportEmail || "").trim().toLowerCase(),
        featuredCity: String(nextSettings.featuredCity || "").trim(),
        maintenanceMode: Boolean(nextSettings.maintenanceMode),
        allowNewRegistrations: Boolean(nextSettings.allowNewRegistrations),
        defaultRecommendationLimit: Number(nextSettings.defaultRecommendationLimit),
        weatherRefreshMinutes: Number(nextSettings.weatherRefreshMinutes),
      };

      const response = await adminService.updateSettings(payload);
      setPlatformSettings({ ...DEFAULT_SETTINGS, ...(response?.settings || payload) });
      setSettingsUpdatedAt(String(response?.updatedAt || ""));
      setNotice(response?.detail || "Settings updated successfully.");
    } catch (err) {
      setError(err.message || "Could not save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const saveRecommendationControls = async (nextControls) => {
    setSavingRecommendationControls(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        weatherWeight: Number(nextControls.weatherWeight),
        moodWeight: Number(nextControls.moodWeight),
        timeWeight: Number(nextControls.timeWeight),
        temperatureWeight: Number(nextControls.temperatureWeight),
        artistAffinityWeight: Number(nextControls.artistAffinityWeight),
        popularityWeight: Number(nextControls.popularityWeight),
        recentPenaltyWeight: Number(nextControls.recentPenaltyWeight),
        maxCandidatePool: Number(nextControls.maxCandidatePool),
        diversityBoost: Number(nextControls.diversityBoost),
      };
      const response = await adminService.updateRecommendationControls(payload);
      setRecommendationControls({ ...DEFAULT_RECOMMENDATION_CONTROLS, ...(response?.controls || payload) });
      setRecommendationControlsUpdatedAt(String(response?.updatedAt || ""));
      setNotice(response?.detail || "Recommendation controls updated.");
    } catch (err) {
      setError(err.message || "Could not save recommendation controls.");
    } finally {
      setSavingRecommendationControls(false);
    }
  };

  const saveWeatherMapping = async (nextMapping) => {
    setSavingWeatherMapping(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        rain: splitCsv(nextMapping.rain),
        clear: splitCsv(nextMapping.clear),
        cloud: splitCsv(nextMapping.cloud),
        thunder: splitCsv(nextMapping.thunder),
        mist: splitCsv(nextMapping.mist),
        snow: splitCsv(nextMapping.snow),
      };
      const response = await adminService.updateWeatherMapping(payload);
      setWeatherMapping({ ...DEFAULT_WEATHER_MAPPING, ...(response?.mapping || payload) });
      setWeatherMappingUpdatedAt(String(response?.updatedAt || ""));
      setNotice(response?.detail || "Weather mapping updated.");
    } catch (err) {
      setError(err.message || "Could not save weather mapping.");
    } finally {
      setSavingWeatherMapping(false);
    }
  };

  const createSong = async (form) => {
    setSavingSong(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        title: String(form.title || "").trim(),
        artist: String(form.artist || "").trim(),
        language: "Tamil",
        genre: String(form.genre || "Unknown").trim() || "Unknown",
        moods: splitCsv(form.moods),
        weatherTags: splitCsv(form.weatherTags),
        timeTags: splitCsv(form.timeTags),
        tempRange: { min: -10, max: 45 },
        energy: 0.5,
        popularity: Number(form.popularity || 50),
        soundcloudUrl: String(form.soundcloudUrl || "").trim() || null,
        albumArt: String(form.albumArt || "").trim() || null,
        duration: Number(form.duration || 180),
      };

      const created = await adminService.createSong(payload);
      setSongs((prev) => [created, ...prev]);
      setNotice("Song created successfully.");
      return true;
    } catch (err) {
      setError(err.message || "Could not create song.");
      return false;
    } finally {
      setSavingSong(false);
    }
  };

  const deleteSong = async (song) => {
    if (!song?.id) {
      return;
    }

    if (!window.confirm(`Delete song "${song.title}" by ${song.artist}?`)) {
      return;
    }

    setDeletingSongId(song.id);
    setError("");
    setNotice("");
    try {
      await adminService.deleteSong(song.id);
      setSongs((prev) => prev.filter((item) => item.id !== song.id));
      setNotice("Song deleted.");
    } catch (err) {
      setError(err.message || "Could not delete song.");
    } finally {
      setDeletingSongId("");
    }
  };

  const deletePlaylist = async (item) => {
    if (!item?.id) {
      return;
    }
    if (!window.confirm(`Delete playlist "${item.playlistName}"?`)) {
      return;
    }
    setDeletingPlaylistId(item.id);
    setError("");
    setNotice("");
    try {
      await adminService.deletePlaylist(item.id);
      setPlaylists((prev) => prev.filter((entry) => entry.id !== item.id));
      setNotice("Playlist removed.");
    } catch (err) {
      setError(err.message || "Could not delete playlist.");
    } finally {
      setDeletingPlaylistId("");
    }
  };

  const createNotification = async (form) => {
    setCreatingNotification(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        title: String(form.title || "").trim(),
        message: String(form.message || "").trim(),
        channel: String(form.channel || "in_app"),
        pinned: Boolean(form.pinned),
      };
      const created = await adminService.createNotification(payload);
      setNotifications((prev) => [created, ...prev]);
      setNotice("Notification sent.");
      return true;
    } catch (err) {
      setError(err.message || "Could not create notification.");
      return false;
    } finally {
      setCreatingNotification(false);
    }
  };

  const updateNotification = async (item, payload) => {
    setUpdatingNotificationId(item.id);
    setError("");
    setNotice("");
    try {
      const updated = await adminService.updateNotification(item.id, payload);
      setNotifications((prev) => prev.map((entry) => (entry.id === item.id ? updated : entry)));
      setNotice("Notification updated.");
    } catch (err) {
      setError(err.message || "Could not update notification.");
    } finally {
      setUpdatingNotificationId("");
    }
  };

  const createFeedback = async (form) => {
    setCreatingFeedback(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        userEmail: String(form.userEmail || "").trim() || null,
        subject: String(form.subject || "").trim(),
        message: String(form.message || "").trim(),
      };
      const created = await adminService.createFeedback(payload);
      setFeedbackItems((prev) => [created, ...prev]);
      setNotice("Feedback ticket added.");
      return true;
    } catch (err) {
      setError(err.message || "Could not create feedback.");
      return false;
    } finally {
      setCreatingFeedback(false);
    }
  };

  const updateFeedback = async (item, statusValue) => {
    const adminNote = window.prompt("Optional admin note:", item.adminNote || "") || "";

    setUpdatingFeedbackId(item.id);
    setError("");
    setNotice("");

    try {
      const updated = await adminService.updateFeedback(item.id, {
        status: statusValue,
        adminNote,
      });
      setFeedbackItems((prev) => prev.map((entry) => (entry.id === item.id ? updated : entry)));
      setNotice("Feedback status updated.");
    } catch (err) {
      setError(err.message || "Could not update feedback.");
    } finally {
      setUpdatingFeedbackId("");
    }
  };

  const filteredSongs = useMemo(() => {
    const q = String(musicSearch || "").trim().toLowerCase();
    if (!q) {
      return songs;
    }
    return songs.filter((song) => {
      const title = String(song.title || "").toLowerCase();
      const artist = String(song.artist || "").toLowerCase();
      const genre = String(song.genre || "").toLowerCase();
      return title.includes(q) || artist.includes(q) || genre.includes(q);
    });
  }, [musicSearch, songs]);

  if (loading) {
    return (
      <div className="grid gap-4">
        <SkeletonLoader className="h-28" />
        <SkeletonLoader className="h-72" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 bg-transparent text-white lg:grid-cols-[auto,1fr]">
      <AdminSidebar
        sections={sections}
        active={activeSection}
        onSelect={setActiveSection}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="space-y-4">
        <section className="glass-card rounded-2xl p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex rounded-xl border border-white/20 p-2 text-white/80 hover:bg-white/10 lg:hidden"
                aria-label="Open admin sidebar"
              >
                <Menu size={17} />
              </button>

              <div>
                <h1 className="font-display text-2xl font-bold">Vibecast Admin Dashboard</h1>
                <p className="text-sm text-white/70">Modern operations panel for users, recommendations, music, and system health.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
                className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-sky/60"
              />

              <button
                type="button"
                onClick={loadData}
                className="rounded-xl border border-white/20 px-3 py-2 text-xs text-white/80 hover:bg-white/10"
              >
                Refresh
              </button>
            </div>
          </div>
        </section>

        {error ? <div className="rounded-xl bg-red-500/15 px-4 py-2 text-sm text-red-200">{error}</div> : null}
        {notice ? <div className="rounded-xl bg-emerald-500/15 px-4 py-2 text-sm text-emerald-100">{notice}</div> : null}

        {activeSection === "overview" ? (
          <OverviewSection analytics={analytics} />
        ) : null}

        {activeSection === "analytics" ? (
          <AnalyticsSection analytics={analytics} />
        ) : null}

        {activeSection === "users" ? (
          <UsersSection users={filteredUsers} onBlockToggle={blockToggle} workingUserId={workingUserId} />
        ) : null}

        {activeSection === "music" ? (
          <MusicManagementSection
            songs={filteredSongs}
            search={musicSearch}
            onSearchChange={setMusicSearch}
            onCreateSong={createSong}
            onDeleteSong={deleteSong}
            savingSong={savingSong}
            deletingSongId={deletingSongId}
          />
        ) : null}

        {activeSection === "recommendations" ? (
          <RecommendationControlsSection
            controls={recommendationControls}
            updatedAt={recommendationControlsUpdatedAt}
            onSave={saveRecommendationControls}
            saving={savingRecommendationControls}
          />
        ) : null}

        {activeSection === "weather" ? (
          <WeatherMappingSection
            mapping={weatherMapping}
            updatedAt={weatherMappingUpdatedAt}
            onSave={saveWeatherMapping}
            saving={savingWeatherMapping}
          />
        ) : null}

        {activeSection === "playlists" ? (
          <PlaylistManagementSection
            playlists={playlists}
            deletingPlaylistId={deletingPlaylistId}
            onDeletePlaylist={deletePlaylist}
          />
        ) : null}

        {activeSection === "feedback" ? (
          <FeedbackSupportSection
            items={feedbackItems}
            onCreateFeedback={createFeedback}
            onUpdateFeedback={updateFeedback}
            creatingFeedback={creatingFeedback}
            updatingFeedbackId={updatingFeedbackId}
          />
        ) : null}

        {activeSection === "notifications" ? (
          <NotificationsSection
            items={notifications}
            onCreateNotification={createNotification}
            onUpdateNotification={updateNotification}
            creatingNotification={creatingNotification}
            updatingNotificationId={updatingNotificationId}
          />
        ) : null}

        {activeSection === "revenue" ? <RevenueSection data={revenueData} /> : null}

        {activeSection === "health" ? <SystemHealthSection data={healthData} /> : null}

        {activeSection === "security" ? <SecurityLogsSection data={securityData} /> : null}

        {activeSection === "settings" ? (
          <SettingsSection
            settings={platformSettings}
            updatedAt={settingsUpdatedAt}
            onSave={saveSettings}
            saving={savingSettings}
          />
        ) : null}

        {!new Set([
          "overview",
          "analytics",
          "users",
          "music",
          "recommendations",
          "weather",
          "playlists",
          "feedback",
          "notifications",
          "revenue",
          "health",
          "security",
          "settings",
        ]).has(activeSection) ? (
          <section className="glass-card rounded-2xl p-5">
            <EmptyState
              title={`${sections.find((item) => item.key === activeSection)?.label || "Section"} is ready for configuration`}
              description="This section scaffold is ready. Connect APIs and workflows to enable full operations."
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}

function OverviewSection({ analytics }) {
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard label="Total Users" value={analytics?.totals?.users || 0} />
        <KpiCard label="Active Users Today" value={analytics?.totals?.activeUsers24h || 0} />
        <KpiCard label="Songs Played Today" value={analytics?.totals?.plays || 0} />
        <KpiCard label="New Signups" value={analytics?.usageByDay?.at(-1)?.registrations || 0} />
        <KpiCard label="Premium Users" value={Math.round((analytics?.totals?.users || 0) * 0.18)} />
        <KpiCard label="Tokens Issued" value={analytics?.totals?.tokensIssued || 0} />
      </section>

      <AnalyticsCharts
        topSongs={analytics?.topSongs || []}
        weatherTrends={analytics?.weatherTrends || []}
        usageByDay={analytics?.usageByDay || []}
        topUsers={analytics?.topUsers || []}
      />
    </>
  );
}

function AnalyticsSection({ analytics }) {
  return (
    <section className="grid gap-4">
      <AnalyticsCharts
        topSongs={analytics?.topSongs || []}
        weatherTrends={analytics?.weatherTrends || []}
        usageByDay={analytics?.usageByDay || []}
        topUsers={analytics?.topUsers || []}
      />
    </section>
  );
}

function UsersSection({ users = [], onBlockToggle, workingUserId = "" }) {
  return (
    <section className="glass-card rounded-2xl p-4">
      <h3 className="font-display text-xl font-semibold">User Management</h3>

      <div className="mt-3 overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#0e2231] text-white/70">
            <tr>
              <th className="px-2 py-2">Name</th>
              <th className="px-2 py-2">Email</th>
              <th className="px-2 py-2">Role</th>
              <th className="px-2 py-2">Plays</th>
              <th className="px-2 py-2">Likes</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <motion.tr
                key={user.id}
                className="border-t border-white/10"
                initial={{ opacity: 0.9 }}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                <td className="px-2 py-2">{user.name}</td>
                <td className="px-2 py-2 text-white/70">{user.email}</td>
                <td className="px-2 py-2 capitalize">{user.role}</td>
                <td className="px-2 py-2">{user.playsCount || 0}</td>
                <td className="px-2 py-2">{user.likedSongsCount || 0}</td>
                <td className="px-2 py-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      user.blocked ? "bg-red-500/20 text-red-200" : "bg-emerald-500/20 text-emerald-100"
                    }`}
                  >
                    {user.blocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    disabled={workingUserId === user.id || user.role === "admin"}
                    onClick={() => onBlockToggle?.(user)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      user.blocked
                        ? "bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30"
                        : "bg-red-500/20 text-red-100 hover:bg-red-500/30"
                    } disabled:opacity-45`}
                  >
                    {workingUserId === user.id ? "Updating..." : user.blocked ? "Unblock" : "Block"}
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MusicManagementSection({
  songs = [],
  search,
  onSearchChange,
  onCreateSong,
  onDeleteSong,
  savingSong = false,
  deletingSongId = "",
}) {
  const [form, setForm] = useState(DEFAULT_SONG_FORM);

  const submit = async (event) => {
    event.preventDefault();
    const ok = await onCreateSong?.(form);
    if (ok) {
      setForm(DEFAULT_SONG_FORM);
    }
  };

  return (
    <section className="glass-card rounded-2xl p-5">
      <h3 className="font-display text-xl font-semibold">Music Management</h3>
      <p className="text-sm text-white/70">Create and remove catalog songs used by recommendations.</p>

      <form className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={submit}>
        <input
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Song title"
          className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
          required
        />
        <input
          value={form.artist}
          onChange={(event) => setForm((prev) => ({ ...prev, artist: event.target.value }))}
          placeholder="Artist"
          className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
          required
        />
        <input
          value={form.genre}
          onChange={(event) => setForm((prev) => ({ ...prev, genre: event.target.value }))}
          placeholder="Genre"
          className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
        />
        <input
          value={form.soundcloudUrl}
          onChange={(event) => setForm((prev) => ({ ...prev, soundcloudUrl: event.target.value }))}
          placeholder="Audio URL"
          className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
        />
        <input
          value={form.moods}
          onChange={(event) => setForm((prev) => ({ ...prev, moods: event.target.value }))}
          placeholder="Moods (comma separated)"
          className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
        />
        <input
          value={form.weatherTags}
          onChange={(event) => setForm((prev) => ({ ...prev, weatherTags: event.target.value }))}
          placeholder="Weather tags (comma separated)"
          className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
        />
        <input
          value={form.timeTags}
          onChange={(event) => setForm((prev) => ({ ...prev, timeTags: event.target.value }))}
          placeholder="Time tags (morning, night...)"
          className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            value={form.popularity}
            onChange={(event) => setForm((prev) => ({ ...prev, popularity: Number(event.target.value) }))}
            placeholder="Popularity"
            className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={savingSong}
            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-surf to-sky px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Plus size={15} /> {savingSong ? "Adding" : "Add"}
          </button>
        </div>
      </form>

      <div className="mt-4 flex items-center gap-2">
        <input
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder="Search songs..."
          className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-3 overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#0e2231] text-white/70">
            <tr>
              <th className="px-2 py-2">Title</th>
              <th className="px-2 py-2">Artist</th>
              <th className="px-2 py-2">Genre</th>
              <th className="px-2 py-2">Popularity</th>
              <th className="px-2 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {songs.map((song) => (
              <tr key={song.id} className="border-t border-white/10">
                <td className="px-2 py-2">{song.title}</td>
                <td className="px-2 py-2">{song.artist}</td>
                <td className="px-2 py-2">{song.genre || "-"}</td>
                <td className="px-2 py-2">{song.popularity ?? 0}</td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => onDeleteSong?.(song)}
                    disabled={deletingSongId === song.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-100 hover:bg-red-500/30 disabled:opacity-60"
                  >
                    <Trash2 size={13} /> {deletingSongId === song.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecommendationControlsSection({ controls, updatedAt = "", onSave, saving = false }) {
  const [form, setForm] = useState({ ...DEFAULT_RECOMMENDATION_CONTROLS, ...(controls || {}) });

  useEffect(() => {
    setForm({ ...DEFAULT_RECOMMENDATION_CONTROLS, ...(controls || {}) });
  }, [controls]);

  const fields = [
    "weatherWeight",
    "moodWeight",
    "timeWeight",
    "temperatureWeight",
    "artistAffinityWeight",
    "popularityWeight",
    "recentPenaltyWeight",
    "maxCandidatePool",
    "diversityBoost",
  ];

  const submit = async (event) => {
    event.preventDefault();
    await onSave?.(form);
  };

  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-xl font-semibold">Recommendation Controls</h3>
        <p className="text-xs text-white/60">
          {updatedAt ? `Last updated: ${new Date(updatedAt).toLocaleString()}` : "Not updated yet"}
        </p>
      </div>

      <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={submit}>
        {fields.map((field) => (
          <div key={field}>
            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-white/60">{field}</label>
            <input
              type="number"
              step={field === "diversityBoost" ? "0.01" : "1"}
              value={form[field]}
              onChange={(event) => setForm((prev) => ({ ...prev, [field]: Number(event.target.value) }))}
              className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
            />
          </div>
        ))}

        <div className="md:col-span-2 xl:col-span-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-surf to-sky px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Recommendation Controls"}
          </button>
        </div>
      </form>
    </section>
  );
}

function WeatherMappingSection({ mapping, updatedAt = "", onSave, saving = false }) {
  const [form, setForm] = useState({
    rain: toCsv(mapping?.rain),
    clear: toCsv(mapping?.clear),
    cloud: toCsv(mapping?.cloud),
    thunder: toCsv(mapping?.thunder),
    mist: toCsv(mapping?.mist),
    snow: toCsv(mapping?.snow),
  });

  useEffect(() => {
    setForm({
      rain: toCsv(mapping?.rain),
      clear: toCsv(mapping?.clear),
      cloud: toCsv(mapping?.cloud),
      thunder: toCsv(mapping?.thunder),
      mist: toCsv(mapping?.mist),
      snow: toCsv(mapping?.snow),
    });
  }, [mapping]);

  const submit = async (event) => {
    event.preventDefault();
    await onSave?.(form);
  };

  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-xl font-semibold">Weather Mapping</h3>
        <p className="text-xs text-white/60">
          {updatedAt ? `Last updated: ${new Date(updatedAt).toLocaleString()}` : "Not updated yet"}
        </p>
      </div>

      <form className="grid gap-3 md:grid-cols-2" onSubmit={submit}>
        {Object.keys(DEFAULT_WEATHER_MAPPING).map((key) => (
          <div key={key}>
            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-white/60">{key}</label>
            <input
              value={form[key]}
              onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
              className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
              placeholder="comma separated moods"
            />
          </div>
        ))}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-surf to-sky px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Weather Mapping"}
          </button>
        </div>
      </form>
    </section>
  );
}

function PlaylistManagementSection({ playlists = [], deletingPlaylistId = "", onDeletePlaylist }) {
  return (
    <section className="glass-card rounded-2xl p-5">
      <h3 className="font-display text-xl font-semibold">Playlist Management</h3>
      <p className="text-sm text-white/70">Review and moderate all user playlists.</p>

      <div className="mt-3 overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#0e2231] text-white/70">
            <tr>
              <th className="px-2 py-2">Playlist</th>
              <th className="px-2 py-2">User</th>
              <th className="px-2 py-2">Mood</th>
              <th className="px-2 py-2">Weather</th>
              <th className="px-2 py-2">Songs</th>
              <th className="px-2 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {playlists.map((item) => (
              <tr key={item.id} className="border-t border-white/10">
                <td className="px-2 py-2">{item.playlistName}</td>
                <td className="px-2 py-2">{item.userName || item.userEmail || "Unknown"}</td>
                <td className="px-2 py-2">{item.mood || "-"}</td>
                <td className="px-2 py-2">{item.weatherType || "-"}</td>
                <td className="px-2 py-2">{item.songsCount || 0}</td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    disabled={deletingPlaylistId === item.id}
                    onClick={() => onDeletePlaylist?.(item)}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-100 hover:bg-red-500/30 disabled:opacity-60"
                  >
                    <Trash2 size={13} /> {deletingPlaylistId === item.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function NotificationsSection({
  items = [],
  onCreateNotification,
  onUpdateNotification,
  creatingNotification = false,
  updatingNotificationId = "",
}) {
  const [form, setForm] = useState(DEFAULT_NOTIFICATION_FORM);

  const submit = async (event) => {
    event.preventDefault();
    const ok = await onCreateNotification?.(form);
    if (ok) {
      setForm(DEFAULT_NOTIFICATION_FORM);
    }
  };

  return (
    <section className="glass-card rounded-2xl p-5">
      <h3 className="font-display text-xl font-semibold">Notifications</h3>
      <p className="text-sm text-white/70">Compose announcements and manage visibility.</p>

      <form className="mt-3 grid gap-3 md:grid-cols-4" onSubmit={submit}>
        <input
          value={form.title}
          onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Title"
          className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
          required
        />
        <input
          value={form.message}
          onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
          placeholder="Message"
          className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm md:col-span-2"
          required
        />
        <div className="flex items-center gap-2">
          <select
            value={form.channel}
            onChange={(event) => setForm((prev) => ({ ...prev, channel: event.target.value }))}
            className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
          >
            <option value="in_app">In-App</option>
            <option value="email">Email</option>
            <option value="push">Push</option>
          </select>
          <button
            type="submit"
            disabled={creatingNotification}
            className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-surf to-sky px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Plus size={15} /> {creatingNotification ? "Sending" : "Send"}
          </button>
        </div>
      </form>

      <div className="mt-4 overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#0e2231] text-white/70">
            <tr>
              <th className="px-2 py-2">Title</th>
              <th className="px-2 py-2">Channel</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Pinned</th>
              <th className="px-2 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-white/10">
                <td className="px-2 py-2">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-white/60">{item.message}</p>
                </td>
                <td className="px-2 py-2 uppercase">{item.channel || "in_app"}</td>
                <td className="px-2 py-2">{item.active ? "Active" : "Paused"}</td>
                <td className="px-2 py-2">{item.pinned ? "Pinned" : "No"}</td>
                <td className="px-2 py-2">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      disabled={updatingNotificationId === item.id}
                      onClick={() => onUpdateNotification?.(item, { active: !item.active })}
                      className="rounded-md border border-white/20 px-2 py-1 text-xs text-white/80 hover:bg-white/10 disabled:opacity-60"
                    >
                      {item.active ? "Pause" : "Activate"}
                    </button>
                    <button
                      type="button"
                      disabled={updatingNotificationId === item.id}
                      onClick={() => onUpdateNotification?.(item, { pinned: !item.pinned })}
                      className="rounded-md border border-white/20 px-2 py-1 text-xs text-white/80 hover:bg-white/10 disabled:opacity-60"
                    >
                      {item.pinned ? "Unpin" : "Pin"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FeedbackSupportSection({
  items = [],
  onCreateFeedback,
  onUpdateFeedback,
  creatingFeedback = false,
  updatingFeedbackId = "",
}) {
  const [form, setForm] = useState(DEFAULT_FEEDBACK_FORM);

  const submit = async (event) => {
    event.preventDefault();
    const ok = await onCreateFeedback?.(form);
    if (ok) {
      setForm(DEFAULT_FEEDBACK_FORM);
    }
  };

  return (
    <section className="glass-card rounded-2xl p-5">
      <h3 className="font-display text-xl font-semibold">Feedback & Support</h3>
      <p className="text-sm text-white/70">Track support tickets and move them through resolution.</p>

      <form className="mt-3 grid gap-3 md:grid-cols-4" onSubmit={submit}>
        <input
          value={form.userEmail}
          onChange={(event) => setForm((prev) => ({ ...prev, userEmail: event.target.value }))}
          placeholder="User email (optional)"
          className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
        />
        <input
          value={form.subject}
          onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
          placeholder="Subject"
          className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
          required
        />
        <input
          value={form.message}
          onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
          placeholder="Message"
          className="rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm md:col-span-2"
          required
        />
        <button
          type="submit"
          disabled={creatingFeedback}
          className="inline-flex w-fit items-center gap-1 rounded-xl bg-gradient-to-r from-surf to-sky px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Plus size={15} /> {creatingFeedback ? "Adding" : "Add Ticket"}
        </button>
      </form>

      <div className="mt-4 overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#0e2231] text-white/70">
            <tr>
              <th className="px-2 py-2">Subject</th>
              <th className="px-2 py-2">User</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-white/10">
                <td className="px-2 py-2">
                  <p className="font-medium">{item.subject}</p>
                  <p className="text-xs text-white/60">{item.message}</p>
                </td>
                <td className="px-2 py-2">{item.userEmail || "N/A"}</td>
                <td className="px-2 py-2 capitalize">{item.status || "new"}</td>
                <td className="px-2 py-2">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      disabled={updatingFeedbackId === item.id}
                      onClick={() => onUpdateFeedback?.(item, "in_progress")}
                      className="rounded-md border border-white/20 px-2 py-1 text-xs text-white/80 hover:bg-white/10 disabled:opacity-60"
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      disabled={updatingFeedbackId === item.id}
                      onClick={() => onUpdateFeedback?.(item, "resolved")}
                      className="rounded-md bg-emerald-500/20 px-2 py-1 text-xs text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-60"
                    >
                      Resolve
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RevenueSection({ data }) {
  const totals = data?.totals || {};
  const finance = data?.finance || {};
  const tiers = data?.tiers || [];

  return (
    <section className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Users" value={totals.users || 0} />
        <KpiCard label="Premium Users" value={totals.premiumUsers || 0} />
        <KpiCard label="MRR ($)" value={finance.mrr || 0} />
        <KpiCard label="ARR ($)" value={finance.arr || 0} />
      </div>

      <section className="glass-card rounded-2xl p-5">
        <h3 className="font-display text-xl font-semibold">Subscription / Revenue</h3>
        <p className="mt-1 text-sm text-white/70">
          ARPU ${finance.arpuMonthly || 0} • Conversion {finance.conversionRate || 0}% • Active users (30d){" "}
          {totals.activeUsers30d || 0}
        </p>

        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#0e2231] text-white/70">
              <tr>
                <th className="px-2 py-2">Tier</th>
                <th className="px-2 py-2">Users</th>
                <th className="px-2 py-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr key={tier.name} className="border-t border-white/10">
                  <td className="px-2 py-2">{tier.name}</td>
                  <td className="px-2 py-2">{tier.users}</td>
                  <td className="px-2 py-2">${tier.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function SystemHealthSection({ data }) {
  const metrics = data?.metrics || {};
  const database = data?.database || {};
  const lastEvents = data?.lastEvents || {};

  return (
    <section className="glass-card rounded-2xl p-5">
      <h3 className="font-display text-xl font-semibold">System Health</h3>
      <p className="text-sm text-white/70">
        Database status: <span className={database.ok ? "text-emerald-200" : "text-red-200"}>{database.ok ? "OK" : "Down"}</span>
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Users" value={metrics.users || 0} />
        <KpiCard label="Songs" value={metrics.songs || 0} />
        <KpiCard label="Playlists" value={metrics.playlists || 0} />
        <KpiCard label="Auth Events (24h)" value={metrics.authEvents24h || 0} />
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/80">
        <p>Last play event: {lastEvents.lastPlayAt || "N/A"}</p>
        <p>Last auth event: {lastEvents.lastAuthAt || "N/A"}</p>
        <p>Checked at: {data?.checkedAt || "N/A"}</p>
        {database.error ? <p className="text-red-200">Database error: {database.error}</p> : null}
      </div>
    </section>
  );
}

function SecurityLogsSection({ data }) {
  const logs = data?.logs || [];
  const blockedUsers = data?.blockedUsers || [];

  return (
    <section className="grid gap-4">
      <section className="glass-card rounded-2xl p-5">
        <h3 className="font-display text-xl font-semibold">Security & Logs</h3>
        <p className="text-sm text-white/70">Recent auth events and blocked-user registry.</p>

        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#0e2231] text-white/70">
              <tr>
                <th className="px-2 py-2">Event</th>
                <th className="px-2 py-2">User ID</th>
                <th className="px-2 py-2">Issued At</th>
                <th className="px-2 py-2">Token Fingerprint</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((item) => (
                <tr key={item.id} className="border-t border-white/10">
                  <td className="px-2 py-2">{item.event}</td>
                  <td className="px-2 py-2">{item.userId || "-"}</td>
                  <td className="px-2 py-2">{item.issuedAt || "-"}</td>
                  <td className="px-2 py-2">{item.tokenFingerprint || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-5">
        <h4 className="font-display text-lg font-semibold">Blocked Users</h4>
        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#0e2231] text-white/70">
              <tr>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Reason</th>
                <th className="px-2 py-2">Blocked At</th>
              </tr>
            </thead>
            <tbody>
              {blockedUsers.map((item) => (
                <tr key={item.id} className="border-t border-white/10">
                  <td className="px-2 py-2">{item.name || "Unknown"}</td>
                  <td className="px-2 py-2">{item.email || "-"}</td>
                  <td className="px-2 py-2">{item.blockedReason || "-"}</td>
                  <td className="px-2 py-2">{item.blockedAt || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function SettingsSection({ settings, updatedAt = "", onSave, saving = false }) {
  const [form, setForm] = useState({ ...DEFAULT_SETTINGS, ...(settings || {}) });

  useEffect(() => {
    setForm({ ...DEFAULT_SETTINGS, ...(settings || {}) });
  }, [settings]);

  const onSubmit = async (event) => {
    event.preventDefault();
    await onSave?.(form);
  };

  const onReset = () => {
    setForm({ ...DEFAULT_SETTINGS, ...(settings || {}) });
  };

  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-xl font-semibold">Platform Settings</h3>
          <p className="text-sm text-white/70">Control core admin-operable app behavior from one place.</p>
        </div>
        <p className="text-xs text-white/60">
          {updatedAt ? `Last updated: ${new Date(updatedAt).toLocaleString()}` : "Not updated yet"}
        </p>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-white/60">App Name</label>
          <input
            value={form.appName}
            onChange={(event) => setForm((prev) => ({ ...prev, appName: event.target.value }))}
            className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-white/60">Support Email</label>
          <input
            type="email"
            value={form.supportEmail}
            onChange={(event) => setForm((prev) => ({ ...prev, supportEmail: event.target.value }))}
            className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-white/60">Featured City</label>
          <input
            value={form.featuredCity}
            onChange={(event) => setForm((prev) => ({ ...prev, featuredCity: event.target.value }))}
            className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-white/60">
            Default Recommendations
          </label>
          <input
            type="number"
            min={5}
            max={30}
            value={form.defaultRecommendationLimit}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, defaultRecommendationLimit: Number(event.target.value) }))
            }
            className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-white/60">
            Weather Refresh Minutes
          </label>
          <input
            type="number"
            min={5}
            max={120}
            value={form.weatherRefreshMinutes}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, weatherRefreshMinutes: Number(event.target.value) }))
            }
            className="w-full rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
          <label className="flex items-center gap-2 text-sm text-white/85">
            <input
              type="checkbox"
              checked={Boolean(form.maintenanceMode)}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, maintenanceMode: event.target.checked }))
              }
            />
            Enable maintenance mode
          </label>

          <label className="flex items-center gap-2 text-sm text-white/85">
            <input
              type="checkbox"
              checked={Boolean(form.allowNewRegistrations)}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, allowNewRegistrations: event.target.checked }))
              }
            />
            Allow new registrations
          </label>
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-surf to-sky px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Reset
          </button>
        </div>
      </form>
    </section>
  );
}

function KpiCard({ label, value }) {
  return (
    <motion.article
      className="glass-card rounded-2xl p-4"
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
    >
      <p className="text-xs uppercase tracking-[0.16em] text-white/60">{label}</p>
      <h4 className="mt-2 font-display text-3xl font-bold">{value}</h4>
    </motion.article>
  );
}
