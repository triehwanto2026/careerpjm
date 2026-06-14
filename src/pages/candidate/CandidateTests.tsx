import { useEffect, useState } from "react";
import { Brain, Play, CheckCircle2, Clock, KeyRound, X, AlertCircle, ClipboardList } from "lucide-react";
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
    await startTestWithCode(code.code);
  };

  const closeStartModal = () => {
    setShowStartModal(false);
    setSelectedCode(null);
  };

  const startTestWithCode = async (code: string) => {
    setLoginLoading(true);
    try {
      const safeCode = (code ?? "").toString().trim();
      if (!safeCode) throw new Error("Kode tes tidak valid.");
      const { data, error } = await (supabase as any).rpc("candidate_start_activation_code", {
        _code: safeCode,
      });

      if (error || !data) {
        throw new Error(error?.message || "Kode tes tidak ditemukan untuk akun Anda.");
      }

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
  const activeCodes = codes.filter((c) => !(c.test_completed_at || c.status === "completed") && !(c.expires_at && new Date(c.expires_at) < new Date()));
  const completedCodes = codes.filter((c) => c.test_completed_at || c.status === "completed");

  return (
    <CandidateLayout>
      <div className="min-h-screen bg-muted/20">
        <div className="border-b border-border bg-card px-4 py-4">
          <div className="mx-auto max-w-[96rem]">
            <h1 className="text-xl font-bold tracking-tight">Tes Psikologi</h1>
            <p className="text-sm text-muted-foreground">Kelola paket tes, status pengerjaan, dan ringkasan hasil Anda.</p>
          </div>
        </div>

        <div className="w-full px-4 py-5">
          <div className="mx-auto max-w-[96rem] space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Siap Dikerjakan</p>
                <p className="mt-1 text-2xl font-bold">{activeCodes.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Selesai</p>
                <p className="mt-1 text-2xl font-bold">{completedCodes.length}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Hasil Tersimpan</p>
                <p className="mt-1 text-2xl font-bold">{results.length}</p>
              </div>
            </div>

        {codes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-2 opacity-40" />
            <p>Belum ada paket tes yang ditugaskan untuk akun Anda.</p>
            <p className="text-xs mt-2">Admin akan menugaskan paket tes setelah lamaran Anda diproses.</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {codes.map((c) => {
              const done = c.test_completed_at || c.status === "completed";
              const expired = c.expires_at && new Date(c.expires_at) < new Date();
              const canStart = !done && !expired;
              return (
                <div
                  key={c.id}
                  className={`rounded-xl border bg-card p-4 shadow-sm ${canStart ? 'cursor-pointer border-primary/25 hover:border-primary hover:bg-primary/5 transition-colors' : 'border-border'}`}
                      onClick={() => canStart && openStartModal(c)}
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Brain className="h-4 w-4" /></span>
                        <div>
                          <h3 className="line-clamp-1 text-sm font-semibold">{c.position || "Tes Psikologi"}</h3>
                          <p className="font-mono text-xs text-muted-foreground">{c.code}</p>
                        </div>
                      </div>
                    </div>
                    {done ? (
                      <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-[11px] font-semibold text-green-600">Selesai</span>
                    ) : expired ? (
                      <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-[11px] font-semibold text-red-600">Kedaluwarsa</span>
                    ) : (
                      <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-[11px] font-semibold text-blue-600">Siap</span>
                    )}
                  </div>
                  <div className="grid gap-2 rounded-lg border border-border/70 bg-muted/20 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" />Berlaku hingga</span>
                      <span className="font-medium">{fmtDate(c.expires_at)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-muted-foreground"><ClipboardList className="h-3.5 w-3.5" />Jumlah alat tes</span>
                      <span className="font-medium">{(c.assigned_tests || []).length || "Paket"}</span>
                    </div>
                    {done && (
                      <div className="flex items-center justify-between gap-2 text-green-600">
                        <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Disubmit</span>
                        <span className="font-medium">{fmtDate(c.test_completed_at)}</span>
                      </div>
                    )}
                    {expired && !done && (
                      <div className="flex items-start gap-2 rounded-md bg-red-500/10 p-2 text-red-600">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>Kode ini sudah melewati batas waktu pengerjaan.</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex justify-end">
                    {done ? (
                      <span className="rounded-md bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-600">Tes telah selesai</span>
                    ) : expired ? (
                      <button disabled className="rounded-md bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">Tidak tersedia</button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); openStartModal(c); }} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110">
                        <Play className="h-3.5 w-3.5" /> Masuk ke Tes
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {results.length > 0 && (
          <div id="test-results" className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Riwayat Hasil Tes</h2>
                <p className="text-xs text-muted-foreground">Ringkasan hasil yang sudah tersimpan.</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {results.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 bg-background p-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{r.test_name}</div>
                    <div className="text-xs text-muted-foreground">{fmtDate(r.completed_at)}</div>
                  </div>
                  <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600">Tersimpan</span>
                </div>
              ))}
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

    {false && showLoginModal && null}
    </CandidateLayout>
  );
}
