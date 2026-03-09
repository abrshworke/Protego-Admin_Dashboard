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

function isWithinBounds(lat, lng, subcity, woreda) {
  const subcityEntry = subcityData.find(
    (s) => s.subcity.toLowerCase() === subcity?.toLowerCase()
  );
  if (!subcityEntry) return false;

  if (woreda) {
    const woredaEntry = subcityEntry.woredas.find((w) => w.woreda === woreda);
    if (!woredaEntry) return false;
    const delta = 0.012;
    return (
      Math.abs(lat - woredaEntry.lat) < delta &&
      Math.abs(lng - woredaEntry.lon) < delta
    );
  }

  // Subcity level — check against all woreda bounds
  const lats = subcityEntry.woredas.map((w) => w.lat);
  const lngs = subcityEntry.woredas.map((w) => w.lon);
  const pad = 0.03;
  return (
    lat >= Math.min(...lats) - pad &&
    lat <= Math.max(...lats) + pad &&
    lng >= Math.min(...lngs) - pad &&
    lng <= Math.max(...lngs) + pad
  );
}

function filterByPeriod(incidents, period) {
  const now = new Date();
  return incidents.filter((inc) => {
    if (!inc.createdAt) return false;
    const d = inc.createdAt.toDate();
    if (period === "day") {
      return d.toDateString() === now.toDateString();
    } else if (period === "month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    } else {
      return d.getFullYear() === now.getFullYear();
    }
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

const StatBadge = ({ label, value, color, sub }) => (
  <div className={`rounded-2xl p-5 flex flex-col gap-1 ${color} shadow-sm`}>
    <span className="text-xs font-semibold uppercase tracking-widest opacity-60">{label}</span>
    <span className="text-4xl font-black">{value}</span>
    {sub && <span className="text-xs opacity-50 mt-1">{sub}</span>}
  </div>
);

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

export default function AuthorityStats() {
  const { region, woreda } = useContext(AuthContext);
  const [allIncidents, setAllIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "incidents"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllIncidents(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const regionIncidents = useMemo(() =>
    allIncidents.filter((inc) =>
      inc.latitude && inc.longitude &&
      isWithinBounds(inc.latitude, inc.longitude, region, woreda)
    ), [allIncidents, region, woreda]);

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

  // Woreda breakdown
  const subcityEntry = subcityData.find(
    (s) => s.subcity.toLowerCase() === region?.toLowerCase()
  );
  const woredaBreakdown = useMemo(() => {
    if (!subcityEntry) return [];
    return subcityEntry.woredas.map((w) => {
      const delta = 0.012;
      const count = regionIncidents.filter((inc) =>
        Math.abs(inc.latitude - w.lat) < delta &&
        Math.abs(inc.longitude - w.lon) < delta
      ).length;
      return { name: `W${w.woreda}`, count };
    }).filter((w) => w.count > 0);
  }, [regionIncidents, subcityEntry]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-auto">

          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">Incident Statistics</p>
              <h1 className="text-3xl font-black text-white">
                {region}
                {woreda && <span className="text-slate-400 font-light"> / Woreda {woreda}</span>}
              </h1>
              <p className="text-slate-500 text-sm mt-1">Real-time incident analytics for your jurisdiction</p>
            </div>

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

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">

              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatBadge label="Total (All Time)" value={total} color="bg-slate-800 text-white" />
                <StatBadge label={`Total (${PERIOD_OPTIONS.find(p=>p.value===period)?.label})`} value={periodTotal} color="bg-slate-800 text-white" />
                <StatBadge label="Unresolved" value={unresolved} color="bg-red-950 text-red-300" />
                <StatBadge label="In Process" value={inProcess} color="bg-orange-950 text-orange-300" />
                <StatBadge label="Resolved" value={resolved} color="bg-green-950 text-green-300" sub={`${resolutionRate}% resolution rate`} />
              </div>

              {/* Area Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
                  Incident Timeline — {PERIOD_OPTIONS.find(p => p.value === period)?.label}
                </h2>
                {periodIncidents.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No incidents in this period</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        {Object.entries(STATUS_COLORS).map(([key, color]) => (
                          <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
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
                          fill={`url(#grad-${key})`} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Bottom Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Pie Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Status Breakdown</h2>
                  {total === 0 ? (
                    <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No incidents yet</div>
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

                {/* Woreda Breakdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
                    Incidents by Woreda
                  </h2>
                  {woredaBreakdown.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-slate-600 text-sm">No woreda data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={woredaBreakdown} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#475569", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, fontSize: 12 }} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
