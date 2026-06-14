import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Users, Search, Filter, Download, Eye, Mail, Phone, Calendar, Briefcase, MapPin, GraduationCap, Award, CheckCircle, XCircle, Clock, AlertCircle, FileText, MoreVertical, Edit, Trash2, Building2, User, Camera, BookOpen, FolderOpen, Heart, Globe, Ruler, Weight, CreditCard, Home, Car, Languages, Target, Users2, Star, MessageSquare, Link2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "../../integrations/supabase/client";
import Swal from "sweetalert2";
import ProfessionalResume from "../../components/admin/ProfessionalResume";
import DocumentPreview from "@/components/DocumentPreview";
import ProfessionalApplicationForm from "../../components/admin/ProfessionalApplicationForm";
import { syncExpiredRecruitment } from "@/lib/recruitmentExpiry";

interface Doc {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
}

const SWAL_THEME = () => ({
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  confirmButtonColor: "hsl(174, 72%, 46%)",
});

interface CandidateProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  birth_date: string;
  birth_place: string;
  gender: string;
  address: string;
  city: string;
  bio: string;
  education_level: string;
  education_institution: string;
  major: string;
  graduation_year: string;
  experience_years: string;
  current_position: string;
  current_company: string;
  skills: string | string[];
  strengths: string;
  created_at: string;
  updated_at: string;
  applications: any[];
  has_applied: boolean;
  photo_url?: string;
  cv_url?: string;
  certificates?: string[];
  portfolio_url?: string;
  // Additional fields for comprehensive profile
  marital_status?: string;
  religion?: string;
  nationality?: string;
  height?: string;
  weight?: string;
  blood_type?: string;
  id_card_number?: string;
  nik?: string;
  passport_number?: string;
  driving_license?: string;
  family_members?: any[];
  education_history?: any[];
  work_experience?: any[];
  expected_salary?: string;
  salary_negotiable?: boolean;
  available_start_date?: string;
  willing_to_relocate?: boolean;
  languages?: any[];
  hobbies?: string[];
  references?: any[];
  social_media?: any;
  additional_info?: string;
  // Additional extended fields
  height_cm?: number;
  weight_kg?: number;
  vehicle_license?: string;
  has_vehicle?: boolean;
  vehicle_type?: string;
  vehicle_brand?: string;
  home_ownership?: string;
  home_phone?: string;
  alamat_domisili?: string;
  source_info?: string;
  social_activities?: string;
  available_from?: string;
  notice_period?: number;
  willing_overtime?: boolean;
  willing_shift?: boolean;
  salary_exp_base?: string;
  salary_exp_allowances?: string;
  salary_exp_benefits?: string;
  salary_expectation?: string;
}

