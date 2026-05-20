import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Trash2, Plus, Pencil, Upload, X, Users, UserPlus, MailCheck, CheckCircle, XCircle, Search, Filter, Download, Printer, FileText, MoreVertical, Edit, Building2, User, Camera, BookOpen, FolderOpen, Heart, Globe, Ruler, Weight, CreditCard, Home, Car, Languages, Target, Users2, Star, MessageSquare, Link2, Briefcase, MapPin, Clock, Calendar, GraduationCap, Award, AlertCircle, ChevronRight, Bell, SettingsIcon, UserCog, Shield, ChevronDown, Workflow, Mail, Phone } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import DocumentPreview from "@/components/DocumentPreview";
import Swal from "sweetalert2";

interface Doc {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
}
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ProfessionalApplicationForm from "@/components/admin/ProfessionalApplicationForm";

interface JobVacancy {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  description: string;
  requirements: string;
  closes_at: string;
  application_count?: number;
}

interface ActivationCode {
  id: string;
  code: string;
  password: string;
  candidate_name: string;
  candidate_email: string;
  position: string;
  status: string;
  expires_at: string | null;
  test_completed_at: string | null;
  assigned_tests: string[] | null;
}

interface JobApplication {
  id: string;
  vacancy_id: string;
  user_id: string;
  status: string;
  applied_at: string;
  activation_code_id?: string | null;
  activation_code?: ActivationCode | null;
  candidate_profile: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    phone: string;
    birth_date: string;
    gender: string;
    address: string;
    education_level: string;
    education_institution: string;
    major: string;
    graduation_year: string;
    experience_years: string;
    current_position: string;
    current_company: string;
    skills: string[];
    strengths: string;
    created_at: string;
    marital_status?: string;
    religion?: string;
    nationality?: string;
    height?: string;
    weight?: string;
    blood_type?: string;
    id_card_number?: string;
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
    photo_url?: string;
    cv_url?: string;
    certificates?: string[];
    portfolio_url?: string;
    documents?: Doc[];
  };
}

interface CandidateResult {
  id: string;
  candidate_id: string | null;
  candidate_name: string;
  position: string;
  test_name: string;
  score: number;
  total_questions: number;
  answered_questions: number;
  categories: Record<string, number>;
  status: string;
  interpretation: string | null;
  candidate_profile: Record<string, any> | null;
  completed_at: string;
  webcam_photo_url: string | null;
}

interface TestAnswer {
  id: string;
  question_number: number;
  question_text: string;
  selected_answer: string;
  selected_answer_label: string;
  correct_answer: string | null;
  is_correct: boolean | null;
  category: string | null;
}

