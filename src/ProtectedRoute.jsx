import { Navigate, Outlet } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthProvider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function ProtectedRoute({ adminOnly = false }) {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      if (!adminOnly) {
        // Not admin-only page → everyone logged in can see
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Admin-only page → check Firestore
      const docRef = doc(db, "admins", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    };

    checkAdmin();
  }, [user, adminOnly]);

  if (loading) return <p>Loading...</p>;

  // Not logged in → redirect to login
  if (!user) return <Navigate to="/login" replace />;

  // Admin-only page → not admin → redirect to regular dashboard
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