export default function Applicants() {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [educationFilter, setEducationFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [documentFilter, setDocumentFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [dateField, setDateField] = useState<"registered" | "applied">("registered");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [showDocPreview, setShowDocPreview] = useState(false);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewName, setDocPreviewName] = useState<string | undefined>(undefined);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [contactDraft, setContactDraft] = useState("");
  const [activeInstruments, setActiveInstruments] = useState<{ id: string; name: string }[]>([]);
  const [showApplicantTestModal, setShowApplicantTestModal] = useState(false);
  const [applicantTestSelectedTests, setApplicantTestSelectedTests] = useState<string[]>([]);
  const [applicantTestExpiresAt, setApplicantTestExpiresAt] = useState("");
  const [applicantTestProcessing, setApplicantTestProcessing] = useState(false);
  const [applicantExistingCodes, setApplicantExistingCodes] = useState<any[]>([]);
  const [applicantTestAccess, setApplicantTestAccess] = useState<{ code: string; password: string } | null>(null);
  const [applicantEditCodeId, setApplicantEditCodeId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadCandidates();
    loadActiveInstruments();
  }, []);

  useEffect(() => {
    // Check for candidate parameter from RecruitmentProcess
    const candidateId = searchParams.get('candidate');
    if (candidateId && candidates.length > 0) {
      const candidate = candidates.find(c => c.user_id === candidateId);
      if (candidate) {
        viewCandidateDetail(candidate);
        // Remove the parameter from URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('candidate');
        window.history.replaceState({}, '', `${window.location.pathname}?${newSearchParams.toString()}`);
      }
    }
  }, [searchParams, candidates]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      await syncExpiredRecruitment();
      console.log("Starting to load candidates...");
      
      // Load all candidates first
      const { data: candidatesData, error: candidatesError } = await supabase
        .from("candidate_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (candidatesError) {
        console.error("Candidates error:", candidatesError);
        throw candidatesError;
      }

      const userIds = (candidatesData || []).map((c: any) => c.user_id).filter(Boolean);
      const { data: documentsData, error: documentsError } = userIds.length > 0
        ? await supabase.from("candidate_documents").select("*").in("user_id", userIds)
        : { data: [], error: null };

      if (documentsError) {
        console.error("Documents error:", documentsError);
        throw documentsError;
      }

      const docsByUser = (documentsData as any[] || []).reduce((acc: Record<string, any[]>, doc: any) => {
        if (!acc[doc.user_id]) acc[doc.user_id] = [];
        acc[doc.user_id].push(doc);
        return acc;
      }, {});

      // Get applications for each candidate and parse JSON fields
      const candidatesWithApplications = await Promise.all(
        (candidatesData || []).map(async (candidate: any) => {
          const { data: applicationsData, error: applicationsError } = await supabase
            .from("job_applications")
            .select(`
              id,
              vacancy_id,
              status,
              applied_at,
              job_vacancies(
                id,
                title,
                department,
                closes_at
              )
            `)
            .eq("user_id", candidate.user_id);

          // Helper function to safely parse JSON fields
          const safeParseJSON = (value: any, defaultValue: any) => {
            if (!value) return defaultValue;
            if (Array.isArray(value)) return value;
            if (typeof value === 'object') return value;
            try {
              return JSON.parse(value);
            } catch (e) {
              console.warn('Failed to parse JSON field in loadCandidates:', e);
              return defaultValue;
            }
          };

          // Parse array fields for each candidate
          const parsedCandidate = {
            ...candidate,
            family_members: safeParseJSON(candidate.family_members, []),
            education_history: safeParseJSON(candidate.education_history, []),
            languages: safeParseJSON(candidate.languages, []),
            hobbies: safeParseJSON(candidate.hobbies, []),
            work_experience: safeParseJSON(candidate.work_experience, []),
            certificates: safeParseJSON(candidate.certificates, []),
            references: safeParseJSON(candidate.references, []),
            social_media: safeParseJSON(candidate.social_media, {}),
            skills: safeParseJSON(candidate.skills, []),
            applications: applicationsData || [],
            documents: docsByUser[candidate.user_id] || [],
            has_applied: (applicationsData || []).length > 0
          };

          // Debug logging for specific candidate
          console.log('Parsed candidate skills:', parsedCandidate.skills);
          console.log('Parsed candidate work_experience:', parsedCandidate.work_experience);
          console.log('Raw skills from DB:', candidate.skills);
          console.log('Raw work_experience from DB:', candidate.work_experience);
          
          // Debug logging for salary fields
          console.log('Raw salary_exp_base from DB:', candidate.salary_exp_base);
          console.log('Raw salary_exp_allowances from DB:', candidate.salary_exp_allowances);
          console.log('Raw salary_exp_benefits from DB:', candidate.salary_exp_benefits);
          console.log('Raw expected_salary from DB:', candidate.expected_salary);
          console.log('Raw salary_expectation from DB:', candidate.salary_expectation);
          console.log('Parsed salary_exp_base:', (parsedCandidate as any).salary_exp_base);
          console.log('Parsed salary_exp_allowances:', (parsedCandidate as any).salary_exp_allowances);
          console.log('Parsed salary_exp_benefits:', (parsedCandidate as any).salary_exp_benefits);

          return parsedCandidate;
        })
      );

      console.log("Raw candidates data:", candidatesData);
      console.log("Number of candidates:", candidatesData?.length || 0);
      
      console.log("Mapped candidates data:", candidatesWithApplications);
      setCandidates(candidatesWithApplications);
    } catch (error) {
      console.error("Error loading candidates:", error);
      // Set empty array on error to prevent blank page
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveInstruments = async () => {
    try {
      const { data, error } = await supabase
        .from("test_instruments")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      setActiveInstruments((data as { id: string; name: string }[]) || []);
    } catch (error) {
      console.error("Error loading active instruments:", error);
    }
  };

  const candidateMatchesStatusFilter = (candidate: CandidateProfile) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "not_applied") return !candidate.has_applied;
    return candidate.applications?.some((app) => app.status === statusFilter);
  };

  const getCandidateDateValue = (candidate: CandidateProfile) => {
    if (dateField === "applied") {
      const dates = (candidate.applications || [])
        .map((app) => app.applied_at ? new Date(app.applied_at).getTime() : 0)
        .filter(Boolean);
      return dates.length ? Math.max(...dates) : null;
    }
    return candidate.created_at ? new Date(candidate.created_at).getTime() : null;
  };

  const hasRequiredDocument = (candidate: CandidateProfile, type: string) => {
    const docs = ((candidate as any).documents || []) as Doc[];
    if (type === "cv") return docs.some((doc) => doc.document_type === "cv") || Boolean(candidate.cv_url);
    if (type === "photo") return docs.some((doc) => doc.document_type === "photo") || Boolean(candidate.photo_url);
    return docs.some((doc) => doc.document_type === type);
  };

  const profileCompletionScore = (candidate: CandidateProfile) => {
    const checks = [
      candidate.full_name, candidate.email, candidate.phone, candidate.birth_date, candidate.gender,
      candidate.address, candidate.education_level, candidate.education_institution, candidate.major,
      candidate.current_position, candidate.skills && (Array.isArray(candidate.skills) ? candidate.skills.length : String(candidate.skills).length),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  const getLatestEducationInfo = (profile: any) => {
    const safeParseJSON = (value: any, defaultValue: any) => {
      if (!value) return defaultValue;
      if (Array.isArray(value)) return value;
      if (typeof value === 'object') return value;
      try { return JSON.parse(value); } catch { return defaultValue; }
    };

    const history = safeParseJSON(profile?.education_history, []);
    if (!Array.isArray(history) || history.length === 0) {
      return { level: profile?.education_level || null, major: profile?.major || null, institution: profile?.education_institution || null };
    }

    const educationPriority: Record<string, number> = { 'S3': 8, 'S2': 7, 'S1': 6, 'D4': 5, 'D3': 4, 'D2': 3, 'D1': 2, 'SMA/SMK': 1, 'SMK': 1, 'SMA': 1, 'SMP': 0, 'SD': -1 };

    const latest = history.reduce((latest: any, current: any) => {
      const lp = educationPriority[(latest.level || latest.education_level) as string] || 0;
      const cp = educationPriority[(current.level || current.education_level) as string] || 0;
      if (cp === lp) {
        const ly = parseInt(latest.end_year || latest.graduation_year || '0') || 0;
        const cy = parseInt(current.end_year || current.graduation_year || '0') || 0;
        return cy > ly ? current : latest;
      }
      return cp > lp ? current : latest;
    }, history[0]);

    return {
      level: latest.level || latest.education_level || null,
      major: latest.major || latest.field_of_study || latest.education_major || null,
      institution: latest.school || latest.institution || latest.education_institution || null,
    };
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const q = searchTerm.toLowerCase();
    const ed = getLatestEducationInfo(candidate);
    const matchSearch = !q || [
      candidate.full_name,
      candidate.email,
      candidate.phone,
      candidate.current_position,
      candidate.current_company,
      candidate.city,
      ed.major,
      ed.institution,
      ...(Array.isArray(candidate.skills) ? candidate.skills : String(candidate.skills || "").split(/[,;]/)),
    ].some((value) => String(value || "").toLowerCase().includes(q));

    const matchStatus = candidateMatchesStatusFilter(candidate);
    const matchJob = jobFilter === "all" || candidate.applications?.some((app) => app.vacancy_id === jobFilter || app.job_vacancies?.id === jobFilter);
    const matchCity = cityFilter === "all" || (candidate.city || "").toLowerCase() === cityFilter.toLowerCase();
    const matchEducation = educationFilter === "all" || (ed.level || "").toLowerCase() === educationFilter.toLowerCase();
    const matchGender = genderFilter === "all" || (candidate.gender || "").toLowerCase() === genderFilter.toLowerCase();
    const expYears = Number(candidate.experience_years || 0);
    const matchExperience = experienceFilter === "all"
      || (experienceFilter === "fresh" && expYears === 0)
      || (experienceFilter === "1-2" && expYears >= 1 && expYears <= 2)
      || (experienceFilter === "3-5" && expYears >= 3 && expYears <= 5)
      || (experienceFilter === "5+" && expYears > 5);
    const matchDocument = documentFilter === "all" || hasRequiredDocument(candidate, documentFilter);
    const score = profileCompletionScore(candidate);
    const matchProfile = profileFilter === "all"
      || (profileFilter === "complete" && score >= 80)
      || (profileFilter === "partial" && score >= 50 && score < 80)
      || (profileFilter === "incomplete" && score < 50);

    const dateValue = getCandidateDateValue(candidate);
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : null;
    const matchDate = (!from || (dateValue !== null && dateValue >= from)) && (!to || (dateValue !== null && dateValue <= to));

    return matchSearch && matchStatus && matchJob && matchCity && matchEducation && matchGender && matchExperience && matchDocument && matchProfile && matchDate;
  });

  const uniqueJobs = Array.from(new Map(candidates.flatMap((c) => c.applications || []).map((app) => [app.job_vacancies?.id || app.vacancy_id, app.job_vacancies?.title || "Lowongan"]))).filter(([id]) => id).sort((a, b) => String(a[1]).localeCompare(String(b[1])));
  const uniqueCities = Array.from(new Set(candidates.map((c) => c.city).filter(Boolean))).sort();
  const uniqueEducations = Array.from(new Set(candidates.map((c) => getLatestEducationInfo(c).level).filter(Boolean))).sort();
  const uniqueGenders = Array.from(new Set(candidates.map((c) => c.gender).filter(Boolean))).sort();

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setJobFilter("all");
    setCityFilter("all");
    setEducationFilter("all");
    setGenderFilter("all");
    setExperienceFilter("all");
    setDocumentFilter("all");
    setProfileFilter("all");
    setDateField("registered");
    setDateFrom("");
    setDateTo("");
  };

  const exportFilteredCandidates = () => {
    const escapeCsv = (value: any) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = filteredCandidates.map((candidate) => {
      const ed = getLatestEducationInfo(candidate);
      const apps = (candidate.applications || []).map((app) => `${app.job_vacancies?.title || "-"} (${getStatusLabel(app.status)})`).join("; ");
      return [
        candidate.full_name,
        candidate.email,
        candidate.phone,
        candidate.city,
        candidate.gender,
        ed.level,
        ed.major,
        candidate.experience_years,
        profileCompletionScore(candidate),
        apps,
        candidate.created_at,
      ].map(escapeCsv).join(",");
    });
    const csv = [
      "Nama,Email,Telepon,Kota,Gender,Pendidikan,Jurusan,Pengalaman,Profil %,Lamaran,Tanggal Daftar",
      ...rows,
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pelamar-filtered-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applicantContactTemplateKey = "applicant-contact-template";

  const getPrimaryApplication = (candidate: CandidateProfile) => {
    return candidate.applications?.[0] || null;
  };

  const getCandidateTargetPosition = (candidate: CandidateProfile) => {
    const app = getPrimaryApplication(candidate);
    return app?.job_vacancies?.title || candidate.current_position || "posisi yang tersedia";
  };

  const getDefaultApplicantContactTemplate = () => {
    return `Yth. {nama},

Terima kasih telah mendaftar di proses rekrutmen kami untuk {posisi}. Kami ingin menghubungi Anda terkait kelanjutan data pelamar dan proses seleksi. Mohon konfirmasi ketersediaan Anda.

Terima kasih.`;
  };

  const getStoredApplicantContactTemplate = () => {
    if (typeof window === "undefined") return getDefaultApplicantContactTemplate();
    return localStorage.getItem(applicantContactTemplateKey) || getDefaultApplicantContactTemplate();
  };

  const fillApplicantContactTemplate = (candidate: CandidateProfile, template: string) => {
    return template
      .replaceAll("{nama}", candidate.full_name || "Kandidat")
      .replaceAll("{posisi}", getCandidateTargetPosition(candidate));
  };

  const buildApplicantContactDraft = (candidate: CandidateProfile) => {
    return fillApplicantContactTemplate(candidate, getStoredApplicantContactTemplate());
  };

  const saveApplicantContactDraftTemplate = (candidate: CandidateProfile) => {
    const template = (contactDraft || buildApplicantContactDraft(candidate))
      .replaceAll(candidate.full_name || "Kandidat", "{nama}")
      .replaceAll(getCandidateTargetPosition(candidate), "{posisi}");
    localStorage.setItem(applicantContactTemplateKey, template);
    setContactDraft(fillApplicantContactTemplate(candidate, template));
    Swal.fire({ icon: "success", title: "Draft awal disimpan", timer: 1600, showConfirmButton: false, ...SWAL_THEME() });
  };

  const openCandidateEmail = (candidate: CandidateProfile) => {
    if (!candidate.email) {
      Swal.fire({ icon: "warning", title: "Email belum tersedia", text: "Alamat email kandidat belum tersedia.", ...SWAL_THEME() });
      return;
    }
    const subject = `Informasi Proses Rekrutmen - ${getCandidateTargetPosition(candidate)}`;
    const body = contactDraft || buildApplicantContactDraft(candidate);
    window.location.href = `mailto:${candidate.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const normalizePhoneForWhatsApp = (phone?: string) => {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("62")) return digits;
    if (digits.startsWith("0")) return `62${digits.slice(1)}`;
    return digits;
  };

  const openCandidateWhatsApp = (candidate: CandidateProfile) => {
    const phone = normalizePhoneForWhatsApp(candidate.phone);
    if (!phone) {
      Swal.fire({ icon: "warning", title: "Nomor belum tersedia", text: "Nomor WhatsApp kandidat belum tersedia.", ...SWAL_THEME() });
      return;
    }
    const body = contactDraft || buildApplicantContactDraft(candidate);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(body)}`, "_blank", "noopener,noreferrer");
  };

  const openCandidateRecruitmentProcess = (candidate: CandidateProfile) => {
    const app = getPrimaryApplication(candidate);
    if (!candidate.has_applied || !app?.vacancy_id) {
      setSelectedCandidate(candidate);
      openApplicantStandaloneTestModal(candidate);
      return;
    }
    const params = new URLSearchParams({
      job: app.vacancy_id,
      candidate: candidate.user_id,
      action: "test",
    });
    window.location.href = `/admin/recruitment-process?${params.toString()}`;
  };

  const isBcryptPassword = (password?: string | null) => /^\$2[aby]\$\d{2}\$/.test(String(password || ""));

  const openApplicantStandaloneTestModal = async (candidate: CandidateProfile) => {
    setApplicantTestSelectedTests([]);
    setApplicantTestExpiresAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setApplicantExistingCodes([]);
    setApplicantTestAccess(null);
    setApplicantEditCodeId(null);
    setShowApplicantTestModal(true);

    const { data, error } = await supabase
      .from("activation_codes")
      .select("*")
      .eq("candidate_email", candidate.email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading applicant activation codes:", error);
      return;
    }

    const codes = data || [];
    setApplicantExistingCodes(codes);
    const latestCode = codes[0];
    if (latestCode) {
      setApplicantEditCodeId(latestCode.id || null);
      setApplicantTestSelectedTests(latestCode.assigned_tests || []);
      setApplicantTestExpiresAt(latestCode.expires_at ? latestCode.expires_at.split("T")[0] : "");
      if (latestCode.password && !isBcryptPassword(latestCode.password)) {
        setApplicantTestAccess({ code: latestCode.code, password: latestCode.password });
      }
    }
  };

  const openCandidateCommunication = (candidate: CandidateProfile) => {
    setSelectedCandidate(candidate);
    setContactDraft(buildApplicantContactDraft(candidate));
    setShowCommunicationModal(true);
  };

  const toggleApplicantTest = (id: string) => {
    setApplicantTestSelectedTests((prev) =>
      prev.includes(id) ? prev.filter((testId) => testId !== id) : [...prev, id]
    );
  };

  const generateRandomString = (length: number) => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  };

  const getAssignedApplicantTestNames = () => {
    return applicantTestSelectedTests
      .map((id) => activeInstruments.find((instrument) => instrument.id === id)?.name || id)
      .join(", ");
  };

  const saveApplicantTestCode = async () => {
    if (!selectedCandidate) return;
    if (applicantTestSelectedTests.length === 0) {
      Swal.fire({ icon: "warning", title: "Pilih tes", text: "Pilih minimal 1 alat tes.", ...SWAL_THEME() });
      return;
    }

    setApplicantTestProcessing(true);
    try {
      if (applicantEditCodeId) {
        const { error } = await supabase
          .from("activation_codes")
          .update({
            assigned_tests: applicantTestSelectedTests,
            expires_at: applicantTestExpiresAt || null,
            status: "active",
          } as any)
          .eq("id", applicantEditCodeId);
        if (error) throw error;

        const updatedCode = applicantExistingCodes.find((code) => code.id === applicantEditCodeId);
        if (updatedCode?.password && !isBcryptPassword(updatedCode.password)) {
          setApplicantTestAccess({ code: updatedCode.code, password: updatedCode.password });
        }
        setApplicantExistingCodes((prev) => prev.map((code) => code.id === applicantEditCodeId ? {
          ...code,
          assigned_tests: applicantTestSelectedTests,
          expires_at: applicantTestExpiresAt || null,
          status: "active",
        } : code));
        await Swal.fire({ icon: "success", title: "Kode Tes Diperbarui", text: "Pengaturan kode aktivasi berhasil disimpan.", timer: 1600, showConfirmButton: false, ...SWAL_THEME() });
        return;
      }

      const newCode = `PSY-${generateRandomString(6)}`;
      const newPassword = generateRandomString(8);
      const { data, error } = await supabase.from("activation_codes").insert({
        code: newCode,
        password: newPassword,
        candidate_name: selectedCandidate.full_name,
        candidate_email: selectedCandidate.email,
        position: getCandidateTargetPosition(selectedCandidate),
        status: "active",
        expires_at: applicantTestExpiresAt || null,
        assigned_tests: applicantTestSelectedTests,
      } as any).select("*").single();
      if (error) throw error;
      setApplicantEditCodeId((data as any)?.id || null);
      setApplicantTestAccess({ code: newCode, password: newPassword });
      setApplicantExistingCodes((prev) => [data || {
        code: newCode,
        password: newPassword,
        assigned_tests: applicantTestSelectedTests,
        expires_at: applicantTestExpiresAt || null,
      }, ...prev]);

      await Swal.fire({
        icon: "success",
        title: "Kode Tes Berhasil Dibuat",
        html: `<div style="font-size:14px;line-height:1.8"><p>Kode: <b style="color:hsl(174,72%,46%);font-family:monospace;letter-spacing:2px">${newCode}</b></p><p>Password: <b style="font-family:monospace">${newPassword}</b></p><p style="font-size:12px;color:#888;margin-top:8px">Berikan kode & password ini kepada kandidat.</p></div>`,
        ...SWAL_THEME(),
      });
    } catch (error: any) {
      console.error("Error creating applicant test code:", error);
      Swal.fire({ icon: "error", title: "Gagal membuat kode tes", text: error.message || "Terjadi kesalahan.", ...SWAL_THEME() });
    } finally {
      setApplicantTestProcessing(false);
    }
  };

  const openCandidatePhone = (candidate: CandidateProfile) => {
    const phone = String(candidate.phone || "").replace(/[^\d+]/g, "");
    if (!phone) {
      Swal.fire({ icon: "warning", title: "Nomor belum tersedia", text: "Nomor telepon kandidat belum tersedia.", ...SWAL_THEME() });
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const copyApplicantContactDraft = async () => {
    try {
      await navigator.clipboard.writeText(contactDraft);
      Swal.fire({ icon: "success", title: "Draft disalin", timer: 1200, showConfirmButton: false, ...SWAL_THEME() });
    } catch {
      Swal.fire({ icon: "error", title: "Gagal menyalin", text: "Browser tidak mengizinkan akses clipboard.", ...SWAL_THEME() });
    }
  };

  const getDocumentLabel = (type: string) => {
    switch (type) {
      case 'cv': return 'CV / Resume';
      case 'photo': return 'Foto Formal';
      case 'ktp': return 'KTP';
      case 'ijazah': return 'Ijazah';
      case 'transkrip': return 'Transkrip Nilai';
      case 'kk': return 'Kartu Keluarga';
      case 'buku_nikah': return 'Buku Nikah';
      case 'skck': return 'SKCK';
      case 'tes_kesehatan': return 'Surat Tes Kesehatan';
      default: return type.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
    }
  };

  const viewCandidateDetail = (candidate: CandidateProfile) => {
    try {
      // Parse JSON fields safely with better error handling
      const parsedCandidate = { ...candidate };
      
      // Helper function to safely parse JSON fields
      const safeParseJSON = (value: any, defaultValue: any) => {
        if (!value) return defaultValue;
        if (Array.isArray(value)) return value;
        if (typeof value === 'object') return value;
        try {
          return JSON.parse(value);
        } catch (e) {
          console.warn('Failed to parse JSON field:', e);
          return defaultValue;
        }
      };
      
      // Parse each field with proper defaults
      parsedCandidate.family_members = safeParseJSON(candidate.family_members, []);
      parsedCandidate.education_history = safeParseJSON(candidate.education_history, []);
      parsedCandidate.languages = safeParseJSON(candidate.languages, []);
      parsedCandidate.hobbies = safeParseJSON(candidate.hobbies, []);
      parsedCandidate.work_experience = safeParseJSON(candidate.work_experience, []);
      parsedCandidate.certificates = safeParseJSON(candidate.certificates, []);
      parsedCandidate.references = safeParseJSON(candidate.references, []);
      parsedCandidate.social_media = safeParseJSON(candidate.social_media, {});
      parsedCandidate.skills = safeParseJSON(candidate.skills, []);
      
      // Debug logging for selected candidate
      console.log('Selected candidate salary data:', {
        salary_exp_base: (parsedCandidate as any).salary_exp_base,
        salary_exp_allowances: (parsedCandidate as any).salary_exp_allowances,
        salary_exp_benefits: (parsedCandidate as any).salary_exp_benefits,
        expected_salary: parsedCandidate.expected_salary,
        salary_expectation: (parsedCandidate as any).salary_expectation
      });
      
      setSelectedCandidate(parsedCandidate);
      setContactDraft(buildApplicantContactDraft(parsedCandidate));
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error parsing candidate data:', error);
      // Fallback to original candidate with empty arrays
      const fallbackCandidate = {
        ...candidate,
        family_members: [],
        education_history: [],
        languages: [],
        hobbies: [],
        work_experience: [],
        certificates: [],
        references: [],
        social_media: {},
        skills: [],
      };
      setSelectedCandidate(fallbackCandidate);
      setContactDraft(buildApplicantContactDraft(fallbackCandidate));
      setShowDetailModal(true);
    }
  };

  const viewCandidateProfileOnly = (candidate: CandidateProfile) => {
    setSelectedCandidate(candidate);
    setShowApplicationForm(true);
  };

  const handleDeleteCandidate = async (candidate: CandidateProfile) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus Kandidat?',
      text: `Apakah Anda yakin ingin menghapus data kandidat "${candidate.full_name}"? Tindakan ini tidak dapat dibatalkan.`,
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#dc2626',
      ...SWAL_THEME()
    });

    if (result.isConfirmed) {
      try {
        // Delete from candidate_profiles table
        const { error: profileError } = await supabase
          .from('candidate_profiles')
          .delete()
          .eq('id', candidate.id);

        if (profileError) throw profileError;

        // Delete from candidates table if exists
        const { error: candidateError } = await supabase
          .from('candidates')
          .delete()
          .eq('email', candidate.email);

        if (candidateError && candidateError.code !== 'PGRST116') {
          // Ignore error if record not found
          throw candidateError;
        }

        // Delete auth user if exists
        if (candidate.user_id) {
          const { error: authError } = await supabase.auth.admin.deleteUser(candidate.user_id);
          
          if (authError && authError.message !== 'User not found') {
            // Ignore error if user not found
            console.warn('Auth user not found, continuing...');
          }
        }

        // Refresh data
        await loadCandidates();

        await Swal.fire({
          icon: 'success',
          title: 'Berhasil Dihapus',
          text: `Data kandidat "${candidate.full_name}" telah dihapus.`,
          timer: 2000,
          showConfirmButton: false,
          ...SWAL_THEME()
        });
      } catch (error: any) {
        console.error('Delete error:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Gagal Menghapus',
          text: error.message || 'Terjadi kesalahan saat menghapus data kandidat',
          ...SWAL_THEME()
        });
      }
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

  const handleDownloadResume = (candidate: CandidateProfile) => {
    // Create professional resume download
    const resumeContent = generateResumeContent(candidate);
    const blob = new Blob([resumeContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resume_${candidate.full_name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Use alert instead of toast since toast might not be properly imported
    alert(`Resume ${candidate.full_name} telah diunduh`);
  };

  const generateResumeContent = (candidate: CandidateProfile) => {
    const parseArray = (value: any) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : value.split(/[,;]\s*/).filter(Boolean);
        } catch {
          return value.split(/[,;]\s*/).filter(Boolean);
        }
      }
      return [];
    };

    const safePrint = (value: any) => {
      if (value == null || value === '') return '-';
      return String(value);
    };

    const skills = parseArray(candidate.skills);
    const languages = parseArray(candidate.languages);
    const bio = safePrint(candidate.bio || 'Tidak ada bio tersedia');
    const strengths = safePrint(candidate.strengths || 'Tidak ada keunggulan yang dituliskan');

    const renderList = (items: string[]) => {
      if (!items || items.length === 0) return '<li>-</li>';
      return items.map((item) => `<li>${safePrint(item)}</li>`).join('');
    };

    const renderTags = (items: string[]) => {
      if (!items || items.length === 0) return '<span class="tag">-</span>';
      return items.map((item) => `<span class="tag">${safePrint(item)}</span>`).join('');
    };

    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume - ${safePrint(candidate.full_name)}</title>
    <style>
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #f8fafc; color: #0f172a; }
        .resume { max-width: 840px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08); }
        .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 24px; margin-bottom: 34px; }
        .name { font-size: 36px; font-weight: 800; color: #0f172a; margin: 0; }
        .position { font-size: 18px; color: #475569; margin: 8px 0 0; }
        .contact { margin-top: 12px; font-size: 14px; color: #64748b; line-height: 1.8; }
        .section { margin-bottom: 28px; }
        .section-title { font-size: 16px; font-weight: 700; color: #1e40af; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.15em; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
        .item { margin-bottom: 14px; }
        .label { display: block; font-size: 13px; color: #475569; font-weight: 700; margin-bottom: 4px; }
        .value { font-size: 14px; color: #475569; }
        .skills { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
        .tag { display: inline-flex; background: #1e40af; color: white; padding: 6px 12px; border-radius: 9999px; font-size: 12px; }
        .list { list-style: none; margin: 0; padding: 0; }
        .list li { margin-bottom: 8px; font-size: 14px; color: #475569; }
        .text { font-size: 14px; color: #475569; line-height: 1.8; }
        @media print { body { background: white; } .resume { box-shadow: none; margin: 0; padding: 16px; border-radius: 0; } }
        @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }
    </style>
</head>
<body>
    <div class="resume">
        <div class="header">
            <h1 class="name">${safePrint(candidate.full_name)}</h1>
            <p class="position">${safePrint(candidate.current_position || 'Professional Candidate')}</p>
            <p class="contact">${safePrint(candidate.email)}${candidate.phone ? ` | ${safePrint(candidate.phone)}` : ''}${candidate.city ? ` | ${safePrint(candidate.city)}` : ''}</p>
        </div>

        <div class="section">
            <h2 class="section-title">Tentang Saya</h2>
            <p class="text">${bio}</p>
        </div>

        <div class="section">
            <h2 class="section-title">Informasi Pribadi</h2>
            <div class="grid">
                <div class="item"><span class="label">Tanggal Lahir</span><span class="value">${safePrint(formatDate(candidate.birth_date))}</span></div>
                <div class="item"><span class="label">Tempat Lahir</span><span class="value">${safePrint(candidate.birth_place)}</span></div>
                <div class="item"><span class="label">Jenis Kelamin</span><span class="value">${safePrint(candidate.gender)}</span></div>
                <div class="item"><span class="label">Alamat</span><span class="value">${safePrint(candidate.address)}</span></div>
                <div class="item"><span class="label">Status</span><span class="value">${safePrint(candidate.marital_status)}</span></div>
                <div class="item"><span class="label">No. KTP / NIK</span><span class="value">${safePrint(candidate.id_card_number || candidate.nik)}</span></div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Pendidikan</h2>
            <div class="grid">
                <div class="item"><span class="label">Tingkat Pendidikan</span><span class="value">${safePrint(candidate.education_level)}</span></div>
                <div class="item"><span class="label">Institusi</span><span class="value">${safePrint(candidate.education_institution)}</span></div>
                <div class="item"><span class="label">Jurusan</span><span class="value">${safePrint(candidate.major)}</span></div>
                <div class="item"><span class="label">Tahun Lulus</span><span class="value">${safePrint(candidate.graduation_year)}</span></div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Pengalaman Kerja</h2>
            <div class="item"><span class="label">Posisi Saat Ini</span><span class="value">${safePrint(candidate.current_position)}</span></div>
            <div class="item"><span class="label">Perusahaan</span><span class="value">${safePrint(candidate.current_company)}</span></div>
            <div class="item"><span class="label">Lama Pengalaman</span><span class="value">${safePrint(candidate.experience_years ? `${candidate.experience_years} Tahun` : '')}</span></div>
        </div>

        <div class="section">
            <h2 class="section-title">Keahlian</h2>
            <div class="skills">${renderTags(skills)}</div>
        </div>

        <div class="section">
            <h2 class="section-title">Keunggulan</h2>
            <p class="text">${strengths}</p>
        </div>
    </div>
</body>
</html>
    `;
  };

  const getEducationIcon = (level: string) => {
    switch (level) {
      case 'S1': return '🎓';
      case 'S2': return '🎓';
      case 'S3': return '🎓';
      case 'D3': return '🎓';
      case 'SMK': return '🎓';
      default: return '🎓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'applied': return 'bg-blue-100 text-blue-700';
      case 'screening': return 'bg-yellow-100 text-yellow-700';
      case 'test':
      case 'psychology_test': return 'bg-violet-100 text-violet-700';
      case 'hr_interview': return 'bg-amber-100 text-amber-700';
      case 'user_interview':
      case 'interview': return 'bg-purple-100 text-purple-700';
      case 'offered':
      case 'offer': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'accepted':
      case 'hired': return 'bg-emerald-100 text-emerald-700';
      case 'expired': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'applied': return 'Lamaran Diterima';
      case 'screening': return 'Screening CV';
      case 'test':
      case 'psychology_test': return 'Tes Psikologi';
      case 'hr_interview': return 'Wawancara HR';
      case 'user_interview': return 'Wawancara User';
      case 'interview': return 'Wawancara';
      case 'offered':
      case 'offer': return 'Penawaran';
      case 'rejected': return 'Ditolak';
      case 'accepted':
      case 'hired': return 'Diterima';
      case 'expired': return 'Kedaluwarsa';
      default: return status;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pelamar</h1>
            <p className="text-muted-foreground">Data kandidat yang telah mendaftar</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => loadCandidates()}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
              title="Refresh data"
            >
              <Users className="h-4 w-4" />
              Refresh
            </button>
            <button onClick={exportFilteredCandidates} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        
        {/* Search and Filter */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Filter className="h-4 w-4 text-primary" />
              Filter Screening
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{filteredCandidates.length} data</span>
            </div>
            <button onClick={resetFilters} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
              Reset Filter
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama, email, telepon, posisi, perusahaan, skill, kota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="all">Semua Status</option>
              <option value="not_applied">Belum Melamar</option>
              <option value="submitted">Lamaran Diterima</option>
              <option value="screening">Screening CV</option>
              <option value="test">Tes Psikologi</option>
              <option value="hr_interview">Wawancara HR</option>
              <option value="user_interview">Wawancara User</option>
              <option value="offered">Penawaran</option>
              <option value="accepted">Diterima</option>
              <option value="rejected">Ditolak</option>
              <option value="expired">Kedaluwarsa</option>
            </select>
            <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="all">Semua Lowongan</option>
              {uniqueJobs.map(([id, title]) => <option key={String(id)} value={String(id)}>{String(title)}</option>)}
            </select>
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="all">Semua Kota</option>
              {uniqueCities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
            <select value={educationFilter} onChange={(e) => setEducationFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="all">Semua Pendidikan</option>
              {uniqueEducations.map((ed) => <option key={ed} value={ed}>{ed}</option>)}
            </select>
            <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="all">Semua Gender</option>
              {uniqueGenders.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
            </select>
            <select value={experienceFilter} onChange={(e) => setExperienceFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="all">Semua Pengalaman</option>
              <option value="fresh">Fresh Graduate / 0 tahun</option>
              <option value="1-2">1 - 2 tahun</option>
              <option value="3-5">3 - 5 tahun</option>
              <option value="5+">&gt; 5 tahun</option>
            </select>
            <select value={documentFilter} onChange={(e) => setDocumentFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="all">Semua Dokumen</option>
              <option value="cv">Ada CV</option>
              <option value="photo">Ada Foto</option>
              <option value="ktp">Ada KTP</option>
              <option value="ijazah">Ada Ijazah</option>
              <option value="transkrip">Ada Transkrip</option>
            </select>
            <select value={profileFilter} onChange={(e) => setProfileFilter(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="all">Semua Kelengkapan Profil</option>
              <option value="complete">Lengkap (&ge;80%)</option>
              <option value="partial">Sedang (50-79%)</option>
              <option value="incomplete">Belum Lengkap (&lt;50%)</option>
            </select>
            <select value={dateField} onChange={(e) => setDateField(e.target.value as "registered" | "applied")} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="registered">Tanggal Daftar</option>
              <option value="applied">Tanggal Lamar</option>
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pelamar</p>
                <p className="text-2xl font-bold text-foreground">{candidates.length}</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bulan Ini</p>
                <p className="text-2xl font-bold text-foreground">
                  {candidates.filter(c => c.created_at && new Date(c.created_at).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">S1/D4</p>
                <p className="text-2xl font-bold text-foreground">
                  {candidates.filter(c => c.education_level === 'S1' || c.education_level === 'D4').length}
                </p>
              </div>
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pengalaman</p>
                <p className="text-2xl font-bold text-foreground">
                  {candidates.filter(c => c.experience_years && parseInt(c.experience_years) > 0).length}
                </p>
              </div>
              <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Candidates Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pendidikan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status Lamaran</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal Daftar</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {searchTerm ? "Tidak ada hasil pencarian" : "Belum ada data pelamar"}
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-muted/50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {candidate.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'NA'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{candidate.full_name || '-'}</div>
                            <div className="text-sm text-muted-foreground">{candidate.phone || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-foreground">{candidate.email || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const ed = getLatestEducationInfo(candidate);
                          return (
                            <div className="flex items-center gap-2">
                              <span>{getEducationIcon(ed.level || '')}</span>
                              <div>
                                <div className="text-sm font-medium text-foreground">{ed.level || '-'}</div>
                                <div className="text-xs text-muted-foreground">{ed.major || '-'}</div>
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        {candidate.has_applied ? (
                          <div className="flex flex-col gap-1">
                            {candidate.applications?.slice(0, 2).map((app) => (
                              <div key={app.id} className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(app.status)}`}>
                                  {getStatusLabel(app.status)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {app.job_vacancies?.title}
                                </span>
                              </div>
                            ))}
                            {(candidate.applications?.length || 0) > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{(candidate.applications?.length || 0) - 2} lainnya
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Belum melamar</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-foreground">{formatDate(candidate.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewCandidateDetail(candidate)}
                            className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted transition"
                            title="Profil kandidat"
                          >
                            <User className="h-3.5 w-3.5" />
                            Profil
                          </button>
                          <button
                            onClick={() => openCandidateCommunication(candidate)}
                            className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/15 transition"
                            title="Detail dan komunikasi kandidat"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Detail
                          </button>
                          <button
                            onClick={() => handleDeleteCandidate(candidate)}
                            className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Professional Detail Modal */}
        {showDetailModal && selectedCandidate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      {selectedCandidate.photo_url ? (
                        <img 
                          src={selectedCandidate.photo_url} 
                          alt={selectedCandidate.full_name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-8 w-8 text-white" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{selectedCandidate.full_name}</h2>
                      <p className="text-muted-foreground">{selectedCandidate.current_position || 'Professional'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{selectedCandidate.email}</span>
                        {selectedCandidate.phone && (
                          <>
                            <Phone className="h-4 w-4 text-muted-foreground ml-2" />
                            <span className="text-sm text-muted-foreground">{selectedCandidate.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setShowDetailModal(false)}
                      variant="outline"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Tutup
                    </Button>
                    <Button
                      onClick={() => setShowApplicationForm(true)}
                      className="bg-gradient-to-r from-primary to-accent"
                      size="sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Personal History Card (PHC)
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabs Content */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-8 bg-muted/50 border-b border-border sticky top-0 z-10 overflow-x-auto">
                    <TabsTrigger value="personal" className="flex items-center gap-2 whitespace-nowrap">
                      <User className="h-4 w-4" />
                      Profil
                    </TabsTrigger>
                    <TabsTrigger value="family" className="flex items-center gap-2 whitespace-nowrap">
                      <Heart className="h-4 w-4" />
                      Keluarga
                    </TabsTrigger>
                    <TabsTrigger value="education" className="flex items-center gap-2 whitespace-nowrap">
                      <GraduationCap className="h-4 w-4" />
                      Pendidikan
                    </TabsTrigger>
                    <TabsTrigger value="skills" className="flex items-center gap-2 whitespace-nowrap">
                      <Star className="h-4 w-4" />
                      Skill
                    </TabsTrigger>
                    <TabsTrigger value="experience" className="flex items-center gap-2 whitespace-nowrap">
                      <Briefcase className="h-4 w-4" />
                      Pengalaman
                    </TabsTrigger>
                    <TabsTrigger value="salary" className="flex items-center gap-2 whitespace-nowrap">
                      <Target className="h-4 w-4" />
                      Salary
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2 whitespace-nowrap">
                      <FolderOpen className="h-4 w-4" />
                      Data
                    </TabsTrigger>
                    <TabsTrigger value="additional" className="flex items-center gap-2 whitespace-nowrap">
                      <MessageSquare className="h-4 w-4" />
                      Informasi
                    </TabsTrigger>
                  </TabsList>

                  {/* Personal Info Tab */}
                  <TabsContent value="personal" className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <User className="h-5 w-5 text-primary" />
                          Informasi Pribadi
                        </h3>
                        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-muted-foreground">Nama Lengkap</label>
                              <p className="font-medium text-foreground">{selectedCandidate.full_name || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Email</label>
                              <p className="font-medium text-foreground">{selectedCandidate.email || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Telepon</label>
                              <p className="font-medium text-foreground">{selectedCandidate.phone || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Tanggal Lahir</label>
                              <p className="font-medium text-foreground">{formatDate(selectedCandidate.birth_date)}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Tempat Lahir</label>
                              <p className="font-medium text-foreground">{selectedCandidate.birth_place || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Jenis Kelamin</label>
                              <p className="font-medium text-foreground">{selectedCandidate.gender || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Status Pernikahan</label>
                              <p className="font-medium text-foreground">{selectedCandidate.marital_status || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Agama</label>
                              <p className="font-medium text-foreground">{selectedCandidate.religion || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Kewarganegaraan</label>
                              <p className="font-medium text-foreground">{selectedCandidate.nationality || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Golongan Darah</label>
                              <p className="font-medium text-foreground">{selectedCandidate.blood_type || '-'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Single Container Layout */}
                        <div className="space-y-2">
                          <div className="bg-card border border-border rounded-lg p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Data Fisik - Kiri */}
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-3">
                                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                                    <label className="text-sm text-muted-foreground">No. KTP</label>
                                    <p className="font-medium text-foreground text-right">{(selectedCandidate as any).nik || '-'}</p>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                                    <label className="text-sm text-muted-foreground">SIM</label>
                                    <p className="font-medium text-foreground text-right">{(selectedCandidate as any).vehicle_license || '-'}</p>
                                  </div>
                                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                                    <label className="text-sm text-muted-foreground">Tinggi Badan</label>
                                    <p className="font-medium text-foreground text-right">{(selectedCandidate as any).height_cm ? `${(selectedCandidate as any).height_cm} cm` : '-'}</p>
                                  </div>
                                  <div className="flex justify-between items-center py-2">
                                    <label className="text-sm text-muted-foreground">Berat Badan</label>
                                    <p className="font-medium text-foreground text-right">{(selectedCandidate as any).weight_kg ? `${(selectedCandidate as any).weight_kg} kg` : '-'}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Foto - Kanan Atas */}
                              <div className="flex justify-start md:justify-end">
                                {(selectedCandidate as any).photo_url ? (
                                  <div className="relative">
                                    <img
                                      src={(selectedCandidate as any).photo_url}
                                      alt={`Foto ${selectedCandidate.full_name}`}
                                      className="w-40 h-40 rounded-xl object-cover border-4 border-primary/20 shadow-lg"
                                    />
                                    <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2">
                                      <Camera className="w-4 h-4" />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-40 h-40 rounded-xl bg-muted border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center hover:bg-muted/50 transition-colors">
                                    <User className="w-16 h-16 text-muted-foreground/50 mb-2" />
                                    <p className="text-xs text-muted-foreground/50 text-center">Belum ada foto</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Alamat - Full Width */}
                            <div className="mt-6 pt-6 border-t border-border">
                              <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">Alamat Lengkap</label>
                                <p className="text-sm text-foreground leading-relaxed">
                                  {selectedCandidate.address ? `${selectedCandidate.address}, ${(selectedCandidate as any).city || ''}, ${(selectedCandidate as any).province || ''} ${(selectedCandidate as any).postal_code || ''}`.replace(/,\s*$/, '') : '-'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                                              </div>
                    </div>
                  </TabsContent>

                  {/* Family Tab */}
                  <TabsContent value="family" className="p-6 space-y-6">
                    <div className="bg-card border border-border rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                        <Heart className="h-5 w-5 text-primary" />
                        Data Keluarga
                      </h3>
                      {selectedCandidate.family_members && Array.isArray(selectedCandidate.family_members) && selectedCandidate.family_members.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="border border-border px-4 py-2 text-left text-sm font-medium">Hubungan</th>
                                <th className="border border-border px-4 py-2 text-left text-sm font-medium">Nama</th>
                                <th className="border border-border px-4 py-2 text-left text-sm font-medium">Jenis Kelamin</th>
                                <th className="border border-border px-4 py-2 text-left text-sm font-medium">Usia</th>
                                <th className="border border-border px-4 py-2 text-left text-sm font-medium">Pendidikan</th>
                                <th className="border border-border px-4 py-2 text-left text-sm font-medium">Pekerjaan</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedCandidate.family_members.map((member: any, index: number) => (
                                <tr key={index} className="hover:bg-muted/20">
                                  <td className="border border-border px-4 py-2 text-sm">{member.relation || '-'}</td>
                                  <td className="border border-border px-4 py-2 text-sm font-medium">{member.name || '-'}</td>
                                  <td className="border border-border px-4 py-2 text-sm">{member.gender || '-'}</td>
                                  <td className="border border-border px-4 py-2 text-sm">{member.age || '-'}</td>
                                  <td className="border border-border px-4 py-2 text-sm">{member.education || '-'}</td>
                                  <td className="border border-border px-4 py-2 text-sm">{member.occupation || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Belum ada data keluarga</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Education Tab */}
                  <TabsContent value="education" className="p-6 space-y-6">
                    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        Pendidikan Terakhir
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(() => {
                          // Helper function to get latest education
                          const getLatestEducation = () => {
                            if (!selectedCandidate.education_history) return null;
                            
                            let educationArray = [];
                            
                            // Parse education_history if it's a string
                            if (typeof selectedCandidate.education_history === 'string') {
                              try {
                                educationArray = JSON.parse(selectedCandidate.education_history);
                              } catch (e) {
                                educationArray = [];
                              }
                            } else if (Array.isArray(selectedCandidate.education_history)) {
                              educationArray = selectedCandidate.education_history;
                            }
                            
                            if (educationArray.length === 0) return null;
                            
                            // Sort by education level priority: S3 > S2 > S1 > D4 > D3 > D2 > D1 > SMA/SMK > SMP > SD
                            const educationPriority = {
                              'S3': 8, 'S2': 7, 'S1': 6, 'D4': 5, 'D3': 4, 'D2': 3, 'D1': 2,
                              'SMA/SMK': 1, 'SMK': 1, 'SMA': 1, 'SMP': 0, 'SD': -1
                            };
                            
                            return educationArray.reduce((latest, current) => {
                              const latestPriority = educationPriority[latest.level] || 0;
                              const currentPriority = educationPriority[current.level] || 0;
                              
                              // If same level, compare end year
                              if (latestPriority === currentPriority) {
                                const latestYear = parseInt(latest.end_year || '0') || 0;
                                const currentYear = parseInt(current.end_year || '0') || 0;
                                return currentYear > latestYear ? current : latest;
                              }
                              
                              return currentPriority > latestPriority ? current : latest;
                            });
                          };
                          
                          const latestEducation = getLatestEducation();
                          
                          return latestEducation ? (
                            <>
                              <div>
                                <label className="text-sm text-muted-foreground">Tingkat Pendidikan</label>
                                <p className="font-medium text-foreground">{latestEducation.level || '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Institusi Pendidikan</label>
                                <p className="font-medium text-foreground">{latestEducation.school || latestEducation.institution || '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Jurusan/Program Studi</label>
                                <p className="font-medium text-foreground">{latestEducation.major || latestEducation.field_of_study || '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Tahun Lulus</label>
                                <p className="font-medium text-foreground">{latestEducation.end_year || latestEducation.graduation_year || '-'}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <label className="text-sm text-muted-foreground">Tingkat Pendidikan</label>
                                <p className="font-medium text-foreground">-</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Institusi Pendidikan</label>
                                <p className="font-medium text-foreground">-</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Jurusan/Program Studi</label>
                                <p className="font-medium text-foreground">-</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Tahun Lulus</label>
                                <p className="font-medium text-foreground">-</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {selectedCandidate.education_history && Array.isArray(selectedCandidate.education_history) && selectedCandidate.education_history.length > 0 && (
                      <div className="bg-card border border-border rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                          <BookOpen className="h-5 w-5 text-primary" />
                          Riwayat Pendidikan Lengkap
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="border border-border px-4 py-2 text-left text-sm font-medium">Tingkat</th>
                                <th className="border border-border px-4 py-2 text-left text-sm font-medium">Sekolah/Universitas</th>
                                <th className="border border-border px-4 py-2 text-left text-sm font-medium">Jurusan</th>
                                <th className="border border-border px-4 py-2 text-left text-sm font-medium">Tahun Mulai</th>
                                <th className="border border-border px-4 py-2 text-left text-sm font-medium">Tahun Selesai</th>
                                <th className="border border-border px-4 py-2 text-left text-sm font-medium">Nilai/Grade</th>
                                <th className="border border-border px-4 py-2 text-left text-sm font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedCandidate.education_history.map((edu: any, index: number) => (
                                <tr key={index} className="hover:bg-muted/20">
                                  <td className="border border-border px-4 py-2 text-sm font-medium">{edu.level || '-'}</td>
                                  <td className="border border-border px-4 py-2 text-sm">{edu.school || '-'}</td>
                                  <td className="border border-border px-4 py-2 text-sm">{edu.major || '-'}</td>
                                  <td className="border border-border px-4 py-2 text-sm">{edu.start_year || '-'}</td>
                                  <td className="border border-border px-4 py-2 text-sm">{edu.end_year || '-'}</td>
                                  <td className="border border-border px-4 py-2 text-sm">{edu.grade || '-'}</td>
                                  <td className="border border-border px-4 py-2 text-sm">{edu.status || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Skills & Personality Tab */}
                  <TabsContent value="skills" className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Star className="h-5 w-5 text-primary" />
                          Keahlian & Kompetensi
                        </h3>
                        <div>
                          <label className="text-sm text-muted-foreground">Skills</label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(() => {
                              try {
                                if (!selectedCandidate.skills || !Array.isArray(selectedCandidate.skills) || selectedCandidate.skills.length === 0) {
                                  return <span className="text-muted-foreground">Tidak ada data</span>;
                                }
                                return selectedCandidate.skills.map((skill: any, index) => {
                                  // Handle both string and object format
                                  if (!skill) return null;
                                  const skillName = typeof skill === 'string' ? skill : (skill as any).name || '';
                                  if (!skillName) return null;
                                  return (
                                    <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                      {skillName}
                                    </span>
                                  );
                                });
                              } catch (error) {
                                console.error('Error rendering skills:', error);
                                return <span className="text-muted-foreground">Error loading skills</span>;
                              }
                            })()}
                          </div>
                        </div>
                        {selectedCandidate.strengths && (
                          <div>
                            <label className="text-sm text-muted-foreground">Kelebihan</label>
                            <p className="text-foreground mt-2 whitespace-pre-line">{selectedCandidate.strengths}</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Languages className="h-5 w-5 text-primary" />
                          Bahasa & Hobi
                        </h3>
                        {selectedCandidate.languages && Array.isArray(selectedCandidate.languages) && selectedCandidate.languages.length > 0 && (
                          <div>
                            <label className="text-sm text-muted-foreground">Bahasa</label>
                            <div className="space-y-2 mt-2">
                              {selectedCandidate.languages.map((lang: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                                  <span className="text-sm font-medium">{lang.language || '-'}</span>
                                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">{lang.level || '-'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedCandidate.hobbies && (
                          <div>
                            <label className="text-sm text-muted-foreground">Hobi</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {(() => {
                                try {
                                  // Handle both string and array format
                                  let hobbiesArray = [];
                                  if (typeof selectedCandidate.hobbies === 'string') {
                                    hobbiesArray = (selectedCandidate.hobbies as string).split(',').map(h => h.trim()).filter(h => h);
                                  } else if (Array.isArray(selectedCandidate.hobbies)) {
                                    hobbiesArray = selectedCandidate.hobbies;
                                  }
                                  
                                  return hobbiesArray.map((hobby, index) => (
                                    <span key={index} className="px-2 py-1 bg-muted/50 text-muted-foreground rounded text-sm">
                                      {hobby}
                                    </span>
                                  ));
                                } catch (error) {
                                  console.error('Error rendering hobbies:', error);
                                  return <span className="text-muted-foreground">Error loading hobbies</span>;
                                }
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Experience Tab */}
                  <TabsContent value="experience" className="p-6 space-y-6">
                    
                    {selectedCandidate.work_experience && Array.isArray(selectedCandidate.work_experience) && selectedCandidate.work_experience.length > 0 && (
                      <div className="bg-card border border-border rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                          <Users2 className="h-5 w-5 text-primary" />
                          Riwayat Pengalaman Kerja
                        </h3>
                        <div className="space-y-4">
                          {selectedCandidate.work_experience.map((work: any, index: number) => (
                            <div key={index} className="border border-border rounded-lg p-4 hover:bg-muted/20">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-semibold text-foreground">{work.position_start || work.position || '-'}</h4>
                                  <p className="text-sm text-muted-foreground">{work.company_name || work.company || '-'}</p>
                                </div>
                                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                  {work.join_date && work.end_date ? `${work.join_date} - ${work.end_date}` : work.join_date || work.period || '-'}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{work.duties || work.description || '-'}</p>
                              {work.achievements && (
                                <p className="text-sm text-muted-foreground mt-2"><strong>Pencapaian:</strong> {work.achievements}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Salary Expectation Tab */}
                  <TabsContent value="salary" className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Target className="h-5 w-5 text-primary" />
                          Ekspektasi Gaji
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-muted-foreground">Gaji Pokok yang Diharapkan</label>
                            <p className="font-medium text-foreground text-lg">{(selectedCandidate as any).salary_exp_base || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Tunjangan yang Diharapkan</label>
                            <p className="font-medium text-foreground">{(selectedCandidate as any).salary_exp_allowances || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Benefit/Fasilitas yang Diharapkan</label>
                            <p className="font-medium text-foreground whitespace-pre-line">{(selectedCandidate as any).salary_exp_benefits || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Ekspektasi Gaji Total</label>
                            <p className="font-medium text-foreground text-lg">{selectedCandidate.expected_salary ? `Rp ${selectedCandidate.expected_salary}` : '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Gaji Saat Ini</label>
                            <p className="font-medium text-foreground">{(selectedCandidate as any).salary_expectation || '-'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-primary" />
                          Ketersediaan & Preferensi
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-muted-foreground">Tanggal Mulai Tersedia</label>
                            <p className="font-medium text-foreground">{(selectedCandidate as any).available_from || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Periode Notice</label>
                            <p className="font-medium text-foreground">{(selectedCandidate as any).notice_period ? `${(selectedCandidate as any).notice_period} hari` : '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Bersedia Relokasi</label>
                            <p className="font-medium text-foreground">
                              {(selectedCandidate as any).willing_relocate ? 'Ya' : 'Tidak'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Bersedia Lembur</label>
                            <p className="font-medium text-foreground">
                              {(selectedCandidate as any).willing_overtime ? 'Ya' : 'Tidak'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Bersedia Shift</label>
                            <p className="font-medium text-foreground">
                              {(selectedCandidate as any).willing_shift ? 'Ya' : 'Tidak'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents" className="p-6 space-y-6">
                    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-primary" />
                        Dokumen & Portofolio
                      </h3>
                      
                      {(selectedCandidate as any).documents && (selectedCandidate as any).documents.length > 0 && (
                        <div>
                          <label className="text-sm text-muted-foreground">Dokumen Kandidat</label>
                          <div className="mt-2 space-y-2">
                            {(selectedCandidate as any).documents.map((doc) => (
                              <div key={doc.id} className="p-3 border border-border rounded-lg bg-muted/20">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-6 w-6 text-primary" />
                                  <div className="flex-1">
                                    <p className="font-medium text-foreground">{getDocumentLabel(doc.document_type)}</p>
                                    <p className="text-sm text-muted-foreground truncate">{doc.file_name}</p>
                                  </div>
                                  <Button variant="outline" size="sm" onClick={() => { setDocPreviewUrl(doc.file_url); setDocPreviewName(doc.file_name); setShowDocPreview(true); }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(selectedCandidate as any).cv_url && !((selectedCandidate as any).documents?.some((doc) => doc.document_type === 'cv')) && (
                        <div>
                          <label className="text-sm text-muted-foreground">CV/Resume</label>
                          <div className="mt-2 p-4 border border-border rounded-lg bg-muted/20">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-primary" />
                              <div className="flex-1">
                                <p className="font-medium text-foreground">CV/Resume</p>
                                <p className="text-sm text-muted-foreground">Dokumen CV pelamar</p>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => { setDocPreviewUrl((selectedCandidate as any).cv_url); setDocPreviewName('CV - ' + (selectedCandidate.full_name || 'cv')); setShowDocPreview(true); }}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {(selectedCandidate as any).certificates && Array.isArray((selectedCandidate as any).certificates) && (selectedCandidate as any).certificates.length > 0 && (
                        <div>
                          <label className="text-sm text-muted-foreground">Sertifikat</label>
                          <div className="mt-2 space-y-2">
                            {(selectedCandidate as any).certificates.map((cert, index) => (
                              <div key={index} className="p-3 border border-border rounded-lg bg-muted/20">
                                <div className="flex items-center gap-3">
                                  <Award className="h-6 w-6 text-warning" />
                                  <div className="flex-1">
                                    <p className="font-medium text-foreground">Sertifikat {index + 1}</p>
                                    <p className="text-sm text-muted-foreground">{cert}</p>
                                  </div>
                                  <Button variant="outline" size="sm" onClick={() => { setDocPreviewUrl(cert); setDocPreviewName(`Sertifikat ${index + 1}`); setShowDocPreview(true); }}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(selectedCandidate as any).portfolio_url && !(selectedCandidate as any).documents?.some((doc) => doc.document_type === 'portfolio') && (
                        <div>
                          <label className="text-sm text-muted-foreground">Portofolio</label>
                          <div className="mt-2 p-4 border border-border rounded-lg bg-muted/20">
                            <div className="flex items-center gap-3">
                              <BookOpen className="h-8 w-8 text-primary" />
                              <div className="flex-1">
                                <p className="font-medium text-foreground">Portofolio</p>
                                <p className="text-sm text-muted-foreground">{(selectedCandidate as any).portfolio_url}</p>
                              </div>
                                <Button variant="outline" size="sm" onClick={() => { setDocPreviewUrl((selectedCandidate as any).portfolio_url); setDocPreviewName('Portofolio - ' + (selectedCandidate.full_name || 'portfolio')); setShowDocPreview(true); }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Lihat
                                </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {!(selectedCandidate as any).documents?.length && !(selectedCandidate as any).cv_url && !(selectedCandidate as any).certificates?.length && !(selectedCandidate as any).portfolio_url && (
                        <div className="text-center py-8 text-muted-foreground">
                          <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Belum ada dokumen yang diunggah</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Additional Info Tab */}
                  <TabsContent value="additional" className="p-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-primary" />
                          Informasi Tambahan
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-muted-foreground">Hobi</label>
                            <p className="font-medium text-foreground">{selectedCandidate.hobbies || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">SIM yang Dimiliki</label>
                            <p className="font-medium text-foreground">{(selectedCandidate as any).vehicle_license || '-'}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-sm text-muted-foreground">Alamat Domisili</label>
                            <p className="font-medium text-foreground">{(selectedCandidate as any).alamat_domisili || '-'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Memiliki Kendaraan:</span>
                            <span className="font-medium text-foreground">{(selectedCandidate as any).has_vehicle ? 'Ya' : 'Tidak'}</span>
                          </div>
                          {(selectedCandidate as any).has_vehicle && (
                            <>
                              <div>
                                <label className="text-sm text-muted-foreground">Jenis Kendaraan</label>
                                <p className="font-medium text-foreground">{(selectedCandidate as any).vehicle_type || '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Merk Kendaraan</label>
                                <p className="font-medium text-foreground">{(selectedCandidate as any).vehicle_brand || '-'}</p>
                              </div>
                            </>
                          )}
                          <div>
                            <label className="text-sm text-muted-foreground">Status Kepemilikan Rumah</label>
                            <p className="font-medium text-foreground">{(selectedCandidate as any).home_ownership || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Telepon Rumah</label>
                            <p className="font-medium text-foreground">{(selectedCandidate as any).home_phone || '-'}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-sm text-muted-foreground">Sumber Informasi Lowongan</label>
                            <p className="font-medium text-foreground">{(selectedCandidate as any).source_info || '-'}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-sm text-muted-foreground">Aktivitas Sosial/Organisasi</label>
                            <p className="font-medium text-foreground whitespace-pre-line">{(selectedCandidate as any).social_activities || '-'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-primary" />
                          Preferensi Kerja
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Bersedia Relokasi:</span>
                            <span className="font-medium text-foreground">{(selectedCandidate as any).willing_relocate ? 'Ya' : 'Tidak'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Bersedia Lembur:</span>
                            <span className="font-medium text-foreground">{(selectedCandidate as any).willing_overtime ? 'Ya' : 'Tidak'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Bersedia Shift:</span>
                            <span className="font-medium text-foreground">{(selectedCandidate as any).willing_shift ? 'Ya' : 'Tidak'}</span>
                          </div>
                        </div>

                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mt-6">
                          <Link2 className="h-5 w-5 text-primary" />
                          Social Media & Referensi
                        </h3>
                        {selectedCandidate.social_media && Object.keys(selectedCandidate.social_media).length > 0 && (
                          <div>
                            <label className="text-sm text-muted-foreground">Social Media</label>
                            <div className="space-y-2 mt-2">
                              {Object.entries(selectedCandidate.social_media).map(([platform, url]: [string, any]) => (
                                <div key={platform} className="flex items-center gap-2 p-2 bg-muted/20 rounded">
                                  <span className="text-sm font-medium capitalize">{platform}:</span>
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                    {url}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedCandidate.references && Array.isArray(selectedCandidate.references) && selectedCandidate.references.length > 0 && (
                          <div>
                            <label className="text-sm text-muted-foreground">Referensi</label>
                            <div className="space-y-2 mt-2">
                              {selectedCandidate.references.map((ref: any, index: number) => (
                                <div key={index} className="p-2 bg-muted/20 rounded">
                                  <p className="text-sm font-medium">{ref.name || '-'}</p>
                                  <p className="text-xs text-muted-foreground">{ref.position || '-'}</p>
                                  <p className="text-xs text-muted-foreground">{ref.contact || '-'}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        )}

        {/* Communication Detail Modal */}
        {showCommunicationModal && selectedCandidate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[calc(100dvh-1rem)] overflow-hidden shadow-2xl flex flex-col">
              <div className="flex-shrink-0 border-b border-border bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Detail Komunikasi Kandidat</h2>
                    <p className="text-sm text-muted-foreground">{selectedCandidate.full_name} - {getCandidateTargetPosition(selectedCandidate)}</p>
                  </div>
                  <button
                    onClick={() => setShowCommunicationModal(false)}
                    className="p-1 rounded hover:bg-muted transition"
                  >
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <span className="font-semibold text-foreground">{selectedCandidate.full_name}</span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground break-all">
                      <Mail className="h-3.5 w-3.5" /> {selectedCandidate.email || "-"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {selectedCandidate.phone || "-"}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Posisi: <span className="font-medium text-foreground">{getCandidateTargetPosition(selectedCandidate)}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        Komunikasi Kandidat
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">Ubah draft bila perlu, lalu hubungi kandidat via WhatsApp atau email dari device ini.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => saveApplicantContactDraftTemplate(selectedCandidate)}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Simpan Draft
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setContactDraft(buildApplicantContactDraft(selectedCandidate))}>
                        <Edit className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                      <Button size="sm" variant="outline" onClick={copyApplicantContactDraft}>
                        <FileText className="h-4 w-4 mr-2" />
                        Salin
                      </Button>
                    </div>
                  </div>
                  <textarea
                    value={contactDraft}
                    onChange={(e) => setContactDraft(e.target.value)}
                    rows={7}
                    className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Button onClick={() => openCandidateWhatsApp(selectedCandidate)} className="bg-emerald-600 hover:bg-emerald-700">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button onClick={() => openCandidateEmail(selectedCandidate)} className="bg-blue-600 hover:bg-blue-700">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button onClick={() => openCandidateRecruitmentProcess(selectedCandidate)} variant="outline">
                    <Target className="h-4 w-4 mr-2" />
                    Tes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resume Preview Modal */}
        {showResume && selectedCandidate && (
          <ProfessionalResume
            candidate={selectedCandidate}
            onClose={() => setShowResume(false)}
          />
        )}

        {showDocPreview && docPreviewUrl && (
          <DocumentPreview url={docPreviewUrl} name={docPreviewName} onClose={() => { setShowDocPreview(false); setDocPreviewUrl(null); setDocPreviewName(undefined); }} />
        )}

        {showApplicantTestModal && selectedCandidate && (
          <div className="fixed inset-0 bg-black/55 flex items-center justify-center p-2 sm:p-4 z-[70] overflow-hidden">
            <div className="bg-card border border-border rounded-xl max-w-4xl w-full max-h-[calc(100dvh-1rem)] overflow-hidden shadow-2xl flex flex-col">
              <div className="flex-shrink-0 border-b border-border bg-muted/20 p-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground">Buat Kode Tes Psikologi</h2>
                  <p className="text-sm text-muted-foreground">{selectedCandidate.full_name} - {selectedCandidate.email}</p>
                </div>
                <button
                  onClick={() => setShowApplicantTestModal(false)}
                  className="p-1 rounded hover:bg-muted transition"
                >
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="text-xs text-muted-foreground mb-1">Kandidat</div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-semibold text-foreground">{selectedCandidate.full_name}</span>
                    <span className="text-muted-foreground break-all">{selectedCandidate.email}</span>
                    <span className="text-muted-foreground">{selectedCandidate.phone || "-"}</span>
                  </div>
                </div>

                {applicantExistingCodes.length > 0 && (
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-foreground">Kode Aktivasi Tersedia</div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setApplicantEditCodeId(null);
                          setApplicantTestSelectedTests([]);
                          setApplicantTestExpiresAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
                          setApplicantTestAccess(null);
                        }}
                      >
                        Buat Kode Baru
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {applicantExistingCodes.map((code: any) => {
                        const selected = applicantEditCodeId === code.id;
                        const canShowPassword = code.password && !isBcryptPassword(code.password);
                        return (
                          <div key={code.id || code.code} className={`rounded-lg border p-3 ${selected ? "border-primary bg-primary/10" : "border-border bg-background"}`}>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="font-mono text-sm font-semibold text-primary">{code.code}</div>
                                <div className="mt-1 text-xs text-muted-foreground">{code.assigned_tests?.length ? `Tes: ${code.assigned_tests.map((id: string) => activeInstruments.find((inst) => inst.id === id)?.name || id).join(", ")}` : "Belum ada tes terpilih"}</div>
                                <div className="text-xs text-muted-foreground">{code.expires_at ? `Berlaku hingga ${new Date(code.expires_at).toLocaleDateString("id-ID")}` : "Tanpa tanggal expire"}</div>
                                {!canShowPassword && <div className="mt-1 text-xs text-amber-600">Password lama tersimpan sebagai hash. Pengaturan tes tetap bisa diedit.</div>}
                              </div>
                              <Button
                                size="sm"
                                variant={selected ? "default" : "outline"}
                                onClick={() => {
                                  setApplicantEditCodeId(code.id || null);
                                  setApplicantTestSelectedTests(code.assigned_tests || []);
                                  setApplicantTestExpiresAt(code.expires_at ? code.expires_at.split("T")[0] : "");
                                  setApplicantTestAccess(canShowPassword ? { code: code.code, password: code.password } : null);
                                }}
                              >
                                {selected ? "Sedang Diedit" : "Edit Kode"}
                              </Button>
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
                        onClick={() => toggleApplicantTest(instrument.id)}
                        className={`min-h-12 rounded-lg border px-3 py-2 text-left transition ${applicantTestSelectedTests.includes(instrument.id) ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted"}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium leading-tight text-foreground">{instrument.name}</span>
                          {applicantTestSelectedTests.includes(instrument.id) && <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary" />}
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
                    <label className="block text-sm font-medium text-foreground mb-2">Tanggal Expire</label>
                    <input
                      type="date"
                      value={applicantTestExpiresAt}
                      onChange={(e) => setApplicantTestExpiresAt(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-xs text-muted-foreground mb-2">Ringkasan</div>
                    {applicantTestSelectedTests.length ? (
                      <div className="text-sm text-foreground">Tes dipilih: {getAssignedApplicantTestNames()}</div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Belum ada tes dipilih.</div>
                    )}
                    <div className="mt-1 text-xs text-muted-foreground">Kode ini dibuat tanpa harus ada lamaran lowongan terlebih dahulu.</div>
                  </div>
                </div>

                {applicantTestAccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                    <div className="text-sm font-semibold">Akses tes siap dikirim</div>
                    <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                      <div>Kode: <span className="font-mono font-bold">{applicantTestAccess.code}</span></div>
                      <div>Password: <span className="font-mono font-bold">{applicantTestAccess.password}</span></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 flex flex-col-reverse gap-2 border-t border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-end">
                <Button variant="outline" onClick={() => setShowApplicantTestModal(false)}>Batal</Button>
                <Button onClick={saveApplicantTestCode} disabled={applicantTestProcessing}>
                  {applicantTestProcessing ? "Menyimpan..." : applicantEditCodeId ? "Simpan Perubahan Kode" : "Buat Kode Tes"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Professional Application Form Modal */}
        {showApplicationForm && selectedCandidate && (
          <ProfessionalApplicationForm
            candidate={selectedCandidate}
            onClose={() => setShowApplicationForm(false)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
