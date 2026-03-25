import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Clapperboard,
  CalendarDays,
  Ticket,
  BarChart3,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const adminLinks = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Movies", to: "/admin/movies", icon: Clapperboard },
  { label: "Shows", to: "/admin/shows", icon: CalendarDays },
  { label: "Bookings", to: "/admin/bookings", icon: Ticket },
  { label: "Reports", to: "/admin/reports", icon: BarChart3 },
  { label: "Users", to: "/admin/users", icon: Users },
];

const AdminSidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="w-full lg:fixed lg:left-0 lg:top-20 lg:bottom-0 lg:w-72 lg:bg-[#06110c] lg:border-r lg:border-[#0f2a1f] lg:overflow-y-auto">
      <div className="h-full p-4 lg:flex lg:flex-col lg:py-6">
        <div className="mb-4 pb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#89a59a]">Admin Routes</p>
          <p className="mt-1 text-sm font-semibold text-[#e6f0eb]">ShowTimeX Control</p>
        </div>

        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {adminLinks.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-primary/20 text-[#f4fbf8]"
                      : "text-[#b9cdc4] hover:bg-white/5 hover:text-[#f4fbf8]"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-4 rounded-xl bg-white/5 px-3 py-3 lg:mt-auto">
          <p className="text-xs text-[#89a59a]">Signed in as</p>
          <p className="text-sm font-semibold text-[#f4fbf8] truncate">{user?.name || "Admin"}</p>
          <p className="text-xs text-[#b9cdc4] truncate">{user?.email || "admin@showtimex.com"}</p>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
