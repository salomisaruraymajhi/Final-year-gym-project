import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Award,
  CalendarDays,
  ClipboardList,
  UserCircle,
  LogOut,
  Dumbbell,
  Menu,
  X,
  Package,
  CreditCard,
} from "lucide-react";
import { useState } from "react";

const NAVIGATION = {
  common: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ],
  member: [
    { to: "/my-bookings", label: "My Bookings", icon: CalendarDays },
    { to: "/my-subscriptions", label: "Subscriptions", icon: Package },
  ],
  trainer: [
    { to: "/classes/manage", label: "Manage Classes", icon: ClipboardList },
    { to: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  ],
  admin: [
    { to: "/classes/manage", label: "Manage Classes", icon: ClipboardList },
    { to: "/packages", label: "Packages", icon: Package },
    { to: "/subscriptions", label: "Subscriptions", icon: CreditCard },
    { to: "/members", label: "Members", icon: Users },
    { to: "/trainers", label: "Trainers", icon: Award },
    { to: "/admin", label: "User Management", icon: Users },
  ],
  bottom: [
    { to: "/profile", label: "Profile", icon: UserCircle },
  ],
};

function getNavItems(role) {
  const roleItems = NAVIGATION[role] || [];
  return [...NAVIGATION.common, ...roleItems];
}

export default function Layout({ children }) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = getNavItems(profile?.role);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-[0.8125rem] font-medium transition-colors ${
      isActive
        ? "bg-primary text-white"
        : "text-gray-400 hover:bg-sidebar-hover hover:text-white"
    }`;

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <Dumbbell className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold text-white tracking-tight">
            GymSphere
          </span>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClasses}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-[1.125rem] w-[1.125rem] shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-4 space-y-1.5">
          {NAVIGATION.bottom.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClasses}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-[1.125rem] w-[1.125rem] shrink-0" />
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-[0.8125rem] font-medium text-gray-400 hover:bg-sidebar-hover hover:text-white transition-colors"
          >
            <LogOut className="h-[1.125rem] w-[1.125rem] shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-5 lg:px-10">
          <button
            className="rounded-lg p-2 text-text-secondary hover:bg-background lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-4">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-text-primary">
                {profile?.full_name}
              </p>
              <p className="text-xs text-text-muted capitalize mt-0.5">
                {profile?.role}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background p-5 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
