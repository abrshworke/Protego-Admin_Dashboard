
import Topbar from "../components/Topbar";
import IncidentTable from "../components/IncidentTable";
import Sidebar from "../components/SideBar";
import Footer from "../components/Footer";

export default function Incidents() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <main className="p-6 flex-1 overflow-auto space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h1 className="text-3xl font-bold text-slate-800">
              Incident Management
            </h1>
            <p className="text-slate-500 mt-2 max-w-2xl">
              Monitor, prioritize, and resolve all SOS alerts and incident
              reports in real time with full operational visibility.
            </p>
          </div>

          {/* Table */}
          <IncidentTable />
        </main>
        <Footer />
      </div>
    </div>
  );
}
