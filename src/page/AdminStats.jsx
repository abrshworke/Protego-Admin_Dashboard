import { useEffect, useState, useContext, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { AuthContext } from "../AuthProvider";
import Sidebar from "../components/SideBar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import subcityData from "../assets/subcities.json";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const STATUS_COLORS = {
  unresolved: "#ef4444",
  in_process: "#f97316",
  resolved: "#22c55e",
};

const PERIOD_OPTIONS = [
  { label: "Today", value: "day" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
];

const SUBCITY_NAMES = subcityData.map((s) => s.subcity);

function getSubcityForIncident(lat, lng) {
  for (const subcity of subcityData) {
    const lats = subcity.woredas.map((w) => w.lat);
    const lngs = subcity.woredas.map((w) => w.lon);
    const pad = 0.03;
    if (
      lat >= Math.min(...lats) - pad && lat <= Math.max(...lats) + pad &&
      lng >= Math.min(...lngs) - pad && lng <= Math.max(...lngs) + pad
    ) return subcity.subcity;
  }
  return "Other";
}

function getWoredaForIncident(lat, lng, subcityName) {
  const subcity = subcityData.find((s) => s.subcity === subcityName);
  if (!subcity) return null;
  let closest = null;
  let minDist = Infinity;
  for (const w of subcity.woredas) {
    const dist = Math.sqrt(Math.pow(lat - w.lat, 2) + Math.pow(lng - w.lon, 2));
    if (dist < minDist) { minDist = dist; closest = w.woreda; }
  }
  return minDist < 0.015 ? closest : null;
}

function filterByPeriod(incidents, period) {
  const now = new Date();
  return incidents.filter((inc) => {
    if (!inc.createdAt) return false;
    const d = inc.createdAt.toDate();
    if (period === "day") return d.toDateString() === now.toDateString();
    if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return d.getFullYear() === now.getFullYear();
  });
}

function buildTimeSeriesData(incidents, period) {
  const now = new Date();
  const map = {};
  if (period === "day") {
    for (let h = 0; h < 24; h++) map[h] = { label: `${h}:00`, unresolved: 0, in_process: 0, resolved: 0 };
    incidents.forEach((inc) => {
      const h = inc.createdAt.toDate().getHours();
      if (map[h]) map[h][inc.status] = (map[h][inc.status] || 0) + 1;
    });
  } else if (period === "month") {
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= days; d++) map[d] = { label: `${d}`, unresolved: 0, in_process: 0, resolved: 0 };
    incidents.forEach((inc) => {
      const d = inc.createdAt.toDate().getDate();
      if (map[d]) map[d][inc.status] = (map[d][inc.status] || 0) + 1;
    });
  } else {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    months.forEach((m, i) => map[i] = { label: m, unresolved: 0, in_process: 0, resolved: 0 });
    incidents.forEach((inc) => {
      const m = inc.createdAt.toDate().getMonth();
      map[m][inc.status] = (map[m][inc.status] || 0) + 1;
    });
  }
  return Object.values(map);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.dataKey}: {p.value}
        </p>
      ))}
    </div>
  );
};

const StatBadge = ({ label, value, color, sub }) => (
  <div className={`rounded-2xl p-5 flex flex-col gap-1 ${color} shadow-sm`}>
    <span className="text-xs font-semibold uppercase tracking-widest opacity-60">{label}</span>
    <span className="text-4xl font-black">{value}</span>
    {sub && <span className="text-xs opacity-50 mt-1">{sub}</span>}
  </div>
);

