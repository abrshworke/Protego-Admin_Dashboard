
export default function Footer() {
  return (
    <footer className="mt-auto backdrop-blur bg-gradient-to-r 
                       from-white via-slate-50 to-white 
                       border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 py-6 
                      flex flex-col lg:flex-row 
                      items-center justify-between gap-6">

        {/* Left: Brand + Copyright */}
        <div className="flex flex-col gap-1 text-center lg:text-left">
          <h4 className="text-sm font-semibold text-slate-700">
            Secure Incident System
          </h4>
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>

        {/* Center: Navigation */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
          <a
            href="#"
            className="hover:text-red-600 transition flex items-center gap-1"
          >
            🔒 Privacy
          </a>
          <a
            href="#"
            className="hover:text-red-600 transition flex items-center gap-1"
          >
            📄 Terms
          </a>
          <a
            href="#"
            className="hover:text-red-600 transition flex items-center gap-1"
          >
            🛠 Support
          </a>
          <a
            href="#"
            className="hover:text-red-600 transition flex items-center gap-1"
          >
            📘 Docs
          </a>
        </div>

        {/* Right: Status + Version */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            System Online
          </div>

          <span className="text-slate-400">
            v1.0.0
          </span>
        </div>
      </div>
    </footer>
  );
}
