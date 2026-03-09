import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./AuthProvider";

import ProtectedRoute from "./ProtectedRoute";
import AuthorityLogin from "./page/AuthorityLogin";
import Overview from "./page/Overview";
import AnonymousReports from "./page/AnonymousReports";
import LiveMap from "./page/LiveMap";
import AdminLiveMap from "./page/AdminLiveMap";
import AdminDashboard from "./page/AdminDashboard";
import AuthorityStats from "./page/AuthorityStats";
import AdminStats from "./page/AdminStats";
import AuthorityManagement from "./page/AuthorityManagement";
import StaleIncidents from "./page/Staleincidents";
function RoleRedirect() {
  const { role } = useContext(AuthContext);
  if (role === "admin") return <Navigate to="/admin/overview" replace />;
  if (role === "authority") return <Navigate to="/overview" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<AuthorityLogin />} />

      {/* Root redirect based on role */}
      <Route path="/" element={<RoleRedirect />} />

      {/* Authority routes */}
      <Route element={<ProtectedRoute allowedRoles={["authority"]} />}>
        <Route path="/overview" element={<Overview />} />
        <Route path="/map" element={<LiveMap />} />
        <Route path="/incident-statstics" element={<AuthorityStats />} />
        <Route path="/reports" element={<AnonymousReports />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin/overview" element={<AdminDashboard />} />
        <Route path="/admin/map" element={<AdminLiveMap />} />
        <Route path="/admin/incident-statstics" element={<AdminStats />} />
        <Route path="/admin/reports" element={<AnonymousReports />} />
        <Route path="/admin/stale-incidents" element={<StaleIncidents />} />
        <Route
          path="/admin/authority-management"
          element={<AuthorityManagement />}
        />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
