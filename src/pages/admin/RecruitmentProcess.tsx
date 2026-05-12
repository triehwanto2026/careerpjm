import { useEffect, useState } from "react";
import { Workflow, Search, Filter, Download, Eye, Mail, Phone, Calendar, Briefcase, MapPin, GraduationCap, Award, CheckCircle, XCircle, Clock, AlertCircle, ChevronRight, Users, FileText } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

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
      
      // Load applications with candidate profiles using user_id relationship
      const { data: applicationsData, error: applicationsError } = await supabase
        .from("job_applications")
        .select(`
          *,
          candidate_profiles!inner(
            id,
            user_id,
            full_name,
            email,
            phone,
            birth_date,
            gender,
            address,
            education_level,
            education_institution,
            major,
            graduation_year,
            experience_years,
            current_position,
            current_company,
            skills,
            strengths,
            created_at
          )
        `)
        .eq("vacancy_id", jobId)
        .order("applied_at", { ascending: false });

      console.log("Applications data:", applicationsData);
      console.log("Applications error:", applicationsError);

      if (applicationsError) {
        console.error("Applications error:", applicationsError);
        throw applicationsError;
      }

      // Map data with proper candidate profiles
      const mappedData = (applicationsData || []).map((app: any) => ({
        id: app.id,
        vacancy_id: app.vacancy_id,
        user_id: app.user_id,
        status: app.status,
        applied_at: app.applied_at,
        candidate_profile: app.candidate_profiles || {
          id: '',
          user_id: app.user_id,
          full_name: 'Unknown',
          email: 'Unknown',
          phone: 'Unknown',
          birth_date: '',
          gender: '',
          address: '',
          education_level: '',
          education_institution: '',
          major: '',
          graduation_year: '',
          experience_years: '',
          current_position: '',
          current_company: '',
          skills: [],
          strengths: '',
          created_at: ''
        }
      }));
      
      console.log("Final mapped data:", mappedData);
      setApplications(mappedData);
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
      case 'applied': return 'bg-blue-100 text-blue-700';
      case 'screening': return 'bg-yellow-100 text-yellow-700';
      case 'interview': return 'bg-purple-100 text-purple-700';
      case 'offer': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'hired': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'applied': return 'Lamaran Diterima';
      case 'screening': return 'Screening CV';
      case 'interview': return 'Wawancara';
      case 'offer': return 'Penawaran';
      case 'rejected': return 'Ditolak';
      case 'hired': return 'Diterima';
      default: return status;
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { status: 'applied', label: 'Lamaran Diterima', icon: CheckCircle },
                { status: 'screening', label: 'Screening CV', icon: AlertCircle },
                { status: 'interview', label: 'Wawancara', icon: Users },
                { status: 'offer', label: 'Penawaran', icon: Award },
                { status: 'hired', label: 'Diterima', icon: CheckCircle },
                { status: 'rejected', label: 'Ditolak', icon: XCircle },
              ].map(({ status, label, icon: Icon }) => (
                <div key={status} className="bg-card border border-border rounded-lg p-4 text-center">
                  <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-lg font-bold text-foreground">
                    {applications.filter(app => app.status === status).length}
                  </div>
                  <div className="text-xs text-muted-foreground">{label}</div>
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
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </button>
                              <button
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
                                <option value="applied">Lamaran Diterima</option>
                                <option value="screening">Screening CV</option>
                                <option value="interview">Wawancara</option>
                                <option value="offer">Penawaran</option>
                                <option value="hired">Diterima</option>
                                <option value="rejected">Ditolak</option>
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

        {/* Detail Modal */}
        {showDetailModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
              
              <div className="p-6 space-y-6">
                {/* Candidate Info */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Informasi Pelamar</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Nama Lengkap</label>
                      <p className="font-medium text-foreground">{selectedApplication.candidate_profile.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Email</label>
                      <p className="font-medium text-foreground">{selectedApplication.candidate_profile.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Telepon</label>
                      <p className="font-medium text-foreground">{selectedApplication.candidate_profile.phone}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Pendidikan</label>
                      <p className="font-medium text-foreground">{selectedApplication.candidate_profile.education_level}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Posisi Saat Ini</label>
                      <p className="font-medium text-foreground">{selectedApplication.candidate_profile.current_position}</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Pengalaman</label>
                      <p className="font-medium text-foreground">{selectedApplication.candidate_profile.experience_years} tahun</p>
                    </div>
                  </div>
                </div>

                {/* Application Status */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Status Lamaran</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status Saat Ini</span>
                      <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedApplication.status)}`}>
                        {getStatusLabel(selectedApplication.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Tanggal Lamar</span>
                      <span className="text-sm text-foreground">{formatDate(selectedApplication.applied_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
                  >
                    Tutup
                  </button>
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition">
                    Hubungi Pelamar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
