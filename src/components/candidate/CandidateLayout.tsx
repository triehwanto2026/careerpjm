import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { User, Briefcase, FileText, ClipboardList, LogOut, ShieldCheck, Menu, X, Bell, Settings, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

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
  const [email, setEmail] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [publicSettings, setPublicSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/candidate/login");
      else setEmail(data.session.user.email || "");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/candidate/login");
      else setEmail(session.user.email || "");
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

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

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/candidate/login");
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 shadow-lg flex flex-col`}>
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-2">
            {publicSettings.app_logo_url ? (
              <img src={publicSettings.app_logo_url} alt={publicSettings.app_name || publicSettings.landing_header_title || "PJM Group Career Management"} className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
            )}
            <div>
              <div className="text-sm font-bold text-white">Portal Kandidat</div>
              <div className="text-[10px] text-slate-300">
                {publicSettings.app_name || publicSettings.landing_header_title || "PJM Group Career Management"}
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => {
            const active = location.pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active ? "bg-primary text-white shadow-md" : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <div className="px-3 py-2 text-xs text-slate-300 truncate">{email}</div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-600/10 hover:text-red-200 transition"
          >
            <LogOut className="h-4 w-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 lg:px-6 bg-card">
          <button onClick={() => setOpen(!open)} className="lg:hidden p-2 rounded-md hover:bg-muted">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="text-sm font-semibold">Selamat datang di Portal Kandidat</div>
          
          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-md hover:bg-muted relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-sm">Notifikasi</h3>
                    <p className="text-xs text-muted-foreground">2 notifikasi baru</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-3 hover:bg-muted cursor-pointer border-b border-border">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bell className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold">Status Lamaran Diperbarui</h4>
                          <p className="text-xs text-muted-foreground">Lamaran Anda telah berpindah ke tahap screening</p>
                          <p className="text-xs text-muted-foreground mt-1">2 jam yang lalu</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 hover:bg-muted cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Bell className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold">Tes Psikologi Tersedia</h4>
                          <p className="text-xs text-muted-foreground">Paket tes telah ditugaskan untuk Anda</p>
                          <p className="text-xs text-muted-foreground mt-1">1 hari yang lalu</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-t border-border">
                    <button className="w-full text-center text-sm text-primary hover:underline">
                      Lihat Semua Notifikasi
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted"
              >
                <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium hidden sm:inline">Profil</span>
              </button>
              
              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition"
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
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
