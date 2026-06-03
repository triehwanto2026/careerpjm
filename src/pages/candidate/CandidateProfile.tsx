import { useEffect, useState } from "react";
import { 
  Save, Upload, FileText, Trash2, CheckCircle2, AlertCircle, 
  Plus, X, Building2, GraduationCap, Award, Languages, 
  Heart, Users, Briefcase, Car, Calendar, Phone, MapPin,
  User, FileCheck, Info, DollarSign, ClipboardList, Star, Globe, Link, Edit
} from "lucide-react";
import CandidateLayout from "@/components/candidate/CandidateLayout";
import { supabase } from "@/integrations/supabase/client";
import { resolveStorageUrl } from "@/lib/storage";
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
  height_cm: number | null;
  weight_kg: number | null;
  shirt_size: string;
  pants_size: string;
  shoe_size: string;
  father_name: string;
  mother_name: string;
  spouse_name: string;
  number_of_children: number;
  emergency_contact_name: string;
  emergency_contact_relation: string;
  emergency_contact_phone: string;
  hobbies: string;
  vehicle_license: string;
  has_vehicle: boolean;
  vehicle_type: string;
  vehicle_brand: string;
  home_ownership: string;
  home_phone: string;
  strengths: string;
  weaknesses: string;
  social_activities: string;
  salary_expectation: string;
  salary_exp_base: string;
  salary_exp_allowances: string;
  salary_exp_benefits: string;
  medical_history: string;
  source_info: string;
  willing_relocate: boolean;
  willing_overtime: boolean;
  willing_shift: boolean;
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
  bpjs_kesehatan: string;
  bpjs_ketenagakerjaan: string;
  alamat_domisili: string;
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
  { key: "kk", label: "Kartu Keluarga (KK)", required: true, accept: "image/*,.pdf" },
  { key: "buku_nikah", label: "Buku Nikah", required: false, accept: "image/*,.pdf" },
  { key: "skck", label: "SKCK", required: false, accept: "image/*,.pdf" },
  { key: "tes_kesehatan", label: "Surat Tes Kesehatan", required: false, accept: "image/*,.pdf" },
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
  bpjs_kesehatan: "", bpjs_ketenagakerjaan: "", alamat_domisili: "",
};

