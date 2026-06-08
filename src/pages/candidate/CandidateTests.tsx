import { useEffect, useState } from "react";
import { Brain, Play, CheckCircle2, Clock, KeyRound, X } from "lucide-react";
import Swal from "sweetalert2";
import CandidateLayout from "@/components/candidate/CandidateLayout";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Code {
  id: string;
  code: string;
  candidate_email: string;
  position: string;
  is_used: boolean;
  status: string;
  expires_at: string | null;
  test_completed_at: string | null;
  password: string;
  assigned_tests: string[] | null;
  created_at?: string;
}

export default function CandidateTests() {
  const navigate = useNavigate();
  const [codes, setCodes] = useState<Code[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedCode, setSelectedCode] = useState<Code | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginCode, setLoginCode] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const sortCodes = (codes: Code[]) => {
    if (!codes.length) return [];
    const now = new Date();
    const score = (c: Code) => {
      const expires = c.expires_at ? new Date(c.expires_at) : null;
      const expired = expires ? expires < now : false;
      const done = c.status === "completed" || !!c.test_completed_at;
      if (!done && !expired && c.status !== "invalid") return 0;
      if (done) return 1;
      return 2;
    };
    return [...codes].sort((a, b) => {
      const s = score(a) - score(b);
      if (s !== 0) return s;
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });
  };

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user.email) return;
    const { data: c } = await (supabase as any).from("my_activation_codes").select("*").eq("candidate_email", session.user.email).order("created_at", { ascending: false });
    setCodes(sortCodes((c as any) || []));
    
    // Get candidate profile to get candidate_id
    const { data: profile } = await supabase.from("candidate_profiles").select("*").eq("email", session.user.email).maybeSingle();
    const candidateId = profile?.id;
    
    // Filter test results by candidate_id if available
    let query = supabase.from("test_results").select("*").order("completed_at", { ascending: false });
    if (candidateId) {
      query = query.eq("candidate_id", candidateId);
    }
    const { data: r } = await query;
    setResults((r as any) || []);
  };

  useEffect(() => { load(); }, []);

  const openStartModal = async (code: Code) => {
    // Hitung total durasi tes (menit) dari instrumen yang ditugaskan
    let totalMinutes = 0;
    try {
      const ids = (code.assigned_tests || []).filter(Boolean);
      if (ids.length > 0) {
        const { data: instr } = await supabase
          .from("test_instruments")
          .select("duration_minutes")
          .in("id", ids as string[]);
        totalMinutes = (instr || []).reduce((s: number, r: any) => s + (Number(r.duration_minutes) || 0), 0);
      }
    } catch { /* ignore */ }


    const expiresText = code.expires_at
      ? new Date(code.expires_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
      : "—";

    const res = await Swal.fire({
      title: "Siap Memulai Tes Psikologi?",
      html: `
        <div style="text-align:left;font-size:13.5px;line-height:1.6;color:hsl(var(--foreground))">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
            <div style="background:hsl(var(--muted));border-radius:12px;padding:12px">
              <div style="font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.5px">Kode Tes</div>
              <div style="font-family:ui-monospace,monospace;font-weight:700;font-size:15px;margin-top:4px">${code.code}</div>
            </div>
            <div style="background:hsl(var(--muted));border-radius:12px;padding:12px">
              <div style="font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.5px">Durasi</div>
              <div style="font-weight:700;font-size:15px;margin-top:4px">${totalMinutes > 0 ? `${totalMinutes} menit` : "Sesuai paket"}</div>
            </div>
          </div>
          <div style="background:hsl(var(--muted));border-radius:12px;padding:12px;margin-bottom:14px">
            <div style="font-size:11px;opacity:.7;text-transform:uppercase;letter-spacing:.5px">Posisi</div>
            <div style="font-weight:600;margin-top:4px">${code.position || "Tes Psikologi"}</div>
            <div style="font-size:12px;opacity:.7;margin-top:6px">Berlaku hingga ${expiresText}</div>
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

    if (!res.isConfirmed) return;
    openLoginModal(code.code, "");
  };

  const closeStartModal = () => {
    setShowStartModal(false);
    setSelectedCode(null);
  };

  const openLoginModal = (code = "", password = "") => {
    setLoginCode(code);
    setLoginPassword(password);
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginCode("");
    setLoginPassword("");
  };

  const loginWithActivationCode = async (code: string, password: string) => {
    setLoginLoading(true);
    try {
      const safeCode = (code ?? "").toString().trim();
      const safePassword = (password ?? "").toString().trim();
      if (!safeCode || !safePassword) throw new Error("Kode dan password wajib diisi.");
      const { data, error } = await (supabase as any).rpc("candidate_verify_activation_login", {
        _code: safeCode,
        _password: safePassword,
      });

      if (error || !data) {
        throw new Error("Kode tes atau password salah.");
      }


      const now = new Date();
      const isExpired = data.expires_at && new Date(data.expires_at) < now;
      const status = (data as any).status || "active";

      if (isExpired) throw new Error("Kode tes telah kadaluarsa.");
      if (status === "completed") throw new Error("Tes sudah selesai.");
      if (status === "invalid") throw new Error("Kode tidak valid.");

      const { data: existing } = await supabase
        .from("candidates")
        .select("id, photo_url, phone, birth_date, education, gender")
        .eq("email", data.candidate_email)
        .maybeSingle();

      let candidateId = existing?.id;
      if (!candidateId) {
        const { data: newCand, error: createError } = await supabase
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
        if (createError || !newCand) {
          throw createError || new Error("Gagal membuat kandidat.");
        }
        candidateId = newCand.id;
      }

      sessionStorage.setItem("psytest_auth", "true");
      sessionStorage.setItem("psytest_origin", "candidate");
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
        title: "Login Tes Berhasil",
        text: data.candidate_name,
        timer: 1400,
        showConfirmButton: false,
        background: "hsl(var(--card))",
        color: "hsl(var(--foreground))",
      });

      closeLoginModal();
      closeStartModal();
      navigate("/test");
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal masuk tes",
        text: error?.message || "Silakan periksa kembali kode dan password.",
        background: "hsl(var(--card))",
        color: "hsl(var(--foreground))",
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const fmtDate = (s: string | null) => s ? new Date(s).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <CandidateLayout>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold">Tes Psikologi</h1>
            <p className="text-sm text-muted-foreground">Daftar paket tes yang ditugaskan untuk Anda.</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 w-full px-4 py-6">
          <div className="max-w-6xl mx-auto space-y-4">

        {codes.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-2 opacity-40" />
            <p>Belum ada paket tes yang ditugaskan untuk akun Anda.</p>
            <p className="text-xs mt-2">Admin akan menugaskan paket tes setelah lamaran Anda diproses.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map((c) => {
              const done = c.test_completed_at || c.status === "completed";
              const expired = c.expires_at && new Date(c.expires_at) < new Date();
              const canStart = !done && !expired;
              return (
                <div
                  key={c.id}
                  className={`bg-card border border-border rounded-2xl p-5 ${canStart ? 'cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors' : ''}`}
                      onClick={() => canStart && openStartModal(c)}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <KeyRound className="h-4 w-4 text-primary" />
                        <span className="font-mono text-sm font-bold">{c.code}</span>
                        {done && <span className="px-2 py-0.5 rounded-full bg-green-500/15 text-green-500 text-[10px] font-semibold">SELESAI</span>}
                        {!done && expired && <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 text-[10px] font-semibold">KEDALUWARSA</span>}
                        {!done && !expired && <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 text-[10px] font-semibold">SIAP DIKERJAKAN</span>}
                      </div>
                      <div className="text-sm font-semibold">{c.position || "Tes Psikologi"}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Password: <span className="font-semibold text-foreground">{c.password}</span>
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-3 mt-2">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Berlaku hingga: {fmtDate(c.expires_at)}</span>
                        {done && <span className="flex items-center gap-1 text-green-500"><CheckCircle2 className="h-3 w-3" />Selesai: {fmtDate(c.test_completed_at)}</span>}
                      </div>
                    </div>
                        {done ? (
                          <div className="flex items-center gap-2">
                            <button
                              disabled
                              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-muted text-muted-foreground text-sm font-semibold cursor-not-allowed"
                            >
                              Selesai
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); const el = document.getElementById('test-results'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
                              className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted"
                            >
                              Lihat Hasil
                            </button>
                          </div>
                        ) : expired ? (
                          <button
                            disabled
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-100 text-red-600 text-sm font-semibold cursor-not-allowed"
                          >
                            Kedaluwarsa
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); openStartModal(c); }}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110"
                          >
                            <Play className="h-4 w-4" /> Masuk ke Tes
                          </button>
                        )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {results.length > 0 && (
          <div id="test-results" className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold mb-3">Riwayat Hasil Tes Saya</h2>
            <p className="text-xs text-muted-foreground mb-3">Hasil detail dapat dilihat oleh admin/HR. Anda hanya melihat ringkasan.</p>
            <div className="space-y-2">
              {results.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border text-sm">
                  <div>
                    <div className="font-semibold">{r.test_name}</div>
                    <div className="text-xs text-muted-foreground">{fmtDate(r.completed_at)}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">Telah dinilai</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>

    {showLoginModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-card border border-border rounded-2xl w-full max-w-lg overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <h2 className="text-lg font-semibold">Login Kode Tes</h2>
              <p className="text-sm text-muted-foreground">Masukkan kode dan password tes yang tampil di halaman ini.</p>
            </div>
            <button onClick={closeLoginModal} className="p-2 rounded hover:bg-muted transition">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid gap-4">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">Kode Tes</span>
                <input
                  type="text"
                  value={loginCode}
                  onChange={(e) => setLoginCode(e.target.value)}
                  placeholder="Masukkan kode tes"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">Password</span>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan password tes"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 px-5 py-4 border-t border-border">
            <button onClick={closeLoginModal} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition">Batal</button>
            <button
              onClick={() => loginWithActivationCode(loginCode, loginPassword)}
              disabled={loginLoading || !loginCode || !loginPassword}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginLoading ? 'Memproses...' : 'Masuk Tes'}
            </button>
          </div>
        </div>
      </div>
    )}
    </CandidateLayout>
  );
}
