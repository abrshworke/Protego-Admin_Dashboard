import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import SideBar from "../components/SideBar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import subcityData from "../assets/subcities.json";

// ─── Thresholds ───────────────────────────────────────────────────────────────
const THRESHOLDS = {
  unresolved: 5 * 60 * 1000, // 5 minutes
  in_process: 30 * 60 * 1000, // 30 minutes
};

// ─── Location resolver ────────────────────────────────────────────────────────
function resolveLocation(lat, lng) {
  let closestSubcity = null;
  let closestWoreda = null;
  let minSubcityDist = Infinity;

  for (const subcity of subcityData) {
    const subcityDist = Math.sqrt(
      Math.pow(lat - subcity.lat, 2) + Math.pow(lng - subcity.lon, 2),
    );

    if (subcityDist < minSubcityDist) {
      minSubcityDist = subcityDist;
      closestSubcity = subcity.subcity;

      let minWoredaDist = Infinity;
      for (const w of subcity.woredas) {
        const dist = Math.sqrt(
          Math.pow(lat - w.lat, 2) + Math.pow(lng - w.lon, 2),
        );
        if (dist < minWoredaDist) {
          minWoredaDist = dist;
          closestWoreda = w.woreda;
        }
      }
    }
  }

  return { subcity: closestSubcity, woreda: closestWoreda };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getOverdueInfo(incident, now) {
  const threshold = THRESHOLDS[incident.status];
  if (!threshold || !incident.createdAt) return null;
  const created = incident.createdAt.toDate().getTime();
  const elapsed = now - created;
  if (elapsed < threshold) return null;
  return { elapsed, overdueMs: elapsed - threshold, threshold };
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ${mins % 60}m ago`;
  return `${mins}m ago`;
}

function getUrgency(overdueMs, status) {
  if (status === "unresolved") {
    if (overdueMs > 20 * 60 * 1000) return "critical";
    if (overdueMs > 10 * 60 * 1000) return "high";
    return "medium";
  }
  if (status === "in_process") {
    if (overdueMs > 60 * 60 * 1000) return "critical";
    if (overdueMs > 30 * 60 * 1000) return "high";
    return "medium";
  }
  return "medium";
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const URGENCY_STYLES = {
  critical: {
    border: "border-red-500/50",
    bg: "bg-red-950/30",
    badge: "bg-red-500 text-white",
    dot: "bg-red-400 animate-pulse",
    label: "CRITICAL",
    timer: "text-red-400",
    bar: "bg-red-500",
  },
  high: {
    border: "border-orange-500/40",
    bg: "bg-orange-950/20",
    badge: "bg-orange-500 text-white",
    dot: "bg-orange-400",
    label: "HIGH",
    timer: "text-orange-400",
    bar: "bg-orange-500",
  },
  medium: {
    border: "border-yellow-600/30",
    bg: "bg-yellow-950/10",
    badge: "bg-yellow-600 text-white",
    dot: "bg-yellow-400",
    label: "OVERDUE",
    timer: "text-yellow-400",
    bar: "bg-yellow-500",
  },
};

const STATUS_STYLES = {
  unresolved: "bg-red-900/60 text-red-300 border border-red-800",
  in_process: "bg-orange-900/60 text-orange-300 border border-orange-800",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function LiveTimer({ overdueMs, urgency }) {
  const style = URGENCY_STYLES[urgency];
  return (
    <div
      className={`flex items-center gap-1.5 ${style.timer} font-mono text-xs font-bold`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      overdue by {formatDuration(overdueMs)}
    </div>
  );
}

function OverdueBar({ overdueMs, status, urgency }) {
  const maxOverdue = status === "unresolved" ? 30 * 60 * 1000 : 90 * 60 * 1000;
  const pct = Math.min((overdueMs / maxOverdue) * 100, 100);
  return (
    <div className="w-full bg-slate-800 rounded-full h-1">
      <div
        className={`h-1 rounded-full transition-all duration-1000 ${URGENCY_STYLES[urgency].bar}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StaleIncidents() {
  const [allIncidents, setAllIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("overdue");

  // Tick every second for live timers
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "incidents"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllIncidents(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Build stale list with resolved location
  const staleIncidents = allIncidents
    .filter((inc) => {
      if (inc.status === "resolved") return false;
      return getOverdueInfo(inc, now) !== null;
    })
    .map((inc) => {
      const info = getOverdueInfo(inc, now);
      const urgency = getUrgency(info.overdueMs, inc.status);
      const location =
        inc.latitude && inc.longitude
          ? resolveLocation(inc.latitude, inc.longitude)
          : { subcity: null, woreda: null };
      return {
        ...inc,
        overdueMs: info.overdueMs,
        elapsed: info.elapsed,
        urgency,
        ...location,
      };
    });

  const filtered = staleIncidents
    .filter((inc) => filterStatus === "all" || inc.status === filterStatus)
    .sort((a, b) =>
      sortBy === "overdue"
        ? b.overdueMs - a.overdueMs
        : b.createdAt?.toDate() - a.createdAt?.toDate(),
    );

  const criticalCount = staleIncidents.filter(
    (i) => i.urgency === "critical",
  ).length;
  const highCount = staleIncidents.filter((i) => i.urgency === "high").length;
  const unresolvedStale = staleIncidents.filter(
    (i) => i.status === "unresolved",
  ).length;
  const inProcessStale = staleIncidents.filter(
    (i) => i.status === "in_process",
  ).length;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">
                Admin · Monitoring
              </p>
              <h1 className="text-3xl font-black text-white flex items-center gap-3">
                Stale Incidents
                {criticalCount > 0 && (
                  <span className="text-sm bg-red-500 text-white font-bold px-2.5 py-1 rounded-full animate-pulse">
                    {criticalCount} CRITICAL
                  </span>
                )}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Incidents that have exceeded their response time threshold
              </p>
            </div>

            {/* Threshold legend */}
            <div className="flex flex-col gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
              <p className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-1">
                Thresholds
              </p>
              <p className="text-xs text-slate-500">
                <span className="text-red-400 font-semibold">Unresolved</span> →
                flagged after <span className="text-white">5 min</span>
              </p>
              <p className="text-xs text-slate-500">
                <span className="text-orange-400 font-semibold">
                  In Process
                </span>{" "}
                → flagged after <span className="text-white">30 min</span>
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                label: "Total Stale",
                value: staleIncidents.length,
                color: "bg-slate-800 text-white",
              },
              {
                label: "Critical",
                value: criticalCount,
                color: "bg-red-950 text-red-300",
              },
              {
                label: "High Priority",
                value: highCount,
                color: "bg-orange-950 text-orange-300",
              },
              {
                label: "Unresolved Stale",
                value: unresolvedStale,
                color: "bg-slate-800 text-slate-200",
              },
            ].map((s) => (
              <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-60">
                  {s.label}
                </p>
                <p className="text-3xl font-black mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
              {[
                { label: "All", value: "all" },
                {
                  label: `Unresolved (${unresolvedStale})`,
                  value: "unresolved",
                },
                {
                  label: `In Process (${inProcessStale})`,
                  value: "in_process",
                },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilterStatus(f.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === f.value
                      ? "bg-slate-700 text-white"
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
              {[
                { label: "Most Overdue", value: "overdue" },
                { label: "Recently Reported", value: "reported" },
              ].map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSortBy(s.value)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    sortBy === s.value
                      ? "bg-slate-700 text-white"
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-white rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="text-5xl">✅</div>
              <p className="text-white font-bold text-lg">All clear</p>
              <p className="text-slate-500 text-sm">
                No incidents have exceeded their response thresholds
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((incident) => {
                const urgency = URGENCY_STYLES[incident.urgency];

                return (
                  <div
                    key={incident.id}
                    className={`rounded-2xl border p-5 flex flex-col gap-4 ${urgency.border} ${urgency.bg}`}
                  >
                    {/* Top row — badges + timer */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1.5">
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-full w-fit ${urgency.badge}`}
                        >
                          {urgency.label}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-lg w-fit ${STATUS_STYLES[incident.status]}`}
                        >
                          {incident.status === "unresolved"
                            ? "Unresolved"
                            : "In Process"}
                        </span>
                      </div>
                      <LiveTimer
                        overdueMs={incident.overdueMs}
                        urgency={incident.urgency}
                      />
                    </div>

                    {/* Overdue progress bar */}
                    <OverdueBar
                      overdueMs={incident.overdueMs}
                      status={incident.status}
                      urgency={incident.urgency}
                    />

                    {/* Details */}
                    <div className="space-y-2">
                      {/* Region + Woreda */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-600">🏙️</span>
                        <span>
                          <span className="text-white font-semibold">
                            {incident.subcity ?? "Unknown"}
                          </span>
                          {incident.woreda && (
                            <span className="text-slate-400">
                              {" "}
                              · Woreda {incident.woreda}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Coordinates */}
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-slate-600">📍</span>
                        <span className="font-mono">
                          {incident.latitude?.toFixed(5)},{" "}
                          {incident.longitude?.toFixed(5)}
                        </span>
                      </div>

                      {/* Reported time */}
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-slate-600">🕐</span>
                        <span>
                          Reported{" "}
                          {incident.createdAt
                            ? formatTimeAgo(incident.createdAt.toDate())
                            : "unknown"}
                        </span>
                      </div>

                      {/* Total elapsed */}
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-slate-600">⏱</span>
                        <span>
                          Total elapsed:{" "}
                          <span className="text-white font-semibold">
                            {formatDuration(incident.elapsed)}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* View in Map */}
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${incident.latitude}&mlon=${incident.longitude}#map=17/${incident.latitude}/${incident.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full text-xs font-bold py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center gap-2 transition"
                    >
                      🗺️ View in Map
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
