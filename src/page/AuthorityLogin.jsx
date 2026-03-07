import { useState, useEffect, useContext } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { AuthContext } from "../AuthProvider";
import { doc, getDoc } from "firebase/firestore";
import { assets } from "../assets/data";

export default function AuthorityLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user, role } = useContext(AuthContext);

  // Auto redirect if already logged in
  useEffect(() => {
    if (user && role) {
      redirectByRole(role);
    }
  }, [user, role]);

  const redirectByRole = (role) => {
    if (role === "admin") navigate("/admin/overview", { replace: true });
    else if (role === "authority") navigate("/overview", { replace: true });
    else setError("Your account has no assigned role. Contact administrator.");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const uid = userCredential.user.uid;

      // Fetch role from users collection
      const userDoc = await getDoc(doc(db, "users", uid));
      if (!userDoc.exists()) {
        setError("Account not found in system. Contact administrator.");
        setLoading(false);
        return;
      }

      const { role } = userDoc.data();
      redirectByRole(role);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-credential")
        setError("Invalid email or password.");
      else if (err.code === "auth/too-many-requests")
        setError("Too many attempts. Try again later.");
      else setError("Login failed. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={assets.logo}
            alt="Protego"
            className="w-16 h-16 rounded-full border border-slate-700 shadow-lg object-cover mb-3"
          />
          <h1 className="text-2xl font-bold text-white tracking-wide">
            PROTEGO
          </h1>
          <p className="text-slate-400 text-sm mt-1">Security Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-1">Sign In</h2>
          <p className="text-slate-400 text-sm mb-6">
            Enter your credentials to continue
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition placeholder-slate-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-medium">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 transition placeholder-slate-500"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-xs bg-red-900/30 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg py-2.5 transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Protego Admin Dashboard © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