export default function AdminStats() {
  const [allIncidents, setAllIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [selectedRegion, setSelectedRegion] = useState(SUBCITY_NAMES[0]);
  const [compareMode, setCompareMode] = useState("subcity"); // "subcity" | "woreda"

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "incidents"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        .filter((inc) => inc.latitude && inc.longitude)
        .map((inc) => {
          const subcity = getSubcityForIncident(inc.latitude, inc.longitude);
          const woredaNum = getWoredaForIncident(inc.latitude, inc.longitude, subcity);
          return { ...inc, subcity, woreda: woredaNum };
        });
      setAllIncidents(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Focused region incidents
  const regionIncidents = useMemo(() =>
    allIncidents.filter((i) => i.subcity === selectedRegion),
    [allIncidents, selectedRegion]
  );

  const periodIncidents = useMemo(() =>
    filterByPeriod(regionIncidents, period), [regionIncidents, period]);

  const timeSeriesData = useMemo(() =>
    buildTimeSeriesData(periodIncidents, period), [periodIncidents, period]);

  const total = regionIncidents.length;
  const unresolved = regionIncidents.filter((i) => i.status === "unresolved").length;
  const inProcess = regionIncidents.filter((i) => i.status === "in_process").length;
  const resolved = regionIncidents.filter((i) => i.status === "resolved").length;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const periodTotal = periodIncidents.length;

  const pieData = [
    { name: "Unresolved", value: unresolved, color: "#ef4444" },
    { name: "In Process", value: inProcess, color: "#f97316" },
    { name: "Resolved", value: resolved, color: "#22c55e" },
  ].filter((d) => d.value > 0);

  // Subcity comparison bar chart
  const subcityComparisonData = useMemo(() =>
    SUBCITY_NAMES.map((name) => ({
      name: name.length > 10 ? name.split(" ")[0] : name,
      fullName: name,
      total: allIncidents.filter((i) => i.subcity === name).length,
      unresolved: allIncidents.filter((i) => i.subcity === name && i.status === "unresolved").length,
      resolved: allIncidents.filter((i) => i.subcity === name && i.status === "resolved").length,
    })).sort((a, b) => b.total - a.total),
    [allIncidents]
  );

  // Woreda comparison for selected region
  const selectedSubcity = subcityData.find((s) => s.subcity === selectedRegion);
  const woredaComparisonData = useMemo(() => {
    if (!selectedSubcity) return [];
    return selectedSubcity.woredas.map((w) => ({
      name: `W${w.woreda}`,
      total: regionIncidents.filter((i) => i.woreda === w.woreda).length,
      unresolved: regionIncidents.filter((i) => i.woreda === w.woreda && i.status === "unresolved").length,
      resolved: regionIncidents.filter((i) => i.woreda === w.woreda && i.status === "resolved").length,
    })).filter((w) => w.total > 0);
  }, [regionIncidents, selectedSubcity]);

  const comparisonData = compareMode === "subcity" ? subcityComparisonData : woredaComparisonData;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">Admin — Incident Statistics</p>
              <h1 className="text-3xl font-black text-white">Analytics Dashboard</h1>
              <p className="text-slate-500 text-sm mt-1">City-wide incident intelligence across all subcities</p>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              {/* Region Selector */}
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition cursor-pointer"
              >
                {SUBCITY_NAMES.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              {/* Period Selector */}
              <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPeriod(opt.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      period === opt.value
                        ? "bg-slate-700 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">

              {/* Global Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatBadge label="City-wide Total" value={allIncidents.length} color="bg-slate-800 text-white" />
                <StatBadge label={`${selectedRegion} Total`} value={total} color="bg-blue-950 text-blue-300" />
                <StatBadge
                  label={`${selectedRegion} Unresolved`}
                  value={unresolved}
                  color="bg-red-950 text-red-300"
                />
                <StatBadge
                  label={`${selectedRegion} Resolved`}
                  value={resolved}
                  color="bg-green-950 text-green-300"
                  sub={`${resolutionRate}% resolution rate`}
                />
              </div>

              {/* Area Chart — selected region */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                    {selectedRegion} — Incident Timeline
                  </h2>
                  <span className="text-xs text-slate-600">{periodTotal} incidents this period</span>
                </div>
                {periodIncidents.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No incidents in this period</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        {Object.entries(STATUS_COLORS).map(([key, color]) => (
                          <linearGradient key={key} id={`agrad-${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      {Object.entries(STATUS_COLORS).map(([key, color]) => (
                        <Area key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2}
                          fill={`url(#agrad-${key})`} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Comparison Bar Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                    {compareMode === "subcity" ? "Subcity Comparison — All Addis Ababa" : `Woreda Comparison — ${selectedRegion}`}
                  </h2>
                  <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 gap-1">
                    <button
                      onClick={() => setCompareMode("subcity")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        compareMode === "subcity" ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      By Subcity
                    </button>
                    <button
                      onClick={() => setCompareMode("woreda")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        compareMode === "woreda" ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      By Woreda
                    </button>
                  </div>
                </div>
                {comparisonData.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No data to compare</div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -20, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={50} />
                      <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const full = comparisonData.find((d) => d.name === label);
                          return (
                            <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-xl">
                              <p className="text-white text-xs font-bold mb-2">{full?.fullName || label}</p>
                              {payload.map((p) => (
                                <p key={p.dataKey} className="text-xs font-semibold" style={{ color: p.color }}>
                                  {p.dataKey}: {p.value}
                                </p>
                              ))}
                            </div>
                          );
                        }}
                      />
                      <Legend iconType="circle" iconSize={8}
                        formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{v}</span>} />
                      <Bar dataKey="total" name="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="unresolved" name="Unresolved" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="resolved" name="Resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Bottom Row — Pie + Top Subcities Table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
                    {selectedRegion} — Status Breakdown
                  </h2>
                  {total === 0 ? (
                    <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No incidents in {selectedRegion}</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                          paddingAngle={4} dataKey="value">
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="transparent" />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, fontSize: 12 }} />
                        <Legend iconType="circle" iconSize={8}
                          formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Subcity Leaderboard */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
                    Subcities Ranked by Incidents
                  </h2>
                  <div className="space-y-3">
                    {subcityComparisonData.slice(0, 6).map((item, i) => {
                      const pct = allIncidents.length > 0 ? (item.total / allIncidents.length) * 100 : 0;
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-600 w-4">{i + 1}</span>
                          <span className="text-xs text-slate-300 w-28 truncate">{item.fullName}</span>
                          <div className="flex-1 bg-slate-800 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-400 w-8 text-right">{item.total}</span>
                        </div>
                      );
                    })}
                    {allIncidents.length === 0 && (
                      <p className="text-slate-600 text-sm text-center py-6">No incidents recorded yet</p>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}