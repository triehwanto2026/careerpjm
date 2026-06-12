import { useEffect, useState } from "react";
import { Workflow, Mail, Briefcase, KeyRound } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";
import { syncExpiredRecruitment } from "@/lib/recruitmentExpiry";

interface AppRow {
  id: string;
  user_id: string;
  vacancy_id: string;
  status: string;
  applied_at: string;
  admin_notes: string;
  cover_letter: string;
  vacancy?: { title: string };
  profile?: { full_name: string; email: string; phone: string };
}

const STATUSES = ["submitted", "screening", "test", "interview", "offered", "accepted", "rejected", "expired", "withdrawn"];
const STATUS_LABEL: Record<string, string> = {
  submitted: "Lamaran Masuk", screening: "Screening", test: "Tes", interview: "Wawancara",
  offered: "Penawaran", accepted: "Diterima", rejected: "Ditolak", withdrawn: "Dibatalkan",
  expired: "Kedaluwarsa",
};
const STATUS_COLOR: Record<string, string> = {
  submitted: "bg-blue-500/15 text-blue-500", screening: "bg-cyan-500/15 text-cyan-500",
  test: "bg-violet-500/15 text-violet-500", interview: "bg-amber-500/15 text-amber-500",
  offered: "bg-green-500/15 text-green-500", accepted: "bg-green-500/15 text-green-500",
  rejected: "bg-red-500/15 text-red-500", withdrawn: "bg-gray-500/15 text-gray-500",
  expired: "bg-gray-500/15 text-gray-500",
};

export default function Recruitment() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [filter, setFilter] = useState<string>("all");

  const load = async () => {
    await syncExpiredRecruitment();
    const { data } = await supabase.from("job_applications").select("*").order("applied_at", { ascending: false });
    const list = (data as any) || [];
    const vIds = Array.from(new Set(list.map((a: any) => a.vacancy_id))) as string[];
    const uIds = Array.from(new Set(list.map((a: any) => a.user_id))) as string[];
    if (vIds.length) {
      const { data: vs } = await supabase.from("job_vacancies").select("id,title").in("id", vIds);
      const m = new Map((vs || []).map((v: any) => [v.id, v]));
      list.forEach((a: any) => { a.vacancy = m.get(a.vacancy_id); });
    }
    if (uIds.length) {
      const { data: ps } = await supabase.from("candidate_profiles").select("user_id,full_name,email,phone").in("user_id", uIds);
      const m = new Map((ps || []).map((p: any) => [p.user_id, p]));
      list.forEach((a: any) => { a.profile = m.get(a.user_id); });
    }
    setApps(list);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("job_applications").update({ status, status_updated_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  const addNote = async (a: AppRow) => {
    const { value } = await Swal.fire({ input: "textarea", title: "Catatan untuk Kandidat", inputValue: a.admin_notes || "", showCancelButton: true });
    if (value !== undefined && value !== null) {
      await supabase.from("job_applications").update({ admin_notes: value }).eq("id", a.id);
      load();
    }
  };

  const assignTest = async (a: AppRow) => {
    if (!a.profile?.email) { Swal.fire({ icon: "warning", title: "Email kandidat tidak ditemukan" }); return; }
    const { value: pw } = await Swal.fire({ input: "text", title: "Buat password tes", inputValue: Math.random().toString(36).slice(2, 10), showCancelButton: true });
    if (!pw) return;
    const code = "TEST-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data, error } = await supabase.from("activation_codes").insert({
      code, password: pw, candidate_email: a.profile.email, candidate_name: a.profile.full_name || a.profile.email,
      position: a.vacancy?.title || "", status: "active", is_used: false,
    }).select().single();
    if (error) { Swal.fire({ icon: "error", title: "Gagal", text: error.message }); return; }
    await supabase.from("job_applications").update({ status: "test", activation_code_id: (data as any).id, status_updated_at: new Date().toISOString() }).eq("id", a.id);
    Swal.fire({ icon: "success", title: "Paket tes ditugaskan", html: `Kode: <b>${code}</b><br/>Password: <b>${pw}</b>` });
    load();
  };

  const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Workflow className="h-6 w-6 text-primary" />Proses Rekrutmen</h1>
          <p className="text-sm text-muted-foreground">Kelola alur lamaran dari masuk sampai diterima.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Semua ({apps.length})</button>
          {STATUSES.map((s) => {
            const n = apps.filter((a) => a.status === s).length;
            return (
              <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {STATUS_LABEL[s]} ({n})
              </button>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Kandidat</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Lowongan</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Tanggal</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{a.profile?.full_name || "—"}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{a.profile?.email}</div>
                  </td>
                  <td className="px-4 py-3 flex items-center gap-1"><Briefcase className="h-3.5 w-3.5 text-primary" />{a.vacancy?.title || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(a.applied_at)}</td>
                  <td className="px-4 py-3">
                    <select value={a.status} onChange={(e) => updateStatus(a.id, e.target.value)} className={`px-2 py-1 rounded text-xs font-semibold border-0 ${STATUS_COLOR[a.status]}`}>
                      {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => addNote(a)} className="px-2 py-1 rounded bg-muted text-xs font-medium mr-1 hover:bg-muted/70">Catatan</button>
                    <button onClick={() => assignTest(a)} className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-medium hover:brightness-110 inline-flex items-center gap-1"><KeyRound className="h-3 w-3" />Beri Tes</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Tidak ada lamaran.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
