import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { AuthContext } from "../AuthProvider";
import { assets, sidebarMenu, adminSidebarMenu } from "../assets/data";
import { LogOut } from "lucide-react";
import { useNotifications } from "../NotificationProvider";
export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user, role, region, woreda, firstName, fatherName, grandFatherName } =
    useContext(AuthContext);

  console.log("role is sb:", role);
  const menu = role === "admin" ? adminSidebarMenu : sidebarMenu;

  const { unresolvedCount } = useNotifications();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout: " + error.message);
    }
  };

  return (
    <aside className="w-72 min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-200 flex flex-col border-r border-slate-800">
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
        {menu.map((item, index) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={index}
              to={item.path}
              end
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${
                  isActive
                    ? "bg-slate-800 text-white shadow-inner border border-slate-700"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`
              }
            >
              <span className="text-lg transition-transform duration-200 group-hover:scale-110">
                {Icon && <Icon size={18} />}
              </span>
              <span className="font-medium text-sm tracking-wide">
                {item.name}
              </span>
              <span className={`ml-auto transition`}>
                {item.name === "Live Incidents" && unresolvedCount > 0 ? (
                  <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unresolvedCount > 9 ? "9+" : unresolvedCount}
                  </span>
                ) : (
                  <span
                    className={`w-2 h-2 rounded-full ${window.location.pathname === item.path ? "bg-red-500" : "bg-transparent group-hover:bg-slate-500"}`}
                  />
                )}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* User / Profile */}
      <div className="px-6 py-5 border-t border-slate-800 flex items-center gap-3 relative">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {`${firstName} ${fatherName} ${grandFatherName}`}{" "}
          </p>

          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium
    ${role === "admin" ? "bg-red-900 text-red-300" : "bg-blue-900 text-blue-300"}`}
          >
            {role === "admin" ? "Administrator" : "Authority"}
          </span>

          <span style={{ marginLeft: "10px" }}>
            {role === "authority" ? region : ""}
          </span>

          <span style={{ display: "block", marginLeft: "10px" }}>
            {role === "authority" ? `Woreda: ${woreda}` : ""}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-white transition cursor-pointer"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
