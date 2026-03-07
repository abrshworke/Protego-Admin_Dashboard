import { useState, useEffect, useContext } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../firebase";
import { AuthContext } from "../AuthProvider";
import { doc, getDoc } from "firebase/firestore";

export default function AuthorityLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // ✅ Auto redirect if already logged in
  useEffect(() => {
    if (user) {
      checkAdminAndRedirect(user.uid);
    }
  }, [user]);

  const checkAdminAndRedirect = async (uid) => {
    const docRef = doc(db, "admins", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      navigate("/admin"); // admin page
    } else {
      navigate("/"); // regular authority page
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // ✅ Check if the user is admin and redirect accordingly
      checkAdminAndRedirect(userCredential.user.uid);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#111",
        color: "white",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          padding: "30px",
          background: "#1c1c1c",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          width: "300px",
        }}
      >
        <h2>Authority/Admin Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Login</button>
      </form>
    </div>
  );
}
