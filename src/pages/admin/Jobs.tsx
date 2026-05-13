import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Briefcase, X, Save } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

interface Vacancy {
  id?: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  requirements: string;
  min_salary: number | null;
  max_salary: number | null;
  status: string;
  closes_at: string | null;
}

const blank: Vacancy = {
  title: "", department: "", location: "", employment_type: "Full-time",
  description: "", requirements: "",
  min_salary: null, max_salary: null, status: "active", closes_at: null,
};

export default function Jobs() {
  const [list, setList] = useState<Vacancy[]>([]);
  const [edit, setEdit] = useState<Vacancy | null>(null);
  const [appsCount, setAppsCount] = useState<Record<string, number>>({});

  const load = async () => {
    const { data } = await supabase.from("job_vacancies").select("*").order("created_at", { ascending: false });
    setList((data as any) || []);
    const { data: apps } = await supabase.from("job_applications").select("vacancy_id");
    const counts: Record<string, number> = {};
    (apps || []).forEach((a: any) => { counts[a.vacancy_id] = (counts[a.vacancy_id] || 0) + 1; });
    setAppsCount(counts);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!edit) return;
    if (!edit.title) { Swal.fire({ icon: "warning", title: "Judul wajib diisi" }); return; }
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      Swal.fire({ icon: "error", title: "Sesi habis", text: "Silakan login kembali" });
      return;
    }
    
    const payload: any = { ...edit };
    if (edit.id) {
      const { error } = await supabase.from("job_vacancies").update(payload).eq("id", edit.id);
      if (error) {
        Swal.fire({ icon: "error", title: "Gagal menyimpan", text: error.message });
        return;
      }
    } else {
      delete payload.id;
      const { error } = await supabase.from("job_vacancies").insert(payload);
      if (error) {
        Swal.fire({ icon: "error", title: "Gagal menambahkan", text: error.message });
        return;
      }
    }
    setEdit(null);
    load();
    Swal.fire({ icon: "success", title: "Tersimpan", timer: 1200, showConfirmButton: false });
  };

  const del = async (id: string) => {
    const { isConfirmed } = await Swal.fire({ icon: "warning", title: "Hapus lowongan?", showCancelButton: true });
    if (!isConfirmed) return;
    await supabase.from("job_vacancies").delete().eq("id", id);
    load();
  };

  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  const lbl = "text-xs font-medium text-muted-foreground mb-1 block";

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Lowongan Pekerjaan</h1>
            <p className="text-sm text-muted-foreground">Kelola lowongan yang tampil di portal kandidat.</p>
          </div>
          <button onClick={() => setEdit({ ...blank })} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:brightness-110">
            <Plus className="h-4 w-4" /> Lowongan Baru
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Judul</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Departemen</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Lokasi</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Pelamar</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {list.map((v) => (
                <tr key={v.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" />{v.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.department || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.location || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      v.status === "active" ? "bg-green-500/15 text-green-500" :
                      v.status === "closed" ? "bg-red-500/15 text-red-500" : "bg-gray-500/15 text-gray-500"
                    }`}>{v.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">{appsCount[v.id!] || 0}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEdit({ ...v })} className="p-1.5 hover:bg-primary/10 text-primary rounded mr-1"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => del(v.id!)} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada lowongan.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {edit && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEdit(null)}>
            <div className="bg-card border border-border rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{edit.id ? "Edit" : "Buat"} Lowongan</h2>
                <button onClick={() => setEdit(null)}><X className="h-5 w-5" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2"><label className={lbl}>Judul Posisi *</label><input className={inp} value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
                <div><label className={lbl}>Departemen</label><input className={inp} value={edit.department} onChange={(e) => setEdit({ ...edit, department: e.target.value })} /></div>
                <div><label className={lbl}>Lokasi</label><input className={inp} value={edit.location} onChange={(e) => setEdit({ ...edit, location: e.target.value })} /></div>
                <div>
                  <label className={lbl}>Tipe</label>
                  <select className={inp} value={edit.employment_type} onChange={(e) => setEdit({ ...edit, employment_type: e.target.value })}>
                    <option value="Full-time">Full Time</option><option value="Part-time">Part Time</option><option value="Contract">Kontrak</option><option value="Internship">Magang</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Status</label>
                  <select className={inp} value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                    <option value="draft">Draft</option><option value="active">Active</option><option value="closed">Closed</option>
                  </select>
                </div>
                <div><label className={lbl}>Gaji Min (Rp)</label><input type="number" className={inp} value={edit.min_salary || ""} onChange={(e) => setEdit({ ...edit, min_salary: parseInt(e.target.value) || null })} /></div>
                <div><label className={lbl}>Gaji Max (Rp)</label><input type="number" className={inp} value={edit.max_salary || ""} onChange={(e) => setEdit({ ...edit, max_salary: parseInt(e.target.value) || null })} /></div>
                <div className="md:col-span-2"><label className={lbl}>Deskripsi</label><textarea rows={3} className={inp} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
                <div className="md:col-span-2"><label className={lbl}>Kualifikasi</label><textarea rows={3} className={inp} value={edit.requirements} onChange={(e) => setEdit({ ...edit, requirements: e.target.value })} /></div>
                <div><label className={lbl}>Tanggal Tutup</label><input type="datetime-local" className={inp} value={edit.closes_at?.slice(0, 16) || ""} onChange={(e) => setEdit({ ...edit, closes_at: e.target.value || null })} /></div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setEdit(null)} className="px-4 py-2 rounded-lg border border-border text-sm font-semibold">Batal</button>
                <button onClick={save} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110"><Save className="h-4 w-4" /> Simpan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
