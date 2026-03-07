import { createContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [region, setRegion] = useState(null);
  const [woreda, setWoreda] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        console.log("Fetched user from Firestore:", userData); // ← debug
        console.log("Fetched role from Firestore:", userData.role); // ← debug
        setUser(firebaseUser);
        setRole(userData.role || null);
        setRegion(userData.region || null);
        setWoreda(userData.woreda || null);
      } else {
        setUser(null);
        setRole(null);
        setRegion(null);
        setWoreda(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <AuthContext.Provider value={{ user, role, region, woreda, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
