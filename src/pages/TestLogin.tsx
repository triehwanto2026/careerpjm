import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, LogIn } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "@/integrations/supabase/client";

export default function TestLogin() {
  const navigate = useNavigate();
  const [activationCode, setActivationCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim() || !password.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Data belum lengkap",
        text: "Masukkan kode tes dan password untuk melanjutkan.",
        background: "hsl(var(--card))",
        color: "hsl(var(--foreground))",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("activation_codes")
        .select("*")
        .eq("code", activationCode.trim().toUpperCase())
        .eq("password", password.trim())
        .maybeSingle();

      if (error || !data) {
        throw new Error("Kode tes atau password salah.");
      }

      const now = new Date();
      const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
      const status = (data as any).status || "active";

      if (expiresAt && expiresAt < now) throw new Error("Kode tes telah kadaluarsa.");
      if (status === "completed") throw new Error("Tes sudah selesai.");
      if (status === "invalid") throw new Error("Kode tes tidak valid.");

      const { data: existingCandidate } = await supabase
        .from("candidates")
        .select("id, photo_url, phone, birth_date, education, gender")
        .eq("email", data.candidate_email)
        .maybeSingle();

      let candidateId = existingCandidate?.id;
      if (!candidateId) {
        const { data: inserted } = await supabase
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

        candidateId = inserted?.id;
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
          photo_url: existingCandidate?.photo_url || null,
          phone: existingCandidate?.phone || "",
          birth_date: existingCandidate?.birth_date || "",
          education: existingCandidate?.education || "",
          gender: existingCandidate?.gender || "",
        })
      );

      Swal.fire({
        icon: "success",
        title: "Masuk berhasil",
        text: "Selamat datang di tes psikologi.",
        timer: 1300,
        showConfirmButton: false,
        background: "hsl(var(--card))",
        color: "hsl(var(--foreground))",
      }).then(() => navigate("/test"));
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Login gagal",
        text: err.message || "Terjadi kesalahan saat masuk ke tes.",
        background: "hsl(var(--card))",
        color: "hsl(var(--foreground))",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="text-primary hover:underline flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">Login Tes Psikologi</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Masukkan kode tes dan password untuk mengakses alat tes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Kode Tes</label>
              <input
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                placeholder="Masukkan kode tes"
                className="w-full rounded-2xl border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors font-mono tracking-wider"
                autoComplete="off"
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full rounded-2xl border border-border bg-muted pl-12 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="h-4 w-4" />
              {loading ? "Memproses..." : "Masuk ke Tes"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Jika Anda memiliki akun kandidat biasa, gunakan halaman <Link to="/candidate/login" className="text-primary hover:underline">login kandidat</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
