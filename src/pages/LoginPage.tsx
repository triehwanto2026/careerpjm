import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, LogIn, Eye, EyeOff, Shield, User, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

const LoginPage = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState<"candidate" | "admin">("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (loginType === "admin") {
        // Admin login via Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if user exists in admin_users
        const { data: adminUser } = await supabase
          .from("admin_users")
          .select("*, role:admin_roles(name)")
          .eq("email", email)
          .single();

        if (!adminUser || !adminUser.is_active) {
          await supabase.auth.signOut();
          throw new Error("Akses ditolak. Anda tidak memiliki akses admin.");
        }

        Swal.fire({
          icon: "success",
          title: "Login Berhasil",
          text: "Selamat datang di Admin Panel",
          timer: 1500,
          showConfirmButton: false,
          background: "hsl(var(--card))",
          color: "hsl(var(--foreground))",
        }).then(() => {
          navigate("/admin/dashboard");
        });
      } else {
        // Try candidate login via email/password first (for admin-created accounts)
        if (!activationCode && email && password) {
          console.log('Trying candidate login with:', { email, hasPassword: !!password });
          
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          console.log('Auth result:', { authData, authError });

          if (!authError && authData.user) {
            // Check if user exists in candidates table
            const { data: candidate } = await supabase
              .from("candidates")
              .select("id, name, email, position, photo_url, phone, birth_date, education, gender")
              .eq("email", email)
              .maybeSingle();

            console.log('Candidate data:', candidate);

            if (candidate) {
              sessionStorage.setItem("psytest_auth", "true");
              sessionStorage.setItem("psytest_candidate", JSON.stringify({
                id: candidate.id,
                name: candidate.name,
                email: candidate.email,
                position: candidate.position || "",
                activationCodeId: null,
                assignedTests: [],
                photo_url: candidate.photo_url || null,
                phone: candidate.phone || "",
                birth_date: candidate.birth_date || "",
                education: candidate.education || "",
                gender: candidate.gender || "",
              }));

              Swal.fire({
                icon: "success",
                title: "Selamat Datang",
                text: candidate.name,
                timer: 1500,
                showConfirmButton: false,
                background: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
              }).then(() => {
                navigate("/test");
              });
              return;
            } else {
              console.log('No candidate found for email:', email);
            }
          } else {
            console.log('Auth failed:', authError?.message);
          }
        }

        // Fallback to activation code login
        if (!activationCode) {
          throw new Error("Masukkan kode aktivasi atau gunakan email dan password.");
        }

        const { data, error } = await supabase
          .from("activation_codes")
          .select("*")
          .eq("code", activationCode.trim())
          .eq("password", password.trim())
          .maybeSingle();

        if (error || !data) {
          throw new Error("Kode aktivasi atau password salah.");
        }

        const now = new Date();
        const isExpired = data.expires_at && new Date(data.expires_at) < now;
        const status = (data as any).status || "active";

        if (isExpired) throw new Error("Kode aktivasi telah kadaluarsa.");
        if (status === "completed") throw new Error("Tes sudah selesai.");
        if (status === "invalid") throw new Error("Kode tidak valid.");

        // Get or create candidate
        const { data: existing } = await supabase
          .from("candidates")
          .select("id, photo_url, phone, birth_date, education, gender")
          .eq("email", data.candidate_email)
          .maybeSingle();

        let candidateId = existing?.id;
        if (!candidateId) {
          const { data: newCand } = await supabase
            .from("candidates")
            .insert({
              name: data.candidate_name,
              email: data.candidate_email,
              position: data.position,
              status: "in_progress",
              activation_code_id: data.id,
            } as any)
            .select("id")
            .single();
          candidateId = newCand?.id;
        }

        sessionStorage.setItem("psytest_auth", "true");
        sessionStorage.setItem(
          "psytest_candidate",
          JSON.stringify({
            id: candidateId,
            name: data.candidate_name,
            email: data.candidate_email,
            position: data.position,
            activationCodeId: data.id,
            assignedTests: data.assigned_tests || [],
            photo_url: existing?.photo_url || null,
            phone: existing?.phone || "",
            birth_date: existing?.birth_date || "",
            education: existing?.education || "",
            gender: existing?.gender || "",
          })
        );

        Swal.fire({
          icon: "success",
          title: "Selamat Datang",
          text: data.candidate_name,
          timer: 1500,
          showConfirmButton: false,
          background: "hsl(var(--card))",
          color: "hsl(var(--foreground))",
        }).then(() => {
          navigate("/test");
        });
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Login Gagal",
        text: error.message,
        background: "hsl(var(--card))",
        color: "hsl(var(--foreground))",
        confirmButtonColor: "hsl(174, 72%, 46%)",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
      </div>

      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 glow-primary">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            PT. <span className="text-gradient">PsyTest</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Silakan login untuk melanjutkan</p>
        </div>

        {/* Login Type Toggle */}
        <div className="glass rounded-xl p-1 mb-6 glow-border">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setLoginType("candidate")}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                loginType === "candidate"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-4 w-4" />
              Kandidat
            </button>
            <button
              onClick={() => setLoginType("admin")}
              className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                loginType === "admin"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="glass rounded-2xl p-6 glow-border">
          {loginType === "candidate" ? (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@contoh.com"
                    className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full rounded-lg border border-border bg-muted px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-2 text-center">ATAU</p>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Kode Aktivasi
                    </label>
                    <input
                      type="text"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                      placeholder="Masukkan kode aktivasi"
                      className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-mono tracking-wider"
                      maxLength={20}
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Belum punya akun?{" "}
                  <a href="/candidate/register" className="text-primary hover:underline">
                    Daftar disini
                  </a>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@company.com"
                    className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full rounded-lg border border-border bg-muted px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed glow-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Memverifikasi...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Login
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2025 PT. PsyTest. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
