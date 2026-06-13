import { Link } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, MapPin, Building2, Clock, ArrowRight, Users, Briefcase,
  Shield, ChevronRight, TrendingUp, Target, Award, Globe2, CheckCircle2,
  Sparkles, Layers3,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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

  const parseJsonValue = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const loadLandingSettings = async () => {
      const keys = [
        "app_name",
        "app_logo_url",
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
        "landing_about_milestones_items",
        "landing_about_values_items",
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

    const channel = supabase
      .channel("landing-settings")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "app_settings" }, () => {
        loadLandingSettings();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const heroTitle = landingSettings.landing_header_title || "Temukan Karir Impianmu";
  const heroSubtitle = landingSettings.landing_header_subtitle || "Jelajahi lowongan pekerjaan di PJM Group dan anak perusahaannya. Bangun karir yang bermakna bersama kami.";
  const heroBrand = landingSettings.app_name || landingSettings.landing_header_title || "PJM GROUP Career Management";
  const logoUrl = landingSettings.app_logo_url;
  const heroBackgroundUrl = landingSettings.landing_hero_background_url || "/__l5e/assets-v1/80b11226-9de5-420a-9265-8d649b07e87f/hero-bg.jpg";
  const aboutVision = landingSettings.landing_about_vision || "Tumbuh bersama untuk masa depan yang lebih baik melalui talenta unggul Indonesia.";
  const aboutMission = landingSettings.landing_about_mission || "Menyediakan platform rekrutmen yang modern dan efisien.\nMenghubungkan talent terbaik dengan perusahaan yang tepat.\nMendukung pengembangan karir dan profesionalisme.";
  const aboutValues = parseJsonValue(landingSettings.landing_about_values_items || "[]");
  const aboutMilestones = parseJsonValue(landingSettings.landing_about_milestones_items || "[]");
  const missionItems = aboutMission.split("\n").map((line) => line.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
  const valuesToShow = (aboutValues.length > 0 ? aboutValues : [
    { name: "Integritas", description: "Proses seleksi yang jujur, jelas, dan bertanggung jawab." },
    { name: "Profesionalisme", description: "Standar layanan yang rapi, terukur, dan konsisten." },
    { name: "Kolaborasi", description: "Membangun hubungan kerja yang saling menguatkan." },
  ]).slice(0, 4);
  const milestonesToShow = (aboutMilestones.length > 0 ? aboutMilestones : [
    { year: "2018", title: "Awal Perjalanan", description: "Membangun fondasi layanan rekrutmen dan asesmen." },
    { year: "2022", title: "Transformasi Digital", description: "Mengembangkan proses seleksi yang lebih cepat dan terukur." },
    { year: "2024", title: "Pertumbuhan", description: "Memperluas kesempatan bagi kandidat dan unit bisnis." },
  ]).slice(0, 4);

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
      <section id="beranda" className="relative min-h-[620px] overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBackgroundUrl})` }} />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.90)_36%,rgba(2,6,23,0.60)_68%,rgba(2,6,23,0.42)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_34%,rgba(14,165,233,0.28),transparent_24%),radial-gradient(circle_at_76%_28%,rgba(20,184,166,0.24),transparent_28%),linear-gradient(120deg,transparent_0%,rgba(14,165,233,0.08)_44%,transparent_70%)]" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-slate-950 to-transparent" />
        <div className="relative container py-24 md:py-28 lg:py-36">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="max-w-3xl">
            <Badge className="mb-6 rounded-full border-sky-400/40 bg-sky-400/15 px-4 py-1.5 text-sky-300 shadow-sm shadow-sky-500/20 hover:bg-sky-400/15">🚀 Platform Rekrutmen Resmi PJM Group</Badge>
            <h1 className="mb-5 max-w-2xl text-5xl font-extrabold leading-[1.04] tracking-tight text-white md:text-6xl lg:text-7xl">
              {heroTitle}
            </h1>
            <p className="mb-8 max-w-2xl text-base leading-8 text-slate-300 md:text-xl">
              {heroSubtitle}
            </p>
            <div className="flex max-w-3xl flex-col gap-3 rounded-xl border border-white/20 bg-white/12 p-2 shadow-2xl shadow-sky-950/40 backdrop-blur md:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-lg bg-white px-4 py-3.5 text-slate-900">
                <Search className="h-5 w-5 shrink-0 text-slate-500" />
                <input type="text" placeholder="Cari posisi atau departemen..." className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white px-4 py-3.5 text-slate-900 md:w-60">
                <MapPin className="h-5 w-5 shrink-0 text-slate-500" />
                <input type="text" placeholder="Lokasi..." className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
              </div>
              <Button size="lg" className="h-auto rounded-lg bg-sky-500 px-8 py-3.5 text-white shadow-lg shadow-sky-500/25 hover:bg-sky-600"><Search className="h-4 w-4 mr-2" />Cari</Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1"><CheckCircle2 className="h-3.5 w-3.5 text-teal-300" /> Data kandidat terpusat</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1"><Sparkles className="h-3.5 w-3.5 text-amber-300" /> Assessment psikologi online</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1"><Shield className="h-3.5 w-3.5 text-sky-300" /> Proses rekrutmen terukur</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="container relative z-10 -mt-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.06, duration: 0.35 }} className="rounded-xl border border-slate-200 bg-white p-5 text-slate-950 shadow-lg shadow-slate-200/60 dark:border-border dark:bg-card dark:text-foreground dark:shadow-none">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100"><stat.icon className="h-5 w-5 text-sky-500" /></div>
                <div><p className="text-3xl font-extrabold tracking-tight">{stat.value}</p><p className="text-sm text-slate-500 dark:text-muted-foreground">{stat.label}</p></div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Job Listings */}
      <section id="lowongan" className="container scroll-mt-24 py-16 md:py-20">
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
                <Link to={`/jobs/${job.id}`} className="group block h-full rounded-xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-teal-500/40 hover:shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-500/10"><Building2 className="h-5 w-5 text-teal-600 dark:text-teal-300" /></div>
                    <Badge className="rounded-md bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300">{job.employment_type}</Badge>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold leading-snug transition-colors group-hover:text-primary">{job.title}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{job.department}</p>
                  <p className="mb-6 line-clamp-2 text-sm leading-6 text-muted-foreground">{job.description || "Klik untuk melihat detail lowongan ini."}</p>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="flex min-w-0 items-center gap-1"><MapPin className="h-3 w-3 shrink-0" /> {job.location}</span>
                      <span className="flex min-w-0 items-center gap-1"><Clock className="h-3 w-3 shrink-0" /> {job.closes_at ? new Date(job.closes_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Open"}</span>
                    </div>
                    <ArrowRight className="ml-3 h-4 w-4 shrink-0 text-teal-600 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* About */}
      <section id="tentang" className="scroll-mt-24 overflow-hidden bg-[#07111f] text-white">
        <div className="relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.28),transparent_30%),radial-gradient(circle_at_82%_8%,rgba(20,184,166,0.24),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_42%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/50 to-transparent" />
          <div className="container relative py-20 md:py-28">
            <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:sticky lg:top-28"
              >
                <Badge className="mb-5 rounded-full border-sky-300/30 bg-sky-300/10 px-4 py-1.5 text-sky-200 hover:bg-sky-300/10">
                  <Globe2 className="mr-1.5 h-3.5 w-3.5" /> Tentang PJM Group
                </Badge>
                <h2 className="max-w-xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                  Ruang bertemunya talenta, peluang, dan proses seleksi yang lebih manusiawi.
                </h2>
                <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                  {heroBrand} mendukung proses rekrutmen yang rapi, informatif, dan terukur. Setiap kandidat dapat menemukan peluang, memahami proses, dan mengikuti asesmen dengan pengalaman yang lebih jelas.
                </p>

                <div className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
                  <div className="flex items-center gap-4">
                    {logoUrl ? (
                      <img src={logoUrl} alt={heroBrand} className="h-14 w-auto max-w-[180px] rounded-xl bg-white object-contain p-2" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10">
                        <Building2 className="h-7 w-7 text-sky-300" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">Career Ecosystem</p>
                      <p className="mt-1 text-sm text-slate-300">PJM Group Recruitment</p>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "Fair", icon: Shield },
                      { label: "Insightful", icon: Sparkles },
                      { label: "Connected", icon: Users },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                        <item.icon className="mb-3 h-5 w-5 text-sky-300" />
                        <p className="text-sm font-semibold">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative overflow-hidden rounded-[32px] border border-sky-300/20 bg-gradient-to-br from-sky-400/20 via-white/[0.08] to-teal-400/10 p-7 md:p-9"
                >
                  <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />
                  <div className="relative">
                    <div className="mb-8 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">Visi</p>
                        <h3 className="mt-2 text-2xl font-bold">Arah yang kami tuju</h3>
                      </div>
                      <Target className="h-9 w-9 text-sky-200" />
                    </div>
                    <p className="text-2xl font-bold leading-snug md:text-4xl">{aboutVision}</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur"
                >
                  <div className="mb-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">Misi</p>
                      <h3 className="mt-2 text-2xl font-bold">Cara kami bekerja</h3>
                    </div>
                    <CheckCircle2 className="h-7 w-7 text-teal-200" />
                  </div>
                  <Carousel opts={{ align: "start", loop: missionItems.length > 2 }} className="w-full">
                    <CarouselContent className="-ml-4">
                      {(missionItems.length ? missionItems : [aboutMission]).map((mission, idx) => (
                        <CarouselItem key={idx} className="pl-4 md:basis-1/2">
                          <div className="h-full min-h-[190px] rounded-[24px] border border-white/10 bg-[#0f2034] p-6">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-300/15 text-sm font-black text-teal-200">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <p className="mt-5 text-sm leading-7 text-slate-200">{mission}</p>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="-left-4 hidden border-white/20 bg-white/10 text-white hover:bg-white/20 md:flex" />
                    <CarouselNext className="-right-4 hidden border-white/20 bg-white/10 text-white hover:bg-white/20 md:flex" />
                  </Carousel>
                  <p className="mt-4 text-xs text-slate-400">Geser kanan/kiri untuk melihat seluruh misi.</p>
                </motion.div>
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.82fr]">
              <motion.div
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur"
              >
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">Value</p>
                    <h3 className="mt-2 text-2xl font-bold">Nilai yang terasa dalam proses</h3>
                  </div>
                  <Award className="h-7 w-7 text-amber-200" />
                </div>
                <Carousel opts={{ align: "start", loop: valuesToShow.length > 3 }} className="w-full">
                  <CarouselContent className="-ml-4">
                    {valuesToShow.map((value: any, idx: number) => (
                      <CarouselItem key={idx} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                        <div className="h-full min-h-[178px] rounded-[24px] border border-white/10 bg-gradient-to-br from-amber-300/16 to-white/[0.05] p-6">
                          <Layers3 className="mb-5 h-7 w-7 text-amber-200" />
                          <p className="text-lg font-bold">{value.name || `Nilai ${idx + 1}`}</p>
                          <p className="mt-3 text-sm leading-7 text-slate-300">{value.description}</p>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-left-4 hidden border-white/20 bg-white/10 text-white hover:bg-white/20 md:flex" />
                  <CarouselNext className="-right-4 hidden border-white/20 bg-white/10 text-white hover:bg-white/20 md:flex" />
                </Carousel>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-[32px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur"
              >
                <div className="mb-6 flex items-center gap-3">
                  <Clock className="h-6 w-6 text-sky-200" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">Journey</p>
                    <h3 className="mt-1 text-2xl font-bold">Perjalanan</h3>
                  </div>
                </div>
                <div className="space-y-5">
                  {milestonesToShow.map((item: any, idx: number) => (
                    <div key={idx} className="relative pl-8">
                      <span className="absolute left-0 top-1 flex h-4 w-4 rounded-full bg-sky-300 ring-4 ring-sky-300/15" />
                      {idx < milestonesToShow.length - 1 && <span className="absolute left-[7px] top-6 h-full w-px bg-white/15" />}
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-200">{item.year}</p>
                      <p className="mt-1 text-base font-bold">{item.title || item.year}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{item.description}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
};

export default Index;
