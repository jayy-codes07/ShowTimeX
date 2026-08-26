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
    <aside className="w-full border-line bg-elevated lg:fixed lg:bottom-0 lg:left-0 lg:top-20 lg:w-72 lg:overflow-y-auto lg:border-r">
      <div className="h-full p-2 lg:flex lg:flex-col lg:py-4">
        

        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
          {adminLinks.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  [
                    "flex min-h-touch items-center gap-2.5 rounded-control px-3 py-2.5 text-body-sm font-medium",
                    "transition-colors duration-base ease-out",
                    "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-focusring",
                    isActive
                      ? "bg-brand-soft font-semibold text-brand-text"
                      : "text-content-secondary hover:bg-surface-hover hover:text-content",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-4 rounded-card border border-line bg-surface px-3 py-3 lg:mt-auto">
          <p className="text-caption uppercase text-content-muted">Signed in as</p>
          <p className="truncate text-body-sm font-semibold text-content">
            {user?.name || "Admin"}
          </p>
          <p className="truncate text-body-sm text-content-secondary">
            {user?.email || "admin@showtimex.com"}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
