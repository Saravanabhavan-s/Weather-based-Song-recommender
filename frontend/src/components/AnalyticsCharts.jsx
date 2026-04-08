import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const pieColors = ["#57c7ff", "#16a6a4", "#ff7b5c", "#fbbf24", "#7dd3fc", "#22d3ee"];

export function AnalyticsCharts({ topSongs = [], weatherTrends = [], usageByDay = [], topUsers = [] }) {
  const songData = topSongs.map((song) => ({ name: song.title || "Unknown", plays: song.plays || 0 }));
  const weatherData = weatherTrends.map((item) => ({
    name: item.weatherCondition || "unknown",
    value: item.count || 0,
  }));
  const usageData = usageByDay.map((item) => ({
    day: String(item.date || "").slice(5),
    tokens: item.tokens || 0,
    plays: item.plays || 0,
    logins: item.logins || 0,
  }));
  const topUsersData = topUsers.map((item) => ({
    name: item.name || "Unknown",
    plays: item.plays || 0,
  }));

  return (
    <div className="grid gap-4">
      <article className="glass-card rounded-2xl p-4">
        <h4 className="mb-3 font-display text-lg font-semibold">Usage Trends (7 Days)</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usageData}>
              <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: "#d6e9ff", fontSize: 11 }} />
              <YAxis tick={{ fill: "#d6e9ff", fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="plays" stroke="#57c7ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="tokens" stroke="#fbbf9c" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="logins" stroke="#16a6a4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
      <article className="glass-card rounded-2xl p-4">
        <h4 className="mb-3 font-display text-lg font-semibold">Top Listened Songs</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={songData}>
              <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "#d6e9ff", fontSize: 11 }} />
              <YAxis tick={{ fill: "#d6e9ff", fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="plays" fill="#57c7ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="glass-card rounded-2xl p-4">
        <h4 className="mb-3 font-display text-lg font-semibold">Weather Listening Trends</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={weatherData} dataKey="value" nameKey="name" outerRadius={90} label>
                {weatherData.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="glass-card rounded-2xl p-4 lg:col-span-2">
        <h4 className="mb-3 font-display text-lg font-semibold">Most Active Users (30 Days)</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topUsersData}>
              <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fill: "#d6e9ff", fontSize: 11 }} />
              <YAxis tick={{ fill: "#d6e9ff", fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="plays" fill="#16a6a4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
      </div>
    </div>
  );
}
