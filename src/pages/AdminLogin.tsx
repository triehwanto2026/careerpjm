import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, User, Lock, Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      Swal.fire({
        icon: "warning", title: "Peringatan", text: "Silakan isi username dan password.",
        background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(174, 72%, 46%)",
      });
      return;
    }

    setLoading(true);

    try {
      // Hash password and verify against database
      const passwordHash = await hashPassword(password);

      console.log("Attempting login for:", username.trim());
      console.log("Password hash:", passwordHash);

      // First try without join to check basic access
      const { data: basicUser, error: basicError } = await supabase
        .from("admin_users")
        .select("*")
        .eq("username", username.trim())
        .eq("password_hash", passwordHash)
        .eq("is_active", true)
        .single();

      console.log("Basic user query:", { data: basicUser, error: basicError });

      if (basicError || !basicUser) {
        setLoading(false);
        Swal.fire({
          icon: "error", title: "Login Gagal", text: "Username atau password salah, atau akun tidak aktif.",
          background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(174, 72%, 46%)",
        });
        return;
      }

      // Now try with role join
      const { data: user, error: roleError } = await supabase
        .from("admin_users")
        .select("*, admin_roles(name, permissions)")
        .eq("id", basicUser.id)
        .single();

      console.log("Role join query:", { data: user, error: roleError });

      if (roleError || !user) {
        // Fallback: use basic user data and fetch role separately
        const { data: roleData, error: roleFetchError } = await supabase
          .from("admin_roles")
          .select("*")
          .eq("id", basicUser.role_id)
          .single();

        console.log("Separate role fetch:", { data: roleData, error: roleFetchError });

        const userWithRole = {
          ...basicUser,
          admin_roles: roleData || { name: "Unknown", permissions: [] },
        };
        await completeLogin(userWithRole);
        return;
      }

      await completeLogin(user);
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
      Swal.fire({
        icon: "error", title: "Login Gagal", text: "Terjadi kesalahan. Silakan coba lagi.",
        background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(174, 72%, 46%)",
      });
    }
  };

  const completeLogin = async (user: any) => {
    try {
      // Update last login
      await supabase
        .from("admin_users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", user.id);

      // Store admin session with user info and permissions
      const roleData = user.admin_roles as { name: string; permissions: string[] } | null;
      const adminSession = {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role_id: user.role_id,
        role_name: roleData?.name || "",
        permissions: roleData?.permissions || [],
      };

      sessionStorage.setItem("psytest_admin", "true");
      sessionStorage.setItem("psytest_admin_user", JSON.stringify(adminSession));
      navigate("/admin/dashboard", { replace: true });
    } catch {
      setLoading(false);
      Swal.fire({
        icon: "error", title: "Login Gagal", text: "Terjadi kesalahan saat menyimpan sesi.",
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
              <User className="h-4 w-4 text-primary" />Username
            </label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              autoComplete="off" />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Lock className="h-4 w-4 text-primary" />Password
            </label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full rounded-lg border border-border bg-muted px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                autoComplete="off" />
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
