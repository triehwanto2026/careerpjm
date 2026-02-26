import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, KeyRound, Lock, Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
import { VALID_CREDENTIALS } from "@/data/questions";

const Index = () => {
  const [activationCode, setActivationCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activationCode.trim() || !password.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: "Silakan isi kode aktivasi dan password.",
        background: "hsl(220, 18%, 10%)",
        color: "hsl(210, 20%, 92%)",
        confirmButtonColor: "hsl(174, 72%, 46%)",
      });
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));

    if (
      activationCode === VALID_CREDENTIALS.activationCode &&
      password === VALID_CREDENTIALS.password
    ) {
      Swal.fire({
        icon: "success",
        title: "Akses Diberikan",
        text: "Selamat datang! Anda akan diarahkan ke halaman tes.",
        background: "hsl(220, 18%, 10%)",
        color: "hsl(210, 20%, 92%)",
        confirmButtonColor: "hsl(174, 72%, 46%)",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        sessionStorage.setItem("psytest_auth", "true");
        navigate("/test");
      });
    } else {
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Kode aktivasi atau password salah. Silakan coba lagi.",
        background: "hsl(220, 18%, 10%)",
        color: "hsl(210, 20%, 92%)",
        confirmButtonColor: "hsl(174, 72%, 46%)",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo area */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 glow-primary">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Tes Psikologi <span className="text-gradient">Rekrutmen</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Masukkan kode aktivasi untuk memulai tes
          </p>
        </div>

        {/* Login card */}
        <form
          onSubmit={handleLogin}
          className="glass space-y-5 rounded-2xl p-6 glow-border md:p-8"
        >
          {/* Activation code */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <KeyRound className="h-4 w-4 text-primary" />
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

          {/* Password */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Lock className="h-4 w-4 text-primary" />
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full rounded-lg border border-border bg-muted px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                maxLength={50}
                autoComplete="off"
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

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed glow-primary"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                Memverifikasi...
              </span>
            ) : (
              "Masuk ke Tes"
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Hubungi HRD jika Anda belum menerima kode aktivasi
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground/60">
          © 2024 PsyTest Recruitment Platform • Secure & Confidential
        </p>
      </div>
    </div>
  );
};

export default Index;
