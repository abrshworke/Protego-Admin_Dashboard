import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import AuthorityLogin from "./page/AuthorityLogin";

import Overview from "./page/Overview";
import Incidents from "./page/Incidents";
import AnonymousReports from "./page/AnonymousReports";
import UserManagement from "./page/UserManagement";
import LiveMap from "./page/LiveMap";
import AdminDashboard  from "./page/AdminDashboard";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<AuthorityLogin />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Overview />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/reports" element={<AnonymousReports />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/map" element={<LiveMap />} />
      </Route>

      <Route element={<ProtectedRoute adminOnly={true} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
}
