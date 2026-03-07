import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./AuthProvider";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, role, loading } = useContext(AuthContext);

  if (loading) return <p>Loading...</p>;

  if (!user) return <Navigate to="/login" replace />;

  if (!role) return <p>Loading...</p>;

  if (allowedRoles && !allowedRoles.includes(role)) {
    if (role === "admin") {
      console.log("role:", role);
      return <Navigate to="/admin/overview" replace />;
    }
    if (role === "authority") {
      console.log("role:", role);
      return <Navigate to="/overview" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
