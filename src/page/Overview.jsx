
import React, { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/SideBar";
import Topbar from "../components/Topbar";
import StatCard from "../components/StatCard";
import { statsData, incidentsData } from "../assets/data";
import Footer from "../components/Footer";


export default function Overview() {
  const [search, setSearch] = useState("");

  const recentIncidents = incidentsData.slice(0, 3);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />

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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {statsData.map((item, index) => (
              <StatCard key={index} {...item} />
            ))}
          </div>

          {/* Middle Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-800">
                  Recent Activity
                </h2>
                <Link
                  to="/incidents"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  See All →
                </Link>
              </div>

              <div className="space-y-4">
                {recentIncidents.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
                  >
                    <div>
                      <p className="font-semibold text-slate-700">
                        {item.id}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.source} • {item.timestamp}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium
                        ${
                          item.priority === "High"
                            ? "bg-red-100 text-red-600"
                            : item.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-green-100 text-green-600"
                        }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Insights */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                System Insights
              </h2>

              <div className="space-y-4">
                <InsightItem label="System Health" value="Operational" good />
                <InsightItem label="Active Sensors" value="100%" good />
                <InsightItem label="Unassigned Alerts" value="2" />
                <InsightItem label="Last Sync" value="2 minutes ago" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

/* Small helper component */
function InsightItem({ label, value, good }) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-slate-500">{label}</p>
      <p
        className={`font-semibold ${
          good ? "text-green-600" : "text-slate-700"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
