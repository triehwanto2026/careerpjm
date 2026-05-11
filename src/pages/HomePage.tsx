import { useNavigate } from "react-router-dom";
import { 
  Building2, 
  Target, 
  Eye, 
  Users, 
  Award, 
  TrendingUp,
  Briefcase,
  LogIn,
  Menu,
  X,
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
  Phone,
  Mail,
  Globe,
  UserPlus
} from "lucide-react";
import { useState, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  created_at: string;
  description: string;
  requirements: string;
  responsibilities: string;
  min_salary: number;
  max_salary: number;
  status: string;
  closes_at: string;
}

const HomePage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("vision");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    const { data } = await supabase
      .from("job_vacancies")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(6);
    setJobs(data || []);
  };

  const milestones = [
    { year: "2018", title: "Pendirian Perusahaan", desc: "Didirikan dengan visi menjadi leader dalam solusi HR" },
    { year: "2020", title: "Ekspansi Layanan", desc: "Membuka cabang di 3 kota besar Indonesia" },
    { year: "2022", title: "Digital Transformation", desc: "Launching platform assessment online" },
    { year: "2024", title: "1000+ Clients", desc: "Melayani lebih dari 1000 perusahaan nasional" },
    { year: "2025", title: "AI Integration", desc: "Mengintegrasikan AI dalam proses rekrutmen" },
  ];

  const activities = [
    { title: "Training & Development", desc: "Program pelatihan berkala untuk karyawan", icon: TrendingUp },
    { title: "Team Building", desc: "Kegiatan bonding antar tim setiap quarter", icon: Users },
    { title: "Certification Program", desc: "Dukungan sertifikasi profesional", icon: Award },
    { title: "Career Pathing", desc: "Perencanaan karir yang jelas", icon: Target },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">PT. PsyTest</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#about" className="text-sm text-muted-foreground hover:text-primary transition-colors">Tentang Kami</a>
              <a href="#vision" className="text-sm text-muted-foreground hover:text-primary transition-colors">Visi & Misi</a>
              <a href="#jobs" className="text-sm text-muted-foreground hover:text-primary transition-colors">Karir</a>
              <a href="#contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Kontak</a>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button 
                onClick={() => navigate("/candidate/register")}
                className="hidden md:flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-all text-sm font-medium"
              >
                <UserPlus className="h-4 w-4" />
                Daftar
              </button>
              <button 
                onClick={() => navigate("/login")}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition-all text-sm font-medium"
              >
                <LogIn className="h-4 w-4" />
                Login
              </button>
              
              {/* Mobile Menu Button */}
              <button 
                className="md:hidden p-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-3 space-y-2">
              <a href="#about" className="block py-2 text-sm text-muted-foreground hover:text-primary">Tentang Kami</a>
              <a href="#vision" className="block py-2 text-sm text-muted-foreground hover:text-primary">Visi & Misi</a>
              <a href="#jobs" className="block py-2 text-sm text-muted-foreground hover:text-primary">Karir</a>
              <a href="#contact" className="block py-2 text-sm text-muted-foreground hover:text-primary">Kontak</a>
              <button 
                onClick={() => navigate("/login")}
                className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-lg mt-2"
              >
                <LogIn className="h-4 w-4" />
                Login
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Solusi <span className="text-primary">Rekrutmen</span> & <br />
              Assessment <span className="text-primary">Profesional</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Platform terintegrasi untuk proses rekrutmen yang efisien, 
              akurat, dan berbasis data. Temukan talent terbaik untuk perusahaan Anda.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all font-semibold"
              >
                Mulai Tes
                <ChevronRight className="h-5 w-5" />
              </button>
              <button 
                onClick={() => document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-8 py-4 border border-border rounded-xl hover:bg-muted transition-all font-semibold"
              >
                <Briefcase className="h-5 w-5" />
                Lihat Lowongan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section id="vision" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Visi & Misi</h2>
            <p className="text-muted-foreground">Komitmen kami dalam memberikan solusi terbaik</p>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <button 
              onClick={() => setActiveTab("vision")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "vision" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="inline h-4 w-4 mr-2" />
              Visi
            </button>
            <button 
              onClick={() => setActiveTab("mission")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "mission" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Target className="inline h-4 w-4 mr-2" />
              Misi
            </button>
          </div>

          <div className="max-w-3xl mx-auto">
            {activeTab === "vision" ? (
              <div className="glass rounded-2xl p-8 text-center">
                <Eye className="h-16 w-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-foreground mb-4">Visi Kami</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Menjadi perusahaan terdepan dalam solusi assessment dan rekrutmen 
                  di Indonesia, membantu organisasi menemukan talent terbaik 
                  untuk mencapai kesuksesan bersama.
                </p>
              </div>
            ) : (
              <div className="glass rounded-2xl p-8">
                <Target className="h-16 w-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-foreground mb-4 text-center">Misi Kami</h3>
                <ul className="space-y-4">
                  {[
                    "Memberikan solusi assessment yang akurat dan berbasis data",
                    "Mengembangkan teknologi AI untuk proses rekrutmen yang efisien",
                    "Memberdayakan HR profesional dengan tools yang powerful",
                    "Menciptakan pengalaman kandidat yang positif",
                    "Mendukung pertumbuhan bisnis klien melalui talent acquisition"
                  ].map((mission, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-primary font-bold">{idx + 1}</span>
                      </div>
                      <span className="text-muted-foreground">{mission}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Milestones Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Perjalanan Kami</h2>
            <p className="text-muted-foreground">Milestone penting dalam perjalanan perusahaan</p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-border hidden md:block" />
            
            <div className="space-y-8">
              {milestones.map((milestone, idx) => (
                <div key={idx} className={`flex items-center gap-8 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`flex-1 ${idx % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <div className="glass rounded-xl p-6">
                      <span className="text-2xl font-bold text-primary">{milestone.year}</span>
                      <h3 className="text-lg font-semibold text-foreground mt-2">{milestone.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{milestone.desc}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex w-4 h-4 rounded-full bg-primary border-4 border-background z-10" />
                  <div className="flex-1 hidden md:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Development Activities */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Kegiatan Development</h2>
            <p className="text-muted-foreground">Investasi kami dalam pengembangan talent</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {activities.map((activity, idx) => (
              <div key={idx} className="glass rounded-xl p-6 hover:shadow-lg transition-all">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <activity.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{activity.title}</h3>
                <p className="text-sm text-muted-foreground">{activity.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Jobs Section */}
      <section id="jobs" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Lowongan Pekerjaan</h2>
            <p className="text-muted-foreground">Bergabung dengan tim kami dan kembangkan karir Anda</p>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Belum ada lowongan tersedia saat ini</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <div key={job.id} className="glass rounded-xl p-6 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.department}</p>
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      {job.employment_type}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(job.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{job.description}</p>

                  <button 
                    onClick={() => setSelectedJob(job)}
                    className="w-full py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all text-sm font-medium"
                  >
                    Lihat Detail
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Hubungi Kami</h2>
            <p className="text-muted-foreground">Kami siap membantu kebutuhan rekrutmen Anda</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass rounded-xl p-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Alamat</h3>
              <p className="text-sm text-muted-foreground">
                Jl. Sudirman No. 123<br />
                Jakarta Pusat, 10220
              </p>
            </div>
            <div className="glass rounded-xl p-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Telepon</h3>
              <p className="text-sm text-muted-foreground">
                +62 21 1234 5678<br />
                Senin - Jumat: 08:00 - 17:00
              </p>
            </div>
            <div className="glass rounded-xl p-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Email</h3>
              <p className="text-sm text-muted-foreground">
                info@psytest.id<br />
                career@psytest.id
              </p>
            </div>
            <div className="glass rounded-xl p-6 text-center">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Website</h3>
              <p className="text-sm text-muted-foreground">
                www.psytest.id<br />
                LinkedIn: PT. PsyTest
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">PT. PsyTest</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 PT. PsyTest. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="/login" className="text-sm text-primary hover:underline">Login</a>
              <a href="/admin" className="text-sm text-primary hover:underline">Admin</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{selectedJob.title}</h3>
                  <p className="text-muted-foreground">{selectedJob.department}</p>
                </div>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="p-2 hover:bg-muted rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-4 mb-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {selectedJob.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {selectedJob.employment_type}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(selectedJob.created_at).toLocaleDateString('id-ID')}
                </span>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-foreground mb-2">Deskripsi</h4>
                <p className="text-muted-foreground">{selectedJob.description}</p>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-foreground mb-2">Kualifikasi</h4>
                <ul className="space-y-2">
                  {selectedJob.requirements?.split('\n').map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary mt-1">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => {
                  setSelectedJob(null);
                  navigate("/candidate/register");
                }}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:brightness-110 transition-all font-semibold"
              >
                Lamar Posisi Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
