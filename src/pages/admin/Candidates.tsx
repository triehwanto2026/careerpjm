import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Eye, Trash2, Plus, Pencil, Upload, X, User, Users, UserPlus, MailCheck, CheckCircle, XCircle, Key, Heart, Globe, Ruler, Weight, CreditCard, Home, Car, Languages, Target, Users2, Star, MessageSquare, Link2, Briefcase, MapPin, Clock, Calendar, GraduationCap, Award, AlertCircle, ChevronRight, Bell, SettingsIcon, UserCog, Shield, ChevronDown, Workflow, Mail, Phone, FileText, Save, Brain, Download } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import DocumentPreview from "@/components/DocumentPreview";
import { supabase } from "@/integrations/supabase/client";
import { uploadCandidatePhoto } from "@/lib/photoUpload";
import { resolveStorageUrl } from "@/lib/storage";
import { buildCfitInterpretation, getCfitIqInfoFromResult } from "@/lib/cfitScoring";
import { buildDiscInterpretation } from "@/lib/discScoring";
import { buildIstInterpretation } from "@/lib/istScoring";
import { buildMbtiInterpretation, getMbtiRows, getMbtiType, isMbtiName } from "@/lib/mbtiScoring";
import { buildPapiInterpretation, getPapiRows, isPapiName, PAPI_SCALES } from "@/lib/papiScoring";
import { buildPersonalityPlusInterpretation } from "@/lib/personalityPlusScoring";

const SWAL_THEME = () => ({
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  confirmButtonColor: "hsl(174, 72%, 46%)",
});

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "Menunggu", cls: "bg-muted text-muted-foreground" },
  in_progress: { label: "Berlangsung", cls: "bg-amber-400/10 text-amber-400" },
  completed: { label: "Selesai", cls: "bg-emerald-400/10 text-emerald-400" },
  expired: { label: "Kadaluarsa", cls: "bg-destructive/10 text-destructive" },
};

const generateStrongPassword = (length = 14) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}<>?";
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

interface CandidateRow {
  id: string; name: string; email: string; phone: string; position: string;
  status: string; birth_date: string | null; education: string | null; gender: string | null;
  photo_url: string | null; created_at: string; city?: string; province?: string;
  profile_id?: string; user_id?: string | null; is_complete?: boolean;
  current_company?: string | null; experience_years?: number | null;
}

interface FormState {
  id?: string;
  name: string; 
  email: string; 
  password: string;
  phone: string; 
  position: string;
  birth_date: string; 
  education: string; 
  gender: string;
  photo_url: string | null;
  nik?: string;
  nickname?: string;
}

const emptyForm: FormState = { 
  name: "", 
  email: "", 
  password: "", 
  phone: "", 
  position: "", 
  birth_date: "", 
  education: "", 
  gender: "Laki-laki", 
  photo_url: null 
};

