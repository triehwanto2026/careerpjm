import { useEffect, useState } from "react";
import { Save, Upload, FileText, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import CandidateLayout from "@/components/candidate/CandidateLayout";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

interface Profile {
  id?: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  birth_place: string;
  birth_date: string | null;
  gender: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  marital_status: string;
  religion: string;
  nationality: string;
  education_level: string;
  education_major: string;
  education_institution: string;
  education_year: number | null;
  gpa: number | null;
  experience_years: number;
  current_position: string;
  current_company: string;
  expected_salary: number | null;
  skills: string;
  bio: string;
  photo_url: string | null;
  linkedin_url: string | null;
  is_complete: boolean;
}

interface Doc {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
}

const DOC_TYPES = [
  { key: "cv", label: "CV / Resume", required: true, accept: ".pdf,.doc,.docx" },
  { key: "ktp", label: "KTP", required: true, accept: "image/*,.pdf" },
  { key: "photo", label: "Foto Formal", required: true, accept: "image/*" },
  { key: "ijazah", label: "Ijazah", required: true, accept: "image/*,.pdf" },
  { key: "transkrip", label: "Transkrip Nilai", required: true, accept: "image/*,.pdf" },
];

const blank: Profile = {
  full_name: "", email: "", phone: "", birth_place: "", birth_date: null, gender: "",
  address: "", city: "", province: "", postal_code: "", marital_status: "", religion: "",
  nationality: "Indonesia", education_level: "", education_major: "", education_institution: "",
  education_year: null, gpa: null, experience_years: 0, current_position: "", current_company: "",
  expected_salary: null, skills: "", bio: "", photo_url: null, linkedin_url: null, is_complete: false,
};

export default function CandidateProfile() {
  const [profile, setProfile] = useState<Profile>(blank);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);
    const { data: p } = await supabase.from("candidate_profiles").select("*").eq("user_id", session.user.id).maybeSingle();
    if (p) setProfile({ ...blank, ...(p as any) });
    else setProfile({ ...blank, email: session.user.email || "" });
    const { data: d } = await supabase.from("candidate_documents").select("*").eq("user_id", session.user.id);
    setDocs((d as any) || []);
  };

  useEffect(() => { load(); }, []);

  const upd = (k: keyof Profile, v: any) => setProfile((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    const requiredFields: (keyof Profile)[] = ["full_name", "phone", "birth_date", "gender", "address", "education_level"];
    const isComplete = requiredFields.every((f) => !!profile[f]) && docs.length >= 5;
    const payload = { ...profile, user_id: userId, is_complete: isComplete };
    delete (payload as any).id;
    const { error } = await supabase.from("candidate_profiles").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      Swal.fire({ icon: "error", title: "Gagal menyimpan", text: error.message });
      return;
    }
    Swal.fire({ icon: "success", title: "Profil tersimpan", timer: 1500, showConfirmButton: false });
    load();
  };

  const uploadDoc = async (type: string, file: File) => {
    const ext = file.name.split(".").pop();
    const path = `${userId}/${type}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("candidate-documents").upload(path, file, { upsert: true });
    if (upErr) {
      Swal.fire({ icon: "error", title: "Upload gagal", text: upErr.message });
      return;
    }
    const { data: pub } = supabase.storage.from("candidate-documents").getPublicUrl(path);
    // Remove old doc of same type
    const old = docs.find((d) => d.document_type === type);
    if (old) await supabase.from("candidate_documents").delete().eq("id", old.id);
    await supabase.from("candidate_documents").insert({
      user_id: userId, document_type: type, file_name: file.name, file_url: pub.publicUrl,
      file_size: file.size, mime_type: file.type,
    });
    load();
  };

  const deleteDoc = async (id: string) => {
    const { isConfirmed } = await Swal.fire({ icon: "warning", title: "Hapus dokumen?", showCancelButton: true });
    if (!isConfirmed) return;
    await supabase.from("candidate_documents").delete().eq("id", id);
    load();
  };

  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  const lbl = "text-xs font-medium text-muted-foreground mb-1 block";

  return (
    <CandidateLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Profil Kandidat</h1>
            <p className="text-sm text-muted-foreground">Lengkapi biodata & lampiran untuk dapat melamar lowongan.</p>
          </div>
          <div className={`flex items-center gap-2 text-sm font-semibold ${profile.is_complete ? "text-green-500" : "text-amber-500"}`}>
            {profile.is_complete ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {profile.is_complete ? "Profil Lengkap" : "Profil Belum Lengkap"}
          </div>
        </div>

        {/* Biodata */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Data Pribadi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={lbl}>Nama Lengkap *</label><input className={inp} value={profile.full_name} onChange={(e) => upd("full_name", e.target.value)} /></div>
            <div><label className={lbl}>Email</label><input className={inp} value={profile.email} disabled /></div>
            <div><label className={lbl}>Telepon *</label><input className={inp} value={profile.phone} onChange={(e) => upd("phone", e.target.value)} /></div>
            <div><label className={lbl}>Tempat Lahir</label><input className={inp} value={profile.birth_place} onChange={(e) => upd("birth_place", e.target.value)} /></div>
            <div><label className={lbl}>Tanggal Lahir *</label><input type="date" className={inp} value={profile.birth_date || ""} onChange={(e) => upd("birth_date", e.target.value)} /></div>
            <div>
              <label className={lbl}>Jenis Kelamin *</label>
              <select className={inp} value={profile.gender} onChange={(e) => upd("gender", e.target.value)}>
                <option value="">Pilih...</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Status Pernikahan</label>
              <select className={inp} value={profile.marital_status} onChange={(e) => upd("marital_status", e.target.value)}>
                <option value="">Pilih...</option><option value="Belum Menikah">Belum Menikah</option><option value="Menikah">Menikah</option><option value="Cerai">Cerai</option>
              </select>
            </div>
            <div><label className={lbl}>Agama</label><input className={inp} value={profile.religion} onChange={(e) => upd("religion", e.target.value)} /></div>
            <div className="md:col-span-2"><label className={lbl}>Alamat *</label><textarea className={inp} rows={2} value={profile.address} onChange={(e) => upd("address", e.target.value)} /></div>
            <div><label className={lbl}>Kota</label><input className={inp} value={profile.city} onChange={(e) => upd("city", e.target.value)} /></div>
            <div><label className={lbl}>Provinsi</label><input className={inp} value={profile.province} onChange={(e) => upd("province", e.target.value)} /></div>
          </div>
        </section>

        {/* Pendidikan */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Pendidikan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Jenjang Pendidikan Terakhir *</label>
              <select className={inp} value={profile.education_level} onChange={(e) => upd("education_level", e.target.value)}>
                <option value="">Pilih...</option><option>SMA/SMK</option><option>D3</option><option>S1</option><option>S2</option><option>S3</option>
              </select>
            </div>
            <div><label className={lbl}>Jurusan</label><input className={inp} value={profile.education_major} onChange={(e) => upd("education_major", e.target.value)} /></div>
            <div><label className={lbl}>Institusi</label><input className={inp} value={profile.education_institution} onChange={(e) => upd("education_institution", e.target.value)} /></div>
            <div><label className={lbl}>Tahun Lulus</label><input type="number" className={inp} value={profile.education_year || ""} onChange={(e) => upd("education_year", parseInt(e.target.value) || null)} /></div>
            <div><label className={lbl}>IPK</label><input type="number" step="0.01" className={inp} value={profile.gpa || ""} onChange={(e) => upd("gpa", parseFloat(e.target.value) || null)} /></div>
          </div>
        </section>

        {/* Pengalaman */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Pengalaman & Profesional</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className={lbl}>Tahun Pengalaman</label><input type="number" className={inp} value={profile.experience_years} onChange={(e) => upd("experience_years", parseInt(e.target.value) || 0)} /></div>
            <div><label className={lbl}>Posisi Saat Ini</label><input className={inp} value={profile.current_position} onChange={(e) => upd("current_position", e.target.value)} /></div>
            <div><label className={lbl}>Perusahaan Saat Ini</label><input className={inp} value={profile.current_company} onChange={(e) => upd("current_company", e.target.value)} /></div>
            <div><label className={lbl}>Ekspektasi Gaji (Rp)</label><input type="number" className={inp} value={profile.expected_salary || ""} onChange={(e) => upd("expected_salary", parseInt(e.target.value) || null)} /></div>
            <div className="md:col-span-2"><label className={lbl}>Keahlian (pisahkan dengan koma)</label><input className={inp} value={profile.skills} onChange={(e) => upd("skills", e.target.value)} placeholder="Excel, Public Speaking, Photoshop, ..." /></div>
            <div className="md:col-span-2"><label className={lbl}>Tentang Saya</label><textarea className={inp} rows={3} value={profile.bio} onChange={(e) => upd("bio", e.target.value)} /></div>
            <div className="md:col-span-2"><label className={lbl}>LinkedIn URL</label><input className={inp} value={profile.linkedin_url || ""} onChange={(e) => upd("linkedin_url", e.target.value)} /></div>
          </div>
        </section>

        {/* Dokumen */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Dokumen Pendukung</h2>
          <div className="space-y-3">
            {DOC_TYPES.map((t) => {
              const existing = docs.find((d) => d.document_type === t.key);
              return (
                <div key={t.key} className="flex items-center gap-3 p-3 border border-border rounded-lg bg-background">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{t.label} {t.required && <span className="text-red-500">*</span>}</div>
                    {existing ? (
                      <a href={existing.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline truncate block">{existing.file_name}</a>
                    ) : (
                      <div className="text-xs text-muted-foreground">Belum diupload</div>
                    )}
                  </div>
                  <label className="cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110">
                    <Upload className="h-3.5 w-3.5" /> {existing ? "Ganti" : "Upload"}
                    <input type="file" accept={t.accept} className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(t.key, e.target.files[0])} />
                  </label>
                  {existing && (
                    <button onClick={() => deleteDoc(existing.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex justify-end">
          <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:brightness-110 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Profil"}
          </button>
        </div>
      </div>
    </CandidateLayout>
  );
}
