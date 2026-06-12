import { ReactNode, useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Briefcase,
  ClipboardList,
  LogOut,
  ShieldCheck,
  Menu,
  Bell,
  Settings,
  Brain,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";

const nav = [
  { to: "/candidate/profile", label: "Profil Saya", icon: User },
  { to: "/candidate/jobs", label: "Lowongan", icon: Briefcase },
  { to: "/candidate/applications", label: "Lamaran Saya", icon: ClipboardList },
  { to: "/candidate/tests", label: "Tes Psikologi", icon: Brain },
  { to: "/candidate/settings", label: "Pengaturan", icon: Settings },
];

export default function CandidateLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState<string>("");
  // collapsed = narrow (icon-only) on desktop; on mobile collapsed means hidden
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [publicSettings, setPublicSettings] = useState<Record<string, string>>({});
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);

  const sidebarRef = useRef<HTMLElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/candidate/login");
      else {
        setEmail(data.session.user.email || "");
        loadProfilePhoto(data.session.user.id, data.session.user.email || "");
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/candidate/login");
      else {
        setEmail(session.user.email || "");
        loadProfilePhoto(session.user.id, session.user.email || "");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const loadProfilePhoto = async (userId: string, userEmail: string) => {
    const { data } = await supabase
      .from("candidate_profiles")
      .select("photo_url")
      .or(`user_id.eq.${userId},email.eq.${userEmail}`)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setProfilePhotoUrl((data as any)?.photo_url || null);
  };

  useEffect(() => {
    const onPhotoUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ photo_url?: string | null }>).detail;
      if ("photo_url" in (detail || {})) {
        setProfilePhotoUrl(detail?.photo_url || null);
        return;
      }
      supabase.auth.getSession().then(({ data }) => {
        const session = data.session;
        if (session) loadProfilePhoto(session.user.id, session.user.email || "");
      });
    };
    window.addEventListener("candidate-profile-photo-updated", onPhotoUpdated);
    return () => window.removeEventListener("candidate-profile-photo-updated", onPhotoUpdated);
  }, []);

  useEffect(() => {
    const loadPublicSettings = async () => {
      const keys = ["app_name", "app_logo_url", "landing_header_title"];
      const { data, error } = await supabase.from("app_settings").select("key, value").in("key", keys);
      if (error) {
        console.error("Error loading candidate branding settings:", error);
        return;
      }
      setPublicSettings(
        (data || []).reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, string>)
      );
    };
    loadPublicSettings();
  }, []);

  // Close dropdowns + collapse mobile sidebar on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(t)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(t)) setShowProfileMenu(false);
      if (
        isMobile &&
        !collapsed &&
        sidebarRef.current &&
        !sidebarRef.current.contains(t)
      ) {
        setCollapsed(true);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isMobile, collapsed]);

  // On route change: collapse on mobile, keep expanded on desktop
  useEffect(() => {
    setCollapsed(isMobile);
    setShowNotifications(false);
    setShowProfileMenu(false);
  }, [location.pathname, isMobile]);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/candidate/login");
  };

  // Sidebar widths
  // Desktop: collapsed = w-16 (icons only); expanded = w-64
  // Mobile: collapsed = hidden (-translate-x-full), expanded = w-64
  const desktopWidth = collapsed ? "lg:w-16" : "lg:w-64";
  const mobileTransform = collapsed ? "-translate-x-full" : "translate-x-0";

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-64 ${desktopWidth} lg:translate-x-0 ${mobileTransform} transform transition-all duration-300 ease-in-out bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 shadow-lg flex flex-col h-screen`}
      >
        <div className="p-3 border-b border-slate-700 flex items-center justify-between gap-2">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-2 flex-1 min-w-0 hover:bg-slate-700/50 rounded-lg p-1 transition"
            aria-label="Toggle sidebar"
          >
            {publicSettings.app_logo_url ? (
              <img
                src={publicSettings.app_logo_url}
                alt={publicSettings.app_name || "Logo"}
                className="h-9 w-9 rounded-lg object-cover flex-none"
              />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center flex-none">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
            )}
            {!collapsed && (
              <div className="min-w-0 text-left">
                <div className="text-sm font-bold text-white truncate">Portal Kandidat</div>
                <div className="text-[10px] text-slate-300 truncate">
                  {publicSettings.app_name || publicSettings.landing_header_title || "PJM Group"}
                </div>
              </div>
            )}
          </button>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {nav.map((n) => {
            const active = location.pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                title={collapsed ? n.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-primary text-white shadow-md"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5 flex-none" />
                {!collapsed && <span className="truncate">{n.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-2 border-t border-slate-700">
          {!collapsed && (
            <div className="px-3 py-2 text-xs text-slate-300 truncate">{email}</div>
          )}
          <button
            onClick={logout}
            title={collapsed ? "Keluar" : undefined}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-600/10 hover:text-red-200 transition ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-4 w-4 flex-none" />
            {!collapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Backdrop on mobile when sidebar open */}
      {!collapsed && isMobile && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Main */}
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-30 flex h-14 flex-shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="p-2 rounded-md hover:bg-muted"
              aria-label="Toggle sidebar"
            >
              {collapsed ? <Menu className="h-5 w-5" /> : <ChevronsRight className="h-5 w-5 rotate-180" />}
            </button>
            <div className="text-sm font-semibold hidden sm:block">
              Selamat datang di Portal Kandidat
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  setShowNotifications((s) => !s);
                  setShowProfileMenu(false);
                }}
                className="p-2 rounded-md hover:bg-muted relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-card border border-border rounded-lg shadow-xl z-50">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-sm">Notifikasi</h3>
                    <p className="text-xs text-muted-foreground">2 notifikasi baru</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-3 hover:bg-muted cursor-pointer border-b border-border">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Bell className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold">Status Lamaran Diperbarui</h4>
                          <p className="text-xs text-muted-foreground">Lamaran Anda telah berpindah ke tahap screening</p>
                          <p className="text-xs text-muted-foreground mt-1">2 jam yang lalu</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 hover:bg-muted cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                          <Bell className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold">Tes Psikologi Tersedia</h4>
                          <p className="text-xs text-muted-foreground">Paket tes telah ditugaskan untuk Anda</p>
                          <p className="text-xs text-muted-foreground mt-1">1 hari yang lalu</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => {
                  setShowProfileMenu((s) => !s);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
              >
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt="Foto profil kandidat" className="h-7 w-7 rounded-full border border-border object-cover" />
                ) : (
                  <div className="h-7 w-7 bg-primary rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
                <span className="text-sm font-medium hidden sm:inline">Profil</span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-xl z-50">
                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate("/candidate/settings");
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Pengaturan Profil</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate("/candidate/profile");
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-muted transition"
                    >
                      <User className="h-4 w-4" />
                      <span>Data Profil</span>
                    </button>
                    <div className="border-t border-border my-2"></div>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <ThemeToggle />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 lg:p-6">{children}</main>
        <footer className="flex-shrink-0 border-t border-border bg-card/50 px-4 py-2 lg:px-6">
          <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>{publicSettings.app_name || publicSettings.landing_header_title || "PJM Group"}</span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Portal Online
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
