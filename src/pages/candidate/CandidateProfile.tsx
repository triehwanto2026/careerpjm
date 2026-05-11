import { useEffect, useState } from "react";
import { 
  Save, Upload, FileText, Trash2, CheckCircle2, AlertCircle, 
  Plus, X, Building2, GraduationCap, Award, Languages, 
  Heart, Users, Briefcase, Car, Calendar, Phone, MapPin,
  User, FileCheck, Info, DollarSign, ClipboardList, Star
} from "lucide-react";
import CandidateLayout from "@/components/candidate/CandidateLayout";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

// Tab configuration
const tabs = [
  { value: "personal", label: "Data Diri", icon: User },
  { value: "family", label: "Keluarga", icon: Users },
  { value: "education", label: "Pendidikan", icon: GraduationCap },
  { value: "skills", label: "Keahlian & Kepribadian", icon: Award },
  { value: "experience", label: "Pengalaman Kerja", icon: Briefcase },
  { value: "salary", label: "Ekspektasi Gaji", icon: DollarSign },
  { value: "documents", label: "Dokumen", icon: FileText },
  { value: "additional", label: "Info Tambahan", icon: ClipboardList },
];

interface Profile {
  id?: string;
  user_id?: string;
  // Personal Data
  full_name: string;
  email: string;
  nik: string;
  npwp: string;
  phone: string;
  birth_place: string;
  birth_date: string | null;
  gender: string;
  blood_type: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  marital_status: string;
  religion: string;
  nationality: string;
  nickname: string;
  ethnicity: string;
  // Physical Data
  height_cm: number | null;
  weight_kg: number | null;
  shirt_size: string;
  pants_size: string;
  shoe_size: string;
  // Family Data
  father_name: string;
  mother_name: string;
  spouse_name: string;
  number_of_children: number;
  // Emergency Contact
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
  // Other
  hobbies: string;
  vehicle_license: string;
  has_vehicle: boolean;
  vehicle_type: string;
  vehicle_brand: string;
  home_ownership: string;
  home_phone: string;
  // Personality
  strengths: string;
  weaknesses: string;
  social_activities: string;
  // Salary
  salary_expectation: string;
  salary_exp_base: string;
  salary_exp_allowances: string;
  salary_exp_benefits: string;
  medical_history: string;
  source_info: string;
  willing_relocate: boolean;
  willing_overtime: boolean;
  willing_shift: boolean;
  // Education Summary
  education_level: string;
  education_major: string;
  education_institution: string;
  education_year: number | null;
  gpa: number | null;
  // Professional Summary
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
  full_name: "", email: "", nik: "", npwp: "", phone: "", birth_place: "", birth_date: null,
  gender: "", blood_type: "", address: "", city: "", province: "", postal_code: "",
  marital_status: "", religion: "", nationality: "Indonesia", nickname: "", ethnicity: "", height_cm: null, weight_kg: null,
  shirt_size: "", pants_size: "", shoe_size: "", father_name: "", mother_name: "",
  spouse_name: "", number_of_children: 0, emergency_contact_name: "", emergency_contact_relation: "",
  emergency_contact_phone: "", hobbies: "", vehicle_license: "", has_vehicle: false,
  vehicle_type: "", vehicle_brand: "", home_ownership: "", home_phone: "", strengths: "", weaknesses: "", social_activities: "",
  salary_expectation: "", salary_exp_base: "", salary_exp_allowances: "", salary_exp_benefits: "", medical_history: "",
  source_info: "", willing_relocate: false, willing_overtime: false, willing_shift: false,
  education_level: "", education_major: "", education_institution: "", education_year: null,
  gpa: null, experience_years: 0, current_position: "", current_company: "", expected_salary: null,
  skills: "", bio: "", photo_url: null, linkedin_url: null, is_complete: false,
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
    const payload: any = { ...profile, user_id: userId, is_complete: isComplete };
    delete payload.id;
    // Remove new fields temporarily until migration is run
    const { nik, npwp, blood_type, height_cm, weight_kg, shirt_size, pants_size, shoe_size,
            father_name, mother_name, spouse_name, number_of_children, emergency_contact_name,
            emergency_contact_relation, emergency_contact_phone, hobbies, vehicle_license, has_vehicle,
            medical_history, source_info, willing_relocate, willing_overtime, willing_shift, ...safePayload } = payload;
    const { error } = await supabase.from("candidate_profiles").upsert(safePayload, { onConflict: "user_id" });
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
  const [activeTab, setActiveTab] = useState("personal");
  const [progress, setProgress] = useState(0);

