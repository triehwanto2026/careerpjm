import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, KeyRound, Lock, Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "@/integrations/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

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
        icon: "warning", title: "Peringatan", text: "Silakan isi kode aktivasi dan password.",
        background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(174, 72%, 46%)",
      });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("activation_codes")
      .select("*")
      .eq("code", activationCode.trim())
      .eq("password", password.trim())
      .maybeSingle();

    if (error || !data) {
      setLoading(false);
      Swal.fire({
        icon: "error", title: "Akses Ditolak",
        text: "Kode aktivasi atau password salah.",
        background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(174, 72%, 46%)",
      });
      return;
    }

    // Check if code is still valid
    const now = new Date();
    const isExpired = data.expires_at && new Date(data.expires_at) < now;
    const status = (data as any).status || 'active';
    
    if (isExpired) {
      setLoading(false);
      Swal.fire({
        icon: "error", title: "Kode Kadaluarsa",
        text: "Kode aktivasi telah kadaluarsa. Silakan hubungi admin.",
        background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(174, 72%, 46%)",
      });
      return;
    }

    if (status === 'completed') {
      setLoading(false);
      Swal.fire({
        icon: "error", title: "Tes Selesai",
        text: "Tes untuk kode aktivasi ini sudah selesai. Kode tidak dapat digunakan lagi.",
        background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(174, 72%, 46%)",
      });
      return;
    }

    if (status === 'invalid') {
      setLoading(false);
      Swal.fire({
        icon: "error", title: "Kode Tidak Valid",
        text: "Kode aktivasi tidak valid. Silakan hubungi admin.",
        background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(174, 72%, 46%)",
      });
      return;
    }

    // Code is valid, proceed with login
    await supabase.from("activation_codes").update({ status: 'active' } as any).eq("id", data.id);
    // Find or create candidate
    const { data: existing } = await supabase.from("candidates").select("id, photo_url, phone, birth_date, education, gender")
      .eq("email", data.candidate_email).maybeSingle();
    let candidateId = existing?.id || null;
    const photoUrl = existing?.photo_url || null;
    if (!candidateId) {
      const { data: newCand } = await supabase.from("candidates").insert({
        name: data.candidate_name, email: data.candidate_email, position: data.position,
        status: "in_progress", activation_code_id: data.id,
      } as any).select("id").single();
      candidateId = newCand?.id || null;
    } else {
      await supabase.from("candidates").update({ status: "in_progress", activation_code_id: data.id } as any).eq("id", candidateId);
    }

    Swal.fire({
      icon: "success", title: "Akses Diberikan",
      text: `Selamat datang, ${data.candidate_name}!`,
      background: "hsl(var(--card))", color: "hsl(var(--foreground))", confirmButtonColor: "hsl(174, 72%, 46%)",
      timer: 1500, showConfirmButton: false,
    }).then(() => {
      sessionStorage.setItem("psytest_auth", "true");
      sessionStorage.setItem("psytest_candidate", JSON.stringify({
        id: candidateId,
        name: data.candidate_name, email: data.candidate_email, position: data.position,
        activationCodeId: data.id, assignedTests: data.assigned_tests || [],
        photo_url: photoUrl,
        phone: existing?.phone || "", birth_date: existing?.birth_date || "",
        education: existing?.education || "", gender: existing?.gender || "",
      }));
      navigate("/test");
    });
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
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Tes Psikologi <span className="text-gradient">Rekrutmen</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Masukkan kode aktivasi untuk memulai tes</p>
        </div>

        <form onSubmit={handleLogin} className="glass space-y-5 rounded-2xl p-6 glow-border md:p-8">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <KeyRound className="h-4 w-4 text-primary" />Kode Aktivasi
            </label>
            <input type="text" value={activationCode} onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
              placeholder="Masukkan kode aktivasi"
              className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-mono tracking-wider"
              maxLength={20} autoComplete="off" />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Lock className="h-4 w-4 text-primary" />Password
            </label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full rounded-lg border border-border bg-muted px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                maxLength={50} autoComplete="off" />
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
            ) : "Masuk ke Tes"}
          </button>

          <p className="text-center text-xs text-muted-foreground">Hubungi HRD jika Anda belum menerima kode aktivasi</p>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2">
          <a href="/admin" className="text-xs text-primary hover:underline">🔐 Admin Panel</a>
          <p className="text-xs text-muted-foreground/60">© 2024 PsyTest Recruitment Platform • Secure & Confidential</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
