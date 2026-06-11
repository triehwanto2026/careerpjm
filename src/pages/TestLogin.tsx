import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, LogIn } from "lucide-react";
import Swal from "sweetalert2";
import { supabase } from "@/integrations/supabase/client";

const getFunctionErrorMessage = async (error: any) => {
  const context = error?.context;
  if (context instanceof Response) {
    try {
      const payload = await context.clone().json();
      if (payload?.error) return payload.error;
      if (payload?.message) return payload.message;
    } catch {
      try {
        const text = await context.clone().text();
        if (text) return text;
      } catch {}
    }
  }
  return error?.message || "Login gagal.";
};

export default function TestLogin() {
  const navigate = useNavigate();
  const [activationCode, setActivationCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const showStartWarning = async (candidate: { activationCode?: string; position?: string; assignedTests?: string[] }) => {
    let totalMinutes = 0;
    try {
      const ids = (candidate.assignedTests || []).filter(Boolean);
      if (ids.length > 0) {
        const { data: instr } = await supabase
          .from("test_instruments")
          .select("duration_minutes")
          .in("id", ids);
        totalMinutes = (instr || []).reduce((sum: number, row: any) => sum + (Number(row.duration_minutes) || 0), 0);
      }
    } catch {}

    return Swal.fire({
      title: "Siap Memulai Tes Psikologi?",
      html: `
        <div style="text-align:left;font-size:13.5px;line-height:1.6;color:hsl(var(--foreground))">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
            <div style="background:hsl(var(--muted));border-radius:12px;padding:12px">
              <div style="font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.5px">Kode Tes</div>
              <div style="font-family:ui-monospace,monospace;font-weight:700;font-size:15px;margin-top:4px">${candidate.activationCode || activationCode.trim().toUpperCase()}</div>
            </div>
            <div style="background:hsl(var(--muted));border-radius:12px;padding:12px">
              <div style="font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.5px">Durasi</div>
              <div style="font-weight:700;font-size:15px;margin-top:4px">${totalMinutes > 0 ? `${totalMinutes} menit` : "Sesuai paket"}</div>
            </div>
          </div>
          <div style="background:hsl(var(--muted));border-radius:12px;padding:12px;margin-bottom:14px">
            <div style="font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.5px">Posisi</div>
            <div style="font-weight:600;margin-top:4px">${candidate.position || "Tes Psikologi"}</div>
          </div>
          <div style="background:rgba(234,179,8,.10);border:1px solid rgba(234,179,8,.35);border-radius:12px;padding:12px">
            <div style="font-weight:700;margin-bottom:6px;color:#f59e0b">⚠ Aturan Anti-Cheat</div>
            <ul style="padding-left:18px;margin:0;font-size:13px">
              <li>Dilarang membuka tab, jendela, atau aplikasi lain.</li>
              <li>Dilarang berpindah layar atau meminimalkan browser.</li>
              <li>Pelanggaran = <b>cheating</b>, tes otomatis keluar.</li>
              <li>Jika keluar otomatis, Anda dapat masuk kembali dengan <b>waktu berkurang</b>; jawaban tersimpan sebagai draft.</li>
              <li>Pastikan koneksi stabil dan webcam aktif.</li>
            </ul>
          </div>
        </div>
      `,
      width: 520,
      showCancelButton: true,
      confirmButtonText: "Lanjut & Masuk Tes",
      cancelButtonText: "Batal",
      reverseButtons: true,
      focusCancel: true,
      background: "hsl(var(--card))",
      color: "hsl(var(--foreground))",
      confirmButtonColor: "hsl(174, 72%, 46%)",
      cancelButtonColor: "hsl(var(--muted))",
      customClass: { popup: "rounded-2xl" },
    });
  };

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
      const { data, error } = await supabase.functions.invoke("test-login", {
        body: {
          code: activationCode.trim().toUpperCase(),
          password: password.trim(),
        },
      });

      if (error || !data || (data as any).error) {
        throw new Error((data as any)?.error || await getFunctionErrorMessage(error));
      }

      const { session, candidate } = data as {
        session: { access_token: string; refresh_token: string };
        candidate: {
          id: string | null;
          name: string;
          email: string;
          position: string;
          activationCodeId: string;
          assignedTests: string[];
        };
      };

      // Establish authenticated Supabase session so RLS scopes to this candidate
      const { error: sessErr } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      if (sessErr) throw new Error(sessErr.message);

      // Fetch any existing candidate detail
      const { data: existingCandidate } = await supabase
        .from("candidates")
        .select("id, photo_url, phone, birth_date, education, gender")
        .eq("email", candidate.email)
        .maybeSingle();

      sessionStorage.setItem("psytest_auth", "true");
      sessionStorage.setItem(
        "psytest_candidate",
        JSON.stringify({
          id: candidate.id || existingCandidate?.id || null,
          name: candidate.name,
          email: candidate.email,
          position: candidate.position,
          activationCodeId: candidate.activationCodeId,
          assignedTests: candidate.assignedTests || [],
          photo_url: existingCandidate?.photo_url || null,
          phone: existingCandidate?.phone || "",
          birth_date: existingCandidate?.birth_date || "",
          education: existingCandidate?.education || "",
          gender: existingCandidate?.gender || "",
        })
      );

      const warning = await showStartWarning({
        activationCode: activationCode.trim().toUpperCase(),
        position: candidate.position,
        assignedTests: candidate.assignedTests || [],
      });
      if (!warning.isConfirmed) {
        sessionStorage.removeItem("psytest_auth");
        sessionStorage.removeItem("psytest_candidate");
        try { await supabase.auth.signOut(); } catch {}
        return;
      }

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
