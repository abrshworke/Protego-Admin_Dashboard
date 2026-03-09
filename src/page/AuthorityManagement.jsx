import { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, secondaryAuth } from "../firebase";
import SideBar from "../components/SideBar";
import Topbar from "../components/Topbar";
import Footer from "../components/Footer";
import subcityData from "../assets/subcities.json";

const SUBCITY_NAMES = subcityData.map((s) => s.subcity);

function getWoredas(subcity) {
  const entry = subcityData.find((s) => s.subcity === subcity);
  return entry ? entry.woredas.map((w) => w.woreda) : [];
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all
      ${type === "success" ? "bg-green-950 border-green-700 text-green-300" : "bg-red-950 border-red-700 text-red-300"}`}
    >
      <span>{type === "success" ? "✓" : "✕"}</span>
      {message}
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── Create Authority Modal ───────────────────────────────────────────────────
function CreateAuthorityModal({ onClose, onSuccess, onError }) {
  const [form, setForm] = useState({
    firstName: "", fatherName: "", grandFatherName: "",
    email: "", password: "", region: "", woreda: "",
  });
  const [loading, setLoading] = useState(false);
  const woredas = form.region ? getWoredas(form.region) : [];

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev, [field]: value,
      ...(field === "region" ? { woreda: "" } : {}),
    }));
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.fatherName || !form.grandFatherName || !form.email || !form.password) {
      onError("Please fill in all required fields."); return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
      await secondaryAuth.signOut();
      await setDoc(doc(db, "users", cred.user.uid), {
        firstName: form.firstName, fatherName: form.fatherName,
        grandFatherName: form.grandFatherName, email: form.email,
        role: "authority",
        region: form.region || "not_assigned",
        woreda: form.woreda || "not_assigned",
      });
      onSuccess("Authority account created successfully.");
      onClose();
    } catch (err) {
      if (err.code === "auth/email-already-in-use") onError("Email already in use.");
      else if (err.code === "auth/weak-password") onError("Password must be at least 6 characters.");
      else onError("Failed to create authority: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">Create Authority</h2>
            <p className="text-slate-500 text-xs mt-0.5">Add a new authority officer to the system</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition text-xl leading-none">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {[
              { field: "firstName", label: "First Name *" },
              { field: "fatherName", label: "Father's Name *" },
              { field: "grandFatherName", label: "Grandfather's Name *" },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="text-xs text-slate-400 font-semibold block mb-1">{label}</label>
                <input type="text" value={form[field]} onChange={(e) => handleChange(field, e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition placeholder-slate-600"
                  placeholder={label.replace(" *", "")} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition placeholder-slate-600"
                placeholder="officer@example.com" />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Password *</label>
              <input type="password" value={form.password} onChange={(e) => handleChange("password", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition placeholder-slate-600"
                placeholder="Min 6 chars" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Region <span className="text-slate-600">(optional)</span></label>
              <select value={form.region} onChange={(e) => handleChange("region", e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition cursor-pointer">
                <option value="">Not Assigned</option>
                {SUBCITY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Woreda <span className="text-slate-600">(optional)</span></label>
              <select value={form.woreda} onChange={(e) => handleChange("woreda", e.target.value)}
                disabled={!form.region}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition cursor-pointer disabled:opacity-40">
                <option value="">Not Assigned</option>
                {woredas.map((w) => <option key={w} value={w}>Woreda {w}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-slate-700 text-slate-400 hover:text-white text-sm font-semibold py-2.5 rounded-xl transition">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition">
            {loading ? "Creating..." : "Create Authority"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assign Modal ─────────────────────────────────────────────────────────────
function AssignModal({ authority, onClose, onSuccess, onError }) {
  const [region, setRegion] = useState(authority.region === "not_assigned" ? "" : authority.region);
  const [woreda, setWoreda] = useState(authority.woreda === "not_assigned" ? "" : authority.woreda);
  const [loading, setLoading] = useState(false);
  const woredas = region ? getWoredas(region) : [];

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", authority.id), {
        region: region || "not_assigned",
        woreda: woreda || "not_assigned",
      });
      onSuccess(`${authority.firstName} assigned to ${region || "no region"}.`);
      onClose();
    } catch (err) {
      onError("Failed to update assignment.");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div>
            <h2 className="text-white font-bold text-lg">Assign Region</h2>
            <p className="text-slate-500 text-xs mt-0.5">{authority.firstName} {authority.fatherName}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition text-xl leading-none">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1">Region</label>
            <select value={region} onChange={(e) => { setRegion(e.target.value); setWoreda(""); }}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition cursor-pointer">
              <option value="">Not Assigned</option>
              {SUBCITY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1">Woreda</label>
            <select value={woreda} onChange={(e) => setWoreda(e.target.value)} disabled={!region}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition cursor-pointer disabled:opacity-40">
              <option value="">Not Assigned</option>
              {woredas.map((w) => <option key={w} value={w}>Woreda {w}</option>)}
            </select>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-slate-700 text-slate-400 hover:text-white text-sm font-semibold py-2.5 rounded-xl transition">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition">
            {loading ? "Saving..." : "Save Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Unassigned Panel — two-step: pick woreda → pick officer ──────────────────
function UnassignedPanel({ authorities, selectedRegion, onAssign, onClose }) {
  const [step, setStep] = useState("woreda"); // "woreda" | "officer"
  const [selectedWoreda, setSelectedWoreda] = useState(null);

  const woredas = getWoredas(selectedRegion);
  const unassigned = authorities.filter((a) => a.region === "not_assigned" || !a.region);

  const handleWoredaClick = (w) => {
    setSelectedWoreda(w);
    setStep("officer");
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md mx-4 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            {step === "officer" && (
              <button onClick={() => setStep("woreda")}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition text-sm font-bold">
                ←
              </button>
            )}
            <div>
              <h2 className="text-white font-bold text-lg">
                {step === "woreda" ? selectedRegion : `Woreda ${selectedWoreda}`}
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                {step === "woreda"
                  ? "Step 1 — Select a woreda"
                  : `Step 2 — Select an officer for ${selectedRegion}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition text-xl leading-none">✕</button>
        </div>

        {/* Step 1 — Woreda grid */}
        {step === "woreda" && (
          <div className="px-6 py-4 max-h-80 overflow-y-auto">
            {woredas.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No woredas found</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {woredas.map((w) => {
                  const count = authorities.filter(
                    (a) => a.region === selectedRegion && a.woreda === w
                  ).length;
                  return (
                    <button key={w} onClick={() => handleWoredaClick(w)}
                      className="flex flex-col items-center justify-center bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 rounded-xl py-3 px-2 transition group">
                      <span className="text-white text-sm font-bold">Woreda {w}</span>
                      <span className="text-slate-500 group-hover:text-blue-200 text-xs mt-0.5">
                        {count} officer{count !== 1 ? "s" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Officer list */}
        {step === "officer" && (
          <div className="px-6 py-4 max-h-80 overflow-y-auto space-y-2">
            {unassigned.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No unassigned authorities available</p>
            ) : (
              unassigned.map((a) => (
                <div key={a.id} className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-semibold">{a.firstName} {a.fatherName}</p>
                    <p className="text-slate-500 text-xs">{a.email}</p>
                  </div>
                  <button onClick={() => onAssign(a, selectedWoreda)}
                    className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg transition">
                    Assign
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <div className="px-6 pb-5">
          <button onClick={onClose} className="w-full border border-slate-700 text-slate-400 hover:text-white text-sm font-semibold py-2.5 rounded-xl transition">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AuthorityManagement() {
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterRegion, setFilterRegion] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [unassignedPanel, setUnassignedPanel] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.role === "authority");
      setAuthorities(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const showToast = (message, type = "success") => setToast({ message, type });

  const handleRemoveFromRegion = async (authority) => {
    try {
      await updateDoc(doc(db, "users", authority.id), {
        region: "not_assigned", woreda: "not_assigned",
      });
      showToast(`${authority.firstName} removed from ${authority.region}.`);
    } catch (err) {
      showToast("Failed to remove assignment.", "error");
    }
    setConfirmRemove(null);
  };

  const handleQuickAssign = async (authority, region, woreda) => {
    try {
      await updateDoc(doc(db, "users", authority.id), {
        region,
        woreda: woreda || "not_assigned",
      });
      showToast(`${authority.firstName} assigned to ${region} / Woreda ${woreda}.`);
    } catch (err) {
      showToast("Failed to assign authority.", "error");
    }
    setUnassignedPanel(null);
  };

  const filtered = useMemo(() => {
    return authorities.filter((a) => {
      const name = `${a.firstName} ${a.fatherName} ${a.grandFatherName} ${a.email}`.toLowerCase();
      const matchSearch = name.includes(search.toLowerCase());
      const matchRegion =
        filterRegion === "all" ||
        (filterRegion === "unassigned"
          ? a.region === "not_assigned" || !a.region
          : a.region === filterRegion);
      return matchSearch && matchRegion;
    });
  }, [authorities, search, filterRegion]);

  const unassignedCount = authorities.filter((a) => a.region === "not_assigned" || !a.region).length;

  const regionGroups = useMemo(() => {
    const groups = {};
    SUBCITY_NAMES.forEach((name) => {
      groups[name] = authorities.filter((a) => a.region === name);
    });
    return groups;
  }, [authorities]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">Admin</p>
              <h1 className="text-3xl font-black text-white">Authority Management</h1>
              <p className="text-slate-500 text-sm mt-1">{authorities.length} officers · {unassignedCount} unassigned</p>
            </div>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-5 py-3 rounded-xl transition shadow-lg shadow-blue-900/30">
              <span className="text-lg leading-none">+</span> Create Authority
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <input type="text" placeholder="Search by name or email..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 w-72 focus:outline-none focus:border-blue-500 transition placeholder-slate-600" />
            <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition cursor-pointer">
              <option value="all">All Regions</option>
              <option value="unassigned">Unassigned</option>
              {SUBCITY_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Authority Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">All Officers</h2>
                  <span className="text-xs text-slate-600">{filtered.length} results</span>
                </div>
                {filtered.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-slate-600 text-sm">No authorities found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800">
                          {["Officer", "Email", "Region", "Woreda", "Actions"].map((h) => (
                            <th key={h} className="text-left text-xs font-bold uppercase tracking-widest text-slate-500 px-6 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((a) => {
                          const isAssigned = a.region && a.region !== "not_assigned";
                          return (
                            <tr key={a.id} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold uppercase">
                                    {a.firstName?.[0]}{a.fatherName?.[0]}
                                  </div>
                                  <div>
                                    <p className="text-white font-semibold">{a.firstName} {a.fatherName}</p>
                                    <p className="text-slate-500 text-xs">{a.grandFatherName}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-400 text-xs">{a.email}</td>
                              <td className="px-6 py-4">
                                {isAssigned ? (
                                  <span className="text-xs bg-blue-950 text-blue-300 border border-blue-800 px-2 py-1 rounded-lg font-semibold">{a.region}</span>
                                ) : (
                                  <span className="text-xs bg-slate-800 text-slate-500 px-2 py-1 rounded-lg">Not Assigned</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {a.woreda && a.woreda !== "not_assigned" ? (
                                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-lg">Woreda {a.woreda}</span>
                                ) : (
                                  <span className="text-xs text-slate-600">—</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <button onClick={() => setAssignTarget(a)}
                                    className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg transition font-semibold">
                                    {isAssigned ? "Reassign" : "Assign"}
                                  </button>
                                  {isAssigned && (
                                    <button onClick={() => setConfirmRemove(a)}
                                      className="text-xs bg-red-950 hover:bg-red-900 text-red-400 px-3 py-1.5 rounded-lg transition font-semibold border border-red-900">
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Region Assignment Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Region Assignments</h2>
                  <p className="text-slate-600 text-xs mt-1">Click + to assign an officer — select woreda first, then pick an officer</p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {SUBCITY_NAMES.map((name) => {
                    const officers = regionGroups[name] || [];
                    return (
                      <div key={name} className="bg-slate-800/50 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white text-sm font-bold">{name}</p>
                            <p className="text-slate-500 text-xs">{officers.length} officer{officers.length !== 1 ? "s" : ""}</p>
                          </div>
                          <button
                            onClick={() => setUnassignedPanel({ region: name })}
                            className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center text-lg leading-none transition font-bold"
                            title="Add officer to this region">
                            +
                          </button>
                        </div>
                        {officers.length === 0 ? (
                          <p className="text-slate-600 text-xs italic">No officers assigned</p>
                        ) : (
                          <div className="space-y-2">
                            {officers.map((a) => (
                              <div key={a.id} className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2">
                                <div>
                                  <p className="text-white text-xs font-semibold">{a.firstName} {a.fatherName}</p>
                                  {a.woreda && a.woreda !== "not_assigned" ? (
                                    <p className="text-slate-500 text-xs">Woreda {a.woreda}</p>
                                  ) : (
                                    <p className="text-slate-600 text-xs italic">No woreda</p>
                                  )}
                                </div>
                                <button onClick={() => setConfirmRemove(a)}
                                  className="text-slate-600 hover:text-red-400 transition text-xs font-bold" title="Remove from region">
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateAuthorityModal onClose={() => setShowCreate(false)}
          onSuccess={(msg) => showToast(msg)} onError={(msg) => showToast(msg, "error")} />
      )}
      {assignTarget && (
        <AssignModal authority={assignTarget} onClose={() => setAssignTarget(null)}
          onSuccess={(msg) => showToast(msg)} onError={(msg) => showToast(msg, "error")} />
      )}
      {unassignedPanel && (
        <UnassignedPanel
          authorities={authorities}
          selectedRegion={unassignedPanel.region}
          onAssign={(a, woreda) => handleQuickAssign(a, unassignedPanel.region, woreda)}
          onClose={() => setUnassignedPanel(null)}
        />
      )}

      {/* Confirm Remove Dialog */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm mx-4 shadow-2xl p-6 text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <h3 className="text-white font-bold text-lg mb-1">Remove Assignment?</h3>
            <p className="text-slate-400 text-sm mb-6">
              <span className="text-white font-semibold">{confirmRemove.firstName} {confirmRemove.fatherName}</span>{" "}
              will be unassigned from{" "}
              <span className="text-white font-semibold">{confirmRemove.region}</span>
              {confirmRemove.woreda && confirmRemove.woreda !== "not_assigned" && (
                <span> / Woreda <span className="text-white font-semibold">{confirmRemove.woreda}</span></span>
              )}.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRemove(null)}
                className="flex-1 border border-slate-700 text-slate-400 hover:text-white text-sm font-semibold py-2.5 rounded-xl transition">Cancel</button>
              <button onClick={() => handleRemoveFromRegion(confirmRemove)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-2.5 rounded-xl transition">Remove</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
