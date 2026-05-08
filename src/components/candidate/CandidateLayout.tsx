import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { User, Briefcase, FileText, ClipboardList, LogOut, Brain, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const nav = [
  { to: "/candidate/profile", label: "Profil Saya", icon: User },
  { to: "/candidate/jobs", label: "Lowongan", icon: Briefcase },
  { to: "/candidate/applications", label: "Lamaran Saya", icon: ClipboardList },
  { to: "/candidate/tests", label: "Tes Psikologi", icon: Brain },
];

export default function CandidateLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState<string>("");
  const [open, setOpen] = useState(false);

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

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/candidate/login");
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 transform transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"} bg-card border-r border-border flex flex-col`}>
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold">Portal Kandidat</div>
              <div className="text-[10px] text-muted-foreground">PsyTest Recruitment</div>
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
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">{email}</div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition"
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
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
