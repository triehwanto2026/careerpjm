import { useEffect, useState } from "react";
import { Eye, Trash2, Plus, Pencil, Upload, X, Users, UserPlus, MailCheck, CheckCircle, XCircle, Search, Filter, Download, FileText, MoreVertical, Edit, Building2, User, Camera, BookOpen, FolderOpen, Heart, Globe, Ruler, Weight, CreditCard, Home, Car, Languages, Target, Users2, Star, MessageSquare, Link2, Briefcase, MapPin, Clock, Calendar, GraduationCap, Award, AlertCircle, ChevronRight, Bell, SettingsIcon, UserCog, Shield, ChevronDown, Workflow, Mail, Phone } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface JobApplication {
  id: string;
  vacancy_id: string;
  user_id: string;
  status: string;
  applied_at: string;
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
  };
}

export default function RecruitmentProcess() {
  const [activeJobs, setActiveJobs] = useState<JobVacancy[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobVacancy | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    loadActiveJobs();
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

      // Get candidate profiles for each application
      const applicationsWithProfiles = await Promise.all(
        (applicationsData || []).map(async (application: any) => {
          const { data: profileData, error: profileError } = await supabase
            .from("candidate_profiles")
            .select("*")
            .eq("user_id", application.user_id)
            .single();

          return {
            ...application,
            candidate_profile: profileData || {
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
            }
          };
        })
      );

      console.log("Final mapped data:", applicationsWithProfiles);
      setApplications(applicationsWithProfiles);
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
    // Redirect to Applicants page with candidate filter
    window.location.href = `/admin/applicants?candidate=${application.candidate_profile.user_id}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

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

  const filteredApplications = applications.filter(app =>
    app.candidate_profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.candidate_profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.candidate_profile.current_position.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition">
                <Filter className="h-4 w-4" />
                Filter
              </button>
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pengalaman</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal Lamar</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
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
                            <div className="text-sm text-foreground">{application.candidate_profile.education_level}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-foreground">{application.candidate_profile.current_position}</div>
                            <div className="text-xs text-muted-foreground">{application.candidate_profile.experience_years} tahun</div>
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
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => viewApplicationDetail(application)}
                                className="p-1 rounded hover:bg-muted transition"
                                title="Lihat Detail Lamaran"
                              >
                                <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </button>
                              <button
                                onClick={() => viewCandidateProfile(application)}
                                className="p-1 rounded hover:bg-muted transition"
                                title="Lihat Profil Kandidat"
                              >
                                <FileText className="h-4 w-4 text-muted-foreground hover:text-foreground" />
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
              
              <div className="flex flex-col h-[calc(90vh-8rem)]">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-border">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-primary/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {selectedApplication.candidate_profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
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
                      <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all">
                        <Mail className="h-4 w-4" />
                        Hubungi Pelamar
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 border border-border bg-card text-foreground rounded-lg hover:bg-muted transition-all">
                        <Download className="h-4 w-4" />
                        Download Resume
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 border border-border bg-card text-foreground rounded-lg hover:bg-muted transition-all">
                        <Phone className="h-4 w-4" />
                        Catatan Telepon
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tabs Content */}
                <div className="flex-1 overflow-y-auto">
                  <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 gap-2 p-4 bg-muted/30 border-b border-border">
                      <div className="space-y-2">
                        <TabsTrigger value="personal" className="w-full justify-start">
                          <Users className="h-4 w-4 mr-2" />
                          Profil
                        </TabsTrigger>
                        <TabsTrigger value="family" className="w-full justify-start">
                          <Heart className="h-4 w-4 mr-2" />
                          Keluarga
                        </TabsTrigger>
                        <TabsTrigger value="education" className="w-full justify-start">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Pendidikan
                        </TabsTrigger>
                        <TabsTrigger value="skills" className="w-full justify-start">
                          <Star className="h-4 w-4 mr-2" />
                          Skill
                        </TabsTrigger>
                      </div>
                      <div className="space-y-2">
                        <TabsTrigger value="experience" className="w-full justify-start">
                          <Briefcase className="h-4 w-4 mr-2" />
                          Pengalaman
                        </TabsTrigger>
                        <TabsTrigger value="salary" className="w-full justify-start">
                          <Target className="h-4 w-4 mr-2" />
                          Salary
                        </TabsTrigger>
                        <TabsTrigger value="documents" className="w-full justify-start">
                          <FileText className="h-4 w-4 mr-2" />
                          Data
                        </TabsTrigger>
                        <TabsTrigger value="additional" className="w-full justify-start">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Informasi
                        </TabsTrigger>
                      </div>
                    </TabsList>

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
                          <div>
                            <label className="text-sm text-muted-foreground">Tingkat Pendidikan</label>
                            <p className="font-medium text-foreground">{selectedApplication.candidate_profile.education_level || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Institusi Pendidikan</label>
                            <p className="font-medium text-foreground">{selectedApplication.candidate_profile.education_institution || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Jurusan/Program Studi</label>
                            <p className="font-medium text-foreground">{selectedApplication.candidate_profile.major || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Tahun Lulus</label>
                            <p className="font-medium text-foreground">{selectedApplication.candidate_profile.graduation_year || '-'}</p>
                          </div>
                        </div>
                      </div>
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
                              {(selectedApplication.candidate_profile.skills || []).map((skill, index) => (
                                <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                  {skill}
                                </span>
                              )) || <span className="text-muted-foreground">Tidak ada data</span>}
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
                          {selectedApplication.candidate_profile.languages && selectedApplication.candidate_profile.languages.length > 0 && (
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
                          {selectedApplication.candidate_profile.hobbies && selectedApplication.candidate_profile.hobbies.length > 0 && (
                            <div>
                              <label className="text-sm text-muted-foreground">Hobi</label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {selectedApplication.candidate_profile.hobbies.map((hobby, index) => (
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
                      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-primary" />
                          Pengalaman Kerja Saat Ini
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-muted-foreground">Posisi Saat Ini</label>
                            <p className="font-medium text-foreground">{selectedApplication.candidate_profile.current_position || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Perusahaan</label>
                            <p className="font-medium text-foreground">{selectedApplication.candidate_profile.current_company || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Lama Pengalaman</label>
                            <p className="font-medium text-foreground">{selectedApplication.candidate_profile.experience_years ? `${selectedApplication.candidate_profile.experience_years} Tahun` : 'Tidak ada data'}</p>
                          </div>
                        </div>
                      </div>
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
                              <label className="text-sm text-muted-foreground">Gaji yang Diharapkan</label>
                              <p className="font-medium text-foreground text-lg">{selectedApplication.candidate_profile.expected_salary || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Negotiable</label>
                              <p className="font-medium text-foreground">
                                {selectedApplication.candidate_profile.salary_negotiable ? 'Ya' : 'Tidak'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Ketersediaan
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm text-muted-foreground">Tanggal Mulai Tersedia</label>
                              <p className="font-medium text-foreground">{selectedApplication.candidate_profile.available_start_date || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Bersedia Relokasi</label>
                              <p className="font-medium text-foreground">
                                {selectedApplication.candidate_profile.willing_to_relocate ? 'Ya' : 'Tidak'}
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
                          <FileText className="h-5 w-5 text-primary" />
                          Dokumen & Portofolio
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedApplication.candidate_profile.cv_url && (
                            <div>
                              <label className="text-sm text-muted-foreground">CV</label>
                              <a href={selectedApplication.candidate_profile.cv_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                                <Eye className="h-4 w-4" />
                                Lihat CV
                              </a>
                            </div>
                          )}
                          {selectedApplication.candidate_profile.portfolio_url && (
                            <div>
                              <label className="text-sm text-muted-foreground">Portfolio</label>
                              <a href={selectedApplication.candidate_profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                                <Eye className="h-4 w-4" />
                                Lihat Portfolio
                              </a>
                            </div>
                          )}
                        </div>
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
                          {selectedApplication.candidate_profile.additional_info && (
                            <div>
                              <label className="text-sm text-muted-foreground">Informasi Tambahan</label>
                              <p className="text-foreground mt-2 whitespace-pre-line">{selectedApplication.candidate_profile.additional_info}</p>
                            </div>
                          )}
                        </div>

                        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Link2 className="h-5 w-5 text-primary" />
                            Social Media & Referensi
                          </h3>
                          {selectedApplication.candidate_profile.social_media && (
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
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-card/95 backdrop-blur-xl px-6 py-4">
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all">
                    <Mail className="h-4 w-4" />
                    Kirim Email
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 border border-border bg-card text-foreground rounded-lg hover:bg-muted transition-all">
                    <Download className="h-4 w-4" />
                    Download CV
                  </button>
                </div>
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
      </div>
    </AdminLayout>
  );
}
