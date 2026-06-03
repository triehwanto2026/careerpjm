import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, User, Lock, Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

const AdminLogin = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      Swal.fire({
        icon: "warning", title: "Peringatan", text: "Silakan isi username/email dan password.",
        background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(174, 72%, 46%)",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-login", {
        body: { identifier: identifier.trim(), password },
      });

      if (error || !data || (data as any).error) {
        const msg = (data as any)?.error || error?.message || "Username atau password salah.";
        setLoading(false);
        Swal.fire({
          icon: "error", title: "Login Gagal", text: msg,
          background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(174, 72%, 46%)",
        });
        return;
      }

      const payload = data as any;

      // Hydrate Supabase Auth session
      const { error: setErr } = await supabase.auth.setSession({
        access_token: payload.session.access_token,
        refresh_token: payload.session.refresh_token,
      });
      if (setErr) throw setErr;

      const adminSession = {
        id: payload.user.id,
        username: payload.user.username,
        full_name: payload.user.full_name,
        role_id: payload.user.role_id,
        role_name: payload.user.role_name,
        permissions: payload.user.permissions || [],
        roles: payload.user.roles || [],
      };
      sessionStorage.setItem("psytest_admin", "true");
      sessionStorage.setItem("psytest_admin_user", JSON.stringify(adminSession));

      if (payload.user.force_password_reset) {
        await Swal.fire({
          icon: "info",
          title: "Reset Password Diperlukan",
          text: "Akun Anda menggunakan password sementara. Silakan ganti password segera di halaman Profil.",
          background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(174, 72%, 46%)",
        });
      }

      navigate("/admin/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Login error:", err);
      setLoading(false);
      Swal.fire({
        icon: "error", title: "Login Gagal", text: err?.message || "Terjadi kesalahan. Silakan coba lagi.",
        background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(174, 72%, 46%)",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 glow-primary">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Admin <span className="text-gradient">Panel</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Masuk ke panel administrasi PsyTest</p>
        </div>

        <form onSubmit={handleLogin} className="glass space-y-5 rounded-2xl p-6 glow-border md:p-8">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <User className="h-4 w-4 text-primary" />Username atau Email
            </label>
            <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
              placeholder="username atau email@admin.local"
              className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              autoComplete="username" />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Lock className="h-4 w-4 text-primary" />Password
            </label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full rounded-lg border border-border bg-muted px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed glow-primary">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Memverifikasi...
              </span>
            ) : "Masuk Admin"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            <Link to="/test-login" className="text-primary hover:underline">← Kembali ke login tes psikologi</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
