import { NavLink } from "react-router-dom";
import { sidebarMenu } from "../assets/data";
import { useState } from "react";
import { assets } from "../assets/data";

export default function Sidebar() {

  const [open, setOpen] = useState(false);
  const handleLogout = () => {
    alert("Logging out...");
    // Add actual logout logic here
  };

  return (
    <aside className="w-72 min-h-screen 
            bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950
            text-slate-200 flex flex-col
            border-r border-slate-800">

      {/* Logo / Brand */}
      <div className="px-6 py-6 flex items-center gap-3 border-b border-slate-800">
       <img
            src={assets.logo}
            alt="logo"
            className="w-14 h-14 rounded-full shadow-md object-cover border border-gray-200"
          />
        <div>
          <h1 className="text-lg font-bold tracking-wide text-white">
            PROTEGO
          </h1>
          <p className="text-xs text-slate-400">Security Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {sidebarMenu.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            end
            className={({ isActive }) =>
              `group flex items-center gap-3 px-4 py-3 rounded-xl 
               transition-all duration-200
               ${
                 isActive
                   ? "bg-slate-800 text-white shadow-inner border border-slate-700"
                   : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
               }`
            }
          >
            {/* Icon Placeholder */}
            <span
              className={`text-lg transition-transform duration-200
              group-hover:scale-110`}
            >
              {item.icon || "▸"}
            </span>

            {/* Label */}
            <span className="font-medium text-sm tracking-wide">
              {item.name}
            </span>

            {/* Active Indicator */}
            <span
              className={`ml-auto w-2 h-2 rounded-full transition
              ${
                window.location.pathname === item.path
                  ? "bg-red-500"
                  : "bg-transparent group-hover:bg-slate-500"
              }`}
            />
          </NavLink>
        ))}
      </nav>

      {/* User / Profile */}
      <div className="px-6 py-5 border-t border-slate-800 flex items-center gap-3 relative">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold">
        A
      </div>

      {/* Admin Info */}
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">Admin User</p>
        <p className="text-xs text-slate-400">System Administrator</p>
      </div>

      {/* Settings Button */}
      <button
        onClick={() => setOpen(!open)}
        className="text-slate-400 hover:text-white transition cursor-pointer"
      >
        ⚙️
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-slate-900 text-white rounded-lg shadow-lg border border-slate-800 overflow-hidden z-50">
          <button className="w-full px-4 py-2 text-left hover:bg-slate-800 transition">
            Profile
          </button>
          <button className="w-full px-4 py-2 text-left hover:bg-slate-800 transition">
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-left text-red-500 hover:bg-slate-800 transition"
          >
            Logout
          </button>
        </div>
      )}
    </div>

    </aside>
  );
}
