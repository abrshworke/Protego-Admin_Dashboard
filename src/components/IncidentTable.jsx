

import { useState } from "react";
import { incidentsData } from "../assets/data";

export default function IncidentTable() {
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Apply filters
  const filteredIncidents = incidentsData.filter((item) => {
    const priorityMatch =
      priorityFilter === "All" || item.priority === priorityFilter;
    const statusMatch =
      statusFilter === "All" || item.status === statusFilter;

    return priorityMatch && statusMatch;
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["ID", "Source", "Timestamp", "Location", "Priority", "Status"];

    const rows = filteredIncidents.map((item) => [
      item.id,
      item.source,
      item.timestamp,
      item.location,
      item.priority,
      item.status,
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) => row.join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "incidents.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      {/* Header + Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Active & Historical Incidents
          </h2>
          <p className="text-sm text-slate-500">
            Filter and export incident reports
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Export */}
          <button
            onClick={exportToCSV}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-slate-800">
              <th className="py-4 px-4">Incident</th>
              <th className="px-4">Timestamp</th>
              <th className="px-4">Location</th>
              <th className="px-4">Priority</th>
              <th className="px-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((item, index) => (
                <tr
                  key={index}
                  className="border-t hover:bg-slate-50 transition"
                >
                  <td className="py-4 px-4">
                    <p className="font-semibold text-slate-800">
                      {item.id}
                    </p>
                    <p className="text-xs text-slate-500">
                      Source: {item.source}
                    </p>
                  </td>

                  <td className="px-4 text-slate-600">
                    {item.timestamp}
                  </td>

                  <td className="px-4 text-slate-600">
                    {item.location}
                  </td>

                  <td className="px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          item.priority === "High"
                            ? "bg-red-100 text-red-600"
                            : item.priority === "Medium"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-600"
                        }`}
                    >
                      {item.priority}
                    </span>
                  </td>

                  <td className="px-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold
                          ${
                            item.status === "Active"
                              ? "bg-red-500"
                              : item.status === "Acknowledged"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                      />
                      <span className="font-medium text-slate-700">
                        {item.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="text-center py-8 text-slate-500"
                >
                  No incidents match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
