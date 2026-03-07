import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, collection } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleCreateAuthority = async (e) => {
    e.preventDefault();

    try {
      // 1️⃣ Create Auth account for the new authority
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const uid = userCredential.user.uid;

      // 2️⃣ Create authority document in Firestore
      await setDoc(doc(collection(db, "authorities"), uid), {
        name,
        email,
        role: "authority",
      });

      alert("Authority created successfully ✅");

      // Reset form
      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Create New Authority</h2>
      <form
        onSubmit={handleCreateAuthority}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          maxWidth: "400px",
        }}
      >
        <input
          type="text"
          placeholder="Authority Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Authority Email"
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
        <button type="submit">Create Authority</button>
      </form>
    </div>
  );
}
