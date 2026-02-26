import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  KeyRound,
  ClipboardList,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Swal from "sweetalert2";

const navItems = [
  { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/activation-codes", label: "Kode Aktivasi", icon: KeyRound },
  { path: "/admin/test-instruments", label: "Alat Tes", icon: ClipboardList },
  { path: "/admin/candidates", label: "Kandidat", icon: Users },
  { path: "/admin/results", label: "Hasil Tes", icon: BarChart3 },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("psytest_admin") !== "true") {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleLogout = () => {
    Swal.fire({
      icon: "warning",
      title: "Keluar?",
      text: "Yakin ingin keluar dari panel admin?",
      showCancelButton: true,
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
      background: "hsl(220, 18%, 10%)",
      color: "hsl(210, 20%, 92%)",
      confirmButtonColor: "hsl(0, 72%, 51%)",
    }).then((r) => {
      if (r.isConfirmed) {
        sessionStorage.removeItem("psytest_admin");
        navigate("/admin", { replace: true });
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-foreground">
              Psy<span className="text-gradient">Admin</span>
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground md:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur-xl px-4 py-3 md:px-6">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground md:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <h2 className="text-sm font-semibold text-foreground">
            {navItems.find((n) => n.path === location.pathname)?.label || "Admin"}
          </h2>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
