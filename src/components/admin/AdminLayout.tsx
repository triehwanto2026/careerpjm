import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  ShieldCheck, LayoutDashboard, KeyRound, ClipboardList, Users, BarChart3, LogOut, Menu, X, Settings as SettingsIcon,
  UserCog, Shield, ChevronDown, ChevronRight, Bell, User, Briefcase, Workflow, UserPlus, MailCheck, ChevronsLeft, ChevronsRight,
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
  {
    label: "Alat Tes",
    icon: ClipboardList,
    children: [
      { path: "/admin/test-instruments", label: "Alat Tes", icon: ClipboardList },
      { path: "/admin/activation-codes", label: "Kode Aktivasi", icon: KeyRound },
      { path: "/admin/results", label: "Hasil Tes", icon: BarChart3 },
    ],
  },
  {
    label: "Manajemen Kandidat",
    icon: Users,
    children: [
      { path: "/admin/candidates", label: "Daftar Kandidat", icon: Users },
      { path: "/admin/hr-jobs", label: "Lowongan", icon: Briefcase },
      { path: "/admin/applicants", label: "Pelamar", icon: Users },
      { path: "/admin/recruitment-process", label: "Recruitment", icon: Workflow },
    ],
  },
  {
    label: "Pengaturan",
    icon: SettingsIcon,
    children: [
      { path: "/admin/settings", label: "Pengaturan Aplikasi", icon: SettingsIcon },
      { path: "/admin/users", label: "Manajemen User", icon: UserCog },
      { path: "/admin/roles", label: "Manajemen Role", icon: Shield },
      { path: "/admin/candidate-settings", label: "Manajemen Kandidat", icon: Users },
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    let cancelled = false;
    const validate = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        sessionStorage.removeItem("psytest_admin");
        sessionStorage.removeItem("psytest_admin_user");
        navigate("/login", { replace: true });
        return;
      }

      const sessionData = sessionStorage.getItem("psytest_admin_user");
      if (!sessionData) return;

      try {
        const parsed = JSON.parse(sessionData) as AdminSession;
        const safeParsed: AdminSession = {
          ...parsed,
          permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
        };
        setAdminSession(safeParsed);

        const currentPath = location.pathname;
        const perms = safeParsed.permissions;
        const hasPermission =
          perms.includes(currentPath) ||
          currentPath === "/admin" ||
          currentPath === "/admin/test-instruments" ||
          currentPath === "/admin/activation-codes" ||
          currentPath === "/admin/jobs" ||
          currentPath === "/admin/hr-jobs" ||
          currentPath === "/admin/recruitment" ||
          currentPath.startsWith("/admin/candidates");

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
        navigate("/login", { replace: true });
      }
    };
    validate();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        sessionStorage.removeItem("psytest_admin");
        sessionStorage.removeItem("psytest_admin_user");
        navigate("/login", { replace: true });
      }
    });

    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, [navigate, location.pathname]);


  // Filter nav entries by permissions
  const navEntries = useMemo(() => {
    if (!adminSession) return ALL_NAV_ENTRIES;
    const perms = Array.isArray(adminSession.permissions) ? adminSession.permissions : [];

    // Paths that should always be visible regardless of permissions
    const alwaysVisiblePaths = ["/admin/hr-jobs", "/admin/applicants", "/admin/recruitment-process", "/admin/results", "/admin/activation-codes", "/admin/candidate-settings", "/admin/candidates"];

    const filtered: NavEntry[] = [];
    for (const entry of ALL_NAV_ENTRIES) {
      if (!entry) continue;
      if ("path" in entry) {
        if (perms.includes(entry.path) || alwaysVisiblePaths.includes(entry.path)) filtered.push(entry);
      } else if (entry.children && Array.isArray(entry.children)) {
        const visibleChildren = entry.children.filter(
          (c) => c && c.path && (perms.includes(c.path) || alwaysVisiblePaths.includes(c.path))
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
    "Alat Tes": location.pathname.startsWith("/admin/test-instruments") ||
                location.pathname.startsWith("/admin/results") ||
                location.pathname === "/admin/activation-codes",
    "Manajemen Kandidat": location.pathname.startsWith("/admin/candidates") ||
                         location.pathname.startsWith("/admin/hr-jobs") ||
                         location.pathname.startsWith("/admin/applicants") ||
                         location.pathname === "/admin/recruitment-process" ||
                         location.pathname === "/admin/results",
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
    }).then(async (r) => {
      if (r.isConfirmed) {
        await supabase.auth.signOut();
        sessionStorage.removeItem("psytest_admin");
        sessionStorage.removeItem("psytest_admin_user");
        navigate("/login", { replace: true });
      }
    });
  };


  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex h-full flex-shrink-0 flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100 shadow-lg transition-all duration-300 md:static md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } ${sidebarCollapsed ? "md:w-20" : "w-64 md:w-64"}`}>
        <div className="flex min-h-0 flex-1 flex-col">
        <div className={`flex items-center justify-between border-b border-slate-700 px-5 py-4 ${sidebarCollapsed ? "px-3" : ""}`}>
          <div className="flex items-center gap-2">
            {adminLogoUrl ? (
              <img src={adminLogoUrl} alt="Admin Logo" className="h-6 w-6 object-contain" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-primary" />
            )}
            {!sidebarCollapsed && (
              <span className="text-lg font-bold text-white">
                {adminPanelName}
              </span>
            )}
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 min-h-0 space-y-1 p-3 overflow-y-auto overscroll-contain">
          {navEntries.map((entry) => {
            if ("path" in entry) {
              // Single nav item
              const active = location.pathname === entry.path;
              return (
                <Link
                  key={entry.path}
                  to={entry.path}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? entry.label : ""}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-primary text-white shadow-md"
                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                    } ${sidebarCollapsed ? "justify-center" : ""}`}
                >
                  <entry.icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && entry.label}
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
                    title={sidebarCollapsed ? entry.label : ""}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        hasActiveChild
                          ? "bg-primary text-white shadow-md"
                          : "text-slate-300 hover:bg-slate-700 hover:text-white"
                      } ${sidebarCollapsed ? "justify-center" : ""}`}
                  >
                    <span className="flex items-center gap-3">
                      <entry.icon className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && entry.label}
                    </span>
                    {!sidebarCollapsed && (isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    ))}
                  </button>
                  {isExpanded && !sidebarCollapsed && (
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
                                        ? "bg-primary text-white"
                                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
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

          <div className="sticky bottom-0 z-10 border-t border-slate-700 bg-slate-950/90 p-3 space-y-2 backdrop-blur-sm">
          {adminSession && !sidebarCollapsed && (
            <div className="rounded-lg bg-white/10 px-3 py-2">
              <p className="text-xs font-medium text-white truncate">
                {adminSession.full_name || adminSession.username}
              </p>
              <p className="text-[10px] text-slate-300 truncate">
                {adminSession.role_name}
              </p>
            </div>
          )}
          <button onClick={handleLogout}
            title={sidebarCollapsed ? "Keluar" : ""}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-red-600/10 hover:text-red-200 transition-colors ${sidebarCollapsed ? "justify-center" : ""}`}>
            <LogOut className="h-4 w-4" />{!sidebarCollapsed && "Keluar"}
          </button>
        </div>
        </div>
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-30 flex flex-shrink-0 items-center gap-3 border-b border-border bg-card/80 backdrop-blur-xl px-4 py-3 md:px-6">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
            className="hidden md:flex text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
            title={sidebarCollapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
          >
            {sidebarCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
          </button>
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

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6">{children}</main>

        <footer className="flex-shrink-0 border-t border-border bg-card/50 px-4 py-3 md:px-6">
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
