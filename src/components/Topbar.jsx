


export default function Topbar() {

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/80 border-b border-slate-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: Search */}
        <div className="relative w-full max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search alerts, reports, users, IDs..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-sm 
                       focus:outline-none focus:ring-2 focus:ring-red-400 
                       transition shadow-sm"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Broadcast Button */}
          <button className="hidden md:flex items-center gap-2 px-4 py-2 
                             rounded-xl bg-gradient-to-r from-red-500 to-red-600 
                             text-white font-semibold shadow hover:scale-105 
                             transition">
            📢 Broadcast Alert
          </button>

          {/* Notification */}
          <div className="relative cursor-pointer">
            <div className="text-xl">🔔</div>
            <span className="absolute -top-1 -right-2 bg-red-600 text-white 
                             text-xs px-1.5 py-0.5 rounded-full animate-pulse">
              3
            </span>
          </div>
          
        </div>
      </div>
    </header>
  );
}