  // Calculate profile completion percentage
  const calculateProgress = () => {
    let score = 0;
    const maxScore = 8;
    
    // Personal data
    if (profile.full_name && profile.nik && profile.phone && profile.address && profile.birth_date) score++;
    // Family
    if (profile.father_name || profile.mother_name || profile.emergency_contact_name) score++;
    // Education
    if (profile.education_level && profile.education_institution) score++;
    // Experience
    if (profile.experience_years > 0 || profile.current_position) score++;
    // Skills & personality
    if (profile.skills || profile.strengths || profile.weaknesses) score++;
    // Salary
    if (profile.salary_expectation || profile.expected_salary) score++;
    // Documents - check minimum required
    const requiredDocs = ['ktp', 'photo', 'ijazah', 'cv'];
    const hasRequiredDocs = requiredDocs.every(type => docs.some(d => d.document_type === type));
    if (hasRequiredDocs) score++;
    // Additional info
    if (profile.hobbies || profile.vehicle_license || profile.linkedin_url) score++;
    
    const pct = Math.round((score / maxScore) * 100);
    setProgress(pct);
  };

  useEffect(() => { calculateProgress(); }, [profile, docs]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setTimeout(calculateProgress, 100);
  };

  const handleSubmit = async () => {
    if (progress < 50) {
      Swal.fire({ 
        icon: "warning", 
        title: "Profil Belum Lengkap", 
        text: `Kelengkapan profil Anda ${progress}%. Minimal 50% untuk melamar pekerjaan.`,
        confirmButtonColor: "hsl(174, 72%, 46%)"
      });
      return;
    }
    await save();
    Swal.fire({ 
      icon: "success", 
      title: "Formulir Terkirim", 
      text: "Formulir kandidat berhasil disubmit. Tim HR akan meninjau data Anda.",
      confirmButtonColor: "hsl(174, 72%, 46%)"
    });
  };

