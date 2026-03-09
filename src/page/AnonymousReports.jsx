

import { useState } from "react";
import Sidebar from "../components/SideBar";
import Topbar from "../components/Topbar";
import ReportCard from "../components/ReportCard";
import { reportsData } from "../assets/data";
import Footer from "../components/Footer";

export default function AnonymousReports() {
  const [search, setSearch] = useState("");

  const filteredReports = reportsData.filter(
    (report) =>
      report.description.toLowerCase().includes(search.toLowerCase()) ||
      report.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
      <Sidebar />

      <div className="flex-1 flex flex-col">

        <main className="p-6 flex-1 overflow-auto space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-3xl font-bold text-slate-800">
              Anonymous Reports
            </h2>
            <p className="text-slate-500 mt-2 max-w-2xl">
              Securely review, analyze, and investigate anonymous tips
              submitted through protected channels.
            </p>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <input
              type="text"
              placeholder="Search by report ID or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-96 px-4 py-2 rounded-xl border border-slate-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reports */}
          <div className="grid gap-5">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))
            ) : (
              <p className="text-slate-500 text-sm">
                No reports found matching your search.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


