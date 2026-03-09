import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/SideBar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import Footer from "../components/Footer";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function Overview() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "incidents"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // Sort by createdAt descending
      data.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || 0;
        const bTime = b.createdAt?.toDate?.() || 0;
        return bTime - aTime;
      });
      setIncidents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Derived stats from real data
  const total = incidents.length;
  const unresolved = incidents.filter((i) => i.status === "unresolved").length;
  const inProcess = incidents.filter((i) => i.status === "in_process").length;
  const resolved = incidents.filter((i) => i.status === "resolved").length;

  const statsData = [
    {
      title: "Total Incidents",
      value: total,
      icon: "🗂️",
      color: "bg-slate-100 text-slate-700",
    },
    {
      title: "Unresolved",
      value: unresolved,
      icon: "🔴",
      color: "bg-red-50 text-red-700",
    },
    {
      title: "In Process",
      value: inProcess,
      icon: "🟠",
      color: "bg-orange-50 text-orange-700",
    },
    {
      title: "Resolved",
      value: resolved,
      icon: "🟢",
      color: "bg-green-50 text-green-700",
    },
  ];

  const recentIncidents = incidents.slice(0, 5);

  const STATUS_STYLES = {
    unresolved: "bg-red-100 text-red-600",
    in_process: "bg-orange-100 text-orange-600",
    resolved: "bg-green-100 text-green-600",
  };

  const STATUS_LABELS = {
    unresolved: "Unresolved",
    in_process: "In Process",
    resolved: "Resolved",
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <main className="p-6 flex-1 overflow-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Dashboard Overview
            </h1>
            <p className="text-slate-500 mt-1">
              Real-time situational awareness and operational status
            </p>
          </div>

          {/* Stats */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-white rounded-2xl shadow-sm animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {statsData.map((item, index) => (
                <div
                  key={index}
                  className={`rounded-2xl shadow-sm p-5 flex items-center gap-4 ${item.color}`}
                >
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium opacity-70">
                      {item.title}
                    </p>
                    <p className="text-3xl font-bold">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Middle Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-800">
                  Recent Incidents
                </h2>
                <Link
                  to="/map"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  View on Map →
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-slate-100 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : recentIncidents.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">
                  No incidents yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {recentIncidents.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                    >
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">
                          📍 {item.latitude?.toFixed(5)},{" "}
                          {item.longitude?.toFixed(5)}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.createdAt
                            ? item.createdAt.toDate().toLocaleString()
                            : "No timestamp"}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-medium ${
                          STATUS_STYLES[item.status] ||
                          "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {STATUS_LABELS[item.status] || item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* System Insights */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Incident Breakdown
              </h2>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="h-8 bg-slate-100 rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <InsightItem label="Total Incidents" value={total} />
                  <InsightItem
                    label="Unresolved"
                    value={unresolved}
                    danger={unresolved > 0}
                  />
                  <InsightItem label="In Process" value={inProcess} />
                  <InsightItem
                    label="Resolved"
                    value={resolved}
                    good={resolved > 0}
                  />
                  {total > 0 && (
                    <>
                      {/* Progress bar */}
                      <div className="pt-2">
                        <p className="text-xs text-slate-400 mb-1">
                          Resolution Rate
                        </p>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.round((resolved / total) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 mt-1 text-right">
                          {Math.round((resolved / total) * 100)}% resolved
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function InsightItem({ label, value, good, danger }) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-slate-500 text-sm">{label}</p>
      <p
        className={`font-semibold ${
          good ? "text-green-600" : danger ? "text-red-600" : "text-slate-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
