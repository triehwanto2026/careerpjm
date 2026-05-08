import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  ShieldCheck, LayoutDashboard, KeyRound, ClipboardList, Users, BarChart3, LogOut, Menu, X, Settings as SettingsIcon,
  UserCog, Shield, ChevronDown, ChevronRight, Bell, User, Briefcase, Workflow,
} from "lucide-react";
import Swal from "sweetalert2";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavItem[];
}

type NavEntry = NavItem | NavGroup;

const ALL_NAV_ENTRIES: NavEntry[] = [
  { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/activation-codes", label: "Kode Aktivasi", icon: KeyRound },
  { path: "/admin/test-instruments", label: "Alat Tes", icon: ClipboardList },
  { path: "/admin/jobs", label: "Lowongan", icon: Briefcase },
  { path: "/admin/recruitment", label: "Rekrutmen", icon: Workflow },
  { path: "/admin/candidates", label: "Kandidat", icon: Users },
  { path: "/admin/results", label: "Hasil Tes", icon: BarChart3 },
  {
    label: "Pengaturan",
    icon: SettingsIcon,
    children: [
      { path: "/admin/settings", label: "Pengaturan Aplikasi", icon: SettingsIcon },
      { path: "/admin/users", label: "Manajemen User", icon: UserCog },
      { path: "/admin/roles", label: "Manajemen Role", icon: Shield },
    ],
  },
];

interface AdminSession {
  id: string;
  username: string;
  full_name: string;
  role_id: string;
  role_name: string;
  permissions: string[];
}

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [adminPanelName, setAdminPanelName] = useState("PsyAdmin");
  const [adminLogoUrl, setAdminLogoUrl] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Fetch admin branding settings
  useEffect(() => {
    const fetchBranding = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["admin_panel_name", "admin_logo_url"]);

      if (data) {
        data.forEach((setting) => {
          if (setting.key === "admin_panel_name") {
            setAdminPanelName(setting.value || "PsyAdmin");
          } else if (setting.key === "admin_logo_url") {
            setAdminLogoUrl(setting.value || null);
          }
        });
      }
    };
    fetchBranding();
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("psytest_admin") !== "true") {
      navigate("/admin", { replace: true });
      return;
    }

    const sessionData = sessionStorage.getItem("psytest_admin_user");
    if (!sessionData) {
      // Old login without user data — allow through with full access for now
      return;
    }

    try {
      const parsed = JSON.parse(sessionData) as AdminSession;
      // Runtime guard: ensure permissions is an array
      const safeParsed: AdminSession = {
        ...parsed,
        permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
      };
      setAdminSession(safeParsed);

      // Check permission for current page
      const currentPath = location.pathname;
      const perms = safeParsed.permissions;
      const hasPermission =
        perms.includes(currentPath) ||
        currentPath === "/admin" ||
        currentPath === "/admin/test-instruments";

      const isSubRoute = currentPath.startsWith("/admin/test-instruments/");
      const hasParentPermission = isSubRoute && perms.includes("/admin/test-instruments");

      if (!hasPermission && !hasParentPermission) {
        Swal.fire({
          icon: "warning",
          title: "Akses Ditolak",
          text: "Anda tidak memiliki izin untuk mengakses halaman ini.",
          background: "hsl(var(--card))",
          color: "hsl(var(--foreground))",
          confirmButtonColor: "hsl(174, 72%, 46%)",
        }).then(() => {
          navigate("/admin/dashboard", { replace: true });
        });
      }
    } catch {
      sessionStorage.removeItem("psytest_admin");
      sessionStorage.removeItem("psytest_admin_user");
      navigate("/admin", { replace: true });
    }
  }, [navigate, location.pathname]);

  // Filter nav entries by permissions
  const navEntries = useMemo(() => {
    if (!adminSession) return ALL_NAV_ENTRIES;
    const perms = Array.isArray(adminSession.permissions) ? adminSession.permissions : [];

    const filtered: NavEntry[] = [];
    for (const entry of ALL_NAV_ENTRIES) {
      if (!entry) continue;
      if ("path" in entry) {
        if (perms.includes(entry.path)) filtered.push(entry);
      } else if (entry.children && Array.isArray(entry.children)) {
        const visibleChildren = entry.children.filter(
          (c) => c && c.path && perms.includes(c.path)
        );
        if (visibleChildren.length > 0) {
          filtered.push({ label: entry.label, icon: entry.icon, children: visibleChildren });
        }
      }
    }
    return filtered;
  }, [adminSession]);

  // Find active page label for header
  const activePageLabel = useMemo(() => {
    for (const entry of navEntries) {
      if ("path" in entry) {
        if (entry.path === location.pathname) return entry.label;
      } else {
        for (const child of entry.children) {
          if (child.path === location.pathname) return child.label;
        }
      }
    }
    return "Admin";
  }, [navEntries, location.pathname]);

  // Expandable groups state
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Pengaturan: location.pathname.startsWith("/admin/settings") ||
                location.pathname === "/admin/users" ||
                location.pathname === "/admin/roles",
  });

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = () => {
    Swal.fire({
      icon: "warning", title: "Keluar?", text: "Yakin ingin keluar dari panel admin?",
      showCancelButton: true, confirmButtonText: "Ya, Keluar", cancelButtonText: "Batal",
      background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(0, 72%, 51%)",
    }).then((r) => {
      if (r.isConfirmed) {
        sessionStorage.removeItem("psytest_admin");
        sessionStorage.removeItem("psytest_admin_user");
        navigate("/admin", { replace: true });
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 md:static md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            {adminLogoUrl ? (
              <img src={adminLogoUrl} alt="Admin Logo" className="h-6 w-6 object-contain" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-primary" />
            )}
            <span className="text-lg font-bold text-foreground">
              {adminPanelName}
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground md:hidden"><X className="h-5 w-5" /></button>
        </div>

        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
          {navEntries.map((entry) => {
            if ("path" in entry) {
              // Single nav item
              const active = location.pathname === entry.path;
              return (
                <Link
                  key={entry.path}
                  to={entry.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <entry.icon className="h-4 w-4 shrink-0" />
                  {entry.label}
                </Link>
              );
            } else {
              // Group with children
              const isExpanded = !!expandedGroups[entry.label];
              const hasActiveChild = entry.children.some(
                (c) => location.pathname === c.path
              );
              return (
                <div key={entry.label} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(entry.label)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      hasActiveChild
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <entry.icon className="h-4 w-4 shrink-0" />
                      {entry.label}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-6 space-y-0.5 border-l-2 border-border pl-2">
                      {entry.children.map((child) => {
                        const childActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                              childActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <child.icon className="h-3.5 w-3.5 shrink-0" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
          })}
        </nav>

        <div className="border-t border-border p-3 space-y-2">
          {adminSession && (
            <div className="rounded-lg bg-muted/50 px-3 py-2">
              <p className="text-xs font-medium text-foreground truncate">
                {adminSession.full_name || adminSession.username}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {adminSession.role_name}
              </p>
            </div>
          )}
          <button onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4" />Keluar
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur-xl px-4 py-3 md:px-6">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground md:hidden"><Menu className="h-5 w-5" /></button>
          <h2 className="flex-1 text-sm font-semibold text-foreground">
            {activePageLabel}
          </h2>
          <div className="flex items-center gap-2 relative">
            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              title="Notifikasi"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-16 top-12 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-sm text-foreground">Notifikasi</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    Tidak ada notifikasi baru
                  </div>
                </div>
              </div>
            )}

            {/* Profile Link */}
            <Link
              to="/admin/profile"
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
              title="Profil"
            >
              <User className="h-5 w-5" />
            </Link>

            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>

        <footer className="border-t border-border bg-card/50 px-4 py-3 md:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>© 2024 {adminPanelName}. All rights reserved.</p>
            <p className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              System Online
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;