const safeParseArray = (value: any) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return [value];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getLatestEducationLabel = (profile: any, fallback?: string | null) => {
  const educationRows = safeParseArray(profile?.education_history);
  const latest = educationRows[educationRows.length - 1];

  if (latest) {
    const parts = [
      latest.level,
      latest.major,
      latest.institution,
      latest.year ? `Lulus ${latest.year}` : "",
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(" - ");
  }

  return profile?.education_level || fallback || null;
};

const Candidates = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active view from URL path
  const getActiveView = () => {
    if (location.pathname.includes('/candidates/new')) return 'new';
    if (location.pathname.includes('/candidates/verify')) return 'verify';
    return 'list';
  };
  
  const [activeView, setActiveView] = useState<string>(getActiveView());
  
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  
  // Email verification states
  const [unverifiedCandidates, setUnverifiedCandidates] = useState<any[]>([]);
  const [loadingUnverified, setLoadingUnverified] = useState(false);

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRow | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [candidateDocs, setCandidateDocs] = useState<any[]>([]);
  const [candidateResults, setCandidateResults] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<"personal" | "family" | "education" | "skills" | "experience" | "salary" | "documents" | "additional">("personal");
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewName, setDocPreviewName] = useState<string | undefined>(undefined);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordCandidate, setPasswordCandidate] = useState<CandidateRow | null>(null);
  const [passwordMode, setPasswordMode] = useState<"default" | "custom">("default");
  const [newCandidatePassword, setNewCandidatePassword] = useState(generateStrongPassword());
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [activeInstruments, setActiveInstruments] = useState<{ id: string; name: string }[]>([]);
  const [showPsychTestModal, setShowPsychTestModal] = useState(false);
  const [psychTestCandidate, setPsychTestCandidate] = useState<CandidateRow | null>(null);
  const [psychSelectedTests, setPsychSelectedTests] = useState<string[]>([]);
  const [psychExpiresAt, setPsychExpiresAt] = useState("");
  const [psychProcessing, setPsychProcessing] = useState(false);
  const [psychAccess, setPsychAccess] = useState<{ code: string; password: string } | null>(null);
  const [psychExistingCodes, setPsychExistingCodes] = useState<any[]>([]);
  const [psychEditCodeId, setPsychEditCodeId] = useState<string | null>(null);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Dynamic form states for edit modal
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [educationHistory, setEducationHistory] = useState<any[]>([]);
  const [workExperience, setWorkExperience] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);

  // Dynamic form handlers for edit modal
  const addFamilyMember = () => {
    setFamilyMembers([...familyMembers, { relation: '', name: '', gender: '', age: '', education: '', occupation: '', company: '' }]);
  };

  const updateFamilyMember = (index: number, field: string, value: any) => {
    const updated = [...familyMembers];
    updated[index] = { ...updated[index], [field]: value };
    setFamilyMembers(updated);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    setEducationHistory([...educationHistory, { level: '', institution: '', major: '', year: '', gpa: '' }]);
  };

  const updateEducation = (index: number, field: string, value: any) => {
    const updated = [...educationHistory];
    updated[index] = { ...updated[index], [field]: value };
    setEducationHistory(updated);
  };

  const removeEducation = (index: number) => {
    setEducationHistory(educationHistory.filter((_, i) => i !== index));
  };

  const addWorkExperience = () => {
    setWorkExperience([...workExperience, {
      company_name: '', position: '', start_date: '', end_date: '', still_working: false,
      description: '', achievements: '', salary_start: '', salary_end: ''
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

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterGender, setFilterGender] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const load = async () => {
    setLoading(true);
    const [{ data: candidateRows, error: candidateError }, { data: profileRows, error: profileError }] = await Promise.all([
      supabase.from("candidates").select("*").order("created_at", { ascending: false }),
      supabase.from("candidate_profiles").select("*").order("created_at", { ascending: false }),
    ]);

    if (candidateError) console.error("Error loading candidates:", candidateError);
    if (profileError) console.error("Error loading candidate profiles:", profileError);

    const profilesByEmail = new Map<string, any>();
    (profileRows || []).forEach((profile: any) => {
      if (profile.email) profilesByEmail.set(profile.email.toLowerCase(), profile);
    });

    const usedProfileEmails = new Set<string>();
    const mergedCandidates = ((candidateRows || []) as any[]).map((candidate) => {
      const profile = profilesByEmail.get(candidate.email?.toLowerCase());
      if (profile?.email) usedProfileEmails.add(profile.email.toLowerCase());

      return {
        ...candidate,
        profile_id: profile?.id,
        user_id: profile?.user_id,
        name: profile?.full_name || candidate.name,
        phone: profile?.phone || candidate.phone || "",
        position: profile?.current_position || candidate.position || "",
        birth_date: profile?.birth_date || candidate.birth_date || null,
        education: getLatestEducationLabel(profile, candidate.education),
        gender: profile?.gender || candidate.gender || null,
        photo_url: profile?.photo_url || candidate.photo_url || null,
        city: profile?.city || candidate.city || "",
        province: profile?.province || "",
        is_complete: Boolean(profile?.is_complete),
        current_company: profile?.current_company || null,
        experience_years: profile?.experience_years ?? null,
      } as CandidateRow;
    });

    const profileOnlyCandidates = ((profileRows || []) as any[])
      .filter((profile) => profile.email && !usedProfileEmails.has(profile.email.toLowerCase()))
      .map((profile) => ({
        id: profile.id,
        profile_id: profile.id,
        user_id: profile.user_id,
        name: profile.full_name || profile.email,
        email: profile.email,
        phone: profile.phone || "",
        position: profile.current_position || "",
        status: "pending",
        birth_date: profile.birth_date || null,
        education: getLatestEducationLabel(profile),
        gender: profile.gender || null,
        photo_url: profile.photo_url || null,
        created_at: profile.created_at,
        city: profile.city || "",
        province: profile.province || "",
        is_complete: Boolean(profile.is_complete),
        current_company: profile.current_company || null,
        experience_years: profile.experience_years ?? null,
      } as CandidateRow));

    setCandidates([...mergedCandidates, ...profileOnlyCandidates]);
    setLoading(false);
  };

  const syncMissingCandidates = async () => {
    try {
      setLoading(true);
      
      // Get all candidate profiles (these are synced from auth users)
      const { data: profiles, error: profileError } = await supabase
        .from("candidate_profiles")
        .select("user_id, email, full_name")
        .order("created_at", { ascending: false });
      
      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        Swal.fire({ 
          icon: "error", 
          title: "Gagal", 
          text: "Tidak bisa mengakses data profil kandidat",
          ...SWAL_THEME() 
        });
        setLoading(false);
        return;
      }

      if (!profiles || profiles.length === 0) {
        Swal.fire({ 
          icon: "info", 
          title: "Tidak Ada Data", 
          text: "Belum ada profil kandidat yang tersimpan",
          ...SWAL_THEME() 
        });
        setLoading(false);
        return;
      }

      // Get all emails in candidates table
      const { data: existingCandidates, error: dbError } = await supabase
        .from("candidates")
        .select("email");
      
      if (dbError) {
        Swal.fire({ 
          icon: "error", 
          title: "Gagal", 
          text: "Tidak bisa mengakses data kandidat",
          ...SWAL_THEME() 
        });
        setLoading(false);
        return;
      }

      const existingEmails = new Set((existingCandidates || []).map(c => c.email));
      
      // Find profiles not in candidates table
      const missingProfiles = (profiles as any[]).filter(p => 
        p.email && !existingEmails.has(p.email)
      );

      if (missingProfiles.length === 0) {
        Swal.fire({ 
          icon: "success", 
          title: "Sudah Sinkron", 
          text: "Semua profil sudah tercatat di tabel kandidat",
          ...SWAL_THEME() 
        });
        setLoading(false);
        return;
      }

      // Add missing profiles to candidates table
      const newCandidates = (missingProfiles as any[]).map(p => ({
        name: p.full_name || p.email.split('@')[0] || 'Unknown',
        email: p.email,
        status: "pending",
        created_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from("candidates")
        .insert(newCandidates);
      
      if (insertError) {
        console.error('Insert error:', insertError);
        Swal.fire({ 
          icon: "error", 
          title: "Gagal Sinkron", 
          text: insertError.message,
          ...SWAL_THEME() 
        });
      } else {
        Swal.fire({ 
          icon: "success", 
          title: "Sinkron Berhasil", 
          html: `<div>${missingProfiles.length} kandidat ditambahkan:<br/><br/>${missingProfiles.map(p => `<small>• ${p.email}</small>`).join('<br/>')}</div>`,
          ...SWAL_THEME() 
        });
        await load();
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('Sync error:', error);
      Swal.fire({ 
        icon: "error", 
        title: "Error", 
        text: error.message,
        ...SWAL_THEME() 
      });
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
    loadActiveInstruments();
    if (activeView === 'verify') {
      loadUnverifiedCandidates();
    }
  }, [activeView]);

  const loadActiveInstruments = async () => {
    const { data, error } = await supabase
      .from("test_instruments")
      .select("id, name")
      .eq("is_active", true)
      .order("name");
    if (error) {
      console.error("Error loading active instruments:", error);
      return;
    }
    setActiveInstruments((data as { id: string; name: string }[]) || []);
  };
  
  const loadUnverifiedCandidates = async () => {
    setLoadingUnverified(true);
    // Auth confirmation status is handled by Edge Function. The table lists profiles
    // so admin can activate login directly without requiring candidate email action.
    const { data } = await supabase
      .from('candidate_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setUnverifiedCandidates(data || []);
    setLoadingUnverified(false);
  };

  const runCandidateAuthAction = async (
    action: "activate_login" | "reset_password" | "create_or_update_user",
    candidate: Pick<CandidateRow, "email" | "name">,
    password?: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-candidate-auth", {
        body: {
          action,
          email: candidate.email,
          full_name: candidate.name,
          password,
        },
      });

      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);

      return data as { message?: string; user_id?: string; created?: boolean };
    } catch (edgeError) {
      console.warn("Edge Function unavailable, falling back to RPC:", edgeError);

      if (action === "reset_password") {
        const { data, error } = await (supabase as any).rpc("admin_reset_candidate_password", {
          candidate_email: candidate.email,
          new_password: password || "123456",
        });
        if (error) {
          const authUserMissing = String(error.message || "").toLowerCase().includes("user auth");
          if (!authUserMissing) throw new Error(error.message);

          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: candidate.email,
            password: password || "123456",
            options: {
              data: { full_name: candidate.name, created_by_admin: true },
            },
          });

          if (signUpError) throw new Error(`Gagal membuat akun login kandidat: ${signUpError.message}`);

          const { error: activateError } = await (supabase as any).rpc("admin_activate_candidate_login", {
            candidate_email: candidate.email,
          });
          if (activateError) throw new Error(activateError.message);

          if (signUpData.session) await supabase.auth.signOut();

          return {
            message: "Akun login kandidat dibuat, password diset, dan login sudah aktif",
            user_id: signUpData.user?.id,
            created: true,
          };
        }
        if (typeof data === "string" && data.trim() === "SUCCESS: Password berhasil direset") {
          throw new Error("Function reset password di database masih versi lama dan belum mengubah password. Jalankan migration terbaru 20260515070000_fix_candidate_auth_admin_functions.sql di Supabase.");
        }
        return { message: data || "Password kandidat berhasil direset", created: false };
      }

      if (action === "activate_login") {
        const { data, error } = await (supabase as any).rpc("admin_activate_candidate_login", {
          candidate_email: candidate.email,
        });
        if (error) throw new Error(error.message);
        return { message: data || "Login kandidat berhasil diaktivasi", created: false };
      }

      if (action === "create_or_update_user") {
        const passwordToUse = password?.trim() || "12345";

        let signUpData: any = null;
        let signUpError: any = null;

        const attemptSignUp = async (pwd: string) => {
          const result = await supabase.auth.signUp({
            email: candidate.email,
            password: pwd,
            options: {
              data: {
                full_name: candidate.name,
                created_by_admin: true,
              },
            },
          });
          signUpData = result.data;
          signUpError = result.error;
        };

        await attemptSignUp(passwordToUse);

        if (signUpError) {
          const errorMessage = String(signUpError.message || "").toLowerCase();
          const weakPassword = errorMessage.includes("weak") || errorMessage.includes("easy to guess");

          if (weakPassword && passwordToUse !== "12345") {
            await attemptSignUp("12345");
          }
        }

        if (signUpError) {
          const errorMessage = String(signUpError.message || "").toLowerCase();
          const alreadyExists = errorMessage.includes("already registered")
            || errorMessage.includes("already exists")
            || errorMessage.includes("duplicate")
            || errorMessage.includes("user already exists");

          if (alreadyExists) {
            const { data: resetData, error: resetError } = await (supabase as any).rpc("admin_reset_candidate_password", {
              candidate_email: candidate.email,
              new_password: passwordToUse,
            });
            if (resetError) throw new Error(resetError.message);

            const { error: activateError } = await (supabase as any).rpc("admin_activate_candidate_login", {
              candidate_email: candidate.email,
            });
            if (activateError) throw new Error(activateError.message);

            return {
              message: String(resetData) || "Password kandidat berhasil direset dan login diaktivasi",
              created: false,
            };
          }

          throw new Error(signUpError.message);
        }

        if (signUpData?.session) {
          await supabase.auth.signOut();
        }

        const { error: activateError } = await (supabase as any).rpc("admin_activate_candidate_login", {
          candidate_email: candidate.email,
        });
        if (activateError) throw new Error(activateError.message);

        return {
          message: "Akun login kandidat dibuat dan email berhasil diaktivasi",
          user_id: signUpData?.user?.id,
          created: true,
        };
      }

      throw new Error("Edge Function belum tersedia. Deploy `admin-candidate-auth` untuk membuat user auth baru dari admin.");
    }
  };
  
  const handleVerifyEmail = async (candidate: any) => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Verifikasi Email?',
      text: 'Tandai email kandidat sebagai terverifikasi?',
      showCancelButton: true,
      confirmButtonText: 'Ya, Verifikasi',
      cancelButtonText: 'Batal',
      ...SWAL_THEME()
    });
    
    if (result.isConfirmed) {
      try {
        await runCandidateAuthAction("activate_login", {
          email: candidate.email,
          name: candidate.full_name || candidate.email,
        });
        Swal.fire({ icon: 'success', title: 'Terverifikasi!', timer: 1500, showConfirmButton: false, ...SWAL_THEME() });
        loadUnverifiedCandidates();
      } catch (error: any) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: error.message, ...SWAL_THEME() });
      }
    }
  };

  const randomCodePart = (length: number) => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const isBcryptPassword = (password?: string | null) => /^\$2[aby]\$\d{2}\$/.test(String(password || ""));

  const openPsychTestModal = async (candidate: CandidateRow) => {
    setPsychTestCandidate(candidate);
    setPsychSelectedTests([]);
    setPsychExpiresAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setPsychAccess(null);
    setPsychExistingCodes([]);
    setPsychEditCodeId(null);
    setShowPsychTestModal(true);

    const { data, error } = await supabase
      .from("activation_codes")
      .select("*")
      .eq("candidate_email", candidate.email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading activation codes:", error);
      return;
    }

    const codes = data || [];
    setPsychExistingCodes(codes);
    const reusableCode = codes.find((code: any) => code.password && !isBcryptPassword(code.password));
    const latestCode = reusableCode || codes[0];
    if (latestCode) {
      setPsychEditCodeId(latestCode.id || null);
      setPsychSelectedTests(latestCode.assigned_tests || []);
      setPsychExpiresAt(latestCode.expires_at ? latestCode.expires_at.split("T")[0] : "");
      if (latestCode.password && !isBcryptPassword(latestCode.password)) {
        setPsychAccess({ code: latestCode.code, password: latestCode.password });
      }
    }
  };

  const togglePsychTest = (id: string) => {
    setPsychSelectedTests((prev) => prev.includes(id) ? prev.filter((testId) => testId !== id) : [...prev, id]);
  };

  const getPsychSelectedNames = (ids = psychSelectedTests) => ids
    .map((id) => activeInstruments.find((instrument) => instrument.id === id)?.name || id)
    .join(", ");

  const buildPsychTestMessage = () => {
    if (!psychTestCandidate || !psychAccess) return "";
    return `Yth. ${psychTestCandidate.name},

Berikut akses Tes Psikologi Anda:
Halaman tes: ${window.location.origin}/test-login
Kode: ${psychAccess.code}
Password: ${psychAccess.password}
Tes: ${getPsychSelectedNames() || "-"}

Mohon mengerjakan tes sebelum tanggal ${psychExpiresAt || "-"}.

Terima kasih.`;
  };

  const savePsychTestCode = async () => {
    if (!psychTestCandidate) return;
    if (psychSelectedTests.length === 0) {
      Swal.fire({ icon: "warning", title: "Pilih tes", text: "Pilih minimal 1 alat tes.", ...SWAL_THEME() });
      return;
    }
    setPsychProcessing(true);
    try {
      if (psychEditCodeId) {
        const { error } = await supabase
          .from("activation_codes")
          .update({
            assigned_tests: psychSelectedTests,
            expires_at: psychExpiresAt || null,
            status: "active",
          } as any)
          .eq("id", psychEditCodeId);
        if (error) throw error;

        const updatedCode = psychExistingCodes.find((code: any) => code.id === psychEditCodeId);
        if (updatedCode?.password && !isBcryptPassword(updatedCode.password)) {
          setPsychAccess({ code: updatedCode.code, password: updatedCode.password });
        }
        setPsychExistingCodes((prev) => prev.map((code: any) => code.id === psychEditCodeId ? {
          ...code,
          assigned_tests: psychSelectedTests,
          expires_at: psychExpiresAt || null,
          status: "active",
        } : code));
        Swal.fire({ icon: "success", title: "Kode Tes Diperbarui", text: "Pengaturan kode aktivasi berhasil disimpan.", timer: 1600, showConfirmButton: false, ...SWAL_THEME() });
        return;
      }

      const code = `PSY-${randomCodePart(6)}`;
      const password = randomCodePart(8);
      const payload = {
        code,
        password,
        candidate_name: psychTestCandidate.name,
        candidate_email: psychTestCandidate.email,
        position: psychTestCandidate.position || "Tes Psikologi",
        status: "active",
        expires_at: psychExpiresAt || null,
        assigned_tests: psychSelectedTests,
      };
      const { data, error } = await supabase.from("activation_codes").insert(payload as any).select("*").single();
      if (error) throw error;
      setPsychAccess({ code, password });
      setPsychEditCodeId((data as any)?.id || null);
      setPsychExistingCodes((prev) => [data || payload, ...prev]);
      Swal.fire({ icon: "success", title: "Kode Tes Dibuat", text: "Kode dan password siap dikirim ke kandidat.", timer: 1600, showConfirmButton: false, ...SWAL_THEME() });
    } catch (error: any) {
      Swal.fire({ icon: "error", title: "Gagal membuat kode tes", text: error.message || "Terjadi kesalahan.", ...SWAL_THEME() });
    } finally {
      setPsychProcessing(false);
    }
  };

  const normalizeWhatsAppPhone = (phone?: string) => {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("62")) return digits;
    if (digits.startsWith("0")) return `62${digits.slice(1)}`;
    return digits;
  };

  const sendPsychAccessWhatsApp = () => {
    if (!psychTestCandidate || !psychAccess) return;
    const phone = normalizeWhatsAppPhone(psychTestCandidate.phone);
    if (!phone) {
      Swal.fire({ icon: "warning", title: "Nomor belum tersedia", text: "Nomor WhatsApp kandidat belum tersedia.", ...SWAL_THEME() });
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(buildPsychTestMessage())}`, "_blank", "noopener,noreferrer");
  };

  const sendPsychAccessEmail = () => {
    if (!psychTestCandidate || !psychAccess) return;
    const subject = "Akses Tes Psikologi";
    window.location.href = `mailto:${psychTestCandidate.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildPsychTestMessage())}`;
  };

  const handleActivateLogin = async (candidate: CandidateRow) => {
    const r = await Swal.fire({
      icon: "question",
      title: "Aktivasi Login?",
      text: `Aktifkan login untuk ${candidate.name} tanpa perlu membuka email notifikasi?`,
      showCancelButton: true,
      confirmButtonText: "Ya, Aktifkan",
      cancelButtonText: "Batal",
      ...SWAL_THEME(),
    });

    if (!r.isConfirmed) return;

    setAuthActionLoading(true);
    try {
      const data = await runCandidateAuthAction("activate_login", candidate);
      await load();
      if (activeView === "verify") await loadUnverifiedCandidates();
      Swal.fire({
        icon: "success",
        title: "Login Aktif",
        text: data.message || "Login kandidat sudah aktif tanpa email notifikasi.",
        timer: 2200,
        showConfirmButton: false,
        ...SWAL_THEME(),
      });
    } catch (error: any) {
      const userMissing = String(error.message || "").toLowerCase().includes("user auth");
      if (userMissing) {
        const strongPassword = generateStrongPassword();
        const create = await Swal.fire({
          icon: "question",
          title: "Akun Login Belum Ada",
          html: `Buat akun login untuk ${candidate.name} dengan password yang aman dan langsung aktifkan?<br/><br/><strong>Password:</strong> <code>${strongPassword}</code>`,
          showCancelButton: true,
          confirmButtonText: "Buat & Aktifkan",
          cancelButtonText: "Batal",
          ...SWAL_THEME(),
        });

        if (create.isConfirmed) {
          setAuthActionLoading(true);
          try {
            const data = await runCandidateAuthAction("reset_password", candidate, strongPassword);
            await load();
            Swal.fire({
              icon: "success",
              title: "Login Aktif",
              text: data.message || "Akun login kandidat sudah dibuat dan aktif.",
              timer: 2200,
              showConfirmButton: false,
              ...SWAL_THEME(),
            });
          } catch (resetError: any) {
            Swal.fire({
              icon: "error",
              title: "Gagal Membuat Login",
              text: resetError.message || "Tidak bisa membuat akun login kandidat.",
              ...SWAL_THEME(),
            });
          } finally {
            setAuthActionLoading(false);
          }
        }
        return;
      }
      Swal.fire({
        icon: "error",
        title: "Gagal Aktivasi",
        text: error.message || "Tidak bisa mengaktifkan login kandidat.",
        ...SWAL_THEME(),
      });
    } finally {
      setAuthActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return '-';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} th`;
  };

  const filtered = candidates.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.position?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase()) ||
    c.education?.toLowerCase().includes(search.toLowerCase())
  ).filter((c) => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (filterGender !== "all" && c.gender !== filterGender) return false;
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedCandidates = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterStatus, filterGender]);

  const openAdd = () => { setForm(emptyForm); setShowForm(true); };
  const openEdit = (c: CandidateRow) => {
    // Load candidate profile data for edit modal
    const loadCandidateProfile = async () => {
      try {
        const { data: profile } = await supabase
          .from("candidate_profiles")
          .select("*")
          .eq("email", c.email)
          .single();
        
        if (profile) {
          setEditForm({
            ...c,
            ...profile,
            user_id: profile.user_id
          });
        } else {
          // Fallback to candidate data if no profile found
          setEditForm({
            ...c,
            full_name: c.name,
            user_id: null
          });
        }
        setShowEditModal(true);
      } catch (error) {
        console.error('Error loading candidate profile:', error);
        // Fallback to candidate data
        setEditForm({
          ...c,
          full_name: c.name,
          user_id: null
        });
        setShowEditModal(true);
      }
    };
    
    loadCandidateProfile();
  };

  const onPickFile = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: "warning", title: "File terlalu besar", text: "Maksimal 5 MB", ...SWAL_THEME() });
      return;
    }
    setUploading(true);
    const url = await uploadCandidatePhoto(file, "cand");
    setUploading(false);
    if (url) setForm(f => ({ ...f, photo_url: url }));
    else Swal.fire({ icon: "error", title: "Gagal upload foto", ...SWAL_THEME() });
  };

  const handleEditSubmit = async () => {
    // Function to handle edit form submission
    console.log('Edit form submitted:', editForm);
    
    if (!editForm || !editForm.id) {
      Swal.fire({ icon: "error", title: "Error", text: "Data kandidat tidak valid", ...SWAL_THEME() });
      return;
    }
    
    setEditLoading(true);
    
    try {
      // Update candidate profile
      const updateData: any = {
        full_name: editForm.full_name || "",
        email: editForm.email || "",
        phone: editForm.phone || "",
        birth_date: editForm.birth_date || null,
        birth_place: editForm.birth_place || "",
        gender: editForm.gender || "",
        education_level: editForm.education_level || "",
        education_institution: editForm.education_institution || "",
        education_major: editForm.education_major || editForm.major || "",
        education_year: editForm.education_year ? Number(editForm.education_year) : null,
        gpa: editForm.gpa ? Number(editForm.gpa) : null,
        current_position: editForm.current_position || "",
        current_company: editForm.current_company || "",
        experience_years: editForm.experience_years ? Number(editForm.experience_years) : 0,
        expected_salary: editForm.expected_salary ? Number(editForm.expected_salary) : null,
        bio: editForm.bio || "",
        photo_url: editForm.photo_url || null,
        linkedin_url: editForm.linkedin_url || null,
        address: editForm.address || "",
        city: editForm.city || "",
        province: editForm.province || "",
        postal_code: editForm.postal_code || "",
        marital_status: editForm.marital_status || "",
        religion: editForm.religion || "",
        nationality: editForm.nationality || "Indonesia",
        updated_at: new Date().toISOString(),
      };
      
      const extendedFields = [
        "nik", "npwp", "nickname", "blood_type", "ethnicity", "medical_history",
        "emergency_contact_name", "emergency_contact_relation", "emergency_contact_phone",
        "bpjs_kesehatan", "bpjs_ketenagakerjaan", "father_name", "mother_name",
        "spouse_name", "number_of_children", "hobbies", "vehicle_license",
        "source_info", "available_from", "notice_period", "additional_info",
        "social_media", "candidate_references", "strengths", "weaknesses",
        "hobbies", "personal_interests", "organizations", "achievements",
        "computer_skills", "other_skills", "salary_exp_base",
        "salary_exp_allowances", "salary_exp_benefits", "expected_salary_range",
        "salary_currency", "salary_requirements", "benefits_requirements",
      ];

      extendedFields.forEach((field) => {
        if (field in editForm) updateData[field] = editForm[field] ?? "";
      });

      ["height_cm", "weight_kg"].forEach((field) => {
        if (field in editForm) updateData[field] = editForm[field] ? Number(editForm[field]) : null;
      });

      ["has_vehicle", "willing_relocate", "willing_overtime", "willing_shift", "salary_negotiable"].forEach((field) => {
        if (field in editForm) updateData[field] = Boolean(editForm[field]);
      });

      const regularFamily = familyMembers.filter((member) => !["Suami", "Istri", "Anak"].includes(member.relation || member.relationship || ""));
      const immediateFamily = familyMembers.filter((member) => ["Suami", "Istri", "Anak"].includes(member.relation || member.relationship || ""));

      updateData.family_data = JSON.stringify(regularFamily);
      updateData.immediate_family_data = JSON.stringify(immediateFamily);
      updateData.family_members = JSON.stringify(familyMembers || []);
      updateData.education_history = JSON.stringify(educationHistory || []);
      updateData.work_experience = JSON.stringify(workExperience || []);
      updateData.skills = JSON.stringify(skills || []);
      updateData.languages = JSON.stringify(languages || []);
      
      // First check if profile exists, if not create it
      const { data: existingProfile } = await supabase
        .from("candidate_profiles")
        .select("*")
        .eq("email", editForm.email)
        .single();
      
      let profileError;
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase.from("candidate_profiles").update(updateData).eq("email", editForm.email);
        profileError = error;
      } else {
        // Create new profile - don't set user_id to avoid foreign key constraint
        const { error } = await supabase.from("candidate_profiles").insert({
          ...updateData,
          created_at: new Date().toISOString()
        } as any);
        profileError = error;
      }
      
      if (profileError) {
        console.error('Profile update/insert error:', profileError);
        throw profileError;
      }
      
      // Update candidate record
      const { error: candidateError } = await supabase.from("candidates").update({
        name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone,
        birth_date: editForm.birth_date,
        education: editForm.education_level,
        gender: editForm.gender,
        position: editForm.current_position,
        photo_url: editForm.photo_url,
      }).eq("id", editForm.id);
      
      if (candidateError) throw candidateError;
      
      // Refresh the page data
      await load();
      
      // Reload the form data to show updated values
      if (selectedCandidate) {
        const { data: refreshedProfile } = await supabase
          .from("candidate_profiles")
          .select("*")
          .eq("email", editForm.email)
          .single();
        
        if (refreshedProfile) {
          setEditForm({
            ...editForm,
            ...refreshedProfile
          });
        }
      }
      
      Swal.fire({ 
        icon: "success", 
        title: "Berhasil diperbarui", 
        text: "Data kandidat berhasil diperbarui",
        timer: 2000, 
        showConfirmButton: false, 
        ...SWAL_THEME() 
      });
      
      setShowEditModal(false);
    } catch (error: any) {
      console.error('Edit error:', error);
      Swal.fire({ 
        icon: "error", 
        title: "Gagal menyimpan", 
        text: error.message || "Terjadi kesalahan saat menyimpan data kandidat", 
        ...SWAL_THEME() 
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submit triggered', form);
    
    if (!form.name.trim() || !form.email.trim()) {
      Swal.fire({ icon: "warning", title: "Lengkapi data", text: "Nama dan email wajib diisi.", ...SWAL_THEME() });
      return;
    }

    const passwordToUse = form.password.trim() || "12345";
    setSaving(true);
    
    try {
      // Check for duplicate email
      const { data: existingEmail, error: emailError } = await supabase
        .from("candidates")
        .select("email")
        .eq("email", form.email)
        .single();
      
      if (existingEmail) {
        Swal.fire({ 
          icon: "error", 
          title: "Email Sudah Digunakan", 
          text: "Email ini sudah terdaftar. Gunakan email lain.", 
          ...SWAL_THEME() 
        });
        return;
      }
      
      // Check for duplicate NIK in candidate_profiles
      if (form.nik) {
        const { data: existingNIK, error: nikError } = await supabase
          .from("candidate_profiles")
          .select("nik")
          .eq("nik", form.nik)
          .single();
        
        if (existingNIK) {
          Swal.fire({ 
            icon: "error", 
            title: "NIK Sudah Terdaftar", 
            text: "Nomor NIK ini sudah terdaftar. Periksa kembali NIK yang dimasukkan.", 
            ...SWAL_THEME() 
          });
          return;
        }
      }
      
      if (form.id) {
        // Update existing candidate
        const payload = {
          name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(),
          position: form.position.trim(), birth_date: form.birth_date || null,
          education: form.education.trim() || null, gender: form.gender, photo_url: form.photo_url,
        };
        const { error } = await supabase.from("candidates").update(payload as any).eq("id", form.id);
        if (error) throw error;
      } else {
        console.log('Creating new candidate...');
        
        try {
          // Create or update Supabase Auth user through Edge Function.
          // This keeps the service-role key off the browser and confirms email immediately.
          const authData = await runCandidateAuthAction(
            "create_or_update_user",
            { email: form.email.trim(), name: form.name.trim() },
            passwordToUse
          );

          // Create candidate record
          const { data: candidateData, error: candidateError } = await supabase
            .from("candidates")
            .insert({
              name: form.name.trim(),
              email: form.email.trim(),
              phone: form.phone.trim() || "",
              position: form.position.trim() || "",
              birth_date: form.birth_date || null,
              education: form.education.trim() || null,
              gender: form.gender,
              photo_url: form.photo_url,
              status: "pending",
              created_at: new Date().toISOString(),
            })
            .select()
            .single();
          
          if (candidateError) throw candidateError;
          
          // Create candidate profile
          const profilePayload: any = {
            full_name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            birth_date: form.birth_date || null,
            gender: form.gender,
            education_level: form.education.trim() || null,
            nik: form.nik || null,
            nickname: form.nickname || null,
            created_at: new Date().toISOString(),
          };
          if (authData.user_id) {
            profilePayload.user_id = authData.user_id;
          }

          const upsertOptions = authData.user_id
            ? { onConflict: "user_id" }
            : { onConflict: "email" };

          const { error: profileError } = await supabase
            .from("candidate_profiles")
            .upsert(profilePayload as any, upsertOptions as any);
          if (profileError) {
            console.error('Profile creation error:', profileError);
            // Don't fail if profile creation fails
          }
          
          // Show success message with login credentials
          await Swal.fire({
            icon: "success",
            title: "Kandidat Berhasil Ditambahkan",
            html: `
              <div class="text-left">
                <p><strong>📧 Login Credentials:</strong></p>
                <p style="margin: 8px 0;">Email: <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${form.email.trim()}</code></p>
                <p style="margin: 8px 0;">Password: <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${passwordToUse}</code></p>
                <p style="margin-top: 12px; font-size: 12px; color: #666;">✓ Email sudah terverifikasi dan siap login</p>
                <p style="margin-top: 8px; font-size: 11px; color: #999;">Login di: /login</p>
              </div>
            `,
            ...SWAL_THEME()
          });
        } catch (error: any) {
          console.error('Create candidate error:', error);
          throw error;
        }
      }
      
      setSaving(false);
      setShowForm(false); 
      setShowAddModal(false);
      setForm(emptyForm); 
      await load();
      
      // If we're on the new view, navigate back to list
      if (activeView === 'new') {
        navigate('/admin/candidates');
      }
      
      Swal.fire({ 
        icon: "success", 
        title: form.id ? "Berhasil diperbarui" : "Kandidat ditambahkan", 
        text: form.id ? undefined : "Akun kandidat berhasil dibuat dan email sudah terverifikasi.",
        timer: 2000, 
        showConfirmButton: false, 
        ...SWAL_THEME() 
      });
    } catch (error: any) {
      console.error('Submit error:', error);
      setSaving(false);
      Swal.fire({ 
        icon: "error", 
        title: "Gagal menyimpan", 
        text: error.message || "Terjadi kesalahan saat menyimpan data kandidat", 
        ...SWAL_THEME() 
      });
    }
  };

  const handleView = async (c: CandidateRow) => {
    setSelectedCandidate(c);
    setShowDetailModal(true);
    setDetailLoading(true);
    setActiveDetailTab("personal");
    
    // Fetch detailed profile
    const { data: profileData } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("email", c.email)
      .maybeSingle();
    setCandidateProfile(profileData);
    
    // Fetch candidate documents
    const { data: docsData } = await supabase
      .from("candidate_documents")
      .select("*")
      .eq("user_id", profileData?.user_id || "")
      .order("created_at", { ascending: false });
    setCandidateDocs(docsData || []);
    
    // Fetch test results from every candidate identifier used across modules.
    const resultCandidateIds = [c.id, c.user_id, c.profile_id, profileData?.id, profileData?.user_id].filter(Boolean);
    const { data: resultsData } = resultCandidateIds.length > 0
      ? await supabase
          .from("test_results")
          .select("*, test:test_instruments(name, category)")
          .in("candidate_id", resultCandidateIds)
          .order("created_at", { ascending: false })
      : { data: [] };
    setCandidateResults(resultsData || []);
    
    setDetailLoading(false);
  };

  const handleDocumentDownload = async (doc: any) => {
    const url = String(doc?.file_url || "");
    if (!url) return;
    const resolvedUrl = await resolveStorageUrl(url);
    const anchor = document.createElement("a");
    anchor.href = resolvedUrl;
    anchor.download = formatInfoValue(doc?.file_name) !== "-" ? formatInfoValue(doc.file_name) : "dokumen-kandidat";
    anchor.target = "_blank";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const handleDelete = async (candidate: CandidateRow) => {
    const r = await Swal.fire({
      icon: "warning",
      title: "Hapus Kandidat?",
      html: `
        <div style="text-align:left;line-height:1.7">
          <p>Data <b>${candidate.name}</b> akan dihapus dari seluruh database terkait.</p>
          <p style="font-size:12px;color:#888">Termasuk profil, hasil tes, sesi tes, lamaran, dokumen, kode aktivasi, dan akun login jika ada.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus Semua",
      cancelButtonText: "Batal",
      ...SWAL_THEME(),
      confirmButtonColor: "hsl(0, 72%, 51%)",
    });

    if (!r.isConfirmed) return;

    try {
      let data = "Data kandidat berhasil dihapus seluruhnya.";
      const { data: rpcData, error } = await (supabase as any).rpc("admin_delete_candidate_account", {
        candidate_email: candidate.email,
      });

      if (error) {
        const schemaCacheMiss = String(error.message || "").includes("schema cache");
        const permissionDenied = String(error.message || "").toLowerCase().includes("permission denied for function admin_delete_candidate_account");
        if (!schemaCacheMiss && !permissionDenied) throw error;

        console.warn("Delete RPC unavailable, using table fallback:", error);
        const email = candidate.email;
        const userId = candidate.user_id;
        const candidateIds = [candidate.id, candidate.profile_id, candidate.user_id].filter(Boolean);

        if (candidateIds.length > 0) {
          const { data: resultRows } = await supabase
            .from("test_results")
            .select("id")
            .in("candidate_id", candidateIds);
          const resultIds = (resultRows || []).map((row: any) => row.id).filter(Boolean);
          if (resultIds.length > 0) {
            await supabase.from("test_answers").delete().in("test_result_id", resultIds);
          }
          await supabase.from("test_results").delete().in("candidate_id", candidateIds);
        }

        if (userId) {
          await supabase.from("job_applications").delete().eq("user_id", userId);
          await supabase.from("candidate_documents").delete().eq("user_id", userId);
          await supabase.from("notifications").delete().eq("user_id", userId);
          await supabase.from("activity_logs").delete().eq("user_id", userId);
        }

        await supabase.from("test_sessions").delete().eq("candidate_email", email);
        await supabase.from("activation_codes").delete().eq("candidate_email", email);
        await supabase.from("candidate_profiles").delete().eq("email", email);
        await supabase.from("candidates").delete().eq("email", email);
        data = permissionDenied
          ? "Data kandidat dihapus dari tabel aplikasi. Untuk menghapus akun login auth juga, jalankan migrasi permission RPC terbaru di Supabase."
          : "Data kandidat dihapus dari tabel aplikasi. Akun auth akan ikut terhapus setelah function database terbaca schema cache.";
      } else {
        data = rpcData || data;
      }

      setCandidates((prev) => prev.filter((item) => item.email.toLowerCase() !== candidate.email.toLowerCase()));
      await load();
      Swal.fire({
        icon: "success",
        title: "Kandidat Dihapus",
        text: data || "Data kandidat berhasil dihapus seluruhnya.",
        timer: 1800,
        showConfirmButton: false,
        ...SWAL_THEME(),
      });
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menghapus",
        text: error.message || "Pastikan function admin_delete_candidate_account sudah dijalankan di Supabase SQL Editor.",
        ...SWAL_THEME(),
      });
    }
  };

  const handleEdit = async (candidate: CandidateRow) => {
    try {
      setSelectedCandidate(candidate);
      setShowEditModal(true);
      setEditLoading(true);

      // Fetch detailed profile for editing
      const { data: profileData, error: profileError } = await supabase
        .from("candidate_profiles")
        .select("*")
        .eq("email", candidate.email)
        .maybeSingle();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      const profileAny = (profileData || {}) as any;
      const familyData = safeParseArray(profileAny.family_data);
      const immediateFamilyData = safeParseArray(profileAny.immediate_family_data);
      const fallbackFamilyData = safeParseArray(profileAny.family_members);
      const mergedFamilyData = familyData.length || immediateFamilyData.length
        ? [...familyData, ...immediateFamilyData]
        : fallbackFamilyData;

      setFamilyMembers(mergedFamilyData);
      setEducationHistory(safeParseArray(profileAny.education_history));
      setWorkExperience(safeParseArray(profileAny.work_experience));
      setSkills(safeParseArray(profileAny.skills));
      setLanguages(safeParseArray(profileAny.languages));

      if (profileAny.user_id) {
        const { data: docsData } = await supabase
          .from("candidate_documents")
          .select("*")
          .eq("user_id", profileAny.user_id)
          .order("created_at", { ascending: false });
        setCandidateDocs(docsData || []);
      } else {
        setCandidateDocs([]);
      }
      
      // Set edit form with candidate data - only use existing fields
      setEditForm({
        ...(profileData || {}),
        id: candidate.id,
        profile_id: profileData?.id || null,
        user_id: profileData?.user_id || null,
        full_name: profileData?.full_name || candidate.name,
        email: profileData?.email || candidate.email,
        phone: profileData?.phone || candidate.phone || '',
        birth_date: profileData?.birth_date || candidate.birth_date || '',
        gender: profileData?.gender || candidate.gender || 'Laki-laki',
        education_level: profileData?.education_level || candidate.education || '',
        current_position: profileData?.current_position || candidate.position || '',
        address: profileData?.address || '',
        city: profileData?.city || '',
        province: profileData?.province || '',
        postal_code: profileData?.postal_code || '',
        bio: profileData?.bio || '',
        education_institution: profileData?.education_institution || '',
        education_major: profileData?.education_major || '',
        education_year: profileData?.education_year || null,
        gpa: profileData?.gpa || null,
        experience_years: profileData?.experience_years || 0,
        current_company: profileData?.current_company || '',
        skills: profileData?.skills || '',
        marital_status: profileData?.marital_status || '',
        religion: profileData?.religion || '',
        nationality: profileData?.nationality || 'Indonesia',
        photo_url: profileData?.photo_url || candidate.photo_url || null,
        linkedin_url: profileData?.linkedin_url || null,
        nik: profileData?.nik || '',
        npwp: profileData?.npwp || '',
        nickname: profileData?.nickname || '',
        birth_place: profileData?.birth_place || '',
        blood_type: profileData?.blood_type || '',
        ethnicity: profileData?.ethnicity || '',
        height_cm: profileData?.height_cm || null,
        weight_kg: profileData?.weight_kg || null,
        medical_history: profileData?.medical_history || '',
        emergency_contact_name: profileData?.emergency_contact_name || '',
        emergency_contact_relation: profileData?.emergency_contact_relation || '',
        emergency_contact_phone: profileData?.emergency_contact_phone || '',
        bpjs_kesehatan: profileData?.bpjs_kesehatan || '',
        bpjs_ketenagakerjaan: profileData?.bpjs_ketenagakerjaan || '',
        father_name: profileData?.father_name || '',
        mother_name: profileData?.mother_name || '',
        spouse_name: profileData?.spouse_name || '',
        number_of_children: profileData?.number_of_children || 0,
        hobbies: profileData?.hobbies || '',
        vehicle_license: profileData?.vehicle_license || '',
        has_vehicle: profileData?.has_vehicle || false,
        source_info: profileData?.source_info || '',
        willing_relocate: profileData?.willing_relocate || false,
        willing_overtime: profileData?.willing_overtime || false,
        willing_shift: profileData?.willing_shift || false,
        expected_salary: profileData?.expected_salary || null,
        salary_negotiable: profileData?.salary_negotiable || false,
        salary_exp_base: profileData?.salary_exp_base || '',
        salary_exp_allowances: profileData?.salary_exp_allowances || '',
        salary_exp_benefits: profileData?.salary_exp_benefits || '',
        expected_salary_range: profileData?.expected_salary_range || '',
        current_salary: profileData?.current_salary || null,
        salary_currency: profileData?.salary_currency || 'IDR',
        salary_requirements: profileData?.salary_requirements || '',
        benefits_requirements: profileData?.benefits_requirements || '',
        available_from: profileData?.available_from || '',
        notice_period: profileData?.notice_period || null,
        additional_info: profileData?.additional_info || '',
        social_media: profileData?.social_media || '',
        candidate_references: profileData?.candidate_references || '',
        personal_interests: profileData?.personal_interests || '',
        organizations: profileData?.organizations || '',
        achievements: profileData?.achievements || '',
        computer_skills: profileData?.computer_skills || '',
        other_skills: profileData?.other_skills || '',
      });

      setEditLoading(false);
    } catch (error) {
      console.error('Error in handleEdit:', error);
      setEditLoading(false);
      Swal.fire({ 
        icon: "error", 
        title: "Error", 
        text: "Gagal memuat data kandidat", 
        ...SWAL_THEME() 
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm || !selectedCandidate) return;
    
    setEditLoading(true);
    try {
      // Update candidates table
      const { error: candidateError } = await supabase
        .from("candidates")
        .update({
          name: editForm.full_name,
          email: editForm.email,
          phone: editForm.phone,
          position: editForm.current_position,
          birth_date: editForm.birth_date,
          education: editForm.education_level,
          gender: editForm.gender
        })
        .eq("id", selectedCandidate.id);

      if (candidateError) throw candidateError;

      // Update candidate_profiles table
      const { error: profileError } = await supabase
        .from("candidate_profiles")
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          phone: editForm.phone,
          birth_date: editForm.birth_date,
          birth_place: editForm.birth_place,
          gender: editForm.gender,
          address: editForm.address,
          city: editForm.city,
          bio: editForm.bio,
          education_level: editForm.education_level,
          education_institution: editForm.education_institution,
          major: editForm.major,
          graduation_year: editForm.graduation_year,
          experience_years: editForm.experience_years,
          current_position: editForm.current_position,
          current_company: editForm.current_company,
          skills: editForm.skills,
          strengths: editForm.strengths,
          marital_status: editForm.marital_status,
          religion: editForm.religion,
          nationality: editForm.nationality,
          height: editForm.height,
          weight: editForm.weight,
          blood_type: editForm.blood_type,
          father_name: editForm.father_name,
          mother_name: editForm.mother_name,
          spouse_name: editForm.spouse_name,
          number_of_children: editForm.number_of_children,
          emergency_contact_name: editForm.emergency_contact_name,
          emergency_contact_relation: editForm.emergency_contact_relation,
          emergency_contact_phone: editForm.emergency_contact_phone,
          hobbies: editForm.hobbies,
          vehicle_license: editForm.vehicle_license,
          has_vehicle: editForm.has_vehicle,
          source_info: editForm.source_info,
          willing_relocate: editForm.willing_relocate,
          willing_overtime: editForm.willing_overtime,
          willing_shift: editForm.willing_shift,
          expected_salary: editForm.expected_salary,
          salary_negotiable: editForm.salary_negotiable,
          available_from: editForm.available_from,
          notice_period: editForm.notice_period,
          additional_info: editForm.additional_info,
          social_media: editForm.social_media,
          references: editForm.references
        } as any)
        .eq("email", selectedCandidate.email);

      if (profileError) throw profileError;

      await load();
      setShowEditModal(false);
      setIsEditMode(false);
      
      await Swal.fire({ 
        icon: "success", 
        title: "Data Diperbarui", 
        text: `Data kandidat ${editForm.full_name} berhasil diperbarui`,
        timer: 2000, 
        showConfirmButton: false, 
        ...SWAL_THEME() 
      });
    } catch (error: any) {
      await Swal.fire({ 
        icon: "error", 
        title: "Gagal Menyimpan", 
        text: error.message || "Terjadi kesalahan saat memperbarui data", 
        ...SWAL_THEME() 
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleResetPassword = async (candidate: CandidateRow) => {
    setPasswordCandidate(candidate);
    setPasswordMode("default");
    setNewCandidatePassword(generateStrongPassword());
    setShowPasswordModal(true);
  };

  const submitPasswordReset = async () => {
    if (!passwordCandidate) return;

    const password = newCandidatePassword.trim();
    if (password.length < 6) {
      Swal.fire({ icon: "warning", title: "Password terlalu pendek", text: "Minimal 6 karakter.", ...SWAL_THEME() });
      return;
    }

    setAuthActionLoading(true);
    try {
      const data = await runCandidateAuthAction("reset_password", passwordCandidate, password);
      await load();
      if (activeView === "verify") await loadUnverifiedCandidates();
      setShowPasswordModal(false);
      await Swal.fire({
        icon: "success",
        title: "Password Direset",
        html: `
          <div style="text-align:left;line-height:1.8">
            <p>Password untuk <b>${passwordCandidate.name}</b> berhasil direset.</p>
            <p>Email: <code style="background:#f0f0f0;padding:2px 6px;border-radius:4px">${passwordCandidate.email}</code></p>
            <p>Password: <code style="background:#f0f0f0;padding:2px 6px;border-radius:4px">${password}</code></p>
            <p style="font-size:12px;color:#777;margin-top:8px">Login sudah diaktivasi tanpa perlu membuka email notifikasi.</p>
          </div>
        `,
        ...SWAL_THEME(),
      });
      console.log(data?.message);
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal Reset",
        text: error.message || "Terjadi kesalahan saat reset password.",
        ...SWAL_THEME(),
      });
    } finally {
      setAuthActionLoading(false);
    }
  };

  const TabButton = ({ view, label, icon: Icon, path }: { view: string; label: string; icon: any; path: string }) => (
    <button
      onClick={() => navigate(path)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        activeView === view
          ? 'bg-primary text-primary-foreground'
          : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header with Tabs */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Manajemen Kandidat</h1>
              <p className="text-sm text-muted-foreground">Kelola data peserta tes</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={syncMissingCandidates}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50"
                title="Sinkronisasi kandidat yang belum tercatat"
              >
                <Users className="h-4 w-4" />
                Sinkron Kandidat
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-primary text-primary-foreground hover:brightness-110"
              >
                <UserPlus className="h-4 w-4" />
                Tambah Kandidat
              </button>
            </div>
          </div>
        </div>
        
        {/* VIEW: List Candidates */}
        {activeView === 'list' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="text" placeholder="Cari nama, email, posisi..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="in_progress">Berlangsung</option>
              <option value="completed">Selesai</option>
              <option value="expired">Kadaluarsa</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Gender</label>
            <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="all">Semua Gender</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Per Halaman</label>
            <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-12">No</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Foto & Nama & Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Jenis Kelamin & Usia</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Tgl Join & Pendidikan</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Posisi & Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Telp & Kota</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Memuat data...</td></tr>
              ) : paginatedCandidates.map((c, index) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground w-12">
                    {((currentPage - 1) * itemsPerPage) + index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {c.photo_url ? (
                        <img src={c.photo_url} alt={c.name || c.email || "Kandidat"} className="h-10 w-10 rounded-full object-cover border border-border" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                          {(c.name || c.email || "K").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{c.name || c.email || "Kandidat"}</p>
                        <p className="text-xs text-muted-foreground">{c.email || "-"}</p>
                        {c.is_complete && (
                          <span className="mt-1 inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">Profil lengkap</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    <div className="space-y-1">
                      <p className="text-xs font-medium">{c.gender || "-"}</p>
                      <p className="text-xs">{calculateAge(c.birth_date)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    <div className="space-y-1">
                      <p className="text-xs font-medium">Join: {formatDate(c.created_at)}</p>
                      <p className="text-xs">{c.education || "-"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{c.position || "-"}</p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusMap[c.status]?.cls || "bg-muted text-muted-foreground"}`}>
                        {statusMap[c.status]?.label || c.status || "-"}
                      </span>
                      {c.current_company && <p>{c.current_company}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    <div className="space-y-1">
                      <p className="font-medium">{c.phone || "-"}</p>
                      <p>{[c.city, c.province].filter(Boolean).join(", ") || "-"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openPsychTestModal(c)} className="inline-flex items-center justify-center rounded-md p-1.5 bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 transition-colors" title="Tes Psikologi">
                        <Brain className="h-4 w-4" />
                      </button>

                      <button onClick={() => handleView(c)} className="inline-flex items-center justify-center rounded-md p-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors" title="Detail">
                        <Eye className="h-4 w-4" />
                      </button>

                      <button onClick={() => handleEdit(c)} className="inline-flex items-center justify-center rounded-md p-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button onClick={() => handleResetPassword(c)} className="inline-flex items-center justify-center rounded-md p-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors" title="Reset Password">
                        <Key className="h-4 w-4" />
                      </button>

                      <button onClick={() => handleActivateLogin(c)} disabled={authActionLoading} className="inline-flex items-center justify-center rounded-md p-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50" title="Aktivasi Login Tanpa Email">
                        <CheckCircle className="h-4 w-4" />
                      </button>

                      <button onClick={() => handleDelete(c)} className="inline-flex items-center justify-center rounded-md p-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && paginatedCandidates.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">Tidak ada data ditemukan</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} kandidat
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Sebelumnya
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya →
              </button>
            </div>
          </div>
        )}
        </div>
        )}

        {/* VIEW: Aktivasi Login */}
        {activeView === 'verify' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Aktivasi Login Kandidat</h2>
                  <p className="text-sm text-muted-foreground">Aktifkan login kandidat tanpa harus membuka email notifikasi.</p>
                </div>
                <button
                  onClick={loadUnverifiedCandidates}
                  disabled={loadingUnverified}
                  className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  {loadingUnverified ? "Memuat..." : "Muat Ulang"}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nama</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingUnverified ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Memuat data...</td></tr>
                  ) : unverifiedCandidates.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Belum ada profil kandidat.</td></tr>
                  ) : unverifiedCandidates.map((candidate) => (
                    <tr key={candidate.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{candidate.full_name || "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{candidate.email}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                          Siap dicek
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleVerifyEmail(candidate)}
                            disabled={authActionLoading}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/20 disabled:opacity-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Aktivasi
                          </button>
                          <button
                            onClick={() => handleResetPassword({
                              id: candidate.id,
                              name: candidate.full_name || candidate.email,
                              email: candidate.email,
                              phone: candidate.phone || "",
                              position: candidate.current_position || "",
                              status: "pending",
                              birth_date: candidate.birth_date || null,
                              education: candidate.education_level || null,
                              gender: candidate.gender || null,
                              photo_url: candidate.photo_url || null,
                              created_at: candidate.created_at,
                              city: candidate.city || "",
                            })}
                            disabled={authActionLoading}
                            className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-500 hover:bg-amber-500/20 disabled:opacity-50"
                          >
                            <Key className="h-4 w-4" />
                            Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* VIEW: Add New Candidate */}
        {activeView === 'new' && (
          <div className="glass rounded-2xl p-6 glow-border">
            <h2 className="text-lg font-bold text-foreground mb-4">Tambah Kandidat Baru</h2>
            <p className="text-sm text-muted-foreground mb-6">Buat akun kandidat baru untuk login ke halaman kandidat. Hanya nama, email, dan password yang wajib diisi.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Nama Lengkap *</label>
                  <input type="text" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} 
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" placeholder="Nama lengkap" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} 
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" placeholder="email@contoh.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Password *</label>
                  <input type="password" required value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} 
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" placeholder="Password untuk login" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">No. Telepon</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} 
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" placeholder="08xxxxxxxxxx" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Posisi Dilamar</label>
                  <input type="text" value={form.position} onChange={e => setForm(f => ({...f, position: e.target.value}))} 
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" placeholder="Posisi yang dilamar" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Tanggal Lahir</label>
                  <input type="date" value={form.birth_date} onChange={e => setForm(f => ({...f, birth_date: e.target.value}))} 
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Gender</label>
                  <select value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))} 
                    className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4 mt-4">
                <p className="text-xs text-muted-foreground mb-2">
                  <strong>Catatan:</strong> Data lengkapan lainnya dapat diedit langsung oleh kandidat setelah login.
                </p>
                <p className="text-xs text-muted-foreground">
                  Email akan otomatis terverifikasi dan kandidat dapat langsung login.
                </p>
              </div>
              
              <div className="flex items-center gap-3 pt-4">
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50">
                  <Plus className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Buat Akun Kandidat'}
                </button>
                <button type="button" onClick={() => navigate('/admin/candidates')} className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}
        
              </div>

      {/* Form Modal - kept for inline editing */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}
            className="glass relative w-full max-w-2xl rounded-2xl glow-border max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-xl px-6 py-4">
              <h2 className="text-lg font-bold text-foreground">{form.id ? "Edit Kandidat" : "Tambah Kandidat"}</h2>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Photo */}
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-5">
                {form.photo_url ? (
                  <div className="relative">
                    <img src={form.photo_url} alt="Foto" className="h-28 w-28 rounded-full object-cover border-2 border-primary" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, photo_url: null }))} className="absolute -right-1 -top-1 rounded-full bg-destructive p-1 text-destructive-foreground"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-muted text-muted-foreground text-3xl font-bold">
                    {(form.name || form.email || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPickFile(e.target.files[0])} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50">
                  <Upload className="h-3.5 w-3.5" /> {uploading ? "Mengunggah..." : (form.photo_url ? "Ganti Foto" : "Upload Foto")}
                </button>
                <p className="text-[11px] text-muted-foreground">JPG/PNG, maks 5 MB. Foto digunakan di laporan tes.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama Lengkap *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} placeholder="John Doe" /></Field>
                <Field label="Email *"><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} placeholder="email@example.com" /></Field>
                <Field label="Telepon"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} placeholder="08xxxxxxxxxx" /></Field>
                <Field label="Posisi Dilamar"><input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={input} placeholder="Software Engineer" /></Field>
                <Field label="Tanggal Lahir"><input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className={input} /></Field>
                <Field label="Jenis Kelamin">
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={input}>
                    <option>Laki-laki</option><option>Perempuan</option>
                  </select>
                </Field>
                <div className="sm:col-span-2"><Field label="Pendidikan"><input value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className={input} placeholder="S1 Teknik Informatika - Universitas Indonesia" /></Field></div>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-border bg-card/95 backdrop-blur-xl px-6 py-3">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Batal</button>
              <button type="submit" disabled={saving || uploading} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50 glow-primary">
                {saving ? "Menyimpan..." : (form.id ? "Simpan Perubahan" : "Tambahkan")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowDetailModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="glass relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl glow-border">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-xl px-6 py-4">
              <h2 className="text-lg font-bold text-foreground">Detail Kandidat</h2>
              <button type="button" onClick={() => setShowDetailModal(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-5">
              {/* Profile Header */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {selectedCandidate.photo_url || candidateProfile?.photo_url ? (
                  <img src={selectedCandidate.photo_url || candidateProfile?.photo_url} alt={selectedCandidate.name || "Kandidat"} className="h-20 w-20 rounded-xl object-cover border border-border shadow-sm" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-primary text-2xl font-bold border border-primary/20">
                    {(selectedCandidate.name || selectedCandidate.email || "K").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold text-foreground">{selectedCandidate.name || selectedCandidate.email || "Kandidat"}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="break-all">{selectedCandidate.email}</span>
                    <span>{selectedCandidate.phone || "-"}</span>
                    <span>{formatInfoValue(selectedCandidate.position || candidateProfile?.current_position || "Posisi tidak ditentukan")}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusMap[selectedCandidate.status]?.cls}`}>
                      {statusMap[selectedCandidate.status]?.label || formatInfoValue(selectedCandidate.status)}
                    </span>
                    {candidateProfile?.is_complete && (
                      <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-emerald-400/10 text-emerald-400">
                        Profil Lengkap
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => openPsychTestModal(selectedCandidate)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-500/10 px-3 py-2 text-sm font-semibold text-violet-500 hover:bg-violet-500/20">
                  <Brain className="h-4 w-4" />
                  Tes Psikologi
                </button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Shield className="h-4 w-4 text-primary" />
                      Akses Login Kandidat
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Aktivasi login tanpa email notifikasi atau reset password kandidat.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleActivateLogin(selectedCandidate)}
                      disabled={authActionLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Aktivasi Login
                    </button>
                    <button
                      onClick={() => handleResetPassword(selectedCandidate)}
                      disabled={authActionLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-500 hover:bg-amber-500/20 disabled:opacity-50"
                    >
                      <Key className="h-4 w-4" />
                      Reset Password
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setActiveDetailTab("personal")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    activeDetailTab === "personal" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Profil Lengkap
                </button>
                <button
                  onClick={() => setActiveDetailTab("documents")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    activeDetailTab === "documents" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Dokumen ({candidateDocs.length})
                </button>
                <button
                  onClick={() => setActiveDetailTab("additional")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    activeDetailTab === "additional" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Hasil Tes ({candidateResults.length})
                </button>
              </div>

              {/* Tab Content */}
              {detailLoading ? (
                <div className="py-8 text-center text-muted-foreground">Memuat data...</div>
              ) : (
                <>
                  {activeDetailTab === "personal" && (
                    <div className="space-y-4">
                      {!candidateProfile ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Kandidat belum melengkapi profil detail
                        </div>
                      ) : (
                        <>
                          {/* Data Pribadi */}
                          <div className="bg-muted/30 rounded-xl p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><User className="h-4 w-4 text-primary" />Data Pribadi</h4>
                            <div className="grid gap-3 sm:grid-cols-2 text-sm">
                              <InfoRow label="NIK" value={candidateProfile.nik || "-"} />
                              <InfoRow label="NPWP" value={candidateProfile.npwp || "-"} />
                              <InfoRow label="Email" value={candidateProfile.email || selectedCandidate.email} />
                              <InfoRow label="Telepon" value={candidateProfile.phone || selectedCandidate.phone || "-"} />
                              <InfoRow label="Tempat Lahir" value={candidateProfile.birth_place || "-"} />
                              <InfoRow label="Tanggal Lahir" value={candidateProfile.birth_date || selectedCandidate.birth_date || "-"} />
                              <InfoRow label="Golongan Darah" value={candidateProfile.blood_type || "-"} />
                              <InfoRow label="Jenis Kelamin" value={candidateProfile.gender || selectedCandidate.gender || "-"} />
                              <InfoRow label="Status Pernikahan" value={candidateProfile.marital_status || "-"} />
                              <InfoRow label="Agama" value={candidateProfile.religion || "-"} />
                              <InfoRow label="Kewarganegaraan" value={candidateProfile.nationality || "-"} />
                            </div>
                          </div>

                          {/* Alamat */}
                          <div className="bg-muted/30 rounded-xl p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Home className="h-4 w-4 text-primary" />Alamat</h4>
                            <div className="grid gap-3 text-sm">
                              <InfoRow label="Alamat Lengkap" value={candidateProfile.address || "-"} full />
                              <div className="grid sm:grid-cols-3 gap-3">
                                <InfoRow label="Kota" value={candidateProfile.city || "-"} />
                                <InfoRow label="Provinsi" value={candidateProfile.province || "-"} />
                                <InfoRow label="Kode Pos" value={candidateProfile.postal_code || "-"} />
                              </div>
                            </div>
                          </div>

                          {/* Data Fisik */}
                          <div className="bg-muted/30 rounded-xl p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" />Data Fisik</h4>
                            <div className="grid gap-3 sm:grid-cols-4 text-sm">
                              <InfoRow label="Tinggi" value={candidateProfile.height_cm ? `${candidateProfile.height_cm} cm` : "-"} />
                              <InfoRow label="Berat" value={candidateProfile.weight_kg ? `${candidateProfile.weight_kg} kg` : "-"} />
                              <InfoRow label="Ukuran Baju" value={candidateProfile.shirt_size || "-"} />
                              <InfoRow label="Ukuran Celana" value={candidateProfile.pants_size || "-"} />
                              <InfoRow label="Ukuran Sepatu" value={candidateProfile.shoe_size || "-"} />
                              <InfoRow label="Riwayat Penyakit" value={candidateProfile.medical_history || "-"} full />
                            </div>
                          </div>

                          {/* Pendidikan */}
                          <div className="bg-muted/30 rounded-xl p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" />Pendidikan</h4>
                            <div className="grid gap-3 sm:grid-cols-2 text-sm">
                              <InfoRow label="Jenjang" value={candidateProfile.education_level || "-"} />
                              <InfoRow label="Jurusan" value={candidateProfile.education_major || "-"} />
                              <InfoRow label="Institusi" value={candidateProfile.education_institution || "-"} />
                              <InfoRow label="Tahun Lulus" value={candidateProfile.education_year || "-"} />
                              <InfoRow label="IPK" value={candidateProfile.gpa || "-"} />
                            </div>
                          </div>

                          {/* Data Keluarga */}
                          <div className="bg-muted/30 rounded-xl p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Heart className="h-4 w-4 text-primary" />Data Keluarga</h4>
                            <div className="grid gap-3 sm:grid-cols-2 text-sm">
                              <InfoRow label="Nama Ayah" value={candidateProfile.father_name || "-"} />
                              <InfoRow label="Nama Ibu" value={candidateProfile.mother_name || "-"} />
                              <InfoRow label="Nama Suami/Istri" value={candidateProfile.spouse_name || "-"} />
                              <InfoRow label="Jumlah Anak" value={candidateProfile.number_of_children || "0"} />
                            </div>
                          </div>

                          {/* Kontak Darurat */}
                          <div className="bg-muted/30 rounded-xl p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />Kontak Darurat</h4>
                            <div className="grid gap-3 sm:grid-cols-3 text-sm">
                              <InfoRow label="Nama Kontak" value={candidateProfile.emergency_contact_name || "-"} />
                              <InfoRow label="Hubungan" value={candidateProfile.emergency_contact_relation || "-"} />
                              <InfoRow label="No. Telepon" value={candidateProfile.emergency_contact_phone || "-"} />
                            </div>
                          </div>

                          {/* Informasi Lainnya */}
                          <div className="bg-muted/30 rounded-xl p-4">
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Informasi Lainnya</h4>
                            <div className="grid gap-3 sm:grid-cols-2 text-sm">
                              <InfoRow label="Hobi" value={candidateProfile.hobbies || "-"} />
                              <InfoRow label="SIM" value={candidateProfile.vehicle_license || "-"} />
                              <InfoRow label="Memiliki Kendaraan" value={candidateProfile.has_vehicle ? "Ya" : "Tidak"} />
                              <InfoRow label="Sumber Info Lowongan" value={candidateProfile.source_info || "-"} />
                              <InfoRow label="Bersedia Relokasi" value={candidateProfile.willing_relocate ? "Ya" : "Tidak"} />
                              <InfoRow label="Bersedia Lembur" value={candidateProfile.willing_overtime ? "Ya" : "Tidak"} />
                              <InfoRow label="Bersedia Shift" value={candidateProfile.willing_shift ? "Ya" : "Tidak"} />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "documents" && (
                    <div className="space-y-3">
                      {candidateDocs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Belum ada dokumen yang diupload
                        </div>
                      ) : (
                        candidateDocs.map((doc) => (
                          <div key={doc.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{formatInfoValue(doc.file_name)}</p>
                              <p className="text-xs text-muted-foreground">{formatInfoValue(doc.document_type)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setDocPreviewUrl(doc.file_url);
                                  setDocPreviewName(formatInfoValue(doc.file_name) !== "-" ? formatInfoValue(doc.file_name) : "Dokumen Kandidat");
                                }}
                                className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                title="Preview dokumen"
                                aria-label="Preview dokumen"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDocumentDownload(doc)}
                                className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-500"
                                title="Download dokumen"
                                aria-label="Download dokumen"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeDetailTab === "additional" && (
                    <div className="space-y-4">
                      {candidateResults.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Belum ada hasil tes
                        </div>
                      ) : (
                        <>
                          {(() => {
                            const scored = candidateResults.filter((result) => typeof result.score === "number");
                            const avg = scored.length ? Math.round(scored.reduce((sum, result) => sum + Number(result.score || 0), 0) / scored.length) : null;
                            const interpreted = candidateResults.filter((result) => result.interpretation).length;
                            return (
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-border bg-card p-4">
                                  <div className="text-xs text-muted-foreground">Total Tes</div>
                                  <div className="mt-1 text-2xl font-bold text-foreground">{candidateResults.length}</div>
                                </div>
                                <div className="rounded-xl border border-border bg-card p-4">
                                  <div className="text-xs text-muted-foreground">Rata-rata Skor</div>
                                  <div className="mt-1 text-2xl font-bold text-foreground">{avg ?? "-"}</div>
                                </div>
                                <div className="rounded-xl border border-border bg-card p-4">
                                  <div className="text-xs text-muted-foreground">Interpretasi</div>
                                  <div className="mt-1 text-2xl font-bold text-foreground">{interpreted}</div>
                                </div>
                              </div>
                            );
                          })()}

                          <div className="space-y-3">
                            {candidateResults.map((result) => (
                              <div key={result.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                                {(() => {
                                  const testSummary = buildPsychologicalTestSummary(result);
                                  return (
                                    <>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <h4 className="font-semibold text-foreground">{formatInfoValue((result.test as any)?.name || result.test_name || "Tes Psikologi")}</h4>
                                    <p className="text-sm text-muted-foreground">{formatInfoValue((result.test as any)?.category || result.status || "-")}</p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {testSummary.badge && (
                                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-500">
                                        {testSummary.badge}
                                      </span>
                                    )}
                                    {result.score !== null && result.score !== undefined && (
                                      <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                                        Skor {formatInfoValue(result.score)}
                                      </span>
                                    )}
                                    <span className="text-xs text-muted-foreground">{(result.completed_at || result.created_at)?.split("T")[0] || "-"}</span>
                                  </div>
                                </div>
                                <div className="mt-3 rounded-lg bg-muted/40 p-3">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Kesimpulan Interpretasi</div>
                                  {testSummary.metrics.length > 0 && (
                                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                      {testSummary.metrics.map((metric) => (
                                        <div key={`${metric.label}-${metric.value}`} className="rounded-lg border border-border bg-card px-3 py-2">
                                          <div className="text-[11px] text-muted-foreground">{metric.label}</div>
                                          <div className="mt-0.5 text-sm font-bold text-foreground">{metric.value}</div>
                                          {metric.note && <div className="mt-0.5 text-[11px] text-muted-foreground">{metric.note}</div>}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground">
                                    {testSummary.text}
                                  </p>
                                </div>
                                    </>
                                  );
                                })()}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="sticky bottom-0 flex items-center justify-end border-t border-border bg-card/95 backdrop-blur-xl px-6 py-3">
              <button onClick={() => setShowDetailModal(false)} className="rounded-lg border border-border bg-card px-5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {docPreviewUrl && (
        <DocumentPreview
          url={docPreviewUrl}
          name={docPreviewName}
          onClose={() => {
            setDocPreviewUrl(null);
            setDocPreviewName(undefined);
          }}
        />
      )}

      {showPsychTestModal && psychTestCandidate && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-2 sm:p-4">
          <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-border bg-muted/20 p-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Buat Kode Tes Psikologi</h2>
                <p className="text-sm text-muted-foreground">{psychTestCandidate.name} - {psychTestCandidate.email}</p>
              </div>
              <button onClick={() => setShowPsychTestModal(false)} className="rounded p-1 text-muted-foreground hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="font-semibold text-foreground">{psychTestCandidate.name}</span>
                  <span className="text-muted-foreground break-all">{psychTestCandidate.email}</span>
                  <span className="text-muted-foreground">{psychTestCandidate.phone || "-"}</span>
                  <span className="text-muted-foreground">{psychTestCandidate.position || "Tes Psikologi"}</span>
                </div>
              </div>

              {psychExistingCodes.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-foreground">Kode Aktivasi Tersedia</div>
                    <button
                      type="button"
                      onClick={() => {
                        setPsychEditCodeId(null);
                        setPsychSelectedTests([]);
                        setPsychExpiresAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
                        setPsychAccess(null);
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      Buat Kode Baru
                    </button>
                  </div>
                  <div className="space-y-2">
                    {psychExistingCodes.map((code: any) => {
                      const canSendPassword = code.password && !isBcryptPassword(code.password);
                      const selected = psychEditCodeId === code.id;
                      return (
                        <div key={code.id || code.code} className={`rounded-lg border p-3 ${selected ? "border-emerald-300 bg-emerald-50" : "border-border bg-background"}`}>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <div className="font-mono text-sm font-semibold text-primary">{code.code}</div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {code.assigned_tests?.length ? `Tes: ${getPsychSelectedNames(code.assigned_tests)}` : "Belum ada tes terpilih"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {code.expires_at ? `Berlaku hingga ${formatDate(code.expires_at)}` : "Tanpa tanggal expire"}
                              </div>
                              {!canSendPassword && (
                                <div className="mt-1 text-xs text-amber-600">Password lama tersimpan sebagai hash, buat kode baru untuk mengirim password asli.</div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setPsychEditCodeId(code.id || null);
                                setPsychSelectedTests(code.assigned_tests || []);
                                setPsychExpiresAt(code.expires_at ? code.expires_at.split("T")[0] : "");
                                setPsychAccess(canSendPassword ? { code: code.code, password: code.password } : null);
                              }}
                              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                            >
                              {selected ? "Sedang Diedit" : "Edit Kode"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Pilih Tes</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {activeInstruments.map((instrument) => (
                    <button
                      key={instrument.id}
                      type="button"
                      onClick={() => togglePsychTest(instrument.id)}
                      className={`min-h-12 rounded-lg border px-3 py-2 text-left transition ${psychSelectedTests.includes(instrument.id) ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted"}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium leading-tight text-foreground">{instrument.name}</span>
                        {psychSelectedTests.includes(instrument.id) && <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary" />}
                      </div>
                    </button>
                  ))}
                  {activeInstruments.length === 0 && (
                    <div className="text-sm text-muted-foreground">Tidak ada alat tes aktif.</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_1fr]">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Tanggal Expire</label>
                  <input
                    type="date"
                    value={psychExpiresAt}
                    onChange={(e) => setPsychExpiresAt(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="text-xs text-muted-foreground">Ringkasan</div>
                  <div className="mt-1 text-sm text-foreground">{psychSelectedTests.length ? `Tes dipilih: ${getPsychSelectedNames()}` : "Belum ada tes dipilih."}</div>
                </div>
              </div>

              {psychAccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                  <div className="text-sm font-semibold">Akses tes siap dikirim</div>
                  <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                    <div>Kode: <span className="font-mono font-bold">{psychAccess.code}</span></div>
                    <div>Password: <span className="font-mono font-bold">{psychAccess.password}</span></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={sendPsychAccessWhatsApp} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                      <MessageSquare className="h-4 w-4" /> Kirim WA
                    </button>
                    <button onClick={sendPsychAccessEmail} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                      <Mail className="h-4 w-4" /> Kirim Email
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-shrink-0 flex-col-reverse gap-2 border-t border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-end">
              <button onClick={() => setShowPsychTestModal(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">Batal</button>
              <button onClick={savePsychTestCode} disabled={psychProcessing} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-60">
                {psychProcessing ? "Menyimpan..." : psychEditCodeId ? "Simpan Perubahan Kode" : "Buat Kode Tes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && passwordCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowPasswordModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="glass w-full max-w-lg rounded-2xl glow-border">
            <div className="flex items-center justify-between border-b border-border bg-card/95 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Reset Password Kandidat</h2>
                <p className="text-xs text-muted-foreground">Login akan otomatis diaktivasi tanpa email notifikasi.</p>
              </div>
              <button type="button" onClick={() => setShowPasswordModal(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-semibold text-foreground">{passwordCandidate.name}</p>
                <p className="text-xs text-muted-foreground">{passwordCandidate.email}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordMode("default");
                    setNewCandidatePassword(generateStrongPassword());
                  }}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    passwordMode === "default" ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <span className="block text-sm font-semibold text-foreground">Gunakan password kuat otomatis</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Password dibuat secara otomatis dan aman.</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordMode("custom")}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    passwordMode === "custom" ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <span className="block text-sm font-semibold text-foreground">Isi Password Baru</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Tentukan password sendiri.</span>
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Password Baru</label>
                <input
                  type="text"
                  value={newCandidatePassword}
                  disabled={passwordMode === "default" || authActionLoading}
                  onChange={(e) => setNewCandidatePassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-70"
                  placeholder="Minimal 6 karakter"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border bg-card/95 px-6 py-3">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                disabled={authActionLoading}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={submitPasswordReset}
                disabled={authActionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
              >
                <Key className="h-4 w-4" />
                {authActionLoading ? "Memproses..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="glass relative w-full max-w-lg rounded-2xl glow-border max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-xl px-6 py-4">
              <h2 className="text-lg font-bold text-foreground">Tambah Kandidat Baru</h2>
              <button type="button" onClick={() => setShowAddModal(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-sm text-muted-foreground">Buat akun kandidat baru untuk login ke halaman kandidat. Hanya nama, email, dan password yang wajib diisi.</p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Nama Lengkap *</label>
                    <input type="text" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} 
                      className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" placeholder="Masukkan nama lengkap" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Email *</label>
                    <input type="email" required value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} 
                      className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" placeholder="Masukkan email" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Password *</label>
                    <input type="password" required value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} 
                      className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" placeholder="Masukkan password" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">No. Telepon</label>
                    <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} 
                      className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" placeholder="Masukkan nomor telepon" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Tanggal Lahir</label>
                    <input type="date" value={form.birth_date} onChange={e => setForm(f => ({...f, birth_date: e.target.value}))} 
                      className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Gender</label>
                    <select value={form.gender} onChange={e => setForm(f => ({...f, gender: e.target.value}))} 
                      className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-4 mt-4">
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>Catatan:</strong> Data lengkapan lainnya dapat diedit langsung oleh kandidat setelah login.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Email akan otomatis terverifikasi dan kandidat dapat langsung login.
                  </p>
                </div>
                
                <div className="flex items-center gap-3 pt-4">
                  <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50">
                    <Plus className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Buat Akun Kandidat'}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Candidate Modal - Full Profile Form */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowEditModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className="glass relative w-full max-w-4xl rounded-2xl glow-border max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-xl px-6 py-4">
              <h2 className="text-lg font-bold text-foreground">Edit Profil Kandidat</h2>
              <button type="button" onClick={() => setShowEditModal(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-2 border-b border-border pb-4">
                <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeDetailTab === "personal" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setActiveDetailTab("personal")}>
                  <Users className="h-4 w-4 inline mr-2" /> Data Diri
                </button>
                <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeDetailTab === "family" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setActiveDetailTab("family")}>
                  <Users className="h-4 w-4 inline mr-2" /> Keluarga
                </button>
                <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeDetailTab === "education" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setActiveDetailTab("education")}>
                  <Award className="h-4 w-4 inline mr-2" /> Pendidikan
                </button>
                <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeDetailTab === "skills" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setActiveDetailTab("skills")}>
                  <Award className="h-4 w-4 inline mr-2" /> Keahlian & Kepribadian
                </button>
                <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeDetailTab === "experience" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setActiveDetailTab("experience")}>
                  <Award className="h-4 w-4 inline mr-2" /> Pengalaman Kerja
                </button>
                <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeDetailTab === "salary" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setActiveDetailTab("salary")}>
                  <Award className="h-4 w-4 inline mr-2" /> Ekspektasi Gaji
                </button>
                <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeDetailTab === "documents" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setActiveDetailTab("documents")}>
                  <FileText className="h-4 w-4 inline mr-2" /> Dokumen
                </button>
                <button className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeDetailTab === "additional" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setActiveDetailTab("additional")}>
                  <Award className="h-4 w-4 inline mr-2" /> Info Tambahan
                </button>
              </div>

              {/* Data Diri Tab */}
              {activeDetailTab === "personal" && (
                <div className="space-y-4">
                  {/* Data Pribadi */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" /> Data Pribadi
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">NIK *</label>
                        <input type="text" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.nik || ''} onChange={(e) => setEditForm({...editForm, nik: e.target.value})} placeholder="16 digit" maxLength={16} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">NPWP</label>
                        <input type="text" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.npwp || ''} onChange={(e) => setEditForm({...editForm, npwp: e.target.value})} placeholder="15 digit" maxLength={15} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">No. Telepon *</label>
                        <input type="tel" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.phone || ''} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} />
                      </div>
                      <div className="lg:col-span-3">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Nama Lengkap *</label>
                        <input type="text" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.full_name || ''} onChange={(e) => setEditForm({...editForm, full_name: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Nama Panggilan</label>
                        <input type="text" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.nickname || ''} onChange={(e) => setEditForm({...editForm, nickname: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Tempat Lahir</label>
                        <input type="text" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.birth_place || ''} onChange={(e) => setEditForm({...editForm, birth_place: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Tanggal Lahir *</label>
                        <input type="date" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.birth_date || ''} onChange={(e) => setEditForm({...editForm, birth_date: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Gol. Darah</label>
                        <select className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.blood_type || ''} onChange={(e) => setEditForm({...editForm, blood_type: e.target.value})}>
                          <option value="">Pilih...</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Jenis Kelamin *</label>
                        <select className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.gender || ''} onChange={(e) => setEditForm({...editForm, gender: e.target.value})}>
                          <option value="">Pilih...</option>
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Status Pernikahan</label>
                        <select className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.marital_status || ''} onChange={(e) => setEditForm({...editForm, marital_status: e.target.value})}>
                          <option value="">Pilih...</option>
                          <option value="Belum Menikah">Belum Menikah</option>
                          <option value="Menikah">Menikah</option>
                          <option value="Cerai">Cerai</option>
                          <option value="Cerai Mati">Cerai Mati</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Agama</label>
                        <select className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.religion || ''} onChange={(e) => setEditForm({...editForm, religion: e.target.value})}>
                          <option value="">Pilih...</option>
                          <option value="Islam">Islam</option>
                          <option value="Kristen Protestan">Kristen Protestan</option>
                          <option value="Kristen Katolik">Kristen Katolik</option>
                          <option value="Hindu">Hindu</option>
                          <option value="Buddha">Buddha</option>
                          <option value="Konghucu">Konghucu</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Suku/Bangsa</label>
                        <input type="text" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.ethnicity || ''} onChange={(e) => setEditForm({...editForm, ethnicity: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">No. BPJS Kesehatan</label>
                          <input type="text" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.bpjs_kesehatan || ''} onChange={(e) => setEditForm({...editForm, bpjs_kesehatan: e.target.value})} placeholder="Nomor BPJS Kesehatan" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">No. BPJS Ketenagakerjaan</label>
                          <input type="text" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.bpjs_ketenagakerjaan || ''} onChange={(e) => setEditForm({...editForm, bpjs_ketenagakerjaan: e.target.value})} placeholder="Nomor BPJS Ketenagakerjaan" />
                        </div>
                      </div>
                      <div className="lg:col-span-3">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Alamat Lengkap *</label>
                        <textarea className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" rows={3} value={editForm?.address || ''} onChange={(e) => setEditForm({...editForm, address: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Kota</label>
                        <input type="text" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.city || ''} onChange={(e) => setEditForm({...editForm, city: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Provinsi</label>
                        <input type="text" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.province || ''} onChange={(e) => setEditForm({...editForm, province: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Kode Pos</label>
                        <input type="text" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.postal_code || ''} onChange={(e) => setEditForm({...editForm, postal_code: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  {/* Data Fisik */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" /> Data Fisik
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Tinggi (cm)</label>
                        <input type="number" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.height_cm || ''} onChange={(e) => setEditForm({...editForm, height_cm: parseInt(e.target.value) || null})} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Berat (kg)</label>
                        <input type="number" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.weight_kg || ''} onChange={(e) => setEditForm({...editForm, weight_kg: parseInt(e.target.value) || null})} />
                      </div>
                      <div className="lg:col-span-3">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Riwayat Penyakit</label>
                        <input type="text" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.medical_history || ''} onChange={(e) => setEditForm({...editForm, medical_history: e.target.value})} placeholder="Tulis 'Tidak ada' jika tidak ada" />
                      </div>
                    </div>
                  </div>

                  {/* Kontak Darurat */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" /> Kontak Darurat
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Nama Kontak</label>
                        <input type="text" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.emergency_contact_name || ''} onChange={(e) => setEditForm({...editForm, emergency_contact_name: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Hubungan</label>
                        <select className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.emergency_contact_relation || ''} onChange={(e) => setEditForm({...editForm, emergency_contact_relation: e.target.value})}>
                          <option value="">Pilih...</option>
                          <option value="Ayah">Ayah</option>
                          <option value="Ibu">Ibu</option>
                          <option value="Suami/Istri">Suami/Istri</option>
                          <option value="Anak">Anak</option>
                          <option value="Saudara">Saudara</option>
                          <option value="Teman">Teman</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">No. Telepon</label>
                        <input type="tel" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.emergency_contact_phone || ''} onChange={(e) => setEditForm({...editForm, emergency_contact_phone: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Family Tab */}
              {activeDetailTab === "family" && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" /> Data Keluarga
                    </h3>
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
                                  <button onClick={() => removeFamilyMember(index)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3 items-end">
                                  <div className="w-24">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Hubungan</label>
                                    <select className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={member.relation} onChange={(e) => updateFamilyMember(index, 'relation', e.target.value)}>
                                      <option value="">Pilih...</option>
                                      <option value="Ayah">Ayah</option>
                                      <option value="Ibu">Ibu</option>
                                      <option value="Kakak">Kakak</option>
                                      <option value="Adik">Adik</option>
                                      <option value="Suami">Suami</option>
                                      <option value="Istri">Istri</option>
                                      <option value="Anak">Anak</option>
                                    </select>
                                  </div>
                                  <div className="flex-1 min-w-[120px]">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Nama</label>
                                    <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={member.name} onChange={(e) => updateFamilyMember(index, 'name', e.target.value)} />
                                  </div>
                                  <div className="w-16">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Jenis Kelamin</label>
                                    <select className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={member.gender} onChange={(e) => updateFamilyMember(index, 'gender', e.target.value)}>
                                      <option value="">Pilih...</option>
                                      <option value="L">L</option>
                                      <option value="P">P</option>
                                    </select>
                                  </div>
                                  <div className="w-16">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Usia</label>
                                    <input type="number" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={member.age} onChange={(e) => updateFamilyMember(index, 'age', e.target.value)} />
                                  </div>
                                  <div className="w-32">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Pendidikan</label>
                                    <select className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={member.education} onChange={(e) => updateFamilyMember(index, 'education', e.target.value)}>
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
                                  <div className="flex-1 min-w-[120px]">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Pekerjaan</label>
                                    <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={member.occupation} onChange={(e) => updateFamilyMember(index, 'occupation', e.target.value)} />
                                  </div>
                                  <div className="flex-1 min-w-[120px]">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Perusahaan</label>
                                    <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={member.company} onChange={(e) => updateFamilyMember(index, 'company', e.target.value)} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={addFamilyMember} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                      <Plus className="h-4 w-4" /> Tambah Anggota Keluarga
                    </button>
                  </div>
                </div>
              )}

              {/* Education Tab */}
              {activeDetailTab === "education" && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" /> Riwayat Pendidikan
                    </h3>
                    <div className="overflow-x-auto">
                      <div className="min-w-full">
                        {educationHistory.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Award className="h-12 w-12 mx-auto mb-2 opacity-40" />
                            <p>Belum ada data pendidikan yang ditambahkan.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {educationHistory.map((edu, index) => (
                              <div key={index} className="bg-background rounded-lg border border-border p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium">Pendidikan #{index + 1}</h4>
                                  <button onClick={() => removeEducation(index)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Tingkat</label>
                                    <select className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={edu.level} onChange={(e) => updateEducation(index, 'level', e.target.value)}>
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
                                  <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Institusi</label>
                                    <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={edu.institution} onChange={(e) => updateEducation(index, 'institution', e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Jurusan</label>
                                    <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={edu.major} onChange={(e) => updateEducation(index, 'major', e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Tahun Lulus</label>
                                    <input type="number" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={edu.year} onChange={(e) => updateEducation(index, 'year', e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">IPK</label>
                                    <input type="number" step="0.01" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={edu.gpa} onChange={(e) => updateEducation(index, 'gpa', e.target.value)} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={addEducation} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                      <Plus className="h-4 w-4" /> Tambah Pendidikan
                    </button>
                  </div>
                </div>
              )}

              {/* Skills Tab */}
              {activeDetailTab === "skills" && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" /> Keahlian & Kepribadian
                    </h3>
                    <div className="overflow-x-auto">
                      <div className="min-w-full">
                        {skills.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Award className="h-12 w-12 mx-auto mb-2 opacity-40" />
                            <p>Belum ada data keahlian yang ditambahkan.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {skills.map((skill, index) => (
                              <div key={index} className="bg-background rounded-lg border border-border p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium">Keahlian #{index + 1}</h4>
                                  <button onClick={() => removeSkill(index)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Nama Keahlian</label>
                                    <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={skill.name} onChange={(e) => updateSkill(index, 'name', e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Level</label>
                                    <select className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={skill.level} onChange={(e) => updateSkill(index, 'level', e.target.value)}>
                                      <option value="">Pilih...</option>
                                      <option value="Pemula">Pemula</option>
                                      <option value="Menengah">Menengah</option>
                                      <option value="Mahir">Mahir</option>
                                      <option value="Ahli">Ahli</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={addSkill} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                      <Plus className="h-4 w-4" /> Tambah Keahlian
                    </button>
                  </div>
                </div>
              )}

              {/* Experience Tab */}
              {activeDetailTab === "experience" && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" /> Pengalaman Kerja
                    </h3>
                    <div className="overflow-x-auto">
                      <div className="min-w-full">
                        {workExperience.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Award className="h-12 w-12 mx-auto mb-2 opacity-40" />
                            <p>Belum ada data pengalaman kerja yang ditambahkan.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {workExperience.map((exp, index) => (
                              <div key={index} className="bg-background rounded-lg border border-border p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium">Pengalaman #{index + 1}</h4>
                                  <button onClick={() => removeWorkExperience(index)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Nama Perusahaan</label>
                                    <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={exp.company_name} onChange={(e) => updateWorkExperience(index, 'company_name', e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Posisi</label>
                                    <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={exp.position} onChange={(e) => updateWorkExperience(index, 'position', e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Tanggal Mulai</label>
                                    <input type="date" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={exp.start_date} onChange={(e) => updateWorkExperience(index, 'start_date', e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Tanggal Selesai</label>
                                    <input type="date" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={exp.end_date} onChange={(e) => updateWorkExperience(index, 'end_date', e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Gaji Awal</label>
                                    <input type="number" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={exp.salary_start} onChange={(e) => updateWorkExperience(index, 'salary_start', e.target.value)} />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Gaji Akhir</label>
                                    <input type="number" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={exp.salary_end} onChange={(e) => updateWorkExperience(index, 'salary_end', e.target.value)} />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Deskripsi Pekerjaan</label>
                                    <textarea className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" rows={3} value={exp.description} onChange={(e) => updateWorkExperience(index, 'description', e.target.value)} />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">Pencapaian</label>
                                    <textarea className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" rows={2} value={exp.achievements} onChange={(e) => updateWorkExperience(index, 'achievements', e.target.value)} />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button onClick={addWorkExperience} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                      <Plus className="h-4 w-4" /> Tambah Pengalaman Kerja
                    </button>
                  </div>
                </div>
              )}

              {/* Salary Tab */}
              {activeDetailTab === "salary" && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" /> Ekspektasi Gaji
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Gaji Minimum yang Diharapkan</label>
                        <input type="number" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.salary_exp_base || ''} onChange={(e) => setEditForm({...editForm, salary_exp_base: e.target.value})} placeholder="Masukkan gaji minimum" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Gaji Maximum yang Diharapkan</label>
                        <input type="number" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.expected_salary || ''} onChange={(e) => setEditForm({...editForm, expected_salary: e.target.value ? Number(e.target.value) : null})} placeholder="Masukkan gaji maximum" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Negotiable</label>
                        <select className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.salary_negotiable ? "yes" : "no"} onChange={(e) => setEditForm({...editForm, salary_negotiable: e.target.value === "yes"})}>
                          <option value="yes">Ya</option>
                          <option value="no">Tidak</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Periode Gaji</label>
                        <select className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.expected_salary_range || ''} onChange={(e) => setEditForm({...editForm, expected_salary_range: e.target.value})}>
                          <option value="">Pilih...</option>
                          <option value="monthly">Bulanan</option>
                          <option value="yearly">Tahunan</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Catatan Gaji</label>
                        <textarea className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" rows={3} value={editForm?.salary_requirements || ''} onChange={(e) => setEditForm({...editForm, salary_requirements: e.target.value})} placeholder="Catatan tambahan mengenai ekspektasi gaji"></textarea>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Benefit yang Diharapkan</label>
                        <textarea className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" rows={3} value={editForm?.salary_exp_benefits || editForm?.benefits_requirements || ''} onChange={(e) => setEditForm({...editForm, salary_exp_benefits: e.target.value, benefits_requirements: e.target.value})} placeholder="BPJS, tunjangan, bonus, dll"></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Tab */}
              {activeDetailTab === "documents" && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" /> Dokumen
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">CV/Resume</label>
                        <div className="flex items-center gap-2">
                          <input type="file" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" accept=".pdf,.doc,.docx" />
                          <button className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                            Upload
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Foto</label>
                        <div className="flex items-center gap-2">
                          <input type="file" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" accept=".jpg,.jpeg,.png" />
                          <button className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                            Upload
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">KTP</label>
                        <div className="flex items-center gap-2">
                          <input type="file" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" accept=".pdf,.jpg,.jpeg,.png" />
                          <button className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                            Upload
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Ijazah</label>
                        <div className="flex items-center gap-2">
                          <input type="file" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" accept=".pdf,.jpg,.jpeg,.png" />
                          <button className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                            Upload
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Sertifikat</label>
                        <div className="flex items-center gap-2">
                          <input type="file" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" accept=".pdf,.jpg,.jpeg,.png" />
                          <button className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                            Upload
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Surat Rekomendasi</label>
                        <div className="flex items-center gap-2">
                          <input type="file" className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" accept=".pdf,.doc,.docx" />
                          <button className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110">
                            Upload
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-medium text-sm text-foreground mb-3">Dokumen yang Telah Diunggah</h4>
                      <div className="space-y-2">
                        {candidateDocs.length === 0 ? (
                          <div className="rounded-lg border border-border bg-background p-4 text-center text-sm text-muted-foreground">
                            Belum ada dokumen yang diunggah.
                          </div>
                        ) : candidateDocs.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{formatInfoValue(doc.file_name)}</p>
                                <p className="text-xs text-muted-foreground">{formatInfoValue(doc.document_type)} - {doc.created_at ? formatDate(doc.created_at) : "-"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setDocPreviewUrl(doc.file_url);
                                  setDocPreviewName(formatInfoValue(doc.file_name) !== "-" ? formatInfoValue(doc.file_name) : "Dokumen Kandidat");
                                }}
                                className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                title="Preview dokumen"
                                aria-label="Preview dokumen"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDocumentDownload(doc)}
                                className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-emerald-500/10 hover:text-emerald-500"
                                title="Download dokumen"
                                aria-label="Download dokumen"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Tab */}
              {activeDetailTab === "additional" && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" /> Info Tambahan
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Hobi</label>
                        <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.hobbies || ''} onChange={(e) => setEditForm({...editForm, hobbies: e.target.value})} placeholder="Masukkan hobi" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Minat</label>
                        <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.personal_interests || ''} onChange={(e) => setEditForm({...editForm, personal_interests: e.target.value})} placeholder="Masukkan minat" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Organisasi</label>
                        <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.organizations || ''} onChange={(e) => setEditForm({...editForm, organizations: e.target.value})} placeholder="Masukkan organisasi" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Prestasi</label>
                        <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.achievements || ''} onChange={(e) => setEditForm({...editForm, achievements: e.target.value})} placeholder="Masukkan prestasi" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Kemampuan Bahasa</label>
                        <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={languages.map((lang) => [lang.name, lang.level].filter(Boolean).join(" - ")).join(", ")} onChange={(e) => setLanguages(e.target.value.split(",").map((item) => ({ name: item.trim(), level: "" })).filter((item) => item.name))} placeholder="Contoh: Bahasa Inggris, Mandarin" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Kemampuan Komputer</label>
                        <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.computer_skills || ''} onChange={(e) => setEditForm({...editForm, computer_skills: e.target.value})} placeholder="Contoh: MS Office, Adobe Photoshop" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Sosial Media</label>
                        <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.social_media || ''} onChange={(e) => setEditForm({...editForm, social_media: e.target.value})} placeholder="LinkedIn, Instagram, dll" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Website/Portfolio</label>
                        <input className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={editForm?.linkedin_url || ''} onChange={(e) => setEditForm({...editForm, linkedin_url: e.target.value})} placeholder="https://portfolio.com" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Referensi</label>
                        <textarea className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" rows={3} value={editForm?.candidate_references || ''} onChange={(e) => setEditForm({...editForm, candidate_references: e.target.value})} placeholder="Nama, jabatan, perusahaan, dan kontak referensi"></textarea>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Catatan Tambahan</label>
                        <textarea className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" rows={3} value={editForm?.additional_info || ''} onChange={(e) => setEditForm({...editForm, additional_info: e.target.value})} placeholder="Informasi tambahan lainnya"></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => handleEditSubmit()} disabled={editLoading} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all disabled:opacity-50">
                  <Save className="h-4 w-4" /> {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button type="button" onClick={() => setShowEditModal(false)} className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const InfoCard = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
    <p className="text-sm font-medium text-foreground">{value}</p>
  </div>
);

const formatInfoValue = (value: any) => {
  if (value == null || value === "") return "-";
  if (Array.isArray(value)) {
    const text = value
      .map((item) => {
        if (item == null || item === "") return "";
        if (typeof item === "object") return item.name || item.label || item.value || Object.values(item).filter(Boolean).join(" - ");
        return String(item);
      })
      .filter(Boolean)
      .join(", ");
    return text || "-";
  }
  if (typeof value === "object") return Object.values(value).filter(Boolean).join(" - ") || "-";
  return String(value);
};

const getResultTestName = (result: any) => formatInfoValue((result?.test as any)?.name || result?.test_name || "Tes Psikologi");

const getResultCategories = (result: any): Record<string, number> => {
  const raw = result?.categories;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, Number(value) || 0])
  );
};

type TestMetric = { label: string; value: string | number; note?: string };
type TestSummary = { badge: string; metrics: TestMetric[]; text: string };

const getDiscValue = (categories: Record<string, number>, dim: "D" | "I" | "S" | "C") => {
  const dimMap: Record<typeof dim, string> = {
    D: "Dominance",
    I: "Influence",
    S: "Steadiness",
    C: "Compliance",
  };
  return Number(
    categories[dim] ??
    categories[`${dim}_N`] ??
    categories[`${dim}_M`] ??
    categories[dimMap[dim]] ??
    categories[`${dimMap[dim]}_N`] ??
    categories[`${dimMap[dim]}_M`] ??
    0
  );
};

const getDiscMirrorValue = (categories: Record<string, number>, dim: "D" | "I" | "S" | "C") => {
  const dimMap: Record<typeof dim, string> = {
    D: "Dominance",
    I: "Influence",
    S: "Steadiness",
    C: "Compliance",
  };
  const direct = categories[dim] ?? categories[`${dim}_N`] ?? categories[dimMap[dim]] ?? categories[`${dimMap[dim]}_N`];
  if (direct !== undefined) return Number(direct) || 0;
  const most = Number(categories[`${dim}_M`] ?? categories[`${dimMap[dim]}_M`] ?? 0);
  const least = Number(categories[`${dim}_L`] ?? categories[`${dimMap[dim]}_L`] ?? 0);
  return most - least;
};

const buildDiscSummary = (result: any) => {
  const categories = getResultCategories(result);
  const dims = (["D", "I", "S", "C"] as const).map((dim) => ({ dim, value: getDiscMirrorValue(categories, dim) }));
  const sorted = [...dims].sort((a, b) => b.value - a.value);
  const dominant = sorted[0]?.dim || "D";
  const secondary = sorted[1]?.dim || "C";
  const labels: Record<string, string> = {
    D: "Dominance",
    I: "Influence",
    S: "Steadiness",
    C: "Conscientiousness",
  };
  const interpretations: Record<string, string> = {
    D: "Profil D menunjukkan pribadi tegas, cepat mengambil keputusan, kompetitif, dan berorientasi hasil. Kandidat biasanya efektif pada situasi yang membutuhkan arah, keberanian mengambil risiko, dan dorongan untuk menyelesaikan target.",
    I: "Profil I menunjukkan pribadi komunikatif, persuasif, antusias, dan mudah membangun relasi. Kandidat biasanya kuat pada pekerjaan yang membutuhkan pengaruh sosial, presentasi, negosiasi, dan engagement dengan orang lain.",
    S: "Profil S menunjukkan pribadi stabil, suportif, sabar, dan kooperatif. Kandidat biasanya nyaman pada lingkungan kerja yang membutuhkan konsistensi, kerja sama, pelayanan, dan hubungan jangka panjang.",
    C: "Profil C menunjukkan pribadi teliti, analitis, sistematis, dan memperhatikan standar mutu. Kandidat biasanya kuat pada pekerjaan yang membutuhkan akurasi, kontrol kualitas, analisis data, kepatuhan prosedur, dan detail teknis.",
  };
  const secondaryText: Record<string, string> = {
    D: "unsur ketegasan dan dorongan hasil",
    I: "unsur komunikasi dan persuasi",
    S: "unsur stabilitas dan kerja sama",
    C: "unsur ketelitian dan kontrol kualitas",
  };

  return {
    badge: `Profil ${dominant} & ${secondary}`,
    metrics: dims.map(({ dim, value }) => ({ label: `Mirror ${dim}`, value: value > 0 ? `+${value}` : value, note: labels[dim] })),
    text: buildDiscInterpretation(categories, Number(result?.total_questions || 24)),
  };
};

const buildPersonalityPlusSummary = (result: any) => {
  const categories = getResultCategories(result);
  const map: Record<string, string> = {
    K: "Koleris",
    C: "Koleris",
    Choleric: "Koleris",
    Koleris: "Koleris",
    S: "Sanguinis",
    Sanguine: "Sanguinis",
    Sanguinis: "Sanguinis",
    M: "Melankolis",
    Melancholy: "Melankolis",
    Melancholic: "Melankolis",
    Melankolis: "Melankolis",
    P: "Plegmatis",
    Phlegmatic: "Plegmatis",
    Plegmatis: "Plegmatis",
    Plegmatic: "Plegmatis",
  };
  const normalized: Record<string, number> = { Sanguinis: 0, Koleris: 0, Melankolis: 0, Plegmatis: 0 };
  Object.entries(categories).forEach(([key, value]) => {
    const target = map[key] || key;
    if (target in normalized) normalized[target] += Number(value) || 0;
  });
  const sorted = Object.entries(normalized).sort((a, b) => b[1] - a[1]);
  const [dominant, dominantValue] = sorted[0] || ["-", 0];
  const [secondary, secondaryValue] = sorted[1] || ["-", 0];
  const total = Object.values(normalized).reduce((sum, value) => sum + value, 0) || Number(result?.answered_questions) || 1;
  const pct = (value: number) => Math.round((value / total) * 100);
  const desc: Record<string, string> = {
    Sanguinis: "Sanguinis menggambarkan pribadi ekspresif, optimis, mudah bergaul, dan energik. Kekuatan utamanya ada pada komunikasi, membangun suasana, kreativitas sosial, dan kemampuan memotivasi orang.",
    Koleris: "Koleris menggambarkan pribadi tegas, mandiri, kompetitif, dan berorientasi hasil. Kekuatan utamanya ada pada kepemimpinan, pengambilan keputusan, dorongan target, dan keberanian menghadapi tantangan.",
    Melankolis: "Melankolis menggambarkan pribadi analitis, terstruktur, teliti, dan memiliki standar kualitas tinggi. Kekuatan utamanya ada pada perencanaan, evaluasi, ketelitian, konsistensi mutu, dan kedalaman berpikir.",
    Plegmatis: "Plegmatis menggambarkan pribadi tenang, sabar, diplomatis, dan kooperatif. Kekuatan utamanya ada pada stabilitas emosi, mendengarkan, menjaga harmoni, dan bekerja konsisten dalam tim.",
  };

  return {
    badge: `${dominant} / ${secondary}`,
    metrics: Object.entries(normalized).map(([label, value]) => ({ label, value, note: `${pct(value)}%` })),
    text: buildPersonalityPlusInterpretation(categories, Number(result?.total_questions || 40)),
  };
};

const CFIT_IQ_TABLE: Record<number, { iq: number; classification: string; note: string }> = {
  49: { iq: 183, classification: "Genius", note: "kemampuan penalaran nonverbal sangat luar biasa" },
  48: { iq: 179, classification: "Genius", note: "kemampuan penalaran nonverbal sangat luar biasa" },
  47: { iq: 176, classification: "Genius", note: "kemampuan penalaran nonverbal sangat luar biasa" },
  46: { iq: 173, classification: "Genius", note: "kemampuan penalaran nonverbal sangat luar biasa" },
  45: { iq: 169, classification: "Very Superior", note: "kemampuan penalaran abstrak berada pada taraf sangat tinggi" },
  44: { iq: 167, classification: "Very Superior", note: "kemampuan penalaran abstrak berada pada taraf sangat tinggi" },
  43: { iq: 165, classification: "Very Superior", note: "kemampuan penalaran abstrak berada pada taraf sangat tinggi" },
  42: { iq: 161, classification: "Very Superior", note: "kemampuan penalaran abstrak berada pada taraf sangat tinggi" },
  41: { iq: 157, classification: "Very Superior", note: "kemampuan penalaran abstrak berada pada taraf sangat tinggi" },
  40: { iq: 155, classification: "Very Superior", note: "kemampuan penalaran abstrak berada pada taraf sangat tinggi" },
  39: { iq: 152, classification: "Very Superior", note: "kemampuan penalaran abstrak berada pada taraf sangat tinggi" },
  38: { iq: 149, classification: "Very Superior", note: "kemampuan penalaran abstrak berada pada taraf sangat tinggi" },
  37: { iq: 145, classification: "Very Superior", note: "kemampuan penalaran abstrak berada pada taraf sangat tinggi" },
  36: { iq: 142, classification: "Very Superior", note: "kemampuan penalaran abstrak berada pada taraf sangat tinggi" },
  35: { iq: 140, classification: "Very Superior", note: "kemampuan penalaran abstrak berada pada taraf sangat tinggi" },
  34: { iq: 137, classification: "Superior", note: "kemampuan penalaran abstrak berada di atas rata-rata tinggi" },
  33: { iq: 133, classification: "Superior", note: "kemampuan penalaran abstrak berada di atas rata-rata tinggi" },
  32: { iq: 131, classification: "Superior", note: "kemampuan penalaran abstrak berada di atas rata-rata tinggi" },
  31: { iq: 128, classification: "Superior", note: "kemampuan penalaran abstrak berada di atas rata-rata tinggi" },
  30: { iq: 124, classification: "Superior", note: "kemampuan penalaran abstrak berada di atas rata-rata tinggi" },
  29: { iq: 121, classification: "Superior", note: "kemampuan penalaran abstrak berada di atas rata-rata tinggi" },
  28: { iq: 119, classification: "High Average", note: "kemampuan penalaran nonverbal berada di atas rata-rata" },
  27: { iq: 116, classification: "High Average", note: "kemampuan penalaran nonverbal berada di atas rata-rata" },
  26: { iq: 113, classification: "High Average", note: "kemampuan penalaran nonverbal berada di atas rata-rata" },
  25: { iq: 109, classification: "Average", note: "kemampuan penalaran nonverbal berada pada taraf rata-rata" },
  24: { iq: 106, classification: "Average", note: "kemampuan penalaran nonverbal berada pada taraf rata-rata" },
  23: { iq: 103, classification: "Average", note: "kemampuan penalaran nonverbal berada pada taraf rata-rata" },
  22: { iq: 100, classification: "Average", note: "kemampuan penalaran nonverbal berada pada taraf rata-rata" },
  21: { iq: 96, classification: "Average", note: "kemampuan penalaran nonverbal berada pada taraf rata-rata" },
  20: { iq: 94, classification: "Average", note: "kemampuan penalaran nonverbal berada pada taraf rata-rata" },
  19: { iq: 91, classification: "Average", note: "kemampuan penalaran nonverbal berada pada taraf rata-rata" },
  18: { iq: 88, classification: "Low Average", note: "kemampuan penalaran nonverbal berada sedikit di bawah rata-rata" },
  17: { iq: 85, classification: "Low Average", note: "kemampuan penalaran nonverbal berada sedikit di bawah rata-rata" },
  16: { iq: 81, classification: "Low Average", note: "kemampuan penalaran nonverbal berada sedikit di bawah rata-rata" },
  15: { iq: 78, classification: "Borderline", note: "kemampuan penalaran nonverbal berada pada taraf rendah dan membutuhkan dukungan struktur kerja yang jelas" },
  14: { iq: 75, classification: "Borderline", note: "kemampuan penalaran nonverbal berada pada taraf rendah dan membutuhkan dukungan struktur kerja yang jelas" },
  13: { iq: 72, classification: "Borderline", note: "kemampuan penalaran nonverbal berada pada taraf rendah dan membutuhkan dukungan struktur kerja yang jelas" },
  12: { iq: 70, classification: "Borderline", note: "kemampuan penalaran nonverbal berada pada taraf rendah dan membutuhkan dukungan struktur kerja yang jelas" },
  11: { iq: 67, classification: "Mild", note: "hasil perlu dibaca hati-hati dan dikonfirmasi dengan observasi serta data pendukung" },
  10: { iq: 65, classification: "Mild", note: "hasil perlu dibaca hati-hati dan dikonfirmasi dengan observasi serta data pendukung" },
  9: { iq: 60, classification: "Mild", note: "hasil perlu dibaca hati-hati dan dikonfirmasi dengan observasi serta data pendukung" },
  8: { iq: 57, classification: "Mild", note: "hasil perlu dibaca hati-hati dan dikonfirmasi dengan observasi serta data pendukung" },
  7: { iq: 55, classification: "Mild", note: "hasil perlu dibaca hati-hati dan dikonfirmasi dengan observasi serta data pendukung" },
  6: { iq: 52, classification: "Mild", note: "hasil perlu dibaca hati-hati dan dikonfirmasi dengan observasi serta data pendukung" },
  5: { iq: 48, classification: "Moderate", note: "hasil perlu dibaca hati-hati dan dikonfirmasi dengan observasi serta data pendukung" },
  4: { iq: 47, classification: "Moderate", note: "hasil perlu dibaca hati-hati dan dikonfirmasi dengan observasi serta data pendukung" },
  3: { iq: 45, classification: "Moderate", note: "hasil perlu dibaca hati-hati dan dikonfirmasi dengan observasi serta data pendukung" },
  2: { iq: 43, classification: "Moderate", note: "hasil perlu dibaca hati-hati dan dikonfirmasi dengan observasi serta data pendukung" },
  1: { iq: 40, classification: "Moderate", note: "hasil perlu dibaca hati-hati dan dikonfirmasi dengan observasi serta data pendukung" },
  0: { iq: 38, classification: "Moderate", note: "hasil perlu dibaca hati-hati dan dikonfirmasi dengan observasi serta data pendukung" },
};

const buildCfitSummary = (result: any) => {
  const info = getCfitIqInfoFromResult(result);

  return {
    badge: `IQ ${info.iq}`,
    metrics: [
      { label: "IQ", value: info.iq },
      { label: "Klasifikasi", value: info.classification },
      { label: "Raw Score", value: `${info.raw}/${info.max}` },
      { label: "Area Ukur", value: "Nonverbal", note: "pola & abstraksi" },
    ],
    text: buildCfitInterpretation(result),
  };
};

const IST_SUBTESTS_FOR_CANDIDATE = [
  { code: "SE", name: "Sentence Completion", max: 20, area: "pemahaman konsep verbal" },
  { code: "WA", name: "Word Association", max: 20, area: "abstraksi verbal" },
  { code: "AN", name: "Analogy", max: 20, area: "penalaran analogis" },
  { code: "GE", name: "Generalization", max: 16, area: "generalisasi konsep" },
  { code: "RA", name: "Arithmetic", max: 20, area: "berhitung praktis" },
  { code: "ZR", name: "Number Series", max: 20, area: "pola numerik" },
  { code: "FA", name: "Figure Assembly", max: 20, area: "analisis figural" },
  { code: "WU", name: "Cube Rotation", max: 20, area: "daya ruang" },
  { code: "ME", name: "Memory", max: 20, area: "daya ingat" },
];

const isIstCandidateResult = (result: any) => {
  const testName = getResultTestName(result).toUpperCase();
  const keys = Object.keys(getResultCategories(result));
  return testName.includes("IST") || keys.some((key) => /^(SE|WA|AN|GE|RA|ZR|FA|WU|ME)(\s*-|$)/i.test(key));
};

const getIstCandidateRows = (categories: Record<string, number>) => IST_SUBTESTS_FOR_CANDIDATE.map((subtest) => {
  const match = Object.entries(categories).find(([key]) => key === subtest.code || key.startsWith(`${subtest.code} -`));
  const raw = Number(match?.[1] || 0);
  const pct = Math.round((raw / subtest.max) * 100);
  const level = pct >= 80 ? "Sangat Tinggi" : pct >= 65 ? "Tinggi" : pct >= 45 ? "Sedang" : pct >= 30 ? "Rendah" : "Sangat Rendah";
  return { ...subtest, raw, pct, level };
});

const buildIstSummary = (result: any): TestSummary => {
  const categories = getResultCategories(result);
  const rows = getIstCandidateRows(categories);
  const raw = Number(categories["IST Raw Score"] ?? rows.reduce((sum, row) => sum + row.raw, 0));
  const max = Number(categories["IST Max Score"] ?? rows.reduce((sum, row) => sum + row.max, 0));
  const score = max > 0 ? Math.round((raw / max) * 100) : Number(result?.score || 0);
  const strongest = [...rows].sort((a, b) => b.pct - a.pct)[0];
  const weakest = [...rows].sort((a, b) => a.pct - b.pct)[0];
  const overall = score >= 80 ? "sangat tinggi" : score >= 65 ? "tinggi" : score >= 45 ? "sedang" : score >= 30 ? "rendah" : "sangat rendah";

  return {
    badge: `IST ${score}%`,
    metrics: rows.map((row) => ({ label: row.code, value: `${row.raw}/${row.max}`, note: `${row.level} - ${row.area}` })),
    text: buildIstInterpretation(categories, Number(result?.score || 0)),
  };
};

const isMbtiCandidateResult = (result: any) => {
  const categories = getResultCategories(result);
  const keys = Object.keys(categories);
  return isMbtiName(getResultTestName(result)) || ["E", "I", "S", "N", "T", "F", "J", "P"].every((key) => keys.includes(key));
};

const buildMbtiSummary = (result: any): TestSummary => {
  const categories = getResultCategories(result);
  const rows = getMbtiRows(categories);
  const type = getMbtiType(categories);

  return {
    badge: type,
    metrics: rows.map((row) => ({ label: row.pair, value: `${row.a} ${row.av} / ${row.b} ${row.bv}`, note: `Dominan ${row.dominant} (${row.strength}%)` })),
    text: buildMbtiInterpretation(categories),
  };
};

const KRAEPELIN_KEYS = [
  { key: "speed", label: "Kecepatan" },
  { key: "accuracy", label: "Ketelitian" },
  { key: "stability", label: "Stabilitas" },
  { key: "work_capacity", label: "Kapasitas Kerja" },
];

const buildKraepelinSummary = (result: any): TestSummary => {
  const categories = getResultCategories(result);
  const rows = KRAEPELIN_KEYS.map((item) => ({ ...item, value: Number(categories[item.key] ?? result?.[`${item.key}_score`] ?? result?.[item.key] ?? 0) }));
  const level = (value: number) => value >= 80 ? "Sangat Tinggi" : value >= 60 ? "Tinggi" : value >= 40 ? "Sedang" : value >= 20 ? "Rendah" : "Sangat Rendah";
  const best = [...rows].sort((a, b) => b.value - a.value)[0];
  const watch = [...rows].sort((a, b) => a.value - b.value)[0];

  return {
    badge: `Kuat: ${best.label}`,
    metrics: rows.map((row) => ({ label: row.label, value: `${row.value}%`, note: level(row.value) })),
    text: `Profil Kraepelin menunjukkan kekuatan relatif pada aspek ${best.label.toLowerCase()} dan area perhatian pada ${watch.label.toLowerCase()}.\n\nTes ini menggambarkan pola kerja dalam tekanan waktu: tempo kerja, ketelitian, stabilitas performa, dan daya tahan menyelesaikan tugas rutin. Interpretasi akhir perlu memperhatikan jenis pekerjaan, tuntutan target, dan toleransi kesalahan pada posisi yang dilamar.`,
  };
};

const PAPI_LABELS_FOR_CANDIDATE: Record<string, string> = Object.fromEntries(PAPI_SCALES.map((scale) => [scale.code, scale.label]));

const isPapiCandidateResult = (result: any) => {
  const name = getResultTestName(result).toUpperCase();
  const keys = Object.keys(getResultCategories(result));
  return isPapiName(name) || (!name.includes("DISC") && keys.filter((key) => PAPI_LABELS_FOR_CANDIDATE[key]).length >= 8);
};

const buildPapiSummary = (result: any): TestSummary => {
  const categories = getResultCategories(result);
  const rows = getPapiRows(categories)
    .sort((a, b) => b.value - a.value || a.code.localeCompare(b.code));
  const top = rows.filter((row) => row.value > 0).slice(0, 4);

  return {
    badge: top[0] ? `${top[0].code} ${top[0].value}/${top[0].max}` : "PAPI",
    metrics: top.map((row) => ({ label: `${row.code} - ${row.label}`, value: `${row.value}/${row.max}`, note: row.level })),
    text: buildPapiInterpretation(categories),
  };
};

const isTechnicalCompletionInterpretation = (value: any) => {
  const text = formatInfoValue(value).toLowerCase();
  return text.includes("kandidat menjawab") || text.includes("skor akhir") || text.includes("jawaban benar");
};

const buildPsychologicalTestSummary = (result: any) => {
  const testName = getResultTestName(result);
  const upperName = testName.toUpperCase();
  if (upperName.includes("DISC")) return buildDiscSummary(result);
  if (upperName.includes("PERSONALITY PLUS") || upperName.includes("TEMPERAMEN")) return buildPersonalityPlusSummary(result);
  if (upperName.includes("CFIT") || upperName.includes("CULTURE FAIR")) return buildCfitSummary(result);
  if (isIstCandidateResult(result)) return buildIstSummary(result);
  if (isMbtiCandidateResult(result)) return buildMbtiSummary(result);
  if (upperName.includes("KRAEPELIN")) return buildKraepelinSummary(result);
  if (isPapiCandidateResult(result)) return buildPapiSummary(result);

  const savedInterpretation = formatInfoValue(result?.interpretation);
  if (savedInterpretation !== "-" && !isTechnicalCompletionInterpretation(savedInterpretation)) {
    return { badge: "", metrics: [], text: savedInterpretation };
  }

  return {
    badge: "",
    metrics: [],
    text: "Belum ada interpretasi psikologis tersimpan untuk hasil tes ini. Silakan lengkapi interpretasi pada Manajer Interpretasi atau halaman hasil tes.",
  };
};

const InfoRow = ({ label, value, full }: { label: string; value: any; full?: boolean }) => (
  <div className={`${full ? 'sm:col-span-2' : ''} flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3`}>
    <span className="text-xs text-muted-foreground sm:w-32 shrink-0">{label}</span>
    <span className="text-foreground font-medium break-words">{formatInfoValue(value)}</span>
  </div>
);

const input = "w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-semibold text-muted-foreground">{label}</span>
    {children}
  </label>
);

export default Candidates;
