import { Link } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, MapPin, Building2, Clock, ArrowRight, Users, Briefcase,
  Shield, ChevronRight, TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useActiveJobs } from "@/hooks/useJobs";
import { supabase } from "@/integrations/supabase/client";

const stats = [
  { label: "Lowongan Aktif", value: "24+", icon: Briefcase },
  { label: "Kandidat Bergabung", value: "1,200+", icon: Users },
  { label: "Tingkat Keberhasilan", value: "92%", icon: TrendingUp },
  { label: "Perusahaan Partner", value: "50+", icon: Shield },
];

const Index = () => {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [landingSettings, setLandingSettings] = useState<Record<string, string>>({});
  const { data: jobs = [], isLoading, error } = useActiveJobs();

  useEffect(() => {
    const loadLandingSettings = async () => {
      const keys = [
        "landing_header_title",
        "landing_header_subtitle",
        "landing_hero_background_url",
        "landing_contact_email",
        "landing_contact_phone",
        "landing_contact_address",
        "landing_about_vision",
        "landing_about_mission",
        "landing_about_milestones",
        "landing_about_values",
      ];
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", keys);

      if (error) {
        console.error("Error loading landing settings:", error);
        setLandingSettings({});
        return;
      }

      setLandingSettings(
        (data || []).reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, string>)
      );
    };

    loadLandingSettings();
  }, []);

  const heroTitle = landingSettings.landing_header_title || "PJM Recruitment";
  const heroSubtitle = landingSettings.landing_header_subtitle || "Platform rekrutmen resmi PJM Group. Temukan karir impian Anda bersama kami.";
  const heroBackgroundUrl = landingSettings.landing_hero_background_url || "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80";
  const contactEmail = landingSettings.landing_contact_email || "hr@pjmgroup.com";
  const contactPhone = landingSettings.landing_contact_phone || "+62 21 1234 5678";
  const contactAddress = landingSettings.landing_contact_address || "Jakarta, Indonesia";
  const aboutVision = landingSettings.landing_about_vision || "Visi kami adalah menjadi mitra rekrutmen terpercaya yang menghubungkan talenta terbaik dengan peluang karir berkualitas.";
  const aboutMission = landingSettings.landing_about_mission || "Misi kami adalah membantu para profesional dan organisasi mencapai tujuan mereka melalui pengalaman rekrutmen yang modern, adil, dan transparan.";
  const aboutMilestones = landingSettings.landing_about_milestones || "2018 - Berdiri sebagai platform rekrutmen inovatif.\n2022 - Melayani lebih dari 1.000 kandidat.\n2024 - Menjadi pilihan utama perusahaan dan talenta di Indonesia.";
  const aboutValues = landingSettings.landing_about_values || "Integritas, Profesionalisme, Kepedulian, Transparansi, Kolaborasi.";

  if (error) {
    console.error("Error loading jobs:", error);
  }

  // Fallback data if database query fails
  const fallbackJobs = [
    { id: "1", title: "Senior Frontend Developer", department: "Engineering", location: "Jakarta", employment_type: "Full-time", closes_at: "2024-12-31", description: "Kami mencari Senior Frontend Developer berpengalaman." },
    { id: "2", title: "UI/UX Designer", department: "Design", location: "Bandung", employment_type: "Full-time", closes_at: "2024-12-31", description: "Bertanggung jawab atas desain antarmuka pengguna." },
    { id: "3", title: "Marketing Specialist", department: "Marketing", location: "Jakarta", employment_type: "Full-time", closes_at: "2024-12-31", description: "Mengembangkan strategi marketing untuk brand awareness." },
  ];

  const jobsToDisplay = jobs.length > 0 ? jobs : fallbackJobs;

  const filteredJobs = jobsToDisplay.filter((job) => {
    const matchSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.department.toLowerCase().includes(search.toLowerCase());
    const matchLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchSearch && matchLocation;
  }).slice(0, 6);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBackgroundUrl})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/20"></div>
        <div className="relative container py-24 md:py-28 lg:py-32">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <Badge className="mb-5 rounded-md border-primary/20 bg-primary/10 px-3 py-1 text-primary hover:bg-primary/10">PJM Recruitment</Badge>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight text-foreground md:text-5xl lg:text-6xl">
              {heroTitle}
            </h1>
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              {heroSubtitle}
            </p>
            <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/95 p-2 shadow-xl shadow-background/20 backdrop-blur md:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-md border border-border bg-background px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input type="text" placeholder="Cari posisi atau departemen..." className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3 md:w-56">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input type="text" placeholder="Lokasi..." className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
              </div>
              <Button size="lg" className="h-auto rounded-md px-6 py-3 md:px-8"><Search className="h-4 w-4 mr-2" />Cari</Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="container relative z-10 -mt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }} className="card-elevated p-5 md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 md:h-12 md:w-12"><stat.icon className="h-5 w-5 text-primary md:h-6 md:w-6" /></div>
                <div><p className="text-2xl font-bold tracking-tight md:text-3xl">{stat.value}</p><p className="text-sm text-muted-foreground">{stat.label}</p></div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="container py-16 md:py-20" id="about">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Tentang Kami</h2>
          <p className="mt-2 text-muted-foreground">Informasi visi, misi, milestone, dan nilai nilai PJM Recruitment.</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold">Visi</h3>
              <p className="mt-3 text-muted-foreground leading-7">{aboutVision}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Misi</h3>
              <p className="mt-3 text-muted-foreground leading-7">{aboutMission}</p>
            </div>
          </div>
          <div className="space-y-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div>
              <h3 className="text-xl font-semibold">Milestone</h3>
              <p className="mt-3 whitespace-pre-line text-muted-foreground leading-7">{aboutMilestones}</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Nilai Nilai</h3>
              <p className="mt-3 text-muted-foreground leading-7">{aboutValues}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="container py-16 md:py-20">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><h2 className="text-3xl font-bold tracking-tight">Lowongan Terbaru</h2><p className="mt-2 text-muted-foreground">Temukan posisi yang sesuai dengan keahlianmu</p></div>
          <Button variant="outline" asChild className="w-fit rounded-md"><Link to="/jobs">Lihat Semua <ChevronRight className="h-4 w-4 ml-1" /></Link></Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="card-elevated h-56 animate-pulse bg-muted/30 p-6" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i, duration: 0.4 }}>
                <Link to={`/jobs/${job.id}`} className="group block h-full rounded-lg border border-border/70 bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10"><Building2 className="h-6 w-6 text-primary" /></div>
                    <Badge className="rounded-md bg-primary/10 text-primary hover:bg-primary/20">{job.employment_type}</Badge>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold leading-snug transition-colors group-hover:text-primary">{job.title}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{job.department}</p>
                  <p className="mb-6 line-clamp-2 text-sm leading-6 text-muted-foreground">{job.description || "Klik untuk melihat detail lowongan ini."}</p>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="flex min-w-0 items-center gap-1"><MapPin className="h-3 w-3 shrink-0" /> {job.location}</span>
                      <span className="flex min-w-0 items-center gap-1"><Clock className="h-3 w-3 shrink-0" /> {job.closes_at ? new Date(job.closes_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Open"}</span>
                    </div>
                    <ArrowRight className="ml-3 h-4 w-4 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Contact Section */}
      <section className="container py-16 md:py-20" id="contact">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold tracking-tight">Kontak</h2>
            <p className="mt-2 text-muted-foreground">Hubungi kami untuk informasi lebih lanjut tentang peluang karir dan proses rekrutmen.</p>
          </div>
          <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <a href={`mailto:${contactEmail}`} className="block mt-2 text-lg font-semibold text-foreground">{contactEmail}</a>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telepon</p>
              <a href={`tel:${contactPhone.replace(/\s+/g, "")}`} className="block mt-2 text-lg font-semibold text-foreground">{contactPhone}</a>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alamat</p>
              <p className="mt-2 text-lg font-semibold text-foreground">{contactAddress}</p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Index;