  return (
    <CandidateLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Formulir Kandidat</h1>
            <p className="text-sm text-muted-foreground">Lengkapi seluruh data untuk meningkatkan peluang Anda</p>
          </div>
          <button onClick={calculateProgress} className="text-sm text-primary hover:underline">Refresh Progress</button>
        </div>

        {/* Progress Bar */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Kelengkapan Profil</span>
            <span className={`text-sm font-bold ${progress >= 50 ? "text-green-500" : "text-amber-500"}`}>{progress}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${progress >= 50 ? "bg-green-500" : "bg-amber-500"}`} style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {progress < 50 ? "⚠️ Minimal 50% untuk bisa melamar pekerjaan" : "✅ Profil sudah memenuhi syarat minimal"}
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex flex-wrap gap-1 bg-muted/50 p-1.5 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB: Personal Data */}
        {activeTab === "personal" && (
          <div className="space-y-4">
            {/* Data Pribadi */}
            <section className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><User className="h-5 w-5 text-primary"/> Data Pribadi</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label className={lbl}>NIK *</label><input className={inp} value={profile.nik} onChange={(e) => upd("nik", e.target.value)} placeholder="16 digit" maxLength={16} /></div>
                <div><label className={lbl}>NPWP</label><input className={inp} value={profile.npwp} onChange={(e) => upd("npwp", e.target.value)} placeholder="15 digit" /></div>
                <div><label className={lbl}>No. Telepon *</label><input className={inp} value={profile.phone} onChange={(e) => upd("phone", e.target.value)} /></div>
                <div className="md:col-span-2"><label className={lbl}>Nama Lengkap *</label><input className={inp} value={profile.full_name} onChange={(e) => upd("full_name", e.target.value)} /></div>
                <div><label className={lbl}>Nama Panggilan</label><input className={inp} value={profile.nickname} onChange={(e) => upd("nickname", e.target.value)} /></div>
                <div><label className={lbl}>Tempat Lahir</label><input className={inp} value={profile.birth_place} onChange={(e) => upd("birth_place", e.target.value)} /></div>
                <div><label className={lbl}>Tanggal Lahir *</label><input type="date" className={inp} value={profile.birth_date || ""} onChange={(e) => upd("birth_date", e.target.value)} /></div>
                <div>
                  <label className={lbl}>Gol. Darah</label>
                  <select className={inp} value={profile.blood_type} onChange={(e) => upd("blood_type", e.target.value)}>
                    <option value="">Pilih...</option><option>A</option><option>B</option><option>AB</option><option>O</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Jenis Kelamin *</label>
                  <select className={inp} value={profile.gender} onChange={(e) => upd("gender", e.target.value)}>
                    <option value="">Pilih...</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Status Pernikahan</label>
                  <select className={inp} value={profile.marital_status} onChange={(e) => upd("marital_status", e.target.value)}>
                    <option value="">Pilih...</option><option value="Belum Menikah">Belum Menikah</option><option value="Menikah">Menikah</option><option value="Cerai">Cerai</option><option value="Cerai Mati">Cerai Mati</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Agama</label>
                  <select className={inp} value={profile.religion} onChange={(e) => upd("religion", e.target.value)}>
                    <option value="">Pilih...</option><option>Islam</option><option>Kristen Protestan</option><option>Kristen Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option><option>Lainnya</option>
                  </select>
                </div>
                <div><label className={lbl}>Suku/Bangsa</label><input className={inp} value={profile.ethnicity} onChange={(e) => upd("ethnicity", e.target.value)} /></div>
                <div className="md:col-span-3"><label className={lbl}>Alamat Lengkap *</label><textarea className={inp} rows={2} value={profile.address} onChange={(e) => upd("address", e.target.value)} /></div>
                <div><label className={lbl}>Kota</label><input className={inp} value={profile.city} onChange={(e) => upd("city", e.target.value)} /></div>
                <div><label className={lbl}>Provinsi</label><input className={inp} value={profile.province} onChange={(e) => upd("province", e.target.value)} /></div>
                <div><label className={lbl}>Kode Pos</label><input className={inp} value={profile.postal_code} onChange={(e) => upd("postal_code", e.target.value)} /></div>
              </div>
            </section>

            {/* Data Fisik */}
            <section className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Heart className="h-5 w-5 text-primary"/> Data Fisik</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div><label className={lbl}>Tinggi (cm)</label><input type="number" className={inp} value={profile.height_cm || ""} onChange={(e) => upd("height_cm", parseInt(e.target.value) || null)} /></div>
                <div><label className={lbl}>Berat (kg)</label><input type="number" className={inp} value={profile.weight_kg || ""} onChange={(e) => upd("weight_kg", parseInt(e.target.value) || null)} /></div>
                <div><label className={lbl}>Ukuran Baju</label><input className={inp} value={profile.shirt_size} onChange={(e) => upd("shirt_size", e.target.value)} placeholder="S/M/L/XL/XXL" /></div>
                <div><label className={lbl}>Ukuran Celana</label><input className={inp} value={profile.pants_size} onChange={(e) => upd("pants_size", e.target.value)} placeholder="28-44" /></div>
                <div><label className={lbl}>Ukuran Sepatu</label><input className={inp} value={profile.shoe_size} onChange={(e) => upd("shoe_size", e.target.value)} placeholder="37-45" /></div>
                <div className="md:col-span-3"><label className={lbl}>Riwayat Penyakit</label><input className={inp} value={profile.medical_history} onChange={(e) => upd("medical_history", e.target.value)} placeholder="Tulis 'Tidak ada' jika tidak ada" /></div>
              </div>
            </section>
          </div>
        )}

        {/* TAB: Family */}
        {activeTab === "family" && (
          <div className="space-y-4">
            {/* Data Keluarga */}
            <section className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> Data Keluarga</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className={lbl}>Nama Ayah</label><input className={inp} value={profile.father_name} onChange={(e) => upd("father_name", e.target.value)} /></div>
                <div><label className={lbl}>Nama Ibu</label><input className={inp} value={profile.mother_name} onChange={(e) => upd("mother_name", e.target.value)} /></div>
                <div><label className={lbl}>Nama Suami/Istri</label><input className={inp} value={profile.spouse_name} onChange={(e) => upd("spouse_name", e.target.value)} /></div>
                <div><label className={lbl}>Jumlah Anak</label><input type="number" className={inp} value={profile.number_of_children} onChange={(e) => upd("number_of_children", parseInt(e.target.value) || 0)} /></div>
              </div>
            </section>

            {/* Kontak Darurat */}
            <section className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Phone className="h-5 w-5 text-primary"/> Kontak Darurat</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label className={lbl}>Nama Kontak</label><input className={inp} value={profile.emergency_contact_name} onChange={(e) => upd("emergency_contact_name", e.target.value)} /></div>
                <div>
                  <label className={lbl}>Hubungan</label>
                  <select className={inp} value={profile.emergency_contact_relation} onChange={(e) => upd("emergency_contact_relation", e.target.value)}>
                    <option value="">Pilih...</option><option>Ayah</option><option>Ibu</option><option>Suami/Istri</option><option>Saudara</option><option>Anak</option><option>Teman</option><option>Lainnya</option>
                  </select>
                </div>
                <div><label className={lbl}>No. Telepon</label><input className={inp} value={profile.emergency_contact_phone} onChange={(e) => upd("emergency_contact_phone", e.target.value)} /></div>
              </div>
            </section>
          </div>
        )}

        {/* Kontak Darurat */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Phone className="h-5 w-5 text-primary"/> Kontak Darurat</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className={lbl}>Nama Kontak</label><input className={inp} value={profile.emergency_contact_name} onChange={(e) => upd("emergency_contact_name", e.target.value)} /></div>
            <div><label className={lbl}>Hubungan</label>
              <select className={inp} value={profile.emergency_contact_relation} onChange={(e) => upd("emergency_contact_relation", e.target.value)}>
                <option value="">Pilih...</option><option>Ayah</option><option>Ibu</option><option>Suami/Istri</option><option>Saudara</option><option>Anak</option><option>Teman</option><option>Lainnya</option>
              </select>
            </div>
            <div><label className={lbl}>No. Telepon</label><input className={inp} value={profile.emergency_contact_phone} onChange={(e) => upd("emergency_contact_phone", e.target.value)} /></div>
          </div>
        </section>

        {/* TAB: Education */}
        {activeTab === "education" && (
          <section className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary"/> Pendidikan</h2>
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
        )}

        {/* TAB: Skills & Personality */}
        {activeTab === "skills" && (
          <div className="space-y-4">
            <section className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Award className="h-5 w-5 text-primary"/> Keahlian & Bahasa</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2"><label className={lbl}>Keahlian (pisahkan dengan koma)</label><input className={inp} value={profile.skills} onChange={(e) => upd("skills", e.target.value)} placeholder="Excel, Public Speaking, Photoshop, ..." /></div>
                <div className="md:col-span-2"><label className={lbl}>Bahasa yang dikuasai</label><input className={inp} value={profile.bio} onChange={(e) => upd("bio", e.target.value)} placeholder="Indonesia, Inggris, Mandarin, ..." /></div>
                <div className="md:col-span-2"><label className={lbl}>LinkedIn URL</label><input className={inp} value={profile.linkedin_url || ""} onChange={(e) => upd("linkedin_url", e.target.value)} /></div>
              </div>
            </section>

            <section className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Star className="h-5 w-5 text-primary"/> Kepribadian</h2>
              <div className="grid grid-cols-1 gap-3">
                <div><label className={lbl}>Kelebihan (Strengths)</label><textarea className={inp} rows={3} value={profile.strengths} onChange={(e) => upd("strengths", e.target.value)} placeholder="Apa kelebihan Anda?" /></div>
                <div><label className={lbl}>Kekurangan (Weaknesses)</label><textarea className={inp} rows={3} value={profile.weaknesses} onChange={(e) => upd("weaknesses", e.target.value)} placeholder="Apa kekurangan Anda?" /></div>
              </div>
            </section>
          </div>
        )}

        {/* TAB: Experience */}
        {activeTab === "experience" && (
          <section className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/> Pengalaman Kerja</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className={lbl}>Tahun Pengalaman</label><input type="number" className={inp} value={profile.experience_years} onChange={(e) => upd("experience_years", parseInt(e.target.value) || 0)} /></div>
              <div><label className={lbl}>Posisi Saat Ini</label><input className={inp} value={profile.current_position} onChange={(e) => upd("current_position", e.target.value)} /></div>
              <div><label className={lbl}>Perusahaan Saat Ini</label><input className={inp} value={profile.current_company} onChange={(e) => upd("current_company", e.target.value)} /></div>
              <div><label className={lbl}>Tentang Saya</label><textarea className={inp} rows={3} value={profile.bio} onChange={(e) => upd("bio", e.target.value)} /></div>
            </div>
          </section>
        )}

        {/* TAB: Salary */}
        {activeTab === "salary" && (
          <section className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary"/> Ekspektasi Gaji</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className={lbl}>Gaji Pokok yang Diharapkan</label><input className={inp} value={profile.salary_exp_base} onChange={(e) => upd("salary_exp_base", e.target.value)} /></div>
              <div><label className={lbl}>Tunjangan yang Diharapkan</label><input className={inp} value={profile.salary_exp_allowances} onChange={(e) => upd("salary_exp_allowances", e.target.value)} /></div>
              <div className="md:col-span-2"><label className={lbl}>Benefit/Fasilitas yang Diharapkan</label><textarea className={inp} rows={2} value={profile.salary_exp_benefits} onChange={(e) => upd("salary_exp_benefits", e.target.value)} placeholder="Asuransi, bonus, transport, dll" /></div>
              <div><label className={lbl}>Ekspektasi Gaji Total (Rp)</label><input type="number" className={inp} value={profile.expected_salary || ""} onChange={(e) => upd("expected_salary", parseInt(e.target.value) || null)} /></div>
              <div><label className={lbl}>Gaji Saat Ini (opsional)</label><input className={inp} value={profile.salary_expectation} onChange={(e) => upd("salary_expectation", e.target.value)} /></div>
            </div>
          </section>
        )}

        {/* TAB: Documents */}
        {activeTab === "documents" && (
          <section className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><FileCheck className="h-5 w-5 text-primary"/> Dokumen Pendukung</h2>
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
        )}

        {/* TAB: Additional Info */}
        {activeTab === "additional" && (
          <div className="space-y-4">
            <section className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Info className="h-5 w-5 text-primary"/> Informasi Tambahan</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label className={lbl}>Hobi</label><input className={inp} value={profile.hobbies} onChange={(e) => upd("hobbies", e.target.value)} placeholder="Contoh: Membaca, Olahraga, Musik" /></div>
                <div><label className={lbl}>SIM yang Dimiliki</label><input className={inp} value={profile.vehicle_license} onChange={(e) => upd("vehicle_license", e.target.value)} placeholder="A/B/C/None" /></div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="has_vehicle" className="rounded" checked={profile.has_vehicle} onChange={(e) => upd("has_vehicle", e.target.checked)} />
                  <label htmlFor="has_vehicle" className="text-sm">Memiliki Kendaraan</label>
                </div>
                {profile.has_vehicle && (
                  <><div><label className={lbl}>Jenis Kendaraan</label><input className={inp} value={profile.vehicle_type} onChange={(e) => upd("vehicle_type", e.target.value)} placeholder="Motor/Mobil" /></div>
                  <div><label className={lbl}>Merk Kendaraan</label><input className={inp} value={profile.vehicle_brand} onChange={(e) => upd("vehicle_brand", e.target.value)} /></div></>
                )}
                <div><label className={lbl}>Status Kepemilikan Rumah</label>
                  <select className={inp} value={profile.home_ownership} onChange={(e) => upd("home_ownership", e.target.value)}>
                    <option value="">Pilih...</option><option>Milik Sendiri</option><option>Orang Tua</option><option>Kontrak/Sewa</option><option>Kost</option>
                  </select>
                </div>
                <div><label className={lbl}>Telepon Rumah</label><input className={inp} value={profile.home_phone} onChange={(e) => upd("home_phone", e.target.value)} /></div>
                <div className="md:col-span-3"><label className={lbl}>Sumber Informasi Lowongan</label><input className={inp} value={profile.source_info} onChange={(e) => upd("source_info", e.target.value)} placeholder="Contoh: Jobstreet, LinkedIn, Referral, dll" /></div>
                <div className="md:col-span-3"><label className={lbl}>Aktivitas Sosial/Organisasi</label><textarea className={inp} rows={2} value={profile.social_activities} onChange={(e) => upd("social_activities", e.target.value)} /></div>
              </div>
            </section>

            <section className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/> Preferensi Kerja</h2>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" checked={profile.willing_relocate} onChange={(e) => upd("willing_relocate", e.target.checked)} />
                  <span className="text-sm">Bersedia Relokasi</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" checked={profile.willing_overtime} onChange={(e) => upd("willing_overtime", e.target.checked)} />
                  <span className="text-sm">Bersedia Lembur</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" checked={profile.willing_shift} onChange={(e) => upd("willing_shift", e.target.checked)} />
                  <span className="text-sm">Bersedia Shift</span>
                </label>
              </div>
            </section>
          </div>
        )}

        {/* Declaration & Submit */}
        <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Dengan ini saya menyatakan bahwa keterangan yang saya berikan di atas adalah <strong>BENAR</strong>.
            Bilamana ternyata terdapat ketidaksesuaian, maka saya bertanggung jawab penuh atas segala akibatnya,
            dan perusahaan berhak menghentikan proses rekrutmen tanpa tuntutan apapun dari saya.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-muted text-foreground px-6 py-3 rounded-xl font-semibold hover:bg-muted/80 disabled:opacity-50">
              <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan Sementara"}
            </button>
            <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:brightness-110 disabled:opacity-50">
              <Save className="h-4 w-4" /> Submit Formulir
            </button>
          </div>
        </section>
      </div>
    </CandidateLayout>
  );
}
