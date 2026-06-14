import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, Trash2, Plus, Pencil, Upload, X, Users, UserPlus, MailCheck, CheckCircle, XCircle, Search, Filter, Download, Printer, FileText, MoreVertical, Edit, Building2, User, Camera, BookOpen, FolderOpen, Heart, Globe, Ruler, Weight, CreditCard, Home, Car, Languages, Target, Users2, Star, MessageSquare, Link2, Briefcase, MapPin, Clock, Calendar, GraduationCap, Award, AlertCircle, ChevronRight, Bell, SettingsIcon, UserCog, Shield, ChevronDown, Workflow, Mail, Phone, Brain, Banknote } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import CandidateTestResultView from "@/components/admin/CandidateTestResultView";
import { generatePrintHTML, printHTML } from "@/utils/printUtils";
import { supabase } from "@/integrations/supabase/client";
import DocumentPreview from "@/components/DocumentPreview";
import Swal from "sweetalert2";
import { syncExpiredRecruitment } from "@/lib/recruitmentExpiry";

const HIDDEN_RECRUITMENT_APPLICATION_STATUSES = ["expired", "withdrawn"];

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
  activation_codes?: ActivationCode[];
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
  const [educationFilter, setEducationFilter] = useState("all");
  const [testFilter, setTestFilter] = useState("all");
  const [salaryMinFilter, setSalaryMinFilter] = useState("");
  const [salaryMaxFilter, setSalaryMaxFilter] = useState("");
  const [appliedFromFilter, setAppliedFromFilter] = useState("");
  const [appliedToFilter, setAppliedToFilter] = useState("");
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
  const [activationMode, setActivationMode] = useState<"create_new" | "allow_retake">("create_new");
  const [activationEditCodeId, setActivationEditCodeId] = useState<string | null>(null);
  const [contactDraft, setContactDraft] = useState("");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadActiveJobs();
    loadActiveInstruments();
  }, []);

  const loadActiveJobs = async () => {
    try {
      await syncExpiredRecruitment();
      const { data: jobsData, error: jobsError } = await supabase
        .from("job_vacancies")
        .select("*")
        .eq("status", "active")
        .or(`closes_at.is.null,closes_at.gte.${new Date().toISOString()}`)
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      // Load application counts for each job
      const jobsWithCounts = await Promise.all((jobsData || []).map(async (job: any) => {
        const { count, error: countError } = await supabase
          .from("job_applications")
          .select("*", { count: 'exact', head: true })
          .eq("vacancy_id", job.id)
          .neq("status", HIDDEN_RECRUITMENT_APPLICATION_STATUSES[0])
          .neq("status", HIDDEN_RECRUITMENT_APPLICATION_STATUSES[1]);

        console.log(`Job ${job.title} has ${count} applications`, countError);
        
        return {
          ...job,
          application_count: count || 0
        };
      }));

      console.log("Jobs with counts:", jobsWithCounts);
      setActiveJobs(jobsWithCounts);
      setSelectedJob((current) => {
        if (!current) return current;
        return jobsWithCounts.some((job: any) => job.id === current.id) ? current : null;
      });
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

  const getActivationStatusLabel = (code: ActivationCode) => {
    if (code.test_completed_at) return "Sudah dikerjakan";
    if (code.expires_at && new Date(code.expires_at) < new Date()) return "Expired";
    return "Aktif";
  };

  const getActivationStatusClass = (code: ActivationCode) => {
    if (code.test_completed_at) return "bg-amber-100 text-amber-700";
    if (code.expires_at && new Date(code.expires_at) < new Date()) return "bg-destructive/10 text-destructive";
    return "bg-emerald-100 text-emerald-700";
  };

  const isBcryptPassword = (password?: string | null) => /^\$2[aby]\$\d{2}\$/.test(String(password || ""));

  const getActivationPasswordText = (code: ActivationCode) => {
    if (!code.password) return "-";
    if (isBcryptPassword(code.password)) return "Password asli tidak dapat ditampilkan";
    return code.password;
  };

  const copyActivationAccess = async (code: ActivationCode) => {
    if (isBcryptPassword(code.password)) {
      Swal.fire({
        icon: "info",
        title: "Password tidak bisa disalin",
        text: "Password lama tersimpan sebagai hash bcrypt. Buat kode baru jika perlu membagikan password asli ke kandidat.",
      });
      return;
    }
    await navigator.clipboard.writeText(`Kode: ${code.code}\nPassword: ${code.password}`);
    Swal.fire({ icon: "success", title: "Kode dan password disalin", timer: 1200, showConfirmButton: false });
  };

  const getPrimaryActivationCode = (application: JobApplication) => {
    return application.activation_code || application.activation_codes?.[0] || null;
  };

  const openActivationModal = (application: JobApplication) => {
    const primaryCode = getPrimaryActivationCode(application);
    setActivationApplication(application);
    setActivationEditCodeId(primaryCode?.id || null);
    setActivationSelectedTests(primaryCode?.assigned_tests || []);
    setActivationExpiresAt(
      primaryCode?.expires_at
        ? primaryCode.expires_at.split("T")[0]
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    setShowActivationModal(true);
  };

  const closeActivationModal = () => {
    setShowActivationModal(false);
    setActivationApplication(null);
    setActivationSelectedTests([]);
    setActivationExpiresAt("");
    setActivationEditCodeId(null);
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
      const existingCode = getPrimaryActivationCode(activationApplication);

      if (activationEditCodeId) {
        const { error } = await supabase.from('activation_codes').update({
          assigned_tests: activationSelectedTests,
          expires_at: activationExpiresAt || null,
          status: 'active',
        } as any).eq('id', activationEditCodeId);
        if (error) throw error;

        const { error: updateError } = await supabase
          .from('job_applications')
          .update({ activation_code_id: activationEditCodeId, status: 'psychology_test' })
          .eq('id', activationApplication.id);
        if (updateError) throw updateError;

        Swal.fire({ icon: 'success', title: 'Kode Tes Diperbarui', text: 'Pengaturan kode aktivasi berhasil disimpan.' });
        closeActivationModal();
        if (selectedJob) {
          await loadApplications(selectedJob.id);
        }
        return;
      }

      if (activationMode === 'allow_retake' && existingCode && existingCode.id) {
        // Allow retake: reset completion and reactivate
        const { error } = await supabase.from('activation_codes').update({
          assigned_tests: activationSelectedTests,
          expires_at: activationExpiresAt || null,
          test_completed_at: null,
          status: 'active',
        } as any).eq('id', existingCode.id);
        if (error) throw error;

        const { error: updateError } = await supabase
          .from('job_applications')
          .update({ activation_code_id: existingCode.id, status: 'psychology_test' })
          .eq('id', activationApplication.id);
        if (updateError) throw updateError;

        Swal.fire({ icon: 'success', title: 'Tes Diizinkan Ulang', text: 'Kandidat dapat mengerjakan ulang tes.' });

      } else {
        // Create a new activation code
        const newCode = `PSY-${generateRandomString(6)}`;
        const newPassword = generateRandomString(8);
        const { data, error } = await supabase
          .from('activation_codes')
          .insert([
            {
              code: newCode,
              password: newPassword,
              candidate_name: activationApplication.candidate_profile.full_name,
              candidate_email: activationApplication.candidate_profile.email,
              position: selectedJob?.title || 'Tes Psikologi',
              status: 'active',
              expires_at: activationExpiresAt || null,
              assigned_tests: activationSelectedTests,
            },
          ])
          .select('*')
          .single();

        if (error || !data) {
          throw error || new Error('Gagal membuat kode aktivasi');
        }

        const { error: updateError } = await supabase
          .from('job_applications')
          .update({ activation_code_id: data.id, status: 'psychology_test' })
          .eq('id', activationApplication.id);
        if (updateError) throw updateError;

        Swal.fire({
          icon: 'success',
          title: 'Kode Berhasil Dibuat',
          html: `<div style="font-size:14px;line-height:1.8"><p>Kode: <b style="color:hsl(174,72%,46%);font-family:monospace;letter-spacing:2px">${newCode}</b></p><p>Password: <b style="font-family:monospace">${newPassword}</b></p><p style="font-size:12px;color:#888;margin-top:8px">Berikan kode & password ini kepada kandidat.</p></div>`,
        });
      }

      closeActivationModal();
      if (selectedJob) {
        await loadApplications(selectedJob.id);
      }
    } catch (error) {
      console.error('Error saving activation code:', error);
      Swal.fire('Error', 'Gagal menyimpan kode aktivasi', 'error');
    } finally {
      setActivationProcessing(false);
    }
  };

  const allowRetakeForCode = async (codeId: string, applicationId: string) => {
    try {
      const { error } = await supabase
        .from('activation_codes')
        .update({
          test_completed_at: null,
          status: 'active',
        })
        .eq('id', codeId);

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Tes Diizinkan Ulang',
        text: 'Kandidat dapat mengerjakan ulang tes.',
      });

      // Reload applications to refresh the UI
      if (selectedJob) {
        loadApplications(selectedJob.id);
      }
    } catch (error) {
      console.error('Error allowing retake:', error);
      Swal.fire('Error', 'Gagal mengizinkan pengerjaan ulang', 'error');
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
        .neq("status", HIDDEN_RECRUITMENT_APPLICATION_STATUSES[0])
        .neq("status", HIDDEN_RECRUITMENT_APPLICATION_STATUSES[1])
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
        ? await supabase.from("activation_codes").select("*").in("candidate_email", emails).order("created_at", { ascending: false })
        : { data: [], error: null };

      if (codesError) {
        console.error("Activation codes error:", codesError);
      }

      const applicationsWithCodes = applicationsWithProfiles.map((application: any) => {
        const activationCodes = (codesData || []).filter((code: any) => code.candidate_email === application.candidate_profile.email) || [];
        return {
          ...application,
          activation_code: activationCodes[0] || null,
          activation_codes: activationCodes,
        };
      });

      console.log("Final mapped data:", applicationsWithCodes);
      setApplications(applicationsWithCodes);
    } catch (error) {
      console.error("Error loading applications:", error);
      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  const selectJob = (job: JobVacancy) => {
    setSelectedJob(job);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("job", job.id);
    setSearchParams(nextParams);
  };

  const clearSelectedJob = () => {
    setSelectedJob(null);
    setApplications([]);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("job");
    nextParams.delete("candidate");
    nextParams.delete("action");
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    if (selectedJob) {
      loadApplications(selectedJob.id);
    }
  }, [selectedJob]);

  useEffect(() => {
    const jobId = searchParams.get("job");
    if (!jobId || activeJobs.length === 0 || selectedJob?.id === jobId) return;
    const targetJob = activeJobs.find((job) => job.id === jobId);
    if (targetJob) setSelectedJob(targetJob);
  }, [activeJobs, searchParams, selectedJob?.id]);

  useEffect(() => {
    const candidateId = searchParams.get("candidate");
    const action = searchParams.get("action");
    if (!candidateId || action !== "test" || applications.length === 0) return;
    const targetApplication = applications.find((application) => application.user_id === candidateId);
    if (!targetApplication || showActivationModal) return;
    openActivationModal(targetApplication);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("action");
    window.history.replaceState({}, "", `${window.location.pathname}?${newSearchParams.toString()}`);
  }, [applications, searchParams, showActivationModal]);

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
    setContactDraft(buildContactDraft(application));
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

      results = results.map((result) => ({
        ...result,
        candidate_profile: result.candidate_profile || application.candidate_profile,
      }));

      if (results.length === 0 && application.candidate_profile.full_name) {
        const nameSearch = application.candidate_profile.full_name;
        const { data: nameData, error: nameError } = await supabase
          .from("test_results")
          .select("*")
          .ilike("candidate_name", `%${nameSearch}%`)
          .order("completed_at", { ascending: false });
        if (nameError) throw nameError;
        results = (nameData as CandidateResult[]) || [];
        results = results.map((result) => ({
          ...result,
          candidate_profile: result.candidate_profile || application.candidate_profile,
        }));
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

  const handlePrintResult = async (result: CandidateResult) => {
    const profile = (result.candidate_profile as Record<string, any> | null) || selectedApplication?.candidate_profile || null;
    const printResult = {
      ...result,
      candidate_profile: profile,
    };

    let answers: any[] = [];
    try {
      const { data } = await supabase
        .from("test_answers")
        .select("*")
        .eq("test_result_id", result.id)
        .order("question_number");
      answers = data || [];
    } catch (err) {
      console.error("Error loading answers:", err);
    }

    const html = generatePrintHTML(printResult, answers, profile?.photo_url);
    printHTML(html);
  };

  const filteredResults = candidateResults.filter((result) =>
    result.candidate_name.toLowerCase().includes(resultSearch.toLowerCase()) ||
    result.position.toLowerCase().includes(resultSearch.toLowerCase()) ||
    result.test_name.toLowerCase().includes(resultSearch.toLowerCase())
  ).filter((result) => {
    if (resultFilterStatus !== "all" && result.status !== resultFilterStatus) return false;
    if (resultFilterTest !== "all" && result.test_name !== resultFilterTest) return false;
    return true;
  });

  const uniqueResultTests = Array.from(new Set(candidateResults.map((result) => result.test_name))).sort();

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

  const formatCompactDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatExpectedSalary = (profile: any) => {
    const raw = profile?.expected_salary || profile?.salary_exp_base || profile?.expected_salary_range || "";
    if (!raw) return "-";
    const numeric = typeof raw === "number" ? raw : Number(String(raw).replace(/[^\d]/g, ""));
    if (numeric && !Number.isNaN(numeric)) return `Rp ${numeric.toLocaleString("id-ID")}`;
    return String(raw);
  };

  const getExpectedSalaryNumber = (profile: any) => {
    const raw = profile?.expected_salary || profile?.salary_exp_base || profile?.expected_salary_range || "";
    if (!raw) return null;
    const numeric = typeof raw === "number" ? raw : Number(String(raw).replace(/[^\d]/g, ""));
    return numeric && !Number.isNaN(numeric) ? numeric : null;
  };

  const getApplicationTestState = (application: JobApplication) => {
    const codes = application.activation_codes || [];
    if (codes.length === 0) return "unassigned";
    if (codes.some((code) => code.test_completed_at)) return "completed";
    if (codes.some((code) => code.expires_at && new Date(code.expires_at) < new Date())) return "expired";
    return "active";
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
      case 'submitted':
        return 'bg-blue-100 text-blue-700';
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
      case 'submitted':
        return '1. Lamaran Diterima';
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

  const recruitmentSteps = [
    { status: 'applied', aliases: ['applied', 'submitted'], shortLabel: 'Lamaran', label: 'Lamaran Diterima', Icon: CheckCircle },
    { status: 'screening', shortLabel: 'Screening', label: 'Screening CV', Icon: FileText },
    { status: 'psychology_test', shortLabel: 'Psikotes', label: 'Tes Psikologi', Icon: Brain },
    { status: 'hr_interview', shortLabel: 'HR', label: 'Wawancara HR', Icon: Users },
    { status: 'user_interview', shortLabel: 'User', label: 'Wawancara User', Icon: UserCog },
    { status: 'offer', shortLabel: 'Offer', label: 'Penawaran', Icon: Award },
    { status: 'hired', shortLabel: 'Diterima', label: 'Diterima', Icon: CheckCircle },
  ];

  const getStageCount = (status: string, aliases?: string[]) => {
    const acceptedStatuses = aliases || [status];
    return applications.filter((app) => acceptedStatuses.includes(app.status)).length;
  };

  const finalApplications = applications.filter((app) => app.status === "hired" || app.status === "rejected").length;

  const getCurrentStepIndex = (status: string) => {
    if (status === 'rejected') return -1;
    return recruitmentSteps.findIndex((step) => step.status === status);
  };

  const contactTemplateKey = (status: string) => `recruitment-contact-template:${status}`;

  const getDefaultContactTemplate = (status: string) => {
    const stage = getStatusLabel(status).replace(/^\d+\.\s*/, "");
    const isTest = status === "psychology_test";
    const isInterview = status === "hr_interview" || status === "user_interview";
    if (isTest) {
      return `Yth. {nama},\n\nTerima kasih atas lamaran Anda untuk posisi {posisi}. Kami mengundang Anda untuk mengikuti tahap Tes Psikologi. Mohon konfirmasi ketersediaan Anda agar kami dapat mengirimkan detail jadwal dan akses tes.\n\nTerima kasih.`;
    }
    if (isInterview) {
      return `Yth. {nama},\n\nTerima kasih atas partisipasi Anda dalam proses rekrutmen posisi {posisi}. Kami mengundang Anda untuk mengikuti tahap {tahap}. Mohon konfirmasi ketersediaan jadwal Anda untuk proses interview.\n\nTerima kasih.`;
    }
    return `Yth. {nama},\n\nTerima kasih atas lamaran Anda untuk posisi {posisi}. Saat ini lamaran Anda berada pada tahap {tahap}. Kami akan menghubungi Anda untuk informasi proses selanjutnya.\n\nTerima kasih.`;
  };

  const fillContactTemplate = (application: JobApplication, template: string) => {
    const candidateName = application.candidate_profile.full_name || "Kandidat";
    const position = selectedJob?.title || application.candidate_profile.current_position || "posisi yang dilamar";
    const stage = getStatusLabel(application.status).replace(/^\d+\.\s*/, "");
    return template
      .replaceAll("{nama}", candidateName)
      .replaceAll("{posisi}", position)
      .replaceAll("{tahap}", stage);
  };

  const getStoredContactTemplate = (status: string) => {
    if (typeof window === "undefined") return getDefaultContactTemplate(status);
    return localStorage.getItem(contactTemplateKey(status)) || getDefaultContactTemplate(status);
  };

  const buildContactDraft = (application: JobApplication) => {
    return fillContactTemplate(application, getStoredContactTemplate(application.status));
  };

  const saveContactDraftTemplate = (application: JobApplication) => {
    const candidateName = application.candidate_profile.full_name || "Kandidat";
    const position = selectedJob?.title || application.candidate_profile.current_position || "posisi yang dilamar";
    const stage = getStatusLabel(application.status).replace(/^\d+\.\s*/, "");
    const template = (contactDraft || buildContactDraft(application))
      .replaceAll(candidateName, "{nama}")
      .replaceAll(position, "{posisi}")
      .replaceAll(stage, "{tahap}");
    localStorage.setItem(contactTemplateKey(application.status), template);
    setContactDraft(fillContactTemplate(application, template));
    Swal.fire({ icon: "success", title: "Draft awal disimpan", text: "Template akan dipakai lagi untuk tahap yang sama.", timer: 1800, showConfirmButton: false });
  };

  const normalizePhoneForWhatsApp = (phone?: string) => {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("62")) return digits;
    if (digits.startsWith("0")) return `62${digits.slice(1)}`;
    return digits;
  };

  const openWhatsAppContact = (application: JobApplication) => {
    const phone = normalizePhoneForWhatsApp(application.candidate_profile.phone);
    if (!phone) {
      Swal.fire("Nomor belum tersedia", "Nomor telepon kandidat belum bisa digunakan untuk WhatsApp.", "warning");
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(contactDraft || buildContactDraft(application))}`, "_blank", "noopener,noreferrer");
  };

  const openEmailContact = (application: JobApplication) => {
    const email = application.candidate_profile.email;
    if (!email || email === "Unknown") {
      Swal.fire("Email belum tersedia", "Alamat email kandidat belum tersedia.", "warning");
      return;
    }
    const subject = `Undangan Proses Rekrutmen - ${selectedJob?.title || "Lamaran"}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(contactDraft || buildContactDraft(application))}`;
  };

  const copyContactDraft = async () => {
    try {
      await navigator.clipboard.writeText(contactDraft);
      Swal.fire({ icon: "success", title: "Draft disalin", timer: 1400, showConfirmButton: false });
    } catch {
      Swal.fire("Gagal menyalin", "Browser tidak mengizinkan akses clipboard.", "error");
    }
  };

  const generateRandomString = (length: number) => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const assignPsychologyTest = async (application: JobApplication) => {
    openActivationModal(application);
  };

  const educationOptions = Array.from(new Set(applications.map((app) => getLatestEducation(app.candidate_profile)).filter((value) => value && value !== "-"))).sort();

  const filteredApplications = applications.filter(app => {
    const latestEducation = getLatestEducation(app.candidate_profile);
    const expectedSalary = getExpectedSalaryNumber(app.candidate_profile);
    const minSalary = salaryMinFilter ? Number(salaryMinFilter) : null;
    const maxSalary = salaryMaxFilter ? Number(salaryMaxFilter) : null;
    const appliedDate = app.applied_at ? new Date(app.applied_at) : null;
    const fromDate = appliedFromFilter ? new Date(`${appliedFromFilter}T00:00:00`) : null;
    const toDate = appliedToFilter ? new Date(`${appliedToFilter}T23:59:59`) : null;
    const testState = getApplicationTestState(app);
    const matchesSearch =
      app.candidate_profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidate_profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidate_profile.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      latestEducation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatExpectedSalary(app.candidate_profile).toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.candidate_profile.current_position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      app.status === statusFilter ||
      (statusFilter === "applied" && app.status === "submitted");
    const matchesEducation = educationFilter === "all" || latestEducation === educationFilter;
    const matchesTest = testFilter === "all" || testState === testFilter;
    const matchesMinSalary = !minSalary || (expectedSalary !== null && expectedSalary >= minSalary);
    const matchesMaxSalary = !maxSalary || (expectedSalary !== null && expectedSalary <= maxSalary);
    const matchesFromDate = !fromDate || (appliedDate !== null && appliedDate >= fromDate);
    const matchesToDate = !toDate || (appliedDate !== null && appliedDate <= toDate);
    return matchesSearch && matchesStatus && matchesEducation && matchesTest && matchesMinSalary && matchesMaxSalary && matchesFromDate && matchesToDate;
  });

  const resetApplicationFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setEducationFilter("all");
    setTestFilter("all");
    setSalaryMinFilter("");
    setSalaryMaxFilter("");
    setAppliedFromFilter("");
    setAppliedToFilter("");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        {!selectedJob && (
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Workflow className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Proses Rekrutmen</h1>
                  <p className="text-sm text-muted-foreground">Kelola proses lamaran untuk setiap lowongan aktif</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-lg font-bold text-foreground">{activeJobs.length}</div>
                  <div className="text-[11px] text-muted-foreground">Lowongan aktif</div>
                </div>
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-lg font-bold text-foreground">{activeJobs.reduce((sum, job) => sum + (job.application_count || 0), 0)}</div>
                  <div className="text-[11px] text-muted-foreground">Total pelamar</div>
                </div>
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="text-lg font-bold text-foreground">-</div>
                  <div className="text-[11px] text-muted-foreground">Final</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedJob ? (
          /* Job Categories */
          <div className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Lowongan Aktif</h2>
                <p className="text-sm text-muted-foreground">Hanya lowongan berstatus aktif dan belum melewati deadline yang ditampilkan.</p>
              </div>
              <span className="text-sm text-muted-foreground">
                {activeJobs.length} lowongan aktif
              </span>
            </div>

            {loading ? (
              <div className="rounded-xl border border-dashed border-border bg-card py-10 text-center text-muted-foreground">
                Memuat data lowongan...
              </div>
            ) : activeJobs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card py-10 text-center text-muted-foreground">
                Tidak ada lowongan aktif
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeJobs.map((job) => (
                  <div
                    key={job.id}
                    className="group bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-sm transition cursor-pointer"
                    onClick={() => selectJob(job)}
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="h-11 w-11 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-primary" />
                      </div>
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                        Aktif
                      </span>
                    </div>

                    <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary">{job.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{job.department}</p>

                    <div className="space-y-2 my-4">
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
                        Tutup: {job.closes_at ? formatCompactDate(job.closes_at) : "Tidak ditentukan"}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <span className="text-sm font-medium text-foreground">
                        {job.application_count || 0} pelamar
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        Kelola <ChevronRight className="h-4 w-4" />
                      </span>
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
              onClick={clearSelectedJob}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
              Kembali ke daftar lowongan
            </button>

            {/* Job Header */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-foreground">{selectedJob.title}</h2>
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Aktif</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Briefcase className="h-4 w-4" />{selectedJob.department}</span>
                      <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{selectedJob.location || "-"}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{selectedJob.employment_type || "-"}</span>
                      <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />Deadline: {selectedJob.closes_at ? formatCompactDate(selectedJob.closes_at) : "Tidak ditentukan"}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center lg:min-w-[360px]">
                  <div className="rounded-lg border border-border bg-background px-3 py-2">
                    <div className="text-xl font-bold text-foreground">{applications.length}</div>
                    <div className="text-[11px] text-muted-foreground">Pelamar</div>
                  </div>
                  <div className="rounded-lg border border-border bg-background px-3 py-2">
                    <div className="text-xl font-bold text-foreground">{getStageCount("psychology_test")}</div>
                    <div className="text-[11px] text-muted-foreground">Psikotes</div>
                  </div>
                  <div className="rounded-lg border border-border bg-background px-3 py-2">
                    <div className="text-xl font-bold text-foreground">{finalApplications}</div>
                    <div className="text-[11px] text-muted-foreground">Final</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Filter Screening</h3>
                  <p className="text-xs text-muted-foreground">Saring kandidat berdasarkan data profil, tahap proses, tes, gaji, dan tanggal apply.</p>
                </div>
                <Button variant="outline" size="sm" onClick={resetApplicationFilters}>
                  Reset
                </Button>
              </div>
              <div className="grid gap-3 lg:grid-cols-12">
                <div className="relative lg:col-span-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari nama, email, telepon, pendidikan, gaji..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="relative lg:col-span-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 w-full appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-9 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
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
                <div className="lg:col-span-3">
                  <select
                    value={educationFilter}
                    onChange={(e) => setEducationFilter(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Semua Pendidikan</option>
                    {educationOptions.map((education) => (
                      <option key={education} value={education}>{education}</option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-3">
                  <select
                    value={testFilter}
                    onChange={(e) => setTestFilter(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">Semua Status Tes</option>
                    <option value="unassigned">Belum Ditugaskan</option>
                    <option value="active">Tes Aktif</option>
                    <option value="completed">Tes Selesai</option>
                    <option value="expired">Tes Expired</option>
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <input
                    type="number"
                    placeholder="Gaji min"
                    value={salaryMinFilter}
                    onChange={(e) => setSalaryMinFilter(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="lg:col-span-2">
                  <input
                    type="number"
                    placeholder="Gaji max"
                    value={salaryMaxFilter}
                    onChange={(e) => setSalaryMaxFilter(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="lg:col-span-2">
                  <input
                    type="date"
                    value={appliedFromFilter}
                    onChange={(e) => setAppliedFromFilter(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    title="Tanggal lamar mulai"
                  />
                </div>
                <div className="lg:col-span-2">
                  <input
                    type="date"
                    value={appliedToFilter}
                    onChange={(e) => setAppliedToFilter(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    title="Tanggal lamar sampai"
                  />
                </div>
                <div className="flex items-center rounded-lg border border-border bg-muted/30 px-3 text-xs text-muted-foreground lg:col-span-4">
                  {filteredApplications.length} kandidat cocok dari {applications.length} pelamar aktif
                </div>
              </div>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
              {[...recruitmentSteps, { status: 'rejected', shortLabel: 'Ditolak', label: 'Ditolak', Icon: XCircle }].map(({ status, aliases, label, shortLabel, Icon }: any, index) => {
                const count = getStageCount(status, aliases);
                return (
                <div key={status} className="bg-card border border-border rounded-xl p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground">#{index + 1}</span>
                  </div>
                  <div className="text-xl font-bold text-foreground">{count}</div>
                  <div className="mt-1 text-xs font-medium text-foreground">{shortLabel}</div>
                  <div className="text-[11px] text-muted-foreground">{label}</div>
                </div>
              )})}
            </div>

            {/* Applications Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Daftar Pelamar</h3>
                  <p className="text-xs text-muted-foreground">{filteredApplications.length} dari {applications.length} pelamar ditampilkan</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px]">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pelamar</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pendidikan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ekspektasi Gaji</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal Lamar</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tes</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loadingApplications ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          Memuat data lamaran...
                        </td>
                      </tr>
                    ) : filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          {searchTerm ? "Tidak ada hasil pencarian" : "Belum ada lamaran untuk lowongan ini"}
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((application) => (
                        <tr key={application.id} className="hover:bg-muted/40 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 bg-primary/10 rounded-full flex items-center justify-center">
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
                            <div className="max-w-[260px] text-sm text-foreground">{getLatestEducation(application.candidate_profile)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-sm font-semibold text-emerald-700">
                              <Banknote className="h-4 w-4" />
                              {formatExpectedSalary(application.candidate_profile)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-foreground">{formatCompactDate(application.applied_at)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex whitespace-nowrap px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                              {getStatusLabel(application.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {application.activation_codes && application.activation_codes.length > 0 ? (
                              <div className="space-y-2">
                                {application.activation_codes.map((c: ActivationCode) => (
                                  <div key={c.id} className="rounded-md p-3 border border-border bg-background">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <div className="font-mono text-sm text-primary">{c.code}</div>
                                        <div className="text-xs text-muted-foreground">{c.assigned_tests?.length ? `Tes: ${getAssignedTestNames(c.assigned_tests)}` : 'Belum ada tes terpilih'}</div>
                                      </div>
                                      <span className={`px-2 py-1 text-[11px] font-semibold rounded-full ${getActivationStatusClass(c)}`}>
                                        {getActivationStatusLabel(c)}
                                      </span>
                                    </div>
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      {c.test_completed_at
                                        ? `Selesai ${formatDate(c.test_completed_at)}`
                                        : c.expires_at
                                          ? `Berlaku hingga ${formatDate(c.expires_at)}`
                                          : 'Aktif'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="text-sm text-muted-foreground">Belum ditugaskan</div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex min-w-[360px] flex-wrap items-center gap-2">
                              <button
                                onClick={() => viewApplicationDetail(application)}
                                className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition"
                              >
                                Detail
                              </button>
                              <button
                                onClick={() => viewCandidateProfile(application)}
                                className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition"
                              >
                                Profil
                              </button>
                              <button
                                onClick={() => openActivationModal(application)}
                                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition"
                              >
                                Tes Psikologi
                              </button>
                              <button
                                onClick={() => viewTestResults(application)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition"
                              >
                                Lihat Hasil Tes
                              </button>
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
          <div className="fixed inset-0 bg-black/55 flex items-center justify-center p-2 sm:p-4 z-[70] overflow-hidden">
            <div className="bg-card border border-border rounded-xl max-w-5xl w-full max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden shadow-2xl flex flex-col">
              <div className="flex-shrink-0 p-4 border-b border-border flex items-center justify-between gap-4 bg-muted/20">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-foreground">Buat / Perbarui Kode Tes Psikologi</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Atur akses tes, tanggal expire, dan retake kandidat.</p>
                </div>
                <button
                  onClick={closeActivationModal}
                  className="p-1 rounded hover:bg-muted transition"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              <div className="min-h-0 flex-1 p-4 space-y-4 overflow-y-auto overscroll-contain">
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Kandidat</span>
                      <span className="font-semibold text-foreground">{activationApplication.candidate_profile.full_name}</span>
                      <span className="text-muted-foreground break-all">{activationApplication.candidate_profile.email}</span>
                      {activationApplication.candidate_profile.phone && activationApplication.candidate_profile.phone !== "Unknown" && (
                        <span className="text-muted-foreground">{activationApplication.candidate_profile.phone}</span>
                      )}
                    </div>
                    <div className="hidden h-4 w-px bg-border md:block" />
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Lowongan</span>
                      <span className="font-semibold text-foreground">{selectedJob?.title || "Tes Psikologi"}</span>
                      <span className="text-muted-foreground">{selectedJob?.department || "-"}</span>
                    </div>
                  </div>
                </div>
                {activationApplication.activation_codes && activationApplication.activation_codes.length > 0 && (
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
                    <label className="text-sm font-semibold text-foreground">Kode Aktivasi Terdaftar ({activationApplication.activation_codes.length})</label>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left px-2 py-2 font-medium text-muted-foreground">Kode</th>
                            <th className="text-left px-2 py-2 font-medium text-muted-foreground">Password</th>
                            <th className="text-left px-2 py-2 font-medium text-muted-foreground">Status</th>
                            <th className="text-left px-2 py-2 font-medium text-muted-foreground">Dibuat</th>
                            <th className="text-center px-2 py-2 font-medium text-muted-foreground">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activationApplication.activation_codes.map((c: any) => (
                            <tr key={c.id} className="border-b border-border/50 hover:bg-background/50 transition">
                              <td className="px-2 py-2 font-mono text-primary whitespace-nowrap">{c.code}</td>
                              <td className="px-2 py-2">
                                <span className={`font-mono ${isBcryptPassword(c.password) ? 'text-muted-foreground' : 'text-foreground'}`}>
                                  {getActivationPasswordText(c)}
                                </span>
                              </td>
                              <td className="px-2 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.test_completed_at ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {c.test_completed_at ? 'Selesai' : 'Aktif'}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-xs text-muted-foreground">{formatDate(c.created_at)}</td>
                              <td className="px-2 py-2 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActivationEditCodeId(c.id);
                                      setActivationSelectedTests(c.assigned_tests || []);
                                      setActivationExpiresAt(c.expires_at ? c.expires_at.split("T")[0] : "");
                                      setActivationMode("create_new");
                                    }}
                                    className={`px-2 py-1 rounded text-xs border transition ${activationEditCodeId === c.id ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:bg-muted"}`}
                                  >
                                    {activationEditCodeId === c.id ? "Edit" : "Edit"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => copyActivationAccess(c)}
                                    className="px-2 py-1 rounded text-xs border border-border text-foreground hover:bg-muted transition"
                                  >
                                    Salin
                                  </button>
                                  {c.test_completed_at && (
                                  <button
                                    type="button"
                                    onClick={() => allowRetakeForCode(c.id, activationApplication.id)}
                                    disabled={activationProcessing}
                                    className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 transition disabled:opacity-50"
                                  >
                                    Izinkan Ulang
                                  </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password yang sudah berbentuk bcrypt tidak dapat dibalik ke password asli. Untuk membagikan akses baru, gunakan mode buat kode baru.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Mode Kode</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${activationMode === 'create_new' && !activationEditCodeId ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}>
                      <input type="radio" name="activationMode" value="create_new" checked={activationMode === 'create_new' && !activationEditCodeId} onChange={() => { setActivationMode('create_new'); setActivationEditCodeId(null); setActivationSelectedTests([]); setActivationExpiresAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]); }} />
                      <span className="text-sm">Buat kode baru</span>
                    </label>
                    <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${activationMode === 'allow_retake' ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}>
                      <input type="radio" name="activationMode" value="allow_retake" checked={activationMode === 'allow_retake'} onChange={() => { setActivationMode('allow_retake'); setActivationEditCodeId(null); }} />
                      <span className="text-sm">Izinkan mengerjakan ulang (retake)</span>
                    </label>
                  </div>
                  <div className="text-xs text-muted-foreground">{activationEditCodeId ? "Sedang mengedit kode aktivasi yang sudah dibuat." : 'Pilih "Izinkan mengerjakan ulang" jika kandidat kehabisan waktu atau perlu mencoba lagi tanpa membuat kode baru.'}</div>

                  <label className="text-sm font-medium text-foreground">Pilih Tes</label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {activeInstruments.map((inst) => (
                      <button
                        key={inst.id}
                        type="button"
                        onClick={() => toggleActivationTest(inst.id)}
                        className={`w-full min-h-12 text-left rounded-lg border px-3 py-2 transition ${activationSelectedTests.includes(inst.id) ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium leading-tight text-foreground">{inst.name}</span>
                          {activationSelectedTests.includes(inst.id) && <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary" />}
                        </div>
                      </button>
                    ))}
                    {activeInstruments.length === 0 && (
                      <div className="text-sm text-muted-foreground">Tidak ada daftar tes aktif saat ini.</div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[260px_1fr]">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Tanggal Expire</label>
                    <input
                      type="date"
                      value={activationExpiresAt}
                      onChange={(e) => setActivationExpiresAt(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="text-xs text-muted-foreground mb-2">Ringkasan</div>
                    <div className="text-sm text-foreground">{activationEditCodeId ? 'Menyimpan perubahan pada kode aktivasi yang dipilih.' : activationApplication.activation_code ? 'Memperbarui kode aktivasi yang sudah ada.' : 'Membuat kode aktivasi baru untuk kandidat.'}</div>
                    {activationSelectedTests.length ? (
                      <div className="text-xs text-muted-foreground mt-2">Tes yang dipilih: {getAssignedTestNames(activationSelectedTests)}</div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-2">Belum ada tes dipilih.</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col-reverse gap-2 border-t border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-end">
                <button onClick={closeActivationModal} className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition">Batal</button>
                <button
                  onClick={saveActivationCode}
                  disabled={activationProcessing}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {activationProcessing ? 'Menyimpan...' : activationEditCodeId ? 'Simpan Perubahan Kode' : activationApplication.activation_code ? 'Perbarui Kode Tes Psikologi' : 'Buat Tes Lagi'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showResultsModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-card border border-border rounded-xl max-w-6xl w-full max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Hasil Tes Kandidat</h2>
                  <p className="text-sm text-muted-foreground">Lihat hasil tes dan cetak laporan tanpa meninggalkan proses rekrutmen.</p>
                </div>
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="p-1 rounded hover:bg-muted transition"
                >
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain max-h-[calc(100dvh-9rem)] sm:max-h-[calc(100dvh-11rem)] space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Kandidat</div>
                    <div className="flex items-start gap-4">
                      {selectedApplication.candidate_profile.photo_url ? (
                        <img src={selectedApplication.candidate_profile.photo_url} alt={selectedApplication.candidate_profile.full_name} className="h-20 w-20 rounded-lg object-cover border border-border" />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted text-primary text-xl font-bold border border-border">
                          {selectedApplication.candidate_profile.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="font-semibold text-foreground">{selectedApplication.candidate_profile.full_name}</div>
                        <div className="text-sm text-muted-foreground">{selectedApplication.candidate_profile.email}</div>
                        <div className="text-sm text-muted-foreground">{selectedApplication.candidate_profile.phone}</div>
                        <div className="mt-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedApplication.status)}`}>
                            {getStatusLabel(selectedApplication.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Lowongan</div>
                    <div className="font-semibold text-foreground">{selectedJob?.title || '-'}</div>
                    <div className="text-sm text-muted-foreground">{selectedJob?.department || '-'}</div>
                    <div className="text-sm text-muted-foreground">{selectedJob?.location || '-'}</div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Ringkasan Tes</div>
                    <div className="text-sm text-foreground">{candidateResults.length} hasil ditemukan</div>
                    <div className="text-sm text-muted-foreground">{resultsLoading ? 'Memuat...' : 'Hasil diperbarui secara otomatis'}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Cari nama tes atau posisi..."
                        value={resultSearch}
                        onChange={(e) => setResultSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={resultFilterStatus}
                        onChange={(e) => setResultFilterStatus(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-9 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="all">Semua Status</option>
                        <option value="passed">Lulus</option>
                        <option value="review">Review</option>
                        <option value="failed">Tidak Lulus</option>
                      </select>
                      <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                    <div className="relative">
                      <select
                        value={resultFilterTest}
                        onChange={(e) => setResultFilterTest(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-3 pr-9 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="all">Semua Tes</option>
                        {uniqueResultTests.map((test) => (
                          <option key={test} value={test}>{test}</option>
                        ))}
                      </select>
                      <Filter className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full min-w-[640px]">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nama Tes</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Posisi</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Skor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Selesai</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {resultsLoading ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Memuat hasil tes...</td>
                          </tr>
                        ) : filteredResults.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Tidak ada hasil tes untuk kandidat ini</td>
                          </tr>
                        ) : (
                          filteredResults.map((result) => (
                            <tr key={result.id} className="hover:bg-muted/50 transition">
                              <td className="px-4 py-3 text-sm text-foreground">{result.test_name}</td>
                              <td className="px-4 py-3 text-sm text-foreground">{result.position || '-'}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(result.status)}`}>
                                  {result.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground">{result.score}/{result.total_questions}</td>
                              <td className="px-4 py-3 text-sm text-foreground">{formatDate(result.completed_at)}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => handleSelectResult(result)}
                                    className="px-3 py-1 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition"
                                  >
                                    Lihat
                                  </button>
                                  <button
                                    onClick={() => handlePrintResult(result)}
                                    className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition"
                                  >
                                    Cetak
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

                {selectedResult && (
                  <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Detail Hasil Tes</h3>
                        <p className="text-sm text-muted-foreground">{selectedResult.test_name} — {selectedResult.position || '-'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePrintResult(selectedResult)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
                      >
                        <Printer className="h-4 w-4" /> Cetak Laporan
                      </button>
                    </div>
                    <CandidateTestResultView
                      result={selectedResult as any}
                      answers={resultAnswers as any}
                      profilePhoto={selectedApplication?.candidate_profile?.photo_url}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal - Application Info */}
        {showDetailModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-card border border-border rounded-xl max-w-5xl w-full max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden shadow-2xl">
              <div className="p-4 sm:p-5 border-b border-border bg-muted/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-foreground">Detail Lamaran</h2>
                      <span className={`px-2.5 py-1 text-xs rounded-full ${getStatusColor(selectedApplication.status)}`}>
                        {getStatusLabel(selectedApplication.status)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedApplication.candidate_profile.full_name} untuk {selectedJob?.title || "lowongan terpilih"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-1 rounded hover:bg-muted transition"
                  >
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain max-h-[calc(100dvh-9rem)] sm:max-h-[calc(100dvh-11rem)] space-y-5">
                {/* Job Information */}
                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        Informasi Lowongan
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <span className="font-semibold text-foreground">{selectedJob?.title || '-'}</span>
                        <span className="text-muted-foreground">{selectedJob?.department || '-'}</span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" /> {selectedJob?.location || '-'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-foreground">{selectedJob?.employment_type || '-'}</span>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">Aktif</span>
                      <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-foreground">Tutup: {formatDate(selectedJob?.closes_at || '')}</span>
                    </div>
                  </div>
                </div>

                {/* Application Information */}
                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        Informasi Lamaran
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <span className="font-semibold text-foreground">{selectedApplication.candidate_profile.full_name}</span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground break-all">
                          <Mail className="h-3.5 w-3.5" /> {selectedApplication.candidate_profile.email}
                        </span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" /> {selectedApplication.candidate_profile.phone || "-"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Pendidikan: <span className="font-medium text-foreground">{getLatestEducation(selectedApplication.candidate_profile)}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-foreground">Lamar: {formatDate(selectedApplication.applied_at)}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedApplication.status)}`}>
                        {getStatusLabel(selectedApplication.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recruitment Process Timeline */}
                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Proses Rekrutmen
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
                    {recruitmentSteps.map((step, index) => {
                      const currentIndex = getCurrentStepIndex(selectedApplication.status);
                      const isRejected = selectedApplication.status === 'rejected';
                      const isCurrentStep = !isRejected && currentIndex === index;
                      const isCompleted = !isRejected && currentIndex > index;
                      const Icon = step.Icon;
                      
                      return (
                        <div 
                          key={step.status}
                          className={`relative rounded-xl border p-3 transition ${
                            isCurrentStep
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 shadow-sm'
                              : isCompleted
                                ? 'border-slate-200 bg-slate-50 text-slate-700'
                                : 'border-border bg-muted/20 text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-start gap-2 md:block">
                            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full ${
                              isCurrentStep ? 'bg-emerald-600 text-white' : isCompleted ? 'bg-slate-700 text-white' : 'bg-background text-muted-foreground border border-border'
                            }`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold leading-tight">{step.shortLabel}</p>
                              <p className="mt-1 text-xs">
                                {isCurrentStep ? 'Sedang proses' : isCompleted ? 'Selesai' : 'Menunggu'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {selectedApplication.status === 'rejected' && (
                    <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                      <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">Lamaran ditolak</p>
                        <p className="text-sm text-red-700">Status kandidat sudah berada pada tahap rejected.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Komunikasi Kandidat
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">Ubah draft pesan bila perlu, lalu kirim via WhatsApp atau email dari device yang sedang login.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => saveContactDraftTemplate(selectedApplication)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
                      >
                        <CheckCircle className="h-4 w-4" /> Simpan Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactDraft(buildContactDraft(selectedApplication))}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition"
                      >
                        <Edit className="h-4 w-4" /> Reset Draft
                      </button>
                      <button
                        type="button"
                        onClick={copyContactDraft}
                        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition"
                      >
                        <FileText className="h-4 w-4" /> Salin
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={contactDraft}
                    onChange={(e) => setContactDraft(e.target.value)}
                    rows={6}
                    className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => openWhatsAppContact(selectedApplication)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                    >
                      <MessageSquare className="h-4 w-4" /> Hubungi Kandidat
                    </button>
                    <button
                      type="button"
                      onClick={() => openEmailContact(selectedApplication)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition"
                    >
                      <Mail className="h-4 w-4" /> Email
                    </button>
                    <button
                      type="button"
                      onClick={() => viewCandidateProfile(selectedApplication)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition"
                    >
                      <User className="h-4 w-4" /> Profil Kandidat
                    </button>
                    <button
                      type="button"
                      onClick={() => openActivationModal(selectedApplication)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15 transition"
                    >
                      <Brain className="h-4 w-4" /> Atur Tes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Modal - Candidate Details */}
        {showProfileModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-card border border-border rounded-xl max-w-6xl w-full max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-border">
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
              
              <div className="flex flex-col h-[calc(100dvh-9rem)] sm:h-[calc(100dvh-11rem)] overflow-hidden">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 sm:p-6 border-b border-border">
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
                              <p className="font-medium text-foreground">{(selectedApplication.candidate_profile as any).salary_exp_allowances || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Benefit/Fasilitas yang Diharapkan</label>
                              <p className="font-medium text-foreground whitespace-pre-line">{(selectedApplication.candidate_profile as any).salary_exp_benefits || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Gaji Saat Ini</label>
                              <p className="font-medium text-foreground">{(selectedApplication.candidate_profile as any).salary_expectation || '-'}</p>
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
                              <p className="font-medium text-foreground">{(selectedApplication.candidate_profile as any).available_from || selectedApplication.candidate_profile.available_start_date || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Periode Notice</label>
                              <p className="font-medium text-foreground">{(selectedApplication.candidate_profile as any).notice_period ? `${(selectedApplication.candidate_profile as any).notice_period} hari` : '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Bersedia Relokasi</label>
                              <p className="font-medium text-foreground">{(selectedApplication.candidate_profile as any).willing_relocate ? 'Ya' : 'Tidak'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Bersedia Lembur</label>
                              <p className="font-medium text-foreground">{(selectedApplication.candidate_profile as any).willing_overtime ? 'Ya' : 'Tidak'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Bersedia Shift</label>
                              <p className="font-medium text-foreground">{(selectedApplication.candidate_profile as any).willing_shift ? 'Ya' : 'Tidak'}</p>
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
