import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { AuthContext } from "./AuthProvider";
import subcityData from "./assets/subcities.json";

export const NotificationContext = createContext(null);

export function useNotifications() {
  return useContext(NotificationContext);
}

function resolveSubcity(lat, lng) {
  let closest = null;
  let minDist = Infinity;
  for (const subcity of subcityData) {
    const dist = Math.sqrt(
      Math.pow(lat - subcity.lat, 2) + Math.pow(lng - subcity.lon, 2)
    );
    if (dist < minDist) { minDist = dist; closest = subcity.subcity; }
  }
  return closest;
}

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playBeep = (startTime, freq, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    playBeep(ctx.currentTime, 880, 0.15);
    playBeep(ctx.currentTime + 0.18, 1100, 0.15);
    playBeep(ctx.currentTime + 0.36, 1320, 0.25);
  } catch (e) {
    console.warn("Audio failed:", e);
  }
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 6000);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  return (
    <div
      style={{ animation: "slideIn 0.3s ease-out" }}
      className="flex items-start gap-3 bg-slate-900 border border-red-500/50 rounded-xl px-4 py-3 shadow-2xl w-80"
    >
      <span className="text-red-400 text-lg mt-0.5 animate-pulse">🚨</span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-bold">New Incident</p>
        <p className="text-red-300 text-xs font-semibold mt-0.5">{toast.subcity}</p>
        <p className="text-slate-500 text-xs font-mono">
          {toast.lat?.toFixed(5)}, {toast.lng?.toFixed(5)}
        </p>
      </div>
      <button onClick={() => onDismiss(toast.id)} className="text-slate-600 hover:text-white transition text-xs mt-0.5">✕</button>
    </div>
  );
}

export function NotificationProvider({ children }) {
  const { user, role, region } = useContext(AuthContext);
  const [toasts, setToasts] = useState([]);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const knownIds = useRef(null); // null = first load, not yet seeded

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!user || role !== "authority" || !region) return;

    const unsub = onSnapshot(collection(db, "incidents"), (snap) => {
      const allIncidents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Filter to this authority's region
      const myIncidents = allIncidents.filter((inc) => {
        if (!inc.latitude || !inc.longitude) return false;
        const subcity = resolveSubcity(inc.latitude, inc.longitude);
        return subcity?.toLowerCase() === region?.toLowerCase();
      });

      // Always update unresolved badge
      setUnresolvedCount(
        myIncidents.filter((i) => i.status === "unresolved").length
      );

      // First snapshot — seed known IDs silently, don't alert
      if (knownIds.current === null) {
        knownIds.current = new Set(myIncidents.map((i) => i.id));
        return;
      }

      // Find new incidents not seen before
      const newOnes = myIncidents.filter((i) => !knownIds.current.has(i.id));

      if (newOnes.length > 0) {
        // Add new IDs to known set
        newOnes.forEach((i) => knownIds.current.add(i.id));

        // Play alert sound once
        playAlertSound();

        // Add a toast for each new incident
        const newToasts = newOnes.map((inc) => ({
          id: inc.id + "_" + Date.now(),
          subcity: resolveSubcity(inc.latitude, inc.longitude),
          lat: inc.latitude,
          lng: inc.longitude,
        }));

        setToasts((prev) => [...prev, ...newToasts]);
      }
    });

    return () => unsub();
  }, [user, role, region]);

  return (
    <NotificationContext.Provider value={{ unresolvedCount }}>
      {children}

      {/* Toast stack — bottom right, visible on all pages */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
        <style>{`
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(100%); }
            to   { opacity: 1; transform: translateX(0); }
          }
        `}</style>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
