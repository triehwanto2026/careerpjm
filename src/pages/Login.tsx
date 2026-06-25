import { Link, useNavigate } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState({ name: "Recruit PJM GROUP", logo: "/pjmgroup-logo.svg" });

  useEffect(() => {
    const loadBrand = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["app_name", "app_logo_url", "landing_header_title"]);
      const settings = (data || []).reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);
      setBrand({
        name: settings.app_name || settings.landing_header_title || "Recruit PJM GROUP",
        logo: settings.app_logo_url || "/pjmgroup-logo.svg",
      });
    };
    loadBrand();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) return;
      if (sessionStorage.getItem("psytest_admin") === "true") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }
      navigate("/candidate/profile", { replace: true });
    });
  }, [navigate]);

  const handleResetPassword = async () => {
    const loginId = identifier.trim();
    if (!loginId.includes("@")) {
      toast({ title: "Error", description: "Masukkan email untuk reset password", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(loginId, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    
    if (error) {
      toast({ title: "Gagal mengirim", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Link reset password dikirim", description: "Silakan cek inbox email Anda" });
    }
  };

  const handleResendConfirmation = async () => {
    const loginId = identifier.trim();
    if (!loginId.includes("@")) {
      toast({ title: "Error", description: "Masukkan email untuk kirim konfirmasi", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: loginId,
    });
    setLoading(false);
    
    if (error) {
      toast({ title: "Gagal mengirim", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email konfirmasi dikirim", description: "Silakan cek inbox email Anda" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loginId = identifier.trim();
    if (!loginId || !password) {
      toast({ title: "Error", description: "Email/username dan password wajib diisi.", variant: "destructive" });
      return;
    }
    setLoading(true);

    try {
      const { data: adminData, error: adminError } = await supabase.functions.invoke("admin-login", {
        body: { identifier: loginId, password },
      });

      const adminPayload = adminData as any;
      if (!adminError && adminPayload?.session?.access_token && adminPayload?.user) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: adminPayload.session.access_token,
          refresh_token: adminPayload.session.refresh_token,
        });
        if (sessionError) throw sessionError;

        const adminSession = {
          id: adminPayload.user.id,
          username: adminPayload.user.username,
          full_name: adminPayload.user.full_name,
          role_id: adminPayload.user.role_id,
          role_name: adminPayload.user.role_name,
          permissions: adminPayload.user.permissions || [],
          roles: adminPayload.user.roles || [],
        };
        sessionStorage.removeItem("psytest_auth");
        sessionStorage.removeItem("psytest_candidate");
        sessionStorage.setItem("psytest_admin", "true");
        sessionStorage.setItem("psytest_admin_user", JSON.stringify(adminSession));

        toast({ title: "Login Berhasil", description: "Selamat datang di panel admin." });
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      if (!loginId.includes("@")) {
        throw new Error("Username hanya untuk admin. Kandidat silakan masuk dengan email.");
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginId,
        password,
      });
      
      if (error) {
        const errorMessage = error.message.toLowerCase();
        
        // Check if error is related to unconfirmed email
        if (errorMessage.includes("email not confirmed") || errorMessage.includes("email confirmation")) {
          toast({
            title: "Email belum dikonfirmasi",
            description: "Silakan gunakan tombol 'Kirim ulang konfirmasi' di bawah",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      sessionStorage.removeItem("psytest_admin");
      sessionStorage.removeItem("psytest_admin_user");
      toast({ title: "Login Berhasil", description: "Selamat datang kembali!" });
      navigate("/candidate/profile", { replace: true });
    } catch (error: any) {
      toast({
        title: "Login Gagal",
        description: error?.message || "Email/username atau password salah.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={brand.logo} alt={brand.name} className="h-16 w-auto max-w-[180px] rounded-xl bg-white object-contain p-2 shadow-sm" />
            </div>
            <h1 className="text-2xl font-bold">Selamat Datang Kembali</h1>
            <p className="text-muted-foreground mt-2">Masuk ke akun {brand.name} Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email atau Username</Label>
              <div className="relative">
                <UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="identifier"
                  type="text"
                  placeholder="email kandidat atau username admin"
                  className="pl-10"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-sm">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={loading}
              className="text-muted-foreground hover:text-primary transition disabled:opacity-50"
            >
              Lupa password?
            </button>
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={loading}
              className="text-muted-foreground hover:text-primary transition disabled:opacity-50"
            >
              Kirim ulang email konfirmasi
            </button>
          </div>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Daftar Sekarang
            </Link>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Akun yang dibuat dari beranda otomatis terdaftar sebagai kandidat. Akun admin dibuat dari dashboard admin.
          </p>
        </motion.div>
      </div>
    </PublicLayout>
  );
};

export default Login;
