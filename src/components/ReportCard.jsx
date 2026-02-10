


import React from "react";

const ReportCard = ({ report }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5
                    hover:shadow-md hover:-translate-y-0.5 transition">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
        <div>
          <p className="font-semibold text-slate-800">
            {report.id}
          </p>
          <p className="text-xs text-slate-500">
            Submitted anonymously
          </p>
        </div>

        

        <span className="text-xs text-slate-400">
          {report.date}
        </span>
      </div>

      {/* Description */}
      <p className="text-slate-700 leading-relaxed mb-5">
        {report.description}
      </p>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Status */}
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
            ${
              report.status === "Pending"
                ? "bg-yellow-100 text-yellow-700"
                : report.status === "Reviewed"
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-600"
            }`}
        >
          Status: {report.status}
        </span>

        {/* Actions */}
        <div className="flex gap-2">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-700">
          Anonymous
        </span>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