export default function RecruitmentProcess() {
  const [activeJobs, setActiveJobs] = useState<JobVacancy[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobVacancy | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [candidateResults, setCandidateResults] = useState<CandidateResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultSearch, setResultSearch] = useState("");
  const [resultFilterStatus, setResultFilterStatus] = useState("all");
  const [resultFilterTest, setResultFilterTest] = useState("all");
  const [selectedResult, setSelectedResult] = useState<CandidateResult | null>(null);
  const [resultAnswers, setResultAnswers] = useState<TestAnswer[]>([]);
  const [resultLoadingAnswers, setResultLoadingAnswers] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [activeInstruments, setActiveInstruments] = useState<{ id: string; name: string }[]>([]);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationApplication, setActivationApplication] = useState<JobApplication | null>(null);
  const [activationSelectedTests, setActivationSelectedTests] = useState<string[]>([]);
  const [activationExpiresAt, setActivationExpiresAt] = useState("");
  const [activationProcessing, setActivationProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadActiveJobs();
    loadActiveInstruments();
  }, []);

  const loadActiveJobs = async () => {
    try {
      const { data: jobsData, error: jobsError } = await supabase
        .from("job_vacancies")
        .select("*")
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      // Load application counts for each job
      const jobsWithCounts = await Promise.all((jobsData || []).map(async (job: any) => {
        const { count, error: countError } = await supabase
          .from("job_applications")
          .select("*", { count: 'exact', head: true })
          .eq("vacancy_id", job.id);

        console.log(`Job ${job.title} has ${count} applications`, countError);
        
        return {
          ...job,
          application_count: count || 0
        };
      }));

      console.log("Jobs with counts:", jobsWithCounts);
      setActiveJobs(jobsWithCounts);
    } catch (error) {
      console.error("Error loading jobs:", error);
      Swal.fire("Error", "Gagal memuat data lowongan", "error");
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
      if (error) {
        console.error("Error loading instruments:", error);
        return;
      }
      setActiveInstruments((data as { id: string; name: string }[]) || []);
    } catch (error) {
      console.error("Error loading instruments:", error);
    }
  };

  const getAssignedTestNames = (testIds?: string[]) => {
    if (!testIds || testIds.length === 0) return "";
    return testIds
      .map((id) => activeInstruments.find((inst) => inst.id === id)?.name || id)
      .join(", ");
  };

  const openActivationModal = (application: JobApplication) => {
    setActivationApplication(application);
    setActivationSelectedTests(application.activation_code?.assigned_tests || []);
    setActivationExpiresAt(
      application.activation_code?.expires_at
        ? application.activation_code.expires_at.split("T")[0]
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    setShowActivationModal(true);
  };

  const closeActivationModal = () => {
    setShowActivationModal(false);
    setActivationApplication(null);
    setActivationSelectedTests([]);
    setActivationExpiresAt("");
  };

  const toggleActivationTest = (id: string) => {
    setActivationSelectedTests((prev) =>
      prev.includes(id) ? prev.filter((testId) => testId !== id) : [...prev, id]
    );
  };

  const saveActivationCode = async () => {
    if (!activationApplication) return;
    if (activationSelectedTests.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Pilih tes",
        text: "Pilih minimal 1 alat tes untuk kode aktivasi.",
      });
      return;
    }

    setActivationProcessing(true);

    try {
      const existingCode = activationApplication.activation_code;
      if (existingCode && existingCode.id) {
        const { error } = await supabase.from("activation_codes").update({
          assigned_tests: activationSelectedTests,
          expires_at: activationExpiresAt || null,
        } as any).eq("id", existingCode.id);
        if (error) throw error;

        Swal.fire({
          icon: "success",
          title: "Kode diperbarui",
          text: "Detail kode aktivasi berhasil diperbarui.",
        });
      } else {
        const newCode = `PSY-${generateRandomString(6)}`;
        const newPassword = generateRandomString(8);
        const { data, error } = await supabase
          .from("activation_codes")
          .insert([
            {
              code: newCode,
              password: newPassword,
              candidate_name: activationApplication.candidate_profile.full_name,
              candidate_email: activationApplication.candidate_profile.email,
              position: selectedJob?.title || "Tes Psikologi",
              status: "active",
              expires_at: activationExpiresAt || null,
              assigned_tests: activationSelectedTests,
            },
          ])
          .select("*")
          .single();

        if (error || !data) {
          throw error || new Error("Gagal membuat kode aktivasi");
        }

        const { error: updateError } = await supabase
          .from("job_applications")
          .update({ activation_code_id: data.id, status: "psychology_test" })
          .eq("id", activationApplication.id);

        if (updateError) throw updateError;

        Swal.fire({
          icon: "success",
          title: "Kode Berhasil Dibuat",
          html: `<div style="font-size:14px;line-height:1.8"><p>Kode: <b style="color:hsl(174,72%,46%);font-family:monospace;letter-spacing:2px">${newCode}</b></p><p>Password: <b style="font-family:monospace">${newPassword}</b></p><p style="font-size:12px;color:#888;margin-top:8px">Berikan kode & password ini kepada kandidat.</p></div>`,
        });
      }

      closeActivationModal();
      if (selectedJob) {
        await loadApplications(selectedJob.id);
      }
    } catch (error) {
      console.error("Error saving activation code:", error);
      Swal.fire("Error", "Gagal menyimpan kode aktivasi", "error");
    } finally {
      setActivationProcessing(false);
    }
  };

  const loadApplications = async (jobId: string) => {
    setLoadingApplications(true);
    try {
      console.log("Loading applications for job:", jobId);
      
      // Load applications first, then get candidate profiles separately
      const { data: applicationsData, error: applicationsError } = await supabase
        .from("job_applications")
        .select("*")
        .eq("vacancy_id", jobId)
        .order("applied_at", { ascending: false });

      if (applicationsError) {
        console.error("Applications error:", applicationsError);
        throw applicationsError;
      }

      const userIds = Array.from(new Set((applicationsData || []).map((application: any) => application.user_id).filter(Boolean)));
      const { data: documentsData, error: documentsError } = userIds.length > 0
        ? await supabase.from("candidate_documents").select("*").in("user_id", userIds)
        : { data: [], error: null };

      if (documentsError) {
        console.error("Candidate documents error:", documentsError);
      }

      const docsByUser = (documentsData as any[] || []).reduce((acc: Record<string, any[]>, doc: any) => {
        if (!acc[doc.user_id]) acc[doc.user_id] = [];
        acc[doc.user_id].push(doc);
        return acc;
      }, {});

      // Get candidate profiles for each application
      const applicationsWithProfiles = await Promise.all(
        (applicationsData || []).map(async (application: any) => {
          const { data: profileData, error: profileError } = await supabase
            .from("candidate_profiles")
            .select("*")
            .eq("user_id", application.user_id)
            .single();

          const candidateDocs = docsByUser[application.user_id] || [];
          const profile = normalizeCandidateProfile(profileData || {
            id: '',
            user_id: application.user_id,
            full_name: 'Unknown',
            email: 'Unknown',
            phone: 'Unknown',
            birth_date: '',
            birth_place: '',
            gender: '',
            address: '',
            city: '',
            bio: '',
            education_level: '',
            education_institution: '',
            major: '',
            graduation_year: '',
            experience_years: '',
            current_position: '',
            current_company: '',
            skills: [],
            strengths: '',
            created_at: '',
            updated_at: '',
            applications: [],
            has_applied: false,
            photo_url: '',
            cv_url: '',
            certificates: [],
            portfolio_url: '',
            marital_status: '',
            religion: '',
            nationality: '',
            height: '',
            weight: '',
            blood_type: '',
            father_name: '',
            mother_name: '',
            spouse_name: '',
            number_of_children: '',
            emergency_contact_name: '',
            emergency_contact_relation: '',
            emergency_contact_phone: '',
            hobbies: '',
            vehicle_license: '',
            has_vehicle: false,
            source_info: '',
            willing_relocate: false,
            willing_overtime: false,
            willing_shift: false,
            expected_salary: '',
            salary_negotiable: false,
            available_from: '',
            notice_period: '',
            additional_info: '',
            social_media: {},
            references: []
          });

          if (!profile.photo_url) {
            const photoDoc = candidateDocs.find((doc: any) => doc.document_type === 'photo');
            if (photoDoc) profile.photo_url = photoDoc.file_url;
          }

          return {
            ...application,
            candidate_profile: {
              ...profile,
              documents: candidateDocs,
            }
          };
        })
      );

      const emails = Array.from(new Set(applicationsWithProfiles.map((app: any) => app.candidate_profile.email).filter(Boolean)));
      const { data: codesData, error: codesError } = emails.length > 0
        ? await supabase.from("activation_codes").select("*").in("candidate_email", emails)
        : { data: [], error: null };

      if (codesError) {
        console.error("Activation codes error:", codesError);
      }

      const applicationsWithCodes = applicationsWithProfiles.map((application: any) => ({
        ...application,
        activation_code: (codesData || []).find((code: any) => code.candidate_email === application.candidate_profile.email) || null,
      }));

      console.log("Final mapped data:", applicationsWithCodes);
      setApplications(applicationsWithCodes);
    } catch (error) {
      console.error("Error loading applications:", error);
      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  useEffect(() => {
    if (selectedJob) {
      loadApplications(selectedJob.id);
    }
  }, [selectedJob]);

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ status: newStatus })
        .eq("id", applicationId);

      if (error) throw error;

      Swal.fire("Berhasil", "Status lamaran berhasil diperbarui", "success");
      loadApplications(selectedJob!.id);
    } catch (error) {
      console.error("Error updating status:", error);
      Swal.fire("Error", "Gagal memperbarui status", "error");
    }
  };

  const viewApplicationDetail = (application: JobApplication) => {
    setSelectedApplication(application);
    setShowDetailModal(true);
  };

  const viewCandidateProfile = (application: JobApplication) => {
    setSelectedApplication(application);
    setShowProfileModal(true);
  };

  const loadCandidateTestResults = async (application: JobApplication) => {
    setResultsLoading(true);
    setCandidateResults([]);
    setSelectedResult(null);
    setResultAnswers([]);

    try {
      const candidateIds = [application.user_id, application.candidate_profile.id].filter(Boolean);
      let { data, error } = await supabase
        .from("test_results")
        .select("*")
        .in("candidate_id", candidateIds)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      let results = (data as CandidateResult[]) || [];

      if (results.length === 0 && application.candidate_profile.full_name) {
        const nameSearch = application.candidate_profile.full_name;
        const { data: nameData, error: nameError } = await supabase
          .from("test_results")
          .select("*")
          .ilike("candidate_name", `%${nameSearch}%`)
          .order("completed_at", { ascending: false });
        if (nameError) throw nameError;
        results = (nameData as CandidateResult[]) || [];
      }

      setCandidateResults(results);
    } catch (error) {
      console.error("Error loading candidate test results:", error);
      Swal.fire("Error", "Gagal memuat hasil tes kandidat", "error");
    } finally {
      setResultsLoading(false);
    }
  };

  const loadResultAnswers = async (resultId: string) => {
    setResultLoadingAnswers(true);
    setResultAnswers([]);

    try {
      const { data, error } = await supabase
        .from("test_answers")
        .select("*")
        .eq("test_result_id", resultId)
        .order("question_number", { ascending: true });
      if (error) throw error;
      setResultAnswers((data as TestAnswer[]) || []);
    } catch (error) {
      console.error("Error loading test result answers:", error);
    } finally {
      setResultLoadingAnswers(false);
    }
  };

  const viewTestResults = async (application: JobApplication) => {
    setSelectedApplication(application);
    setShowResultsModal(true);
    await loadCandidateTestResults(application);
  };

  const handleSelectResult = async (result: CandidateResult) => {
    setSelectedResult(result);
    await loadResultAnswers(result.id);
  };

  const handlePrintResult = (result: CandidateResult) => {
    const statusLabel = result.status === "passed" ? "LULUS" : result.status === "review" ? "REVIEW" : "TIDAK LULUS";
    const categories = Object.entries(result.categories || {}).map(([key, value]) => `<tr><td style="padding:8px;border:1px solid #e5e7eb;">${key}</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${value}</td></tr>`).join("");
    const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Laporan Hasil Tes - ${result.candidate_name}</title><style>body{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;padding:24px;}h1,h2,h3{margin:0 0 12px;}table{border-collapse:collapse;width:100%;margin-top:16px;}th,td{border:1px solid #e5e7eb;padding:10px;text-align:left;}th{background:#f9fafb;} .badge {display:inline-flex;padding:6px 10px;border-radius:9999px;font-size:0.85rem;font-weight:600;background:#e0f2fe;color:#0369a1;} .summary {margin-top:12px;}</style></head><body><h1>Laporan Hasil Tes</h1><p><strong>Kandidat:</strong> ${result.candidate_name}</p><p><strong>Posisi:</strong> ${result.position || '-'}</p><p><strong>Nama Tes:</strong> ${result.test_name}</p><p><strong>Status:</strong> <span class="badge">${statusLabel}</span></p><div class="summary"><p><strong>Skor:</strong> ${result.score} / ${result.total_questions}</p><p><strong>Jawaban Terjawab:</strong> ${result.answered_questions}</p><p><strong>Selesai:</strong> ${formatDate(result.completed_at)}</p></div><h2>Detail Kategori</h2><table><thead><tr><th>Kategori</th><th>Nilai</th></tr></thead><tbody>${categories}</tbody></table>${result.interpretation ? `<h2>Interpretasi</h2><p>${result.interpretation}</p>` : ''}</body></html>`;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const [showDocPreview, setShowDocPreview] = useState(false);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docPreviewName, setDocPreviewName] = useState<string | undefined>(undefined);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
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

  const getLatestEducation = (profile: any) => {
    const history = safeParseJSON(profile?.education_history, []);
    if (Array.isArray(history) && history.length > 0) {
      const latest = history[history.length - 1];
      const parts = [
        latest.level || latest.education_level || latest.degree || latest.degree_name,
        latest.major || latest.field_of_study || latest.education_major,
        latest.institution || latest.education_institution || latest.school,
        latest.year || latest.graduation_year || latest.end_year,
      ].filter(Boolean);
      if (parts.length > 0) return parts.join(' - ');
    }
    const fallback = [
      profile?.education_level,
      profile?.education_institution,
      profile?.major,
      profile?.graduation_year,
    ].filter(Boolean);
    return fallback.length > 0 ? fallback.join(' - ') : '-';
  };

  const safeParseJSON = (value: any, defaultValue: any) => {
    if (value == null || value === "") return defaultValue;
    if (Array.isArray(value)) return value;
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value);
    } catch {
      if (typeof value === "string") {
        return value.split(/[,;]\s*/).filter(Boolean);
      }
      return defaultValue;
    }
  };

  const normalizeCandidateProfile = (profile: any) => ({
    ...profile,
    family_members: safeParseJSON(profile?.family_members, []),
    education_history: safeParseJSON(profile?.education_history, []),
    work_experience: safeParseJSON(profile?.work_experience, []),
    languages: safeParseJSON(profile?.languages, []),
    skills: safeParseJSON(profile?.skills, []),
    hobbies: safeParseJSON(profile?.hobbies, []),
    certificates: safeParseJSON(profile?.certificates, []),
    references: safeParseJSON(profile?.references, []),
    social_media: typeof profile?.social_media === "string"
      ? safeParseJSON(profile.social_media, {})
      : profile?.social_media || {},
    id_card_number: profile?.id_card_number || profile?.nik || '',
    vehicle_license: profile?.vehicle_license || profile?.driving_license || '',
    height: profile?.height || profile?.height_cm || '',
    weight: profile?.weight || profile?.weight_kg || '',
    expected_salary: profile?.expected_salary || profile?.salary_exp_base || '',
    salary_exp_allowances: profile?.salary_exp_allowances || '',
    salary_exp_benefits: profile?.salary_exp_benefits || '',
    salary_expectation: profile?.salary_expectation || '',
    available_from: profile?.available_from || profile?.available_start_date || '',
    notice_period: profile?.notice_period || profile?.notice_period_days || '',
    willing_relocate: profile?.willing_relocate || profile?.willing_to_relocate || false,
    willing_overtime: profile?.willing_overtime || false,
    willing_shift: profile?.willing_shift || false,
    additional_info: profile?.additional_info || '',
    photo_url: profile?.photo_url || '',
    cv_url: profile?.cv_url || profile?.resume_url || '',
    portfolio_url: profile?.portfolio_url || '',
    documents: profile?.documents || [],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-700';
      case 'screening':
        return 'bg-yellow-100 text-yellow-700';
      case 'psychology_test':
        return 'bg-purple-100 text-purple-700';
      case 'hr_interview':
        return 'bg-orange-100 text-orange-700';
      case 'user_interview':
        return 'bg-indigo-100 text-indigo-700';
      case 'offer':
        return 'bg-pink-100 text-pink-700';
      case 'hired':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'applied':
        return '1. Lamaran Diterima';
      case 'screening':
        return '2. Screening CV';
      case 'psychology_test':
        return '3. Tes Psikologi';
      case 'hr_interview':
        return '4. Wawancara HR';
      case 'user_interview':
        return '5. Wawancara User';
      case 'offer':
        return '6. Penawaran';
      case 'hired':
        return '7. Diterima';
      case 'rejected':
        return '8. Ditolak';
      default:
        return status;
    }
  };

  const generateRandomString = (length: number) => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const assignPsychologyTest = async (application: JobApplication) => {
    openActivationModal(application);
  };

  const viewTestResults = (application: JobApplication) => {
    navigate('/admin/results', { state: { search: application.candidate_profile.full_name } });
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.candidate_profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidate_profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidate_profile.current_position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Proses Rekrutmen</h1>
            <p className="text-muted-foreground">Kelola proses lamaran untuk setiap lowongan aktif</p>
          </div>
        </div>

        {!selectedJob ? (
          /* Job Categories */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Lowongan Aktif</h2>
              <span className="text-sm text-muted-foreground">
                {activeJobs.length} lowongan aktif
              </span>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Memuat data lowongan...
              </div>
            ) : activeJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Tidak ada lowongan aktif
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Briefcase className="h-6 w-6 text-primary" />
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Aktif
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-2">{job.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{job.department}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {job.employment_type}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Tutup: {formatDate(job.closes_at)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        {job.application_count || 0} pelamar
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Applications for Selected Job */
          <div className="space-y-4">
            {/* Back Button */}
            <button
              onClick={() => {
                setSelectedJob(null);
                setApplications([]);
              }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Kembali ke daftar lowongan
            </button>

            {/* Job Header */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedJob.title}</h2>
                  <p className="text-muted-foreground">{selectedJob.department}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Pelamar</div>
                  <div className="text-2xl font-bold text-foreground">{applications.length}</div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari nama, email, atau posisi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-9 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">Semua Status</option>
                  <option value="applied">Lamaran Diterima</option>
                  <option value="screening">Screening CV</option>
                  <option value="psychology_test">Tes Psikologi</option>
                  <option value="hr_interview">Wawancara HR</option>
                  <option value="user_interview">Wawancara User</option>
                  <option value="offer">Penawaran</option>
                  <option value="hired">Diterima</option>
                  <option value="rejected">Ditolak</option>
                </select>
                <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
              {[
                { status: 'applied', label: '1. Lamaran Diterima', icon: CheckCircle },
                { status: 'screening', label: '2. Screening CV', icon: AlertCircle },
                { status: 'psychology_test', label: '3. Tes Psikologi', icon: Users },
                { status: 'hr_interview', label: '4. Wawancara HR', icon: Users },
                { status: 'user_interview', label: '5. Wawancara User', icon: Users },
                { status: 'offer', label: '6. Penawaran', icon: Award },
                { status: 'hired', label: '7. Diterima', icon: CheckCircle },
                { status: 'rejected', label: '8. Ditolak', icon: XCircle },
              ].map(({ status, label, icon: Icon }) => (
                <div key={status} className="bg-card border border-border rounded-lg p-4 text-center">
                  <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-lg font-bold text-foreground">
                    {applications.filter(app => app.status === status).length}
                  </div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                  {applications.filter(app => app.status === status).length > 0 && (
                    <div className="mt-2 text-xs text-green-600 font-medium">
                      {applications.filter(app => app.status === status)[0]?.applied_at && 
                        formatDate(applications.filter(app => app.status === status)[0].applied_at)
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Applications Table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pelamar</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pendidikan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal Lamar</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tes</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loadingApplications ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          Memuat data lamaran...
                        </td>
                      </tr>
                    ) : filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                          {searchTerm ? "Tidak ada hasil pencarian" : "Belum ada lamaran untuk lowongan ini"}
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((application) => (
                        <tr key={application.id} className="hover:bg-muted/50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-primary">
                                  {application.candidate_profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{application.candidate_profile.full_name}</div>
                                <div className="text-sm text-muted-foreground">{application.candidate_profile.email}</div>
                                <div className="text-sm text-muted-foreground">{application.candidate_profile.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-foreground">{getLatestEducation(application.candidate_profile)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-foreground">{formatDate(application.applied_at)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(application.status)}`}>
                              {getStatusLabel(application.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {application.activation_code ? (
                              <div className="space-y-1">
                                <div className="text-sm font-semibold text-foreground">{application.activation_code.code}</div>
                                <div className="text-xs text-muted-foreground">Pass: {application.activation_code.password}</div>
                                {application.activation_code.assigned_tests?.length ? (
                                  <div className="text-xs text-muted-foreground">Tes: {getAssignedTestNames(application.activation_code.assigned_tests)}</div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">Belum ada tes terpilih</div>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  {application.activation_code.test_completed_at
                                    ? `Selesai ${formatDate(application.activation_code.test_completed_at)}`
                                    : `Berlaku hingga ${formatDate(application.activation_code.expires_at || '')}`}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Belum ditugaskan</div>
                                <button
                                  onClick={() => openActivationModal(application)}
                                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all glow-primary"
                                >
                                  Buat Kode Tes Psikologi
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => viewApplicationDetail(application)}
                                className="px-3 py-1 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition"
                              >
                                Detail
                              </button>
                              <button
                                onClick={() => viewCandidateProfile(application)}
                                className="px-3 py-1 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition"
                              >
                                Profil
                              </button>
                              <button
                                onClick={() => openActivationModal(application)}
                                className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition"
                              >
                                {application.activation_code
                                  ? application.activation_code.test_completed_at
                                    ? 'Perbarui Kode'
                                    : 'Perbarui Kode Tes Psikologi'
                                  : 'Buat Kode Tes Psikologi'}
                              </button>
                              {application.activation_code && application.activation_code.test_completed_at && (
                                <button
                                  onClick={() => viewTestResults(application)}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition"
                                >
                                  Lihat Hasil Tes
                                </button>
                              )}
                              <select
                                value={application.status}
                                onChange={(e) => updateApplicationStatus(application.id, e.target.value)}
                                className="text-sm border border-border rounded px-2 py-1 bg-background"
                              >
                                <option value="applied">1. Lamaran Diterima</option>
                                <option value="screening">2. Screening CV</option>
                                <option value="psychology_test">3. Tes Psikologi</option>
                                <option value="hr_interview">4. Wawancara HR</option>
                                <option value="user_interview">5. Wawancara User</option>
                                <option value="offer">6. Penawaran</option>
                                <option value="hired">7. Diterima</option>
                                <option value="rejected">8. Ditolak</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {showActivationModal && activationApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-xl max-w-3xl w-full overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Buat / Perbarui Kode Tes Psikologi</h2>
                  <p className="text-sm text-muted-foreground">Sama seperti pada halaman Kode Aktivasi.</p>
                </div>
                <button
                  onClick={closeActivationModal}
                  className="p-1 rounded hover:bg-muted transition"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-muted/40 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Kandidat</div>
                    <div className="font-semibold text-foreground">{activationApplication.candidate_profile.full_name}</div>
                    <div className="text-sm text-muted-foreground">{activationApplication.candidate_profile.email}</div>
                    <div className="text-sm text-muted-foreground">{activationApplication.candidate_profile.current_position || "-"}</div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Lowongan</div>
                    <div className="font-semibold text-foreground">{selectedJob?.title || "Tes Psikologi"}</div>
                    <div className="text-sm text-muted-foreground">{selectedJob?.department || "-"}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Pilih Tes</label>
                  <div className="grid grid-cols-1 gap-2">
                    {activeInstruments.map((inst) => (
                      <button
                        key={inst.id}
                        type="button"
                        onClick={() => toggleActivationTest(inst.id)}
                        className={`w-full text-left rounded-lg border px-4 py-3 transition ${activationSelectedTests.includes(inst.id) ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-foreground">{inst.name}</span>
                          {activationSelectedTests.includes(inst.id) && <span className="text-xs text-primary">Dipilih</span>}
                        </div>
                      </button>
                    ))}
                    {activeInstruments.length === 0 && (
                      <div className="text-sm text-muted-foreground">Tidak ada daftar tes aktif saat ini.</div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Tanggal Expire</label>
                    <input
                      type="date"
                      value={activationExpiresAt}
                      onChange={(e) => setActivationExpiresAt(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="text-xs text-muted-foreground mb-2">Ringkasan</div>
                    <div className="text-sm text-foreground">{activationApplication.activation_code ? 'Memperbarui kode aktivasi yang sudah ada.' : 'Membuat kode aktivasi baru untuk kandidat.'}</div>
                    {activationSelectedTests.length ? (
                      <div className="text-xs text-muted-foreground mt-2">Tes yang dipilih: {getAssignedTestNames(activationSelectedTests)}</div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-2">Belum ada tes dipilih.</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-border p-4">
                <button onClick={closeActivationModal} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition">Batal</button>
                <button
                  onClick={saveActivationCode}
                  disabled={activationProcessing}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {activationProcessing ? 'Menyimpan...' : activationApplication.activation_code ? 'Perbarui Kode Tes Psikologi' : 'Buat Kode Tes Psikologi'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal - Application Info */}
        {showDetailModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">Detail Lamaran</h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-1 rounded hover:bg-muted transition"
                  >
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                {/* Job Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Informasi Lowongan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Posisi</p>
                      <p className="font-medium text-foreground">{selectedJob?.title || '-'}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Departemen</p>
                      <p className="font-medium text-foreground">{selectedJob?.department || '-'}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Lokasi</p>
                      <p className="font-medium text-foreground">{selectedJob?.location || '-'}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Tipe Kerja</p>
                      <p className="font-medium text-foreground">{selectedJob?.employment_type || '-'}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Tutup Lowongan</p>
                      <p className="font-medium text-foreground">{formatDate(selectedJob?.closes_at || '')}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Status Lowongan</p>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Aktif</span>
                    </div>
                  </div>
                </div>

                {/* Application Information */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Informasi Lamaran
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Nama Pelamar</p>
                      <p className="font-medium text-foreground">{selectedApplication.candidate_profile.full_name}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="font-medium text-foreground">{selectedApplication.candidate_profile.email}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Telepon</p>
                      <p className="font-medium text-foreground">{selectedApplication.candidate_profile.phone}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Tanggal Lamar</p>
                      <p className="font-medium text-foreground">{formatDate(selectedApplication.applied_at)}</p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Status Saat Ini</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedApplication.status)}`}>
                        {getStatusLabel(selectedApplication.status)}
                      </span>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm text-muted-foreground mb-1">Pendidikan Terakhir</p>
                      <p className="font-medium text-foreground">{selectedApplication.candidate_profile.education_level}</p>
                    </div>
                  </div>
                </div>

                {/* Recruitment Process Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Proses Rekrutmen
                  </h3>
                  <div className="space-y-3">
                    {[
                      { status: 'applied', label: '1. Lamaran Diterima', icon: '📥' },
                      { status: 'screening', label: '2. Screening CV', icon: '📋' },
                      { status: 'psychology_test', label: '3. Tes Psikologi', icon: '🧠' },
                      { status: 'hr_interview', label: '4. Wawancara HR', icon: '👔' },
                      { status: 'user_interview', label: '5. Wawancara User', icon: '👤' },
                      { status: 'offer', label: '6. Penawaran', icon: '📄' },
                      { status: 'hired', label: '7. Diterima', icon: '✅' },
                      { status: 'rejected', label: '8. Ditolak', icon: '❌' }
                    ].map((step) => {
                      const isCurrentStep = selectedApplication.status === step.status;
                      const isCompleted = ['applied', 'screening', 'psychology_test', 'hr_interview', 'user_interview', 'offer', 'hired'].indexOf(step.status) < 
                                        ['applied', 'screening', 'psychology_test', 'hr_interview', 'user_interview', 'offer', 'hired'].indexOf(selectedApplication.status);
                      
                      return (
                        <div 
                          key={step.status}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            isCurrentStep 
                              ? 'bg-primary/10 border-primary/20' 
                              : isCompleted 
                                ? 'bg-muted/30 border-border' 
                                : 'bg-muted/10 border-border/50'
                          }`}
                        >
                          <span className="text-xl">{step.icon}</span>
                          <div className="flex-1">
                            <p className={`font-medium ${isCurrentStep ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {step.label}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {isCurrentStep ? 'Sedang berjalan' : isCompleted ? 'Selesai' : 'Menunggu'}
                            </p>
                          </div>
                          {isCurrentStep && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Modal - Candidate Details */}
        {showProfileModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">Profil Kandidat</h2>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="p-1 rounded hover:bg-muted transition"
                  >
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col h-[calc(90vh-8rem)] overflow-hidden">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-border">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-primary/20 flex items-center justify-center">
                      {selectedApplication.candidate_profile.photo_url ? (
                        <img
                          src={selectedApplication.candidate_profile.photo_url}
                          alt={selectedApplication.candidate_profile.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-primary">
                          {selectedApplication.candidate_profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-foreground">{selectedApplication.candidate_profile.full_name}</h3>
                      <p className="text-muted-foreground">{selectedApplication.candidate_profile.email}</p>
                      <p className="text-muted-foreground">{selectedApplication.candidate_profile.phone}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedApplication.status)}`}>
                          {getStatusLabel(selectedApplication.status)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Lamar: {formatDate(selectedApplication.applied_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
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
                <div className="flex-1 overflow-y-auto pb-28">
                  <Tabs defaultValue="personal" className="w-full h-full">
                    <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-xl">
                      <div className="overflow-x-auto">
                        <TabsList className="flex min-w-max items-center gap-2 p-3 bg-card/95 border-b border-border">
                          <TabsTrigger value="personal" className="flex-shrink-0 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm">
                            <Users className="h-4 w-4" />
                            Profil
                          </TabsTrigger>
                          <TabsTrigger value="family" className="flex-shrink-0 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm">
                            <Heart className="h-4 w-4" />
                            Keluarga
                          </TabsTrigger>
                          <TabsTrigger value="education" className="flex-shrink-0 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm">
                            <GraduationCap className="h-4 w-4" />
                            Pendidikan
                          </TabsTrigger>
                          <TabsTrigger value="skills" className="flex-shrink-0 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm">
                            <Star className="h-4 w-4" />
                            Skill
                          </TabsTrigger>
                          <TabsTrigger value="experience" className="flex-shrink-0 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm">
                            <Briefcase className="h-4 w-4" />
                            Pengalaman
                          </TabsTrigger>
                          <TabsTrigger value="salary" className="flex-shrink-0 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm">
                            <Target className="h-4 w-4" />
                            Salary
                          </TabsTrigger>
                          <TabsTrigger value="documents" className="flex-shrink-0 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm">
                            <FileText className="h-4 w-4" />
                            Data
                          </TabsTrigger>
                          <TabsTrigger value="additional" className="flex-shrink-0 inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm">
                            <MessageSquare className="h-4 w-4" />
                            Informasi
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </div>

                    {/* Personal Info Tab */}
                    <TabsContent value="personal" className="p-6 space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Informasi Pribadi
                          </h3>
                          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm text-muted-foreground">Nama Lengkap</label>
                                <p className="font-medium text-foreground">{selectedApplication.candidate_profile.full_name || '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Email</label>
                                <p className="font-medium text-foreground">{selectedApplication.candidate_profile.email || '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Telepon</label>
                                <p className="font-medium text-foreground">{selectedApplication.candidate_profile.phone || '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Tanggal Lahir</label>
                                <p className="font-medium text-foreground">{formatDate(selectedApplication.candidate_profile.birth_date)}</p>
                              </div>
                                                            <div>
                                <label className="text-sm text-muted-foreground">Jenis Kelamin</label>
                                <p className="font-medium text-foreground">{selectedApplication.candidate_profile.gender || '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Status Pernikahan</label>
                                <p className="font-medium text-foreground">{selectedApplication.candidate_profile.marital_status || '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Agama</label>
                                <p className="font-medium text-foreground">{selectedApplication.candidate_profile.religion || '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Kewarganegaraan</label>
                                <p className="font-medium text-foreground">{selectedApplication.candidate_profile.nationality || '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Golongan Darah</label>
                                <p className="font-medium text-foreground">{selectedApplication.candidate_profile.blood_type || '-'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Identitas & Fisik
                          </h3>
                          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm text-muted-foreground">No. KTP</label>
                                <p className="font-medium text-foreground">{selectedApplication.candidate_profile.id_card_number || '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">No. Passport</label>
                                <p className="font-medium text-foreground">{selectedApplication.candidate_profile.passport_number || '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">SIM</label>
                                <p className="font-medium text-foreground">{selectedApplication.candidate_profile.driving_license || '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Tinggi Badan</label>
                                <p className="font-medium text-foreground">{selectedApplication.candidate_profile.height || '-'}</p>
                              </div>
                              <div>
                                <label className="text-sm text-muted-foreground">Berat Badan</label>
                                <p className="font-medium text-foreground">{selectedApplication.candidate_profile.weight || '-'}</p>
                              </div>
                            </div>
                          </div>

                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Home className="h-5 w-5 text-primary" />
                            Alamat
                          </h3>
                          <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                            <div>
                              <label className="text-sm text-muted-foreground">Alamat Lengkap</label>
                              <p className="font-medium text-foreground">{selectedApplication.candidate_profile.address || '-'}</p>
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
                        {selectedApplication.candidate_profile.family_members && selectedApplication.candidate_profile.family_members.length > 0 ? (
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
                                {selectedApplication.candidate_profile.family_members.map((member: any, index: number) => (
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
                            const getLatestEducation = () => {
                              if (!selectedApplication.candidate_profile.education_history) return null;
                              let educationArray: any[] = [];
                              if (typeof selectedApplication.candidate_profile.education_history === 'string') {
                                try {
                                  educationArray = JSON.parse(selectedApplication.candidate_profile.education_history);
                                } catch {
                                  educationArray = [];
                                }
                              } else if (Array.isArray(selectedApplication.candidate_profile.education_history)) {
                                educationArray = selectedApplication.candidate_profile.education_history;
                              }
                              if (educationArray.length === 0) return null;
                              const educationPriority: Record<string, number> = {
                                'S3': 8, 'S2': 7, 'S1': 6, 'D4': 5, 'D3': 4, 'D2': 3, 'D1': 2,
                                'SMA/SMK': 1, 'SMK': 1, 'SMA': 1, 'SMP': 0, 'SD': -1
                              };
                              return educationArray.reduce((latest, current) => {
                                const latestPriority = educationPriority[latest.level] || 0;
                                const currentPriority = educationPriority[current.level] || 0;
                                if (latestPriority === currentPriority) {
                                  const latestYear = parseInt(latest.end_year || latest.graduation_year || '0', 10) || 0;
                                  const currentYear = parseInt(current.end_year || current.graduation_year || '0', 10) || 0;
                                  return currentYear > latestYear ? current : latest;
                                }
                                return currentPriority > latestPriority ? current : latest;
                              });
                            };
                            const latestEducation = getLatestEducation();
                            if (!latestEducation) {
                              return [
                                { label: 'Tingkat Pendidikan', value: '-' },
                                { label: 'Institusi Pendidikan', value: '-' },
                                { label: 'Jurusan/Program Studi', value: '-' },
                                { label: 'Tahun Lulus', value: '-' }
                              ].map((item) => (
                                <div key={item.label}>
                                  <label className="text-sm text-muted-foreground">{item.label}</label>
                                  <p className="font-medium text-foreground">{item.value}</p>
                                </div>
                              ));
                            }
                            return [
                              { label: 'Tingkat Pendidikan', value: latestEducation.level || '-' },
                              { label: 'Institusi Pendidikan', value: latestEducation.school || latestEducation.institution || '-' },
                              { label: 'Jurusan/Program Studi', value: latestEducation.major || latestEducation.field_of_study || '-' },
                              { label: 'Tahun Lulus', value: latestEducation.end_year || latestEducation.graduation_year || '-' }
                            ].map((item) => (
                              <div key={item.label}>
                                <label className="text-sm text-muted-foreground">{item.label}</label>
                                <p className="font-medium text-foreground">{item.value}</p>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {selectedApplication.candidate_profile.education_history && Array.isArray(selectedApplication.candidate_profile.education_history) && selectedApplication.candidate_profile.education_history.length > 0 && (
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
                                {selectedApplication.candidate_profile.education_history.map((edu: any, index: number) => (
                                  <tr key={index} className="hover:bg-muted/20">
                                    <td className="border border-border px-4 py-2 text-sm font-medium">{edu.level || '-'}</td>
                                    <td className="border border-border px-4 py-2 text-sm">{edu.school || edu.institution || '-'}</td>
                                    <td className="border border-border px-4 py-2 text-sm">{edu.major || edu.field_of_study || '-'}</td>
                                    <td className="border border-border px-4 py-2 text-sm">{edu.start_year || edu.start || '-'}</td>
                                    <td className="border border-border px-4 py-2 text-sm">{edu.end_year || edu.graduation_year || '-'}</td>
                                    <td className="border border-border px-4 py-2 text-sm">{edu.grade || edu.gpa || '-'}</td>
                                    <td className="border border-border px-4 py-2 text-sm">{edu.status || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    {/* Skills Tab */}
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
                                  if (!selectedApplication.candidate_profile.skills || !Array.isArray(selectedApplication.candidate_profile.skills) || selectedApplication.candidate_profile.skills.length === 0) {
                                    return <span className="text-muted-foreground">Tidak ada data</span>;
                                  }
                                  return selectedApplication.candidate_profile.skills.map((skill: any, index: number) => {
                                    const skillName = typeof skill === 'string' ? skill : skill?.name || '';
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
                          {selectedApplication.candidate_profile.strengths && (
                            <div>
                              <label className="text-sm text-muted-foreground">Kelebihan</label>
                              <p className="text-foreground mt-2 whitespace-pre-line">{selectedApplication.candidate_profile.strengths}</p>
                            </div>
                          )}
                        </div>

                        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Languages className="h-5 w-5 text-primary" />
                            Bahasa & Hobi
                          </h3>
                          {selectedApplication.candidate_profile.languages && Array.isArray(selectedApplication.candidate_profile.languages) && selectedApplication.candidate_profile.languages.length > 0 && (
                            <div>
                              <label className="text-sm text-muted-foreground">Bahasa</label>
                              <div className="space-y-2 mt-2">
                                {selectedApplication.candidate_profile.languages.map((lang: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                                    <span className="text-sm font-medium">{lang.language || '-'}</span>
                                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">{lang.level || '-'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedApplication.candidate_profile.hobbies && Array.isArray(selectedApplication.candidate_profile.hobbies) && selectedApplication.candidate_profile.hobbies.length > 0 && (
                            <div>
                              <label className="text-sm text-muted-foreground">Hobi</label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {selectedApplication.candidate_profile.hobbies.map((hobby: any, index: number) => (
                                  <span key={index} className="px-2 py-1 bg-muted/50 text-muted-foreground rounded text-sm">
                                    {hobby}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Experience Tab */}
                    <TabsContent value="experience" className="p-6 space-y-6">
                      {selectedApplication.candidate_profile.work_experience && Array.isArray(selectedApplication.candidate_profile.work_experience) && selectedApplication.candidate_profile.work_experience.length > 0 ? (
                        <div className="bg-card border border-border rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                            <Users2 className="h-5 w-5 text-primary" />
                            Riwayat Pengalaman Kerja
                          </h3>
                          <div className="space-y-4">
                            {selectedApplication.candidate_profile.work_experience.map((work: any, index: number) => (
                              <div key={index} className="border border-border rounded-lg p-4 hover:bg-muted/20">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-semibold text-foreground">{work.position_start || work.position || work.role || '-'}</h4>
                                    <p className="text-sm text-muted-foreground">{work.company_name || work.company || '-'}</p>
                                  </div>
                                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                    {work.join_date && work.end_date ? `${work.join_date} - ${work.end_date}` : work.period || work.duration || '-'}
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
                      ) : (
                        <div className="bg-card border border-border rounded-lg p-6 text-center text-muted-foreground">
                          Belum ada riwayat pengalaman kerja
                        </div>
                      )}
                    </TabsContent>

                    {/* Salary Tab */}
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
                              <p className="font-medium text-foreground text-lg">{selectedApplication.candidate_profile.expected_salary || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Tunjangan yang Diharapkan</label>
                              <p className="font-medium text-foreground">{selectedApplication.candidate_profile.salary_exp_allowances || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Benefit/Fasilitas yang Diharapkan</label>
                              <p className="font-medium text-foreground whitespace-pre-line">{selectedApplication.candidate_profile.salary_exp_benefits || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Gaji Saat Ini</label>
                              <p className="font-medium text-foreground">{selectedApplication.candidate_profile.salary_expectation || '-'}</p>
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
                              <p className="font-medium text-foreground">{selectedApplication.candidate_profile.available_from || selectedApplication.candidate_profile.available_start_date || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Periode Notice</label>
                              <p className="font-medium text-foreground">{selectedApplication.candidate_profile.notice_period ? `${selectedApplication.candidate_profile.notice_period} hari` : '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Bersedia Relokasi</label>
                              <p className="font-medium text-foreground">{selectedApplication.candidate_profile.willing_relocate ? 'Ya' : 'Tidak'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Bersedia Lembur</label>
                              <p className="font-medium text-foreground">{selectedApplication.candidate_profile.willing_overtime ? 'Ya' : 'Tidak'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Bersedia Shift</label>
                              <p className="font-medium text-foreground">{selectedApplication.candidate_profile.willing_shift ? 'Ya' : 'Tidak'}</p>
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
                        {selectedApplication.candidate_profile.documents && selectedApplication.candidate_profile.documents.length > 0 && (
                          <div>
                            <label className="text-sm text-muted-foreground">Dokumen Kandidat</label>
                            <div className="mt-2 space-y-2">
                              {selectedApplication.candidate_profile.documents.map((doc) => (
                                <div key={doc.id} className="p-3 border border-border rounded-lg bg-muted/20">
                                  <div className="flex items-center gap-3">
                                    <FileText className="h-6 w-6 text-primary" />
                                    <div className="flex-1">
                                      <p className="font-medium text-foreground">{getDocumentLabel(doc.document_type)}</p>
                                      <p className="text-sm text-muted-foreground truncate">{doc.file_name}</p>
                                    </div>
                                    <button onClick={() => { setDocPreviewUrl(doc.file_url); setDocPreviewName(doc.file_name); setShowDocPreview(true); }} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors inline-flex items-center">
                                      <Eye className="h-4 w-4 mr-2 inline" />
                                      Preview
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedApplication.candidate_profile.cv_url && !(selectedApplication.candidate_profile.documents?.some((doc) => doc.document_type === 'cv')) && (
                          <div>
                            <label className="text-sm text-muted-foreground">CV/Resume</label>
                            <div className="mt-2 p-4 border border-border rounded-lg bg-muted/20">
                              <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-primary" />
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">CV/Resume</p>
                                  <p className="text-sm text-muted-foreground">Dokumen CV pelamar</p>
                                </div>
                                <button onClick={() => { setDocPreviewUrl(selectedApplication.candidate_profile.cv_url); setDocPreviewName('CV - ' + (selectedApplication.candidate_profile.full_name || 'cv')); setShowDocPreview(true); }} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors inline-flex items-center">
                                  <Eye className="h-4 w-4 mr-2 inline" />
                                  Preview
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedApplication.candidate_profile.certificates && Array.isArray(selectedApplication.candidate_profile.certificates) && selectedApplication.candidate_profile.certificates.length > 0 && (
                          <div>
                            <label className="text-sm text-muted-foreground">Sertifikat</label>
                            <div className="mt-2 space-y-2">
                              {selectedApplication.candidate_profile.certificates.map((cert, index) => (
                                <div key={index} className="p-3 border border-border rounded-lg bg-muted/20">
                                  <div className="flex items-center gap-3">
                                    <Award className="h-6 w-6 text-warning" />
                                    <div className="flex-1">
                                      <p className="font-medium text-foreground">Sertifikat {index + 1}</p>
                                      <p className="text-sm text-muted-foreground">{cert}</p>
                                    </div>
                                    <button onClick={() => { setDocPreviewUrl(typeof cert === 'string' ? cert : undefined); setDocPreviewName(`Sertifikat ${index + 1}`); setShowDocPreview(true); }} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors inline-flex items-center">
                                      <Eye className="h-4 w-4 mr-2 inline" />
                                      Preview
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedApplication.candidate_profile.portfolio_url && !(selectedApplication.candidate_profile.documents?.some((doc) => doc.document_type === 'portfolio')) && (
                          <div>
                            <label className="text-sm text-muted-foreground">Portofolio</label>
                            <div className="mt-2 p-4 border border-border rounded-lg bg-muted/20">
                              <div className="flex items-center gap-3">
                                <BookOpen className="h-8 w-8 text-primary" />
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">Portofolio</p>
                                  <p className="text-sm text-muted-foreground">Tautan portofolio</p>
                                </div>
                                <button onClick={() => { setDocPreviewUrl(selectedApplication.candidate_profile.portfolio_url); setDocPreviewName('Portofolio - ' + (selectedApplication.candidate_profile.full_name || 'portfolio')); setShowDocPreview(true); }} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors inline-flex items-center">
                                  <Eye className="h-4 w-4 mr-2 inline" />
                                  Lihat
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {!selectedApplication.candidate_profile.documents?.length && !selectedApplication.candidate_profile.cv_url && !(selectedApplication.candidate_profile.certificates && selectedApplication.candidate_profile.certificates.length > 0) && !selectedApplication.candidate_profile.portfolio_url && (
                          <div className="text-center py-8 text-muted-foreground">
                            <FolderOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Belum ada dokumen yang diunggah</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {showDocPreview && docPreviewUrl && (
                      <DocumentPreview url={docPreviewUrl} name={docPreviewName} onClose={() => { setShowDocPreview(false); setDocPreviewUrl(null); setDocPreviewName(undefined); }} />
                    )}

                    {/* Additional Info Tab */}
                    <TabsContent value="additional" className="p-6 space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Informasi Tambahan
                          </h3>
                          {selectedApplication.candidate_profile.additional_info ? (
                            <div>
                              <label className="text-sm text-muted-foreground">Informasi Tambahan</label>
                              <p className="text-foreground mt-2 whitespace-pre-line">{selectedApplication.candidate_profile.additional_info}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Belum ada informasi tambahan</p>
                          )}
                        </div>

                        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Link2 className="h-5 w-5 text-primary" />
                            Social Media & Referensi
                          </h3>
                          {selectedApplication.candidate_profile.social_media && Object.keys(selectedApplication.candidate_profile.social_media).length > 0 ? (
                            <div>
                              <label className="text-sm text-muted-foreground">Social Media</label>
                              <div className="space-y-2 mt-2">
                                {Object.entries(selectedApplication.candidate_profile.social_media).map(([platform, url]: [string, any]) => (
                                  <div key={platform} className="flex items-center gap-2 p-2 bg-muted/20 rounded">
                                    <span className="text-sm font-medium capitalize">{platform}:</span>
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                      {url}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Belum ada tautan social media</p>
                          )}
                          {selectedApplication.candidate_profile.references && Array.isArray(selectedApplication.candidate_profile.references) && selectedApplication.candidate_profile.references.length > 0 ? (
                            <div>
                              <label className="text-sm text-muted-foreground">Referensi</label>
                              <div className="space-y-2 mt-2">
                                {selectedApplication.candidate_profile.references.map((ref: any, index: number) => (
                                  <div key={index} className="p-2 bg-muted/20 rounded">
                                    <p className="text-sm font-medium">{ref.name || '-'}</p>
                                    <p className="text-xs text-muted-foreground">{ref.position || '-'}</p>
                                    <p className="text-xs text-muted-foreground">{ref.contact || '-'}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Belum ada referensi</p>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 flex items-center justify-end border-t border-border bg-card/95 backdrop-blur-xl px-6 py-4">
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="rounded-lg border border-border bg-card px-5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {showApplicationForm && selectedApplication && (
          <ProfessionalApplicationForm
            candidate={selectedApplication.candidate_profile}
            onClose={() => setShowApplicationForm(false)}
          />
        )}
      </div>
    </AdminLayout>
  );
}
