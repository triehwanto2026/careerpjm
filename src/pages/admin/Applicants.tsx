import { useEffect, useState } from "react";
import { Users, Search, Filter, Download, Eye, Mail, Phone, Calendar, Briefcase, MapPin, GraduationCap, Award, CheckCircle, XCircle, Clock, AlertCircle, FileText, MoreVertical, Edit, Trash2, Building2, User, Camera, BookOpen, FolderOpen, Heart, Globe, Ruler, Weight, CreditCard, Home, Car, Languages, Target, Users2, Star, MessageSquare, Link2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

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
  skills: string[];
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
}

export default function Applicants() {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateProfile | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
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

      // Get applications for each candidate
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
                title
              )
            `)
            .eq("user_id", candidate.user_id);

          return {
            ...candidate,
            applications: applicationsData || [],
            has_applied: (applicationsData || []).length > 0
          };
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

  const filteredCandidates = candidates.filter(candidate =>
    candidate.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.current_position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewCandidateDetail = (candidate: CandidateProfile) => {
    setSelectedCandidate(candidate);
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
    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume - ${candidate.full_name}</title>
    <style>
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .resume { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
        .name { font-size: 32px; font-weight: bold; color: #1e40af; margin: 0; }
        .position { font-size: 18px; color: #64748b; margin: 5px 0; }
        .contact { font-size: 14px; color: #64748b; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 20px; font-weight: bold; color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .item { margin-bottom: 10px; }
        .label { font-weight: bold; color: #374151; }
        .value { color: #6b7280; }
        .skills { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill { background: #1e40af; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="resume">
        <div class="header">
            <h1 class="name">${candidate.full_name}</h1>
            <p class="position">${candidate.current_position || 'Professional'}</p>
            <div class="contact">
                ${candidate.email} | ${candidate.phone || 'No Phone'} | ${candidate.city || 'No City'}
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Tentang Saya</h2>
            <p class="value">${candidate.bio || 'Tidak ada bio tersedia'}</p>
        </div>

        <div class="section">
            <h2 class="section-title">Informasi Pribadi</h2>
            <div class="grid">
                <div class="item">
                    <span class="label">Tanggal Lahir:</span>
                    <span class="value">${formatDate(candidate.birth_date)}</span>
                </div>
                <div class="item">
                    <span class="label">Tempat Lahir:</span>
                    <span class="value">${candidate.birth_place || '-'}</span>
                </div>
                <div class="item">
                    <span class="label">Jenis Kelamin:</span>
                    <span class="value">${candidate.gender || '-'}</span>
                </div>
                <div class="item">
                    <span class="label">Alamat:</span>
                    <span class="value">${candidate.address || '-'}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Pendidikan</h2>
            <div class="item">
                <span class="label">Tingkat Pendidikan:</span>
                <span class="value">${candidate.education_level || '-'}</span>
            </div>
            <div class="item">
                <span class="label">Institusi:</span>
                <span class="value">${candidate.education_institution || '-'}</span>
            </div>
            <div class="item">
                <span class="label">Jurusan:</span>
                <span class="value">${candidate.major || '-'}</span>
            </div>
            <div class="item">
                <span class="label">Tahun Lulus:</span>
                <span class="value">${candidate.graduation_year || '-'}</span>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Pengalaman Kerja</h2>
            <div class="item">
                <span class="label">Posisi Saat Ini:</span>
                <span class="value">${candidate.current_position || '-'}</span>
            </div>
            <div class="item">
                <span class="label">Perusahaan:</span>
                <span class="value">${candidate.current_company || '-'}</span>
            </div>
            <div class="item">
                <span class="label">Pengalaman:</span>
                <span class="value">${candidate.experience_years ? `${candidate.experience_years} Tahun` : 'Tidak ada data'}</span>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Keahlian</h2>
            <div class="skills">
                ${candidate.skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
            </div>
        </div>

        ${candidate.strengths ? `
        <div class="section">
            <h2 class="section-title">Keunggulan</h2>
            <p class="value">${candidate.strengths}</p>
        </div>
        ` : ''}
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
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition">
              <Download className="h-4 w-4" />
              Export
            </button>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Posisi</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Pengalaman</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status Lamaran</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tanggal Daftar</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
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
                        <div className="flex items-center gap-2">
                          <span>{getEducationIcon(candidate.education_level)}</span>
                          <div>
                            <div className="text-sm font-medium text-foreground">{candidate.education_level || '-'}</div>
                            <div className="text-xs text-muted-foreground">{candidate.major || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-foreground">{candidate.current_position || '-'}</div>
                        <div className="text-xs text-muted-foreground">{candidate.current_company || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-foreground">{candidate.experience_years ? `${candidate.experience_years} Tahun` : '-'}</div>
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
                            className="p-1 rounded hover:bg-muted transition"
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </button>
                          {candidate.has_applied && (
                            <button
                              className="p-1 rounded hover:bg-muted transition"
                              title="Lihat Lamaran"
                            >
                              <FileText className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </button>
                          )}
                          <button
                            className="p-1 rounded hover:bg-muted transition"
                            title="Kirim Email"
                          >
                            <Mail className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </button>
                          <button
                            className="p-1 rounded hover:bg-muted transition"
                            title="Telepon"
                          >
                            <Phone className="h-4 w-4 text-muted-foreground hover:text-foreground" />
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
            <div className="bg-card border border-border rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
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
                      onClick={() => handleDownloadResume(selectedCandidate)}
                      className="bg-gradient-to-r from-primary to-accent"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Resume
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabs Content */}
              <div className="flex-1 overflow-y-auto">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-8 bg-muted/50 border-b border-border sticky top-0 z-10 overflow-x-auto">
                    <TabsTrigger value="personal" className="flex items-center gap-2 whitespace-nowrap">
                      <User className="h-4 w-4" />
                      Data Diri
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
                      Keahlian & Kepribadian
                    </TabsTrigger>
                    <TabsTrigger value="experience" className="flex items-center gap-2 whitespace-nowrap">
                      <Briefcase className="h-4 w-4" />
                      Pengalaman Kerja
                    </TabsTrigger>
                    <TabsTrigger value="salary" className="flex items-center gap-2 whitespace-nowrap">
                      <Target className="h-4 w-4" />
                      Ekspektasi Gaji
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="flex items-center gap-2 whitespace-nowrap">
                      <FolderOpen className="h-4 w-4" />
                      Dokumen
                    </TabsTrigger>
                    <TabsTrigger value="additional" className="flex items-center gap-2 whitespace-nowrap">
                      <MessageSquare className="h-4 w-4" />
                      Info Tambahan
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
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-primary" />
                          Identitas & Fisik
                        </h3>
                        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-muted-foreground">No. KTP</label>
                              <p className="font-medium text-foreground">{selectedCandidate.id_card_number || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">No. Passport</label>
                              <p className="font-medium text-foreground">{selectedCandidate.passport_number || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">SIM</label>
                              <p className="font-medium text-foreground">{selectedCandidate.driving_license || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Tinggi Badan</label>
                              <p className="font-medium text-foreground">{selectedCandidate.height || '-'}</p>
                            </div>
                            <div>
                              <label className="text-sm text-muted-foreground">Berat Badan</label>
                              <p className="font-medium text-foreground">{selectedCandidate.weight || '-'}</p>
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
                            <p className="font-medium text-foreground">{selectedCandidate.address || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Kota</label>
                            <p className="font-medium text-foreground">{selectedCandidate.city || '-'}</p>
                          </div>
                          {selectedCandidate.bio && (
                            <div>
                              <label className="text-sm text-muted-foreground">Bio</label>
                              <p className="font-medium text-foreground whitespace-pre-line">{selectedCandidate.bio}</p>
                            </div>
                          )}
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
                      {selectedCandidate.family_members && selectedCandidate.family_members.length > 0 ? (
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
                        <div>
                          <label className="text-sm text-muted-foreground">Tingkat Pendidikan</label>
                          <p className="font-medium text-foreground">{selectedCandidate.education_level || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Institusi Pendidikan</label>
                          <p className="font-medium text-foreground">{selectedCandidate.education_institution || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Jurusan/Program Studi</label>
                          <p className="font-medium text-foreground">{selectedCandidate.major || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Tahun Lulus</label>
                          <p className="font-medium text-foreground">{selectedCandidate.graduation_year || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {selectedCandidate.education_history && selectedCandidate.education_history.length > 0 && (
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
                            {(selectedCandidate.skills || []).map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                {skill}
                              </span>
                            )) || <span className="text-muted-foreground">Tidak ada data</span>}
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
                        {selectedCandidate.languages && selectedCandidate.languages.length > 0 && (
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
                        {selectedCandidate.hobbies && selectedCandidate.hobbies.length > 0 && (
                          <div>
                            <label className="text-sm text-muted-foreground">Hobi</label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedCandidate.hobbies.map((hobby, index) => (
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
                          <p className="font-medium text-foreground">{selectedCandidate.current_position || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Perusahaan</label>
                          <p className="font-medium text-foreground">{selectedCandidate.current_company || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground">Lama Pengalaman</label>
                          <p className="font-medium text-foreground">{selectedCandidate.experience_years ? `${selectedCandidate.experience_years} Tahun` : 'Tidak ada data'}</p>
                        </div>
                      </div>
                    </div>

                    {selectedCandidate.work_experience && selectedCandidate.work_experience.length > 0 && (
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
                                  <h4 className="font-semibold text-foreground">{work.position || '-'}</h4>
                                  <p className="text-sm text-muted-foreground">{work.company || '-'}</p>
                                </div>
                                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                                  {work.period || '-'}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{work.description || '-'}</p>
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
                            <label className="text-sm text-muted-foreground">Gaji yang Diharapkan</label>
                            <p className="font-medium text-foreground text-lg">{selectedCandidate.expected_salary || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Negotiable</label>
                            <p className="font-medium text-foreground">
                              {selectedCandidate.salary_negotiable ? 'Ya' : 'Tidak'}
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
                            <p className="font-medium text-foreground">{selectedCandidate.available_start_date || '-'}</p>
                          </div>
                          <div>
                            <label className="text-sm text-muted-foreground">Bersedia Relokasi</label>
                            <p className="font-medium text-foreground">
                              {selectedCandidate.willing_to_relocate ? 'Ya' : 'Tidak'}
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
                      
                      {selectedCandidate.cv_url && (
                        <div>
                          <label className="text-sm text-muted-foreground">CV/Resume</label>
                          <div className="mt-2 p-4 border border-border rounded-lg bg-muted/20">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-primary" />
                              <div className="flex-1">
                                <p className="font-medium text-foreground">CV/Resume</p>
                                <p className="text-sm text-muted-foreground">Dokumen CV pelamar</p>
                              </div>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedCandidate.certificates && selectedCandidate.certificates.length > 0 && (
                        <div>
                          <label className="text-sm text-muted-foreground">Sertifikat</label>
                          <div className="mt-2 space-y-2">
                            {selectedCandidate.certificates.map((cert, index) => (
                              <div key={index} className="p-3 border border-border rounded-lg bg-muted/20">
                                <div className="flex items-center gap-3">
                                  <Award className="h-6 w-6 text-warning" />
                                  <div className="flex-1">
                                    <p className="font-medium text-foreground">Sertifikat {index + 1}</p>
                                    <p className="text-sm text-muted-foreground">{cert}</p>
                                  </div>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedCandidate.portfolio_url && (
                        <div>
                          <label className="text-sm text-muted-foreground">Portofolio</label>
                          <div className="mt-2 p-4 border border-border rounded-lg bg-muted/20">
                            <div className="flex items-center gap-3">
                              <BookOpen className="h-8 w-8 text-primary" />
                              <div className="flex-1">
                                <p className="font-medium text-foreground">Portofolio</p>
                                <p className="text-sm text-muted-foreground">{selectedCandidate.portfolio_url}</p>
                              </div>
                              <Button variant="outline" size="sm" asChild>
                                <a href={selectedCandidate.portfolio_url} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-4 w-4 mr-2" />
                                  Lihat
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {!selectedCandidate.cv_url && !selectedCandidate.certificates?.length && !selectedCandidate.portfolio_url && (
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
                        {selectedCandidate.additional_info && (
                          <div>
                            <label className="text-sm text-muted-foreground">Informasi Tambahan</label>
                            <p className="text-foreground mt-2 whitespace-pre-line">{selectedCandidate.additional_info}</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Link2 className="h-5 w-5 text-primary" />
                          Social Media & Referensi
                        </h3>
                        {selectedCandidate.social_media && (
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
                        {selectedCandidate.references && selectedCandidate.references.length > 0 && (
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
      </div>
    </AdminLayout>
  );
}