export default function CandidateProfile() {
  const [profile, setProfile] = useState<Profile>(blank);
  const [originalProfile, setOriginalProfile] = useState<Profile>(blank);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [immediateFamily, setImmediateFamily] = useState<any[]>([]);
  const [educationHistory, setEducationHistory] = useState<any[]>([]);
  const [informalEducation, setInformalEducation] = useState<any[]>([]);
  const [workExperience, setWorkExperience] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);

  const getPhotoDoc = () => docs.find((d) => d.document_type === "photo");
  const displayPhotoUrl = profile.photo_url || getPhotoDoc()?.file_url || "";

  const load = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);
    const { data: p } = await supabase.from("candidate_profiles").select("*").eq("user_id", session.user.id).single();
    if (p) {
      const profileData = { ...blank, ...(p as any) };
      setProfile(profileData);
      setOriginalProfile(profileData);
      
      // Load and parse array fields from database
      try {
        const pData = p as any; // Type assertion to access dynamic fields
        
        // Helper function to safely parse JSON fields
        const safeParseJSON = (value: any, defaultValue: any) => {
          if (!value) return defaultValue;
          if (Array.isArray(value)) return value;
          if (typeof value === 'object') return value;
          try {
            return JSON.parse(value);
          } catch (e) {
            console.warn('Failed to parse JSON field in load:', e);
            return defaultValue;
          }
        };
        
        const familyData = safeParseJSON(pData.family_members, []);
        const educationData = safeParseJSON(pData.education_history, []);
        const informalEducationData = safeParseJSON(pData.informal_education, []);
        const workExperienceData = safeParseJSON(pData.work_experience, []);
        const skillsData = safeParseJSON(pData.skills, []);
        const languagesData = safeParseJSON(pData.languages, []);
        
        // Try to load from new separated fields first, fallback to family_members
        const familyDataNew = safeParseJSON(pData.family_data, []);
        const immediateFamilyDataNew = safeParseJSON(pData.immediate_family_data, []);
        
        console.log('Loading family data - family_data:', familyDataNew);
        console.log('Loading family data - immediate_family_data:', immediateFamilyDataNew);
        console.log('Loading family data - original family_members:', familyData);
        
        if (familyDataNew.length > 0 || immediateFamilyDataNew.length > 0) {
          // Use new separated data if available
          console.log('Using new separated family data');
          setFamilyMembers(familyDataNew);
          setImmediateFamily(immediateFamilyDataNew);
        } else {
          // Fallback to old family_members field and split data
          console.log('Using fallback to family_members field');
          const regularFamily = familyData.filter((member: any) => {
            const relation = member.relation || member.relationship || '';
            console.log('Filtering family member:', member, 'relation:', relation);
            return ['Ayah', 'Ibu', 'Bapak', 'Kakak', 'Adik', 'Saudara'].includes(relation);
          });
          const immediateFamilyData = familyData.filter((member: any) => {
            const relation = member.relation || member.relationship || '';
            return ['Suami', 'Istri', 'Anak'].includes(relation);
          });
          
          console.log('Filtered regular family:', regularFamily);
          console.log('Filtered immediate family:', immediateFamilyData);
          
          setFamilyMembers(regularFamily);
          setImmediateFamily(immediateFamilyData);
        }
        setEducationHistory(educationData);
        setInformalEducation(informalEducationData);
        setWorkExperience(workExperienceData);
        setSkills(skillsData);
        setLanguages(languagesData);
      } catch (error) {
        console.error('Error parsing array data:', error);
        // Set empty arrays if parsing fails
        setFamilyMembers([]);
        setImmediateFamily([]);
        setEducationHistory([]);
        setInformalEducation([]);
        setWorkExperience([]);
        setSkills([]);
        setLanguages([]);
      }
    } else {
      const profileData = { ...blank, email: session.user.email || "" };
      setProfile(profileData);
      setOriginalProfile(profileData);
      
      // Set empty arrays for new profile
      setFamilyMembers([]);
      setImmediateFamily([]);
      setEducationHistory([]);
      setInformalEducation([]);
      setWorkExperience([]);
      setSkills([]);
      setLanguages([]);
    }
    const { data: d } = await supabase.from("candidate_documents").select("*").eq("user_id", session.user.id);
    const docsData = (d as any) || [];
    setDocs(docsData);
    const photoDoc = docsData.find((doc: any) => doc.document_type === "photo");
    if (!profile.photo_url && photoDoc) {
      setProfile((prev) => ({ ...prev, photo_url: photoDoc.file_url }));
    }
  };

  useEffect(() => { load(); }, []);

  const upd = (k: keyof Profile, v: any) => setProfile((p) => ({ ...p, [k]: v }));

  const handleEdit = () => {
    setOriginalProfile({ ...profile });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setProfile({ ...originalProfile });
    setIsEditing(false);
    // Reload family data to reset to original state
    load();
  };

  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, { relation: '', name: '', gender: '', age: '', education: '', occupation: '', company: '' }]);
  };

  const updateFamilyMember = (index: number, field: string, value: any) => {
    console.log('Updating family member:', { index, field, value, currentMember: familyMembers[index] });
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    console.log('Updated family member:', updated[index]);
    setFamilyMembers(updated);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const addImmediateFamilyMember = () => {
    setImmediateFamily([...immediateFamily, { relation: '', name: '', gender: '', age: '', education: '', occupation: '', company: '' }]);
  };

  const updateImmediateFamilyMember = (index: number, field: string, value: any) => {
    const updated = [...immediateFamily];
    updated[index] = { ...updated[index], [field]: value };
    setImmediateFamily(updated);
  };

  const removeImmediateFamilyMember = (index: number) => {
    setImmediateFamily(immediateFamily.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    setEducationHistory([...educationHistory, { level: '', school: '', major: '', start_year: '', end_year: '', grade: '', status: '' }]);
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const updated = [...educationHistory];
    updated[index] = { ...updated[index], [field]: value };
    setEducationHistory(updated);
  };

  const removeEducation = (index: number) => {
    setEducationHistory(educationHistory.filter((_, i) => i !== index));
  };

  const addInformalEducation = () => {
    setInformalEducation([...informalEducation, { name: '', institution: '', year: '', certificate: '' }]);
  };

  const updateInformalEducation = (index: number, field: string, value: any) => {
    const updated = [...informalEducation];
    updated[index] = { ...updated[index], [field]: value };
    setInformalEducation(updated);
  };

  const removeInformalEducation = (index: number) => {
    setInformalEducation(informalEducation.filter((_, i) => i !== index));
  };

  const addWorkExperience = () => {
    setWorkExperience([...workExperience, {
      company_name: '', business_type: '', employee_count: '', address: '', city: '',
      join_date: '', end_date: '', still_working: false,
      position_start: '', salary_start: '', position_end: '', salary_end: '',
      supervisor_name: '', supervisor_position: '', supervisor_phone: '',
      duties: '', achievements: '', organization_structure: '', resignation_reason: '',
      benefits: ''
    }]);
  };

  const updateWorkExperience = (index: number, field: string, value: any) => {
    const updated = [...workExperience];
    updated[index] = { ...updated[index], [field]: value };
    setWorkExperience(updated);
  };

  const removeWorkExperience = (index: number) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index));
  };

  const addSkill = () => {
    setSkills([...skills, { name: '', level: '' }]);
  };

  const updateSkill = (index: number, field: string, value: any) => {
    const updated = [...skills];
    updated[index] = { ...updated[index], [field]: value };
    setSkills(updated);
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const addLanguage = () => {
    setLanguages([...languages, { name: '', level: '' }]);
  };

  const updateLanguage = (index: number, field: string, value: any) => {
    const updated = [...languages];
    updated[index] = { ...updated[index], [field]: value };
    setLanguages(updated);
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  // Format currency to Indonesian Rupiah
  const formatCurrency = (value: string): string => {
    // Remove all non-digit characters
    const cleanValue = value.replace(/\D/g, '');
    // Format with dots
    if (cleanValue === '') return '';
    return parseInt(cleanValue).toLocaleString('id-ID');
  };

  // Handle currency input
  const handleCurrencyInput = (value: string, setter: (value: string) => void) => {
    const formatted = formatCurrency(value);
    setter(formatted);
  };

  
  const calculateProgress = () => {
    // Required fields for Data Diri (40%)
    const personalFields: (keyof Profile)[] = ["full_name", "phone", "birth_date", "gender", "address", "city", "province", "postal_code", "marital_status", "religion"];
    const personalFilled = personalFields.filter(f => !!profile[f]).length;
    const personalProgress = (personalFilled / personalFields.length) * 40;

    // Required fields for Keluarga (20%)
    const familyProgress = (familyMembers.length > 0 || immediateFamily.length > 0) ? 20 : 0;

    // Required fields for Pendidikan (20%)
    const educationProgress = educationHistory.length > 0 ? 20 : 0;

    // Documents (20%)
    const requiredDocs = 6; // CV, KTP, Foto, Ijazah, Transkrip, KK
    const docProgress = docs.length >= requiredDocs ? 20 : (docs.length / requiredDocs) * 20;

    const totalProgress = Math.round(personalProgress + familyProgress + educationProgress + docProgress);
    setProgress(totalProgress);
    return totalProgress;
  };

  const save = async () => {
    setSaving(true);
    const currentProgress = calculateProgress();
    
    try {
      // Save main profile data
      const payload: any = { 
        ...profile, 
        user_id: userId, 
        is_complete: currentProgress >= 50,
        // Save family data to separate columns
        family_data: JSON.stringify(familyMembers || []),
        immediate_family_data: JSON.stringify(immediateFamily || []),
        // Keep family_members for backward compatibility
        family_members: JSON.stringify([...familyMembers, ...immediateFamily] || []),
        education_history: JSON.stringify(educationHistory || []),
        informal_education: JSON.stringify(informalEducation || []),
        work_experience: JSON.stringify(workExperience || []),
        skills: JSON.stringify(skills || []),
        languages: JSON.stringify(languages || []),
      };
      delete payload.id;
      
      // Debug logging
      console.log('Saving payload with skills:', payload.skills);
      console.log('Saving payload with work_experience:', payload.work_experience);
      console.log('Skills array being saved:', skills);
      console.log('Work experience array being saved:', workExperience);
      console.log('Family members being saved:', familyMembers);
      console.log('Immediate family being saved:', immediateFamily);
      console.log('Combined family data:', [...familyMembers, ...immediateFamily]);
      console.log('Family members JSON:', payload.family_members);
      
      const { error } = await supabase.from("candidate_profiles").upsert(payload, { onConflict: "user_id" });
      
      if (error) {
        console.error('Profile save error:', error);
        Swal.fire({ icon: "error", title: "Gagal menyimpan", text: error.message });
        return;
      }
      
      console.log('Profile saved successfully');
      Swal.fire({ icon: "success", title: "Profil tersimpan", timer: 1500, showConfirmButton: false });
      setIsEditing(false); // Exit edit mode after successful save
      load();
    } catch (error) {
      console.error('Save error:', error);
      Swal.fire({ icon: "error", title: "Gagal menyimpan", text: "Terjadi kesalahan saat menyimpan data" });
    } finally {
      setSaving(false);
    }
  };

  const uploadDoc = async (type: string, file: File) => {
    const bucket = type === "photo" ? "candidate-photos" : "candidate-documents";
    const ext = file.name.split(".").pop();
    const path = `${userId}/${type}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (upErr) {
      Swal.fire({ icon: "error", title: "Upload gagal", text: upErr.message });
      return;
    }
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    const fileUrl = pub.publicUrl;
    const old = docs.find((d) => d.document_type === type);
    if (old) await supabase.from("candidate_documents").delete().eq("id", old.id);
    await supabase.from("candidate_documents").insert({
      user_id: userId, document_type: type, file_name: file.name, file_url: fileUrl,
      file_size: file.size, mime_type: file.type,
    });
    if (type === "photo") {
      await supabase.from("candidate_profiles").upsert({ user_id: userId, photo_url: fileUrl }, { onConflict: "user_id" });
    }
    load();
  };

  const deleteDoc = async (id: string) => {
    const docToDelete = docs.find((doc) => doc.id === id);
    const { isConfirmed } = await Swal.fire({ icon: "warning", title: "Hapus dokumen?", showCancelButton: true });
    if (!isConfirmed) return;
    await supabase.from("candidate_documents").delete().eq("id", id);
    if (docToDelete?.document_type === "photo") {
      await supabase.from("candidate_profiles").upsert({ user_id: userId, photo_url: null }, { onConflict: "user_id" });
    }
    load();
  };

  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  const inpDisabled = "w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm cursor-not-allowed opacity-60";
  const lbl = "text-xs font-medium text-muted-foreground mb-1 block";
  const [activeTab, setActiveTab] = useState("personal");
  const [progress, setProgress] = useState(0);

  
  useEffect(() => { calculateProgress(); }, [profile, docs, familyMembers, immediateFamily, educationHistory]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setTimeout(calculateProgress, 100);
  };

  const handleSubmit = async () => {
    const currentProgress = calculateProgress();
    if (currentProgress < 50) {
      Swal.fire({ 
        icon: "warning", 
        title: "Profil Belum Lengkap", 
        text: `Kelengkapan profil Anda ${currentProgress}%. Minimal 50% untuk melamar pekerjaan.`,
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

  const openDocument = async (fileUrl: string) => {
    const win = window.open('', '_blank');
    const resolved = await resolveStorageUrl(fileUrl);
    if (win) {
      win.location.href = resolved;
    } else {
      window.location.href = resolved;
    }
  };

  return (
    <CandidateLayout>
      <div className="min-h-screen w-full flex flex-col">
        {/* Header - Fixed Top */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="w-full px-4 py-4 md:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Formulir Kandidat</h1>
                <p className="text-sm text-muted-foreground">Lengkapi seluruh data untuk meningkatkan peluang Anda</p>
              </div>
              <button onClick={calculateProgress} className="text-sm text-primary hover:underline">Refresh Progress</button>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4 bg-card border border-border rounded-xl p-4">
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
            <div className="mt-4 flex flex-wrap gap-1 bg-muted/50 p-1.5 rounded-xl">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs font-medium transition-all ${
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
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 w-full px-4 py-6 md:px-6 lg:px-8 overflow-y-auto">

        {/* TAB: Personal Data */}
        {activeTab === "personal" && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Data Pribadi */}
            <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><User className="h-5 w-5 text-primary"/> Data Pribadi</h2>
              <div className="space-y-4">
                <div className="bg-muted border border-border rounded-2xl p-4 flex flex-col items-center text-center gap-3">
                  <div className="h-28 w-28 rounded-xl overflow-hidden bg-white border border-border flex items-center justify-center">
                    {displayPhotoUrl ? (
                      <img src={displayPhotoUrl} alt="Foto Formal" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Foto Formal</p>
                    <p className="text-xs text-muted-foreground">Foto kandidat untuk profil dan PHC.</p>
                  </div>
                  {isEditing && (
                    <label className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground cursor-pointer hover:brightness-110">
                      <Upload className="h-4 w-4" /> Ganti Foto
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc("photo", e.target.files[0])} />
                    </label>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><label className={lbl}>NIK *</label><input className={isEditing ? inp : inpDisabled} value={profile.nik} onChange={(e) => isEditing && upd("nik", e.target.value)} placeholder="16 digit" maxLength={16} disabled={!isEditing} /></div>
                <div><label className={lbl}>NPWP</label><input className={isEditing ? inp : inpDisabled} value={profile.npwp} onChange={(e) => isEditing && upd("npwp", e.target.value)} placeholder="15 digit" disabled={!isEditing} /></div>
                <div><label className={lbl}>No. Telepon *</label><input className={isEditing ? inp : inpDisabled} value={profile.phone} onChange={(e) => isEditing && upd("phone", e.target.value)} disabled={!isEditing} /></div>
                <div className="md:col-span-2 lg:col-span-3"><label className={lbl}>Nama Lengkap *</label><input className={isEditing ? inp : inpDisabled} value={profile.full_name} onChange={(e) => isEditing && upd("full_name", e.target.value)} disabled={!isEditing} /></div>
                <div><label className={lbl}>Nama Panggilan</label><input className={isEditing ? inp : inpDisabled} value={profile.nickname} onChange={(e) => isEditing && upd("nickname", e.target.value)} disabled={!isEditing} /></div>
                <div><label className={lbl}>Tempat Lahir</label><input className={isEditing ? inp : inpDisabled} value={profile.birth_place} onChange={(e) => isEditing && upd("birth_place", e.target.value)} disabled={!isEditing} /></div>
                <div><label className={lbl}>Tanggal Lahir *</label><input type="date" className={isEditing ? inp : inpDisabled} value={profile.birth_date || ""} onChange={(e) => isEditing && upd("birth_date", e.target.value)} disabled={!isEditing} /></div>
                <div>
                  <label className={lbl}>Gol. Darah</label>
                  <select className={isEditing ? inp : inpDisabled} value={profile.blood_type} onChange={(e) => isEditing && upd("blood_type", e.target.value)} disabled={!isEditing}>
                    <option value="">Pilih...</option><option>A</option><option>B</option><option>AB</option><option>O</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Jenis Kelamin *</label>
                  <select className={isEditing ? inp : inpDisabled} value={profile.gender} onChange={(e) => isEditing && upd("gender", e.target.value)} disabled={!isEditing}>
                    <option value="">Pilih...</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Status Pernikahan</label>
                  <select className={isEditing ? inp : inpDisabled} value={profile.marital_status} onChange={(e) => isEditing && upd("marital_status", e.target.value)} disabled={!isEditing}>
                    <option value="">Pilih...</option><option value="Belum Menikah">Belum Menikah</option><option value="Menikah">Menikah</option><option value="Cerai">Cerai</option><option value="Cerai Mati">Cerai Mati</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Agama</label>
                  <select className={isEditing ? inp : inpDisabled} value={profile.religion} onChange={(e) => isEditing && upd("religion", e.target.value)} disabled={!isEditing}>
                    <option value="">Pilih...</option><option>Islam</option><option>Kristen Protestan</option><option>Kristen Katolik</option><option>Hindu</option><option>Buddha</option><option>Konghucu</option><option>Lainnya</option>
                  </select>
                </div>
                <div><label className={lbl}>Suku/Bangsa</label><input className={isEditing ? inp : inpDisabled} value={profile.ethnicity} onChange={(e) => isEditing && upd("ethnicity", e.target.value)} disabled={!isEditing} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className={lbl}>No. BPJS Kesehatan</label><input className={isEditing ? inp : inpDisabled} value={profile.bpjs_kesehatan || ""} onChange={(e) => isEditing && upd("bpjs_kesehatan", e.target.value)} placeholder="Nomor BPJS Kesehatan" disabled={!isEditing} /></div>
                  <div><label className={lbl}>No. BPJS Ketenagakerjaan</label><input className={isEditing ? inp : inpDisabled} value={profile.bpjs_ketenagakerjaan || ""} onChange={(e) => isEditing && upd("bpjs_ketenagakerjaan", e.target.value)} placeholder="Nomor BPJS Ketenagakerjaan" disabled={!isEditing} /></div>
                </div>
                <div className="md:col-span-3"><label className={lbl}>Alamat Lengkap *</label><textarea className={isEditing ? inp : inpDisabled} rows={3} value={profile.address} onChange={(e) => isEditing && upd("address", e.target.value)} disabled={!isEditing} /></div>
                <div><label className={lbl}>Kota</label><input className={isEditing ? inp : inpDisabled} value={profile.city} onChange={(e) => isEditing && upd("city", e.target.value)} disabled={!isEditing} /></div>
                <div><label className={lbl}>Provinsi</label><input className={isEditing ? inp : inpDisabled} value={profile.province} onChange={(e) => isEditing && upd("province", e.target.value)} disabled={!isEditing} /></div>
                <div><label className={lbl}>Kode Pos</label><input className={isEditing ? inp : inpDisabled} value={profile.postal_code} onChange={(e) => isEditing && upd("postal_code", e.target.value)} disabled={!isEditing} /></div>
              </div>
            </div>
            </section>

            {/* Data Fisik */}
            <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Heart className="h-5 w-5 text-primary"/> Data Fisik</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div><label className={lbl}>Tinggi (cm)</label><input type="number" className={isEditing ? inp : inpDisabled} value={profile.height_cm || ""} onChange={(e) => isEditing && upd("height_cm", parseInt(e.target.value) || null)} disabled={!isEditing} /></div>
                <div><label className={lbl}>Berat (kg)</label><input type="number" className={isEditing ? inp : inpDisabled} value={profile.weight_kg || ""} onChange={(e) => isEditing && upd("weight_kg", parseInt(e.target.value) || null)} disabled={!isEditing} /></div>
                <div className="sm:col-span-2 lg:col-span-3"><label className={lbl}>Riwayat Penyakit</label><input className={isEditing ? inp : inpDisabled} value={profile.medical_history} onChange={(e) => isEditing && upd("medical_history", e.target.value)} placeholder="Tulis 'Tidak ada' jika tidak ada" disabled={!isEditing} /></div>
              </div>
            </section>

            {/* Kontak Darurat */}
            <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Phone className="h-5 w-5 text-primary"/> Kontak Darurat</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div><label className={lbl}>Nama Kontak</label><input className={isEditing ? inp : inpDisabled} value={profile.emergency_contact_name} onChange={(e) => isEditing && upd("emergency_contact_name", e.target.value)} disabled={!isEditing} /></div>
                <div>
                  <label className={lbl}>Hubungan</label>
                  <select className={isEditing ? inp : inpDisabled} value={profile.emergency_contact_relation} onChange={(e) => isEditing && upd("emergency_contact_relation", e.target.value)} disabled={!isEditing}>
                    <option value="">Pilih...</option><option>Ayah</option><option>Ibu</option><option>Suami/Istri</option><option>Saudara</option><option>Anak</option><option>Teman</option><option>Lainnya</option>
                  </select>
                </div>
                <div><label className={lbl}>No. Telepon</label><input className={isEditing ? inp : inpDisabled} value={profile.emergency_contact_phone} onChange={(e) => isEditing && upd("emergency_contact_phone", e.target.value)} disabled={!isEditing} /></div>
              </div>
            </section>
          </div>
        )}

        {/* TAB: Family */}
        {activeTab === "family" && (
          <div className="space-y-4 max-w-7xl mx-auto">
            {/* Data Keluarga */}
            <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> Data Keluarga</h2>
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {familyMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-40" />
                      <p>Belum ada data keluarga yang ditambahkan.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {familyMembers.map((member, index) => (
                        <div key={index} className="bg-background rounded-lg border border-border p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Anggota Keluarga #{index + 1}</h4>
                            {isEditing && (
                              <button onClick={() => removeFamilyMember(index)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 items-end">
                            <div className="min-w-0">
                              <label className={lbl}>Hubungan</label>
                              <select className={isEditing ? inp : inpDisabled} value={member.relation || ''} onChange={(e) => isEditing && updateFamilyMember(index, 'relation', e.target.value)} disabled={!isEditing}>
                                <option value="">Pilih...</option>
                                <option value="Bapak">Bapak</option>
                                <option value="Ibu">Ibu</option>
                                <option value="Saudara">Saudara</option>
                              </select>
                            </div>
                            <div className="min-w-0 sm:col-span-2 xl:col-span-3">
                              <label className={lbl}>Nama</label>
                              <input className={isEditing ? inp : inpDisabled} value={member.name} onChange={(e) => isEditing && updateFamilyMember(index, 'name', e.target.value)} disabled={!isEditing} />
                            </div>
                            <div className="min-w-0">
                              <label className={lbl}>Jenis Kelamin</label>
                              <select className={isEditing ? inp : inpDisabled} value={member.gender} onChange={(e) => isEditing && updateFamilyMember(index, 'gender', e.target.value)} disabled={!isEditing}>
                                <option value="">Pilih...</option>
                                <option value="L">L</option>
                                <option value="P">P</option>
                              </select>
                            </div>
                            <div className="min-w-0">
                              <label className={lbl}>Usia</label>
                              <input type="number" className={isEditing ? inp : inpDisabled} value={member.age} onChange={(e) => isEditing && updateFamilyMember(index, 'age', e.target.value)} disabled={!isEditing} />
                            </div>
                            <div className="min-w-0">
                              <label className={lbl}>Pendidikan</label>
                              <select className={isEditing ? inp : inpDisabled} value={member.education} onChange={(e) => isEditing && updateFamilyMember(index, 'education', e.target.value)} disabled={!isEditing}>
                                <option value="">Pilih...</option>
                                <option value="Tidak tamat SD">Tidak tamat SD</option>
                                <option value="SD">SD</option>
                                <option value="SMP">SMP</option>
                                <option value="SMA/SMK">SMA/SMK</option>
                                <option value="D1">D1</option>
                                <option value="D3">D3</option>
                                <option value="S1">S1</option>
                                <option value="S2">S2</option>
                                <option value="S3">S3</option>
                              </select>
                            </div>
                            <div className="min-w-0 sm:col-span-2 xl:col-span-3">
                              <label className={lbl}>Pekerjaan</label>
                              <input className={isEditing ? inp : inpDisabled} value={member.occupation} onChange={(e) => isEditing && updateFamilyMember(index, 'occupation', e.target.value)} disabled={!isEditing} />
                            </div>
                            <div className="min-w-0 sm:col-span-2 xl:col-span-3">
                              <label className={lbl}>Perusahaan</label>
                              <input className={isEditing ? inp : inpDisabled} value={member.company} onChange={(e) => isEditing && updateFamilyMember(index, 'company', e.target.value)} disabled={!isEditing} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {isEditing && (
                <button onClick={addFamilyMember} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                  <Plus className="h-4 w-4" /> Tambah Anggota Keluarga
                </button>
              )}
            </section>

            {/* Keluarga Inti */}
            <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary"/> Keluarga Inti</h2>
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {immediateFamily.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-40" />
                      <p>Belum ada data keluarga inti yang ditambahkan.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {immediateFamily.map((member, index) => (
                        <div key={index} className="bg-background rounded-lg border border-border p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Anggota Keluarga Inti #{index + 1}</h4>
                            {isEditing && (
                              <button onClick={() => removeImmediateFamilyMember(index)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 items-end">
                            <div className="min-w-0">
                              <label className={lbl}>Hubungan</label>
                              <select className={isEditing ? inp : inpDisabled} value={member.relation} onChange={(e) => isEditing && updateImmediateFamilyMember(index, 'relation', e.target.value)} disabled={!isEditing}>
                                <option value="">Pilih...</option>
                                <option value="Suami">Suami</option>
                                <option value="Istri">Istri</option>
                                <option value="Anak">Anak</option>
                              </select>
                            </div>
                            <div className="min-w-0 sm:col-span-2 xl:col-span-3">
                              <label className={lbl}>Nama</label>
                              <input className={isEditing ? inp : inpDisabled} value={member.name} onChange={(e) => isEditing && updateImmediateFamilyMember(index, 'name', e.target.value)} disabled={!isEditing} />
                            </div>
                            <div className="min-w-0">
                              <label className={lbl}>Jenis Kelamin</label>
                              <select className={isEditing ? inp : inpDisabled} value={member.gender} onChange={(e) => isEditing && updateImmediateFamilyMember(index, 'gender', e.target.value)} disabled={!isEditing}>
                                <option value="">Pilih...</option>
                                <option value="L">L</option>
                                <option value="P">P</option>
                              </select>
                            </div>
                            <div className="min-w-0">
                              <label className={lbl}>Usia</label>
                              <input type="number" className={isEditing ? inp : inpDisabled} value={member.age} onChange={(e) => isEditing && updateImmediateFamilyMember(index, 'age', e.target.value)} disabled={!isEditing} />
                            </div>
                            <div className="min-w-0">
                              <label className={lbl}>Pendidikan</label>
                              <select className={isEditing ? inp : inpDisabled} value={member.education} onChange={(e) => isEditing && updateImmediateFamilyMember(index, 'education', e.target.value)} disabled={!isEditing}>
                                <option value="">Pilih...</option>
                                <option value="Tidak tamat SD">Tidak tamat SD</option>
                                <option value="SD">SD</option>
                                <option value="SMP">SMP</option>
                                <option value="SMA/SMK">SMA/SMK</option>
                                <option value="D1">D1</option>
                                <option value="D2">D2</option>
                                <option value="D3">D3</option>
                                <option value="D4">D4</option>
                                <option value="S1">S1</option>
                                <option value="S2">S2</option>
                                <option value="S3">S3</option>
                              </select>
                            </div>
                            <div className="min-w-0 sm:col-span-2 xl:col-span-3">
                              <label className={lbl}>Pekerjaan</label>
                              <input className={isEditing ? inp : inpDisabled} value={member.occupation} onChange={(e) => isEditing && updateImmediateFamilyMember(index, 'occupation', e.target.value)} disabled={!isEditing} />
                            </div>
                            <div className="min-w-0 sm:col-span-2 xl:col-span-3">
                              <label className={lbl}>Perusahaan</label>
                              <input className={isEditing ? inp : inpDisabled} value={member.company} onChange={(e) => isEditing && updateImmediateFamilyMember(index, 'company', e.target.value)} disabled={!isEditing} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {isEditing && (
                <button onClick={addImmediateFamilyMember} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                  <Plus className="h-4 w-4" /> Tambah Anggota Keluarga Inti
                </button>
              )}
            </section>
          </div>
        )}

        {/* TAB: Education */}
        {activeTab === "education" && (
          <div className="space-y-4 max-w-7xl mx-auto">
            <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary"/> Riwayat Pendidikan Formal</h2>
              <div className="space-y-3">
                {educationHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-40" />
                    <p>Belum ada riwayat pendidikan formal yang ditambahkan.</p>
                  </div>
                ) : (
                  educationHistory.map((edu, index) => (
                    <div key={index} className="bg-background rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Pendidikan #{index + 1}</h4>
                        {isEditing && (
                          <button onClick={() => removeEducation(index)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
                        <div className="min-w-0">
                          <label className={lbl}>Jenjang</label>
                          <select className={isEditing ? inp : inpDisabled} value={edu.level} onChange={(e) => isEditing && updateEducation(index, 'level', e.target.value)} disabled={!isEditing}>
                            <option value="">Pilih...</option>
                            <option value="SD">SD</option>
                            <option value="SMP">SMP</option>
                            <option value="SMA/SMK">SMA/SMK</option>
                            <option value="D1">D1</option>
                            <option value="D3">D3</option>
                            <option value="S1">S1</option>
                            <option value="S2">S2</option>
                            <option value="S3">S3</option>
                          </select>
                        </div>
                        <div className="min-w-0 md:col-span-2 xl:col-span-2">
                          <label className={lbl}>Nama Sekolah / Perguruan Tinggi</label>
                          <input className={isEditing ? inp : inpDisabled} value={edu.school} onChange={(e) => isEditing && updateEducation(index, 'school', e.target.value)} disabled={!isEditing} />
                        </div>
                        <div className="min-w-0 xl:col-span-1">
                          <label className={lbl}>Jurusan</label>
                          <input className={isEditing ? inp : inpDisabled} value={edu.major} onChange={(e) => isEditing && updateEducation(index, 'major', e.target.value)} disabled={!isEditing} />
                        </div>
                        <div className="grid grid-cols-3 gap-3 xl:col-span-4">
                          <div className="min-w-0">
                            <label className={lbl}>Masuk</label>
                            <input type="number" className={isEditing ? inp : inpDisabled} value={edu.start_year} onChange={(e) => isEditing && updateEducation(index, 'start_year', e.target.value)} placeholder="Tahun" disabled={!isEditing} />
                          </div>
                          <div className="min-w-0">
                            <label className={lbl}>Selesai</label>
                            <input type="number" className={isEditing ? inp : inpDisabled} value={edu.end_year} onChange={(e) => isEditing && updateEducation(index, 'end_year', e.target.value)} placeholder="Tahun" disabled={!isEditing} />
                          </div>
                          <div className="min-w-0">
                            <label className={lbl}>Nilai</label>
                            <input className={isEditing ? inp : inpDisabled} value={edu.grade} onChange={(e) => isEditing && updateEducation(index, 'grade', e.target.value)} placeholder="Nilai/IPK" disabled={!isEditing} />
                          </div>
                        </div>
                        <div className="min-w-0">
                          <label className={lbl}>Status</label>
                          <select className={isEditing ? inp : inpDisabled} value={edu.status} onChange={(e) => isEditing && updateEducation(index, 'status', e.target.value)} disabled={!isEditing}>
                            <option value="">Pilih...</option>
                            <option value="Lulus">Lulus</option>
                            <option value="Tidak Lulus">Tidak Lulus</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {isEditing && (
                <button onClick={addEducation} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                  <Plus className="h-4 w-4" /> Tambah Riwayat Pendidikan
                </button>
              )}
            </section>

            <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Award className="h-5 w-5 text-primary"/> Pendidikan Informal</h2>
              <div className="space-y-3">
                {informalEducation.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-2 opacity-40" />
                    <p>Belum ada pendidikan informal yang ditambahkan.</p>
                  </div>
                ) : (
                  informalEducation.map((edu, index) => (
                    <div key={index} className="bg-background rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Pendidikan Informal #{index + 1}</h4>
                        {isEditing && (
                          <button onClick={() => removeInformalEducation(index)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div><label className={lbl}>Nama Kursus/Pelatihan</label><input className={isEditing ? inp : inpDisabled} value={edu.name} onChange={(e) => isEditing && updateInformalEducation(index, 'name', e.target.value)} placeholder="Nama kursus/pelatihan" disabled={!isEditing} /></div>
                        <div><label className={lbl}>Lembaga/Institusi</label><input className={isEditing ? inp : inpDisabled} value={edu.institution} onChange={(e) => isEditing && updateInformalEducation(index, 'institution', e.target.value)} placeholder="Lembaga penyelenggara" disabled={!isEditing} /></div>
                        <div><label className={lbl}>Tahun</label><input type="number" className={isEditing ? inp : inpDisabled} value={edu.year} onChange={(e) => isEditing && updateInformalEducation(index, 'year', e.target.value)} placeholder="Tahun" disabled={!isEditing} /></div>
                        <div><label className={lbl}>Sertifikat</label><input className={isEditing ? inp : inpDisabled} value={edu.certificate} onChange={(e) => isEditing && updateInformalEducation(index, 'certificate', e.target.value)} placeholder="Nama sertifikat" disabled={!isEditing} /></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {isEditing && (
                <button onClick={addInformalEducation} className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                  <Plus className="h-4 w-4" /> Tambah Pendidikan Informal
                </button>
              )}
            </section>
          </div>
        )}

        {/* TAB: Skills & Personality */}
        {activeTab === "skills" && (
          <div className="space-y-4 max-w-7xl mx-auto">
            <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2"><Award className="h-5 w-5 text-primary"/> Keahlian</h2>
                {isEditing && (
                  <button onClick={addSkill} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                    <Plus className="h-4 w-4" /> Tambah Keahlian
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {skills.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-2 opacity-40" />
                    <p>Belum ada keahlian yang ditambahkan.</p>
                  </div>
                ) : (
                  skills.map((skill, index) => (
                    <div key={index} className="bg-background rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Keahlian #{index + 1}</h4>
                        {isEditing && (
                          <button onClick={() => removeSkill(index)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><label className={lbl}>Nama Keahlian</label><input className={isEditing ? inp : inpDisabled} value={skill.name} onChange={(e) => isEditing && updateSkill(index, 'name', e.target.value)} placeholder="Contoh: Microsoft Excel, Public Speaking" disabled={!isEditing} /></div>
                        <div>
                          <label className={lbl}>Tingkat Kemahiran</label>
                          <select className={isEditing ? inp : inpDisabled} value={skill.level} onChange={(e) => isEditing && updateSkill(index, 'level', e.target.value)} disabled={!isEditing}>
                            <option value="">Pilih...</option>
                            <option value="Pemula">Pemula</option>
                            <option value="Menengah">Menengah</option>
                            <option value="Mahir">Mahir</option>
                            <option value="Ahli">Ahli</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2"><Globe className="h-5 w-5 text-primary"/> Bahasa</h2>
                {isEditing && (
                  <button onClick={addLanguage} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                    <Plus className="h-4 w-4" /> Tambah Bahasa
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {languages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Globe className="h-12 w-12 mx-auto mb-2 opacity-40" />
                    <p>Belum ada bahasa yang ditambahkan.</p>
                  </div>
                ) : (
                  languages.map((language, index) => (
                    <div key={index} className="bg-background rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Bahasa #{index + 1}</h4>
                        {isEditing && (
                          <button onClick={() => removeLanguage(index)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div><label className={lbl}>Nama Bahasa</label><input className={isEditing ? inp : inpDisabled} value={language.name} onChange={(e) => isEditing && updateLanguage(index, 'name', e.target.value)} placeholder="Contoh: Bahasa Indonesia, English" disabled={!isEditing} /></div>
                        <div>
                          <label className={lbl}>Tingkat Kemahiran</label>
                          <select className={isEditing ? inp : inpDisabled} value={language.level} onChange={(e) => isEditing && updateLanguage(index, 'level', e.target.value)} disabled={!isEditing}>
                            <option value="">Pilih...</option>
                            <option value="Dasar">Dasar</option>
                            <option value="Menengah">Menengah</option>
                            <option value="Lancar">Lancar</option>
                            <option value="Mahir">Mahir</option>
                            <option value="Native">Native</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Star className="h-5 w-5 text-primary"/> Kepribadian</h2>
              <div className="grid grid-cols-1 gap-3">
                <div><label className={lbl}>Kelebihan (Strengths)</label><textarea className={isEditing ? inp : inpDisabled} rows={3} value={profile.strengths} onChange={(e) => isEditing && upd("strengths", e.target.value)} placeholder="Apa kelebihan Anda?" disabled={!isEditing} /></div>
                <div><label className={lbl}>Kekurangan (Weaknesses)</label><textarea className={isEditing ? inp : inpDisabled} rows={3} value={profile.weaknesses} onChange={(e) => isEditing && upd("weaknesses", e.target.value)} placeholder="Apa kekurangan Anda?" disabled={!isEditing} /></div>
              </div>
            </section>

            <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Link className="h-5 w-5 text-primary"/> Media Sosial</h2>
              <div className="grid grid-cols-1 gap-3">
                <div><label className={lbl}>LinkedIn URL</label><input className={isEditing ? inp : inpDisabled} value={profile.linkedin_url || ""} onChange={(e) => isEditing && upd("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/username" disabled={!isEditing} /></div>
              </div>
            </section>
          </div>
        )}

        {/* TAB: Experience */}
        {activeTab === "experience" && (
          <div className="space-y-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/> Pengalaman Kerja</h2>
              {isEditing && (
                <button onClick={addWorkExperience} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                  <Plus className="h-4 w-4" /> Tambah Pengalaman
                </button>
              )}
            </div>
            
            {workExperience.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">
                <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-40" />
                <p>Belum ada pengalaman kerja yang ditambahkan.</p>
              </div>
            ) : (
              workExperience.map((exp, index) => (
                <div key={index} className="bg-card border border-border rounded-2xl p-4 md:p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Pengalaman Kerja #{index + 1}</h3>
                    {isEditing && (
                      <button onClick={() => removeWorkExperience(index)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Informasi Perusahaan */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Informasi Perusahaan</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div><label className={lbl}>Nama Perusahaan *</label><input className={isEditing ? inp : inpDisabled} value={exp.company_name} onChange={(e) => isEditing && updateWorkExperience(index, 'company_name', e.target.value)} placeholder="Nama PT/Perusahaan" disabled={!isEditing} /></div>
                      <div><label className={lbl}>Jenis Usaha</label><input className={isEditing ? inp : inpDisabled} value={exp.business_type} onChange={(e) => isEditing && updateWorkExperience(index, 'business_type', e.target.value)} placeholder="Jenis usaha" disabled={!isEditing} /></div>
                      <div><label className={lbl}>Jumlah Karyawan</label><input type="number" className={isEditing ? inp : inpDisabled} value={exp.employee_count} onChange={(e) => isEditing && updateWorkExperience(index, 'employee_count', e.target.value)} placeholder="Jumlah" disabled={!isEditing} /></div>
                      <div className="sm:col-span-2 lg:col-span-3"><label className={lbl}>Alamat</label><input className={isEditing ? inp : inpDisabled} value={exp.address} onChange={(e) => isEditing && updateWorkExperience(index, 'address', e.target.value)} placeholder="Alamat lengkap" disabled={!isEditing} /></div>
                      <div><label className={lbl}>Kota</label><input className={isEditing ? inp : inpDisabled} value={exp.city} onChange={(e) => isEditing && updateWorkExperience(index, 'city', e.target.value)} placeholder="Kota" disabled={!isEditing} /></div>
                    </div>
                  </div>

                  {/* Periode Kerja */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Periode Kerja</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      <div><label className={lbl}>Tanggal Masuk *</label><input type="date" className={isEditing ? inp : inpDisabled} value={exp.join_date} onChange={(e) => isEditing && updateWorkExperience(index, 'join_date', e.target.value)} disabled={!isEditing} /></div>
                      <div>
                        <label className={lbl}>Tanggal Keluar</label>
                        <input type="date" className={isEditing ? inp : inpDisabled} value={exp.end_date} onChange={(e) => isEditing && updateWorkExperience(index, 'end_date', e.target.value)} disabled={!isEditing || exp.still_working} />
                      </div>
                      <div className="flex items-center gap-2 pt-6 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                        <input type="checkbox" id={`still-working-${index}`} className="rounded" checked={exp.still_working} onChange={(e) => isEditing && updateWorkExperience(index, 'still_working', e.target.checked)} disabled={!isEditing} />
                        <label htmlFor={`still-working-${index}`} className="text-sm">Masih bekerja di perusahaan ini</label>
                      </div>
                    </div>
                  </div>

                  {/* Jabatan dan Gaji */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Jabatan dan Gaji</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      <div><label className={lbl}>Jabatan Awal *</label><input className={isEditing ? inp : inpDisabled} value={exp.position_start} onChange={(e) => isEditing && updateWorkExperience(index, 'position_start', e.target.value)} placeholder="Jabatan awal" disabled={!isEditing} /></div>
                      <div><label className={lbl}>Gaji Awal</label><input className={isEditing ? inp : inpDisabled} value={exp.salary_start} onChange={(e) => isEditing && handleCurrencyInput(e.target.value, (value) => updateWorkExperience(index, 'salary_start', value))} placeholder="Rp 0" disabled={!isEditing} /></div>
                      <div><label className={lbl}>Jabatan Akhir</label><input className={isEditing ? inp : inpDisabled} value={exp.position_end} onChange={(e) => isEditing && updateWorkExperience(index, 'position_end', e.target.value)} placeholder="Jabatan akhir" disabled={!isEditing} /></div>
                      <div><label className={lbl}>Gaji Akhir</label><input className={isEditing ? inp : inpDisabled} value={exp.salary_end} onChange={(e) => isEditing && handleCurrencyInput(e.target.value, (value) => updateWorkExperience(index, 'salary_end', value))} placeholder="Rp 0" disabled={!isEditing} /></div>
                    </div>
                  </div>

                  {/* Informasi Atasan */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Informasi Atasan Langsung</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div><label className={lbl}>Nama Atasan</label><input className={isEditing ? inp : inpDisabled} value={exp.supervisor_name} onChange={(e) => isEditing && updateWorkExperience(index, 'supervisor_name', e.target.value)} placeholder="Nama atasan" disabled={!isEditing} /></div>
                      <div><label className={lbl}>Jabatan Atasan</label><input className={isEditing ? inp : inpDisabled} value={exp.supervisor_position} onChange={(e) => isEditing && updateWorkExperience(index, 'supervisor_position', e.target.value)} placeholder="Jabatan atasan" disabled={!isEditing} /></div>
                      <div><label className={lbl}>Nomor Telepon</label><input className={isEditing ? inp : inpDisabled} value={exp.supervisor_phone} onChange={(e) => isEditing && updateWorkExperience(index, 'supervisor_phone', e.target.value)} placeholder="Nomor telepon" disabled={!isEditing} /></div>
                    </div>
                  </div>

                  {/* Detail Pekerjaan */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Detail Pekerjaan</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div><label className={lbl}>Uraikan Tugas dan Tanggung Jawab</label><textarea className={isEditing ? inp : inpDisabled} rows={3} value={exp.duties} onChange={(e) => isEditing && updateWorkExperience(index, 'duties', e.target.value)} placeholder="Deskripsikan tugas dan tanggung jawab Anda" disabled={!isEditing} /></div>
                      <div><label className={lbl}>Target atau Pencapaian</label><textarea className={isEditing ? inp : inpDisabled} rows={3} value={exp.achievements} onChange={(e) => isEditing && updateWorkExperience(index, 'achievements', e.target.value)} placeholder="Target yang dicapai selama bekerja" disabled={!isEditing} /></div>
                      <div><label className={lbl}>Gambarkan Struktur Organisasi</label><textarea className={isEditing ? inp : inpDisabled} rows={3} value={exp.organization_structure} onChange={(e) => isEditing && updateWorkExperience(index, 'organization_structure', e.target.value)} placeholder="Deskripsikan struktur organisasi divisi/departemen Anda" disabled={!isEditing} /></div>
                    </div>
                  </div>

                  {/* Alasan dan Benefit */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Alasan dan Benefit</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div><label className={lbl}>Alasan Berhenti/Resign</label><textarea className={isEditing ? inp : inpDisabled} rows={2} value={exp.resignation_reason} onChange={(e) => isEditing && updateWorkExperience(index, 'resignation_reason', e.target.value)} placeholder="Alasan Anda berhenti dari perusahaan ini" disabled={!isEditing} /></div>
                      <div><label className={lbl}>Benefit Lainnya yang Didapatkan</label><textarea className={isEditing ? inp : inpDisabled} rows={2} value={exp.benefits} onChange={(e) => isEditing && updateWorkExperience(index, 'benefits', e.target.value)} placeholder="Benefit tambahan (BPJS, tunjangan, dll)" disabled={!isEditing} /></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: Salary */}
        {activeTab === "salary" && (
          <div className="space-y-4 max-w-7xl mx-auto">
            <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary"/> Ekspektasi Gaji</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><label className={lbl}>Gaji Pokok yang Diharapkan</label><input className={isEditing ? inp : inpDisabled} value={profile.salary_exp_base} onChange={(e) => isEditing && handleCurrencyInput(e.target.value, (value) => upd("salary_exp_base", value))} placeholder="Rp 0" disabled={!isEditing} /></div>
                <div><label className={lbl}>Tunjangan yang Diharapkan</label><input className={isEditing ? inp : inpDisabled} value={profile.salary_exp_allowances} onChange={(e) => isEditing && handleCurrencyInput(e.target.value, (value) => upd("salary_exp_allowances", value))} placeholder="Rp 0" disabled={!isEditing} /></div>
                <div className="sm:col-span-2"><label className={lbl}>Benefit/Fasilitas yang Diharapkan</label><textarea className={isEditing ? inp : inpDisabled} rows={2} value={profile.salary_exp_benefits} onChange={(e) => isEditing && upd("salary_exp_benefits", e.target.value)} placeholder="Asuransi, bonus, transport, dll" disabled={!isEditing} /></div>
                <div><label className={lbl}>Ekspektasi Gaji Total (Rp)</label><input className={isEditing ? inp : inpDisabled} value={profile.expected_salary ? formatCurrency(profile.expected_salary.toString()) : ''} onChange={(e) => isEditing && handleCurrencyInput(e.target.value, (value) => upd("expected_salary", parseInt(value.replace(/\D/g, '')) || null))} placeholder="Rp 0" disabled={!isEditing} /></div>
                <div><label className={lbl}>Gaji Saat Ini (opsional)</label><input className={isEditing ? inp : inpDisabled} value={profile.salary_expectation} onChange={(e) => isEditing && handleCurrencyInput(e.target.value, (value) => upd("salary_expectation", value))} placeholder="Rp 0" disabled={!isEditing} /></div>
              </div>
            </section>
          </div>
        )}

        {/* TAB: Documents */}
        {activeTab === "documents" && (
          <div className="space-y-4 max-w-7xl mx-auto">
            <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><FileCheck className="h-5 w-5 text-primary"/> Dokumen Pendukung</h2>
              <div className="space-y-3">
                {DOC_TYPES.map((t) => {
                  const existing = docs.find((d) => d.document_type === t.key);
                  return (
                    <div key={t.key} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-border rounded-lg bg-background">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{t.label} {t.required && <span className="text-red-500">*</span>}</div>
                        {existing ? (
                          <button type="button" onClick={() => openDocument(existing.file_url)} className="text-xs text-primary hover:underline truncate block text-left">{existing.file_name}</button>
                        ) : (
                          <div className="text-xs text-muted-foreground">Belum diupload</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing && (
                          <label className="cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:brightness-110">
                            <Upload className="h-3.5 w-3.5" /> {existing ? "Ganti" : "Upload"}
                            <input type="file" accept={t.accept} className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(t.key, e.target.files[0])} />
                          </label>
                        )}
                        {existing && isEditing && (
                          <button onClick={() => deleteDoc(existing.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* TAB: Additional Info */}
        {activeTab === "additional" && (
          <div className="space-y-4 max-w-7xl mx-auto">
            <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Info className="h-5 w-5 text-primary"/> Informasi Tambahan</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div><label className={lbl}>Hobi</label><input className={isEditing ? inp : inpDisabled} value={profile.hobbies} onChange={(e) => isEditing && upd("hobbies", e.target.value)} placeholder="Contoh: Membaca, Olahraga, Musik" disabled={!isEditing} /></div>
                <div><label className={lbl}>SIM yang Dimiliki</label><input className={isEditing ? inp : inpDisabled} value={profile.vehicle_license} onChange={(e) => isEditing && upd("vehicle_license", e.target.value)} placeholder="A/B/C/None" disabled={!isEditing} /></div>
                <div><label className={lbl}>Alamat Domisili</label><input className={isEditing ? inp : inpDisabled} value={profile.alamat_domisili || ""} onChange={(e) => isEditing && upd("alamat_domisili", e.target.value)} placeholder="Alamat domisili" disabled={!isEditing} /></div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="has_vehicle" className="rounded" checked={profile.has_vehicle} onChange={(e) => isEditing && upd("has_vehicle", e.target.checked)} disabled={!isEditing} />
                  <label htmlFor="has_vehicle" className="text-sm">Memiliki Kendaraan</label>
                </div>
                {profile.has_vehicle && (
                  <>
                    <div><label className={lbl}>Jenis Kendaraan</label><input className={isEditing ? inp : inpDisabled} value={profile.vehicle_type} onChange={(e) => isEditing && upd("vehicle_type", e.target.value)} placeholder="Motor/Mobil" disabled={!isEditing} /></div>
                    <div><label className={lbl}>Merk Kendaraan</label><input className={isEditing ? inp : inpDisabled} value={profile.vehicle_brand} onChange={(e) => isEditing && upd("vehicle_brand", e.target.value)} disabled={!isEditing} /></div>
                  </>
                )}
                <div><label className={lbl}>Status Kepemilikan Rumah</label>
                  <select className={isEditing ? inp : inpDisabled} value={profile.home_ownership} onChange={(e) => isEditing && upd("home_ownership", e.target.value)} disabled={!isEditing}>
                    <option value="">Pilih...</option><option>Milik Sendiri</option><option>Orang Tua</option><option>Kontrak/Sewa</option><option>Kost</option>
                  </select>
                </div>
                <div><label className={lbl}>Telepon Rumah</label><input className={isEditing ? inp : inpDisabled} value={profile.home_phone} onChange={(e) => isEditing && upd("home_phone", e.target.value)} disabled={!isEditing} /></div>
                <div className="sm:col-span-2 lg:col-span-3"><label className={lbl}>Sumber Informasi Lowongan</label><input className={isEditing ? inp : inpDisabled} value={profile.source_info} onChange={(e) => isEditing && upd("source_info", e.target.value)} placeholder="Contoh: Jobstreet, LinkedIn, Referral, dll" disabled={!isEditing} /></div>
                <div className="sm:col-span-2 lg:col-span-3"><label className={lbl}>Aktivitas Sosial/Organisasi</label><textarea className={isEditing ? inp : inpDisabled} rows={2} value={profile.social_activities} onChange={(e) => isEditing && upd("social_activities", e.target.value)} disabled={!isEditing} /></div>
              </div>
            </section>

            <section className="bg-card border border-border rounded-2xl p-4 md:p-5">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/> Preferensi Kerja</h2>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" checked={profile.willing_relocate} onChange={(e) => isEditing && upd("willing_relocate", e.target.checked)} disabled={!isEditing} />
                  <span className="text-sm">Bersedia Relokasi</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" checked={profile.willing_overtime} onChange={(e) => isEditing && upd("willing_overtime", e.target.checked)} disabled={!isEditing} />
                  <span className="text-sm">Bersedia Lembur</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" checked={profile.willing_shift} onChange={(e) => isEditing && upd("willing_shift", e.target.checked)} disabled={!isEditing} />
                  <span className="text-sm">Bersedia Shift</span>
                </label>
              </div>
            </section>
          </div>
        )}

        {/* Declaration & Submit */}
        <section className="bg-card border border-border rounded-2xl p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Dengan ini saya menyatakan bahwa keterangan yang saya berikan di atas adalah <strong>BENAR</strong>.
            Bilamana ternyata terdapat ketidaksesuaian, maka saya bertanggung jawab penuh atas segala akibatnya,
            dan perusahaan berhak menghentikan proses rekrutmen tanpa tuntutan apapun dari saya.
          </p>
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            {isEditing ? (
              <>
                <button onClick={handleCancelEdit} disabled={saving} className="flex items-center gap-2 bg-muted text-foreground px-6 py-3 rounded-xl font-semibold hover:bg-muted/80 disabled:opacity-50 w-full sm:w-auto">
                  <X className="h-4 w-4" /> Batal Edit
                </button>
                <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:brightness-110 disabled:opacity-50 w-full sm:w-auto">
                  <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </>
            ) : (
              <button onClick={handleEdit} disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:brightness-110 disabled:opacity-50 w-full sm:w-auto">
                <Edit className="h-4 w-4" /> Edit
              </button>
            )}
          </div>
        </section>
        </div>
      </div>
    </CandidateLayout>
  );
}
