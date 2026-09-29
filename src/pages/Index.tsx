import { Link } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, MapPin, Building2, Clock, ArrowRight, Users, Briefcase,
  Shield, ChevronRight, TrendingUp, Target, Award, Globe2, CheckCircle2,
  Sparkles, Layers3, ClipboardCheck,
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

const companyVision = {
  title: "Growing Together for a Better Future",
  description:
    "Bertumbuh bersama untuk masa depan yang lebih baik melalui pengembangan properti yang bernilai, serta perluasan bisnis finansial dan komersial yang memberi manfaat berkelanjutan bagi pelanggan, mitra, karyawan, dan masyarakat.",
};

const companyMissions = [
  "Mengembangkan properti dan kawasan yang berkualitas, sesuai kebutuhan pasar, serta menciptakan nilai jangka panjang.",
  "Mengembangkan bisnis finansial dan komersial, termasuk HORECA dan entertainment, secara bertanggung jawab dan saling mendukung dengan bisnis inti.",
  "Menghadirkan produk, layanan, dan pengalaman pelanggan yang aman, nyaman, inovatif, dan terpercaya.",
  "Membangun kerja sama yang saling menguntungkan dengan pelanggan, mitra usaha, pemerintah, dan masyarakat.",
  "Mengembangkan sumber daya manusia yang profesional, adaptif, kolaboratif, dan berorientasi pada hasil.",
  "Menjalankan tata kelola perusahaan yang baik serta melakukan perbaikan berkelanjutan agar pertumbuhan bisnis memberi manfaat bagi semua pihak.",
];

const companyValues = [
  {
    name: "M",
    full: "Modern",
    meaning: "Terbuka terhadap inovasi dan pengembangan.",
    application: "Menggunakan gagasan dan cara kerja yang relevan untuk menghasilkan nilai lebih baik.",
  },
  {
    name: "A",
    full: "Adaptif",
    meaning: "Cepat menyesuaikan diri terhadap perubahan.",
    application: "Tanggap terhadap perkembangan pasar, kebutuhan pelanggan, dan arah bisnis.",
  },
  {
    name: "S",
    full: "Sinergis",
    meaning: "Membangun kolaborasi untuk mencapai tujuan bersama.",
    application: "Bekerja sama lintas tim dan menjalin kemitraan yang produktif.",
  },
  {
    name: "Y",
    full: "Yakin",
    meaning: "Percaya diri, konsisten, dan optimis dalam mencapai keberhasilan.",
    application: "Berani mengambil tanggung jawab dan menuntaskan komitmen.",
  },
  {
    name: "H",
    full: "Handal",
    meaning: "Profesional, berintegritas, dan dapat dipercaya.",
    application: "Menjaga mutu pekerjaan serta memenuhi janji kepada pelanggan dan mitra.",
  },
  {
    name: "U",
    full: "Unggul",
    meaning: "Berorientasi pada kualitas, hasil terbaik, dan perbaikan berkelanjutan.",
    application: "Menetapkan standar tinggi dan terus meningkatkan kinerja.",
  },
  {
    name: "R",
    full: "Responsif",
    meaning: "Cepat tanggap, proaktif, dan berorientasi pada solusi.",
    application: "Memahami kebutuhan dan menyelesaikan persoalan secara tepat.",
  },
];

const companyMilestones = [
  {
    year: "1982",
    title: "Awal Perjalanan Properti",
    description:
      "PJM Group memulai perjalanan di bisnis properti melalui keterlibatan dalam pembangunan perumahan RS/RSS di atas lahan seluas dua hektare.",
  },
  {
    year: "1984",
    title: "Tambak Rejo Indah",
    description:
      "PJM Group memperoleh kepercayaan untuk mengembangkan proyek perumahan Tambak Rejo Indah di Pasuruan.",
  },
  {
    year: "1985",
    title: "Sarana Tidar",
    description:
      "Melalui proyek Sarana Tidar, PJM Group mengembangkan perumahan kelas menengah ke atas di wilayah Malang dan Sidoarjo.",
  },
  {
    year: "1997",
    title: "22 Proyek di Jawa Timur",
    description:
      "PJM Group mencapai tonggak penting dengan pembangunan 22 proyek sekaligus di Jawa Timur.",
  },
  {
    year: "2000",
    title: "Villa Puncak Tidar",
    description:
      "PJM Group mengembangkan Villa Puncak Tidar, Malang, sebagai proyek hunian mewah.",
  },
  {
    year: "2004",
    title: "Kolaborasi Pengembang Nasional",
    description:
      "PJM Group memulai kolaborasi dengan pengembang properti, termasuk Ciputra Group dan Lippo Group, dalam pembangunan proyek perumahan kelas menengah ke atas di beberapa kota.",
  },
  {
    year: "2005",
    title: "Perluasan Wilayah",
    description:
      "PJM Group memperluas jangkauan pengembangan ke Jawa Timur, DKI Jakarta, Jawa Barat, dan DI Yogyakarta.",
  },
  {
    year: "2008",
    title: "Batu Night Spectacular",
    description:
      "PJM Group berkolaborasi dengan Jatim Park Group dan memperluas portofolio ke sektor hiburan melalui Batu Night Spectacular (BNS) di Batu, Malang.",
  },
  {
    year: "2012",
    title: "Swiss-Belinn Malang",
    description:
      "PJM Group memasuki sektor perhotelan melalui pengembangan Swiss-Belinn Malang bersama mitra usaha.",
  },
  {
    year: "2020",
    title: "Kesehatan & Komersial",
    description:
      "PJM Group mengembangkan Intibios Clinic di Surabaya pada sektor kesehatan dan meluncurkan Elpico Mall sebagai kawasan komersial di Malang.",
  },
  {
    year: "2021",
    title: "Citraland Puncak Tidar",
    description:
      "PJM Group bekerja sama dengan Ciputra Group dalam pengembangan Citraland Puncak Tidar, Malang.",
  },
  {
    year: "2022",
    title: "Sakala",
    description:
      "PJM Group meluncurkan Sakala, hunian dengan konsep resort style living.",
  },
  {
    year: "2024",
    title: "TERALAND, 221 Lane, F&B, dan Workspace",
    description:
      "PJM Group meluncurkan TERALAND di Menganti dan 221 Lane di MERR Surabaya. Pada tahun yang sama, PJM Group memperluas bisnis F&B melalui Ahpek Kopitiam dan Common Grounds Malang, serta meresmikan ruang kerja HQ Lippo Thamrin di Jakarta Pusat melalui kolaborasi dengan IWG Group.",
  },
];

const Index = () => {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [landingSettings, setLandingSettings] = useState<Record<string, string>>({});
  const { data: jobs = [], isLoading, error } = useActiveJobs();

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
  const logoUrl = landingSettings.app_logo_url || "/pjmgroup-logo.svg";
  const heroBackgroundUrl = landingSettings.landing_hero_background_url || "/__l5e/assets-v1/80b11226-9de5-420a-9265-8d649b07e87f/hero-bg.jpg";
  const aboutVision = companyVision.title;
  const aboutVisionDesc = companyVision.description;
  const missionItems = companyMissions;
  const valuesToShow = companyValues;
  const milestonesToShow = companyMilestones;

  if (error) {
    console.error("Error loading jobs:", error);
  }

  const filteredJobs = jobs.filter((job) => {
    const matchSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.department.toLowerCase().includes(search.toLowerCase());
    const matchLocation = !locationFilter || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchSearch && matchLocation;
  });
  const jobsByDepartment = filteredJobs.reduce((acc: Record<string, typeof filteredJobs>, job) => {
    const department = job.department || "Lainnya";
    (acc[department] ||= []).push(job);
    return acc;
  }, {});
  const departmentGroups = Object.entries(jobsByDepartment).slice(0, 4);

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
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Lowongan Terbaru</h2>
            <p className="mt-2 text-muted-foreground">
              {jobs.length > 0 ? "Temukan posisi yang sesuai dengan keahlianmu" : "Belum ada lowongan aktif saat ini"}
            </p>
          </div>
          {jobs.length > 0 && <Button variant="outline" asChild className="w-fit rounded-md"><Link to="/jobs">Lihat Semua <ChevronRight className="h-4 w-4 ml-1" /></Link></Button>}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="card-elevated h-56 animate-pulse bg-muted/30 p-6" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold">Lowongan belum tersedia</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Saat ini belum ada posisi aktif. Silakan cek kembali secara berkala atau daftar sebagai kandidat untuk melengkapi profil Anda.
            </p>
            <Button asChild className="mt-5 rounded-md"><Link to="/register">Daftar Kandidat</Link></Button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Tidak ada lowongan yang cocok dengan pencarian Anda.
          </div>
        ) : (
          <div className="space-y-5">
            {departmentGroups.map(([department, items], groupIndex) => (
              <motion.div key={department} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: groupIndex * 0.06, duration: 0.35 }} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{department}</h3>
                    <p className="text-xs text-muted-foreground">{items.length} posisi tersedia</p>
                  </div>
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {items.slice(0, 3).map((job) => (
                    <Link key={job.id} to={`/jobs/${job.id}`} className="group rounded-lg border border-border/70 bg-background p-4 transition hover:border-primary/40 hover:bg-primary/5">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h4 className="line-clamp-2 text-sm font-semibold group-hover:text-primary">{job.title}</h4>
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
                      </div>
                      <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{job.description || "Klik untuk melihat detail lowongan ini."}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1"><MapPin className="h-3 w-3" />{job.location}</span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1"><Clock className="h-3 w-3" />{job.employment_type}</span>
                      </div>
                    </Link>
                  ))}
                  {items.length > 3 && (
                    <Link to="/jobs" className="flex min-h-28 items-center justify-center rounded-lg border border-dashed border-border bg-background text-sm font-medium text-primary hover:bg-primary/5">
                      +{items.length - 3} posisi lainnya di {department}
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Gallery Section */}
      <section className="container py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Galeri Kegiatan</h2>
          <p className="text-muted-foreground">Momen proses rekrutmen dan aktivitas perusahaan</p>
        </div>
        <Carousel opts={{ align: "start", loop: true }} className="w-full">
          <CarouselContent>
            {[
              { title: "Proses Interview", desc: "Interview kandidat dengan tim HR", img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop" },
              { title: "Assessment Center", desc: "Pelaksanaan tes psikologi", img: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop" },
              { title: "Team Building", desc: "Kegiatan bonding tim", img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop" },
              { title: "Training Session", desc: "Pelatihan karyawan", img: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop" },
              { title: "Office Environment", desc: "Suasana kantor yang nyaman", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop" },
              { title: "Career Fair", desc: "Partisipasi dalam job fair", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop" },
            ].map((item, idx) => (
              <CarouselItem key={idx} className="md:basis-1/2 lg:basis-1/3">
                <div className="relative overflow-hidden rounded-xl border border-border bg-card group">
                  <img src={item.img} alt={item.title} className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <p className="text-sm text-slate-200">{item.desc}</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 top-1/2 -translate-y-1/2 border-border bg-background hover:bg-muted" />
          <CarouselNext className="right-4 top-1/2 -translate-y-1/2 border-border bg-background hover:bg-muted" />
        </Carousel>
      </section>

      {/* About */}
      <section id="tentang" className="scroll-mt-24 overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background">
        <div className="container py-16 md:py-24">
            {/* Brand */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
                {logoUrl ? (
                  <img src={logoUrl} alt={heroBrand} className="h-auto w-full max-w-[360px] object-contain" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Platform Rekrutmen Resmi PJM Group</p>
                  <p className="mt-3 text-lg text-muted-foreground">
                    Temukan karir impian Anda bersama kami.
                  </p>
                </div>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Fair", icon: Shield, desc: "Proses yang adil" },
                  { label: "Insightful", icon: Sparkles, desc: "Data-driven" },
                  { label: "Connected", icon: Users, desc: "Terhubung" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-border bg-muted/30 p-5 text-center hover:bg-muted/50 transition">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto mb-3">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-base font-semibold text-foreground mb-1">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Vision */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-background to-muted/20 p-6 md:p-8 mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Visi</p>
                  <h3 className="text-lg font-bold text-foreground">Arah yang kami tuju</h3>
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground leading-relaxed mb-4">{aboutVision}</p>
              <p className="text-base text-muted-foreground leading-relaxed">{aboutVisionDesc}</p>
            </motion.div>

            {/* Mission */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Misi</p>
                  <h3 className="text-lg font-bold text-foreground">Cara kami bekerja</h3>
                </div>
              </div>
              <div className="space-y-4">
                {missionItems.map((mission, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{mission}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Values - MASYHUR */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-12"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Nilai Perusahaan</p>
                  <h3 className="text-lg font-bold text-foreground">Nilai Perusahaan — MASYHUR</h3>
                </div>
              </div>
              <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent className="-ml-4">
                  {valuesToShow.map((value, idx) => (
                    <CarouselItem key={idx} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                      <div className="h-full min-h-[270px] rounded-xl border border-border bg-muted/30 p-5 transition hover:border-primary/30 hover:bg-muted/50">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                            <span className="text-xl font-black">{value.name}</span>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">MASYHUR</p>
                            <p className="text-lg font-bold text-foreground">{value.full}</p>
                          </div>
                        </div>
                        <div className="space-y-3 text-sm leading-relaxed">
                          <div>
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Makna</p>
                            <p className="text-foreground">{value.meaning}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Penerapan</p>
                            <p className="text-muted-foreground">{value.application}</p>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2 top-1/2 -translate-y-1/2 border-border bg-background hover:bg-muted" />
                <CarouselNext className="right-2 top-1/2 -translate-y-1/2 border-border bg-background hover:bg-muted" />
              </Carousel>
            </motion.div>

            {/* Journey - Milestones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-card p-6 md:p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Perjalanan</p>
                  <h3 className="text-lg font-bold text-foreground">Milestone PJM Group</h3>
                </div>
              </div>
              <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2">
                {milestonesToShow.map((item: any, idx: number) => (
                  <div key={idx} className="relative pl-8">
                    <span className="absolute left-0 top-2 flex h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
                    {idx < milestonesToShow.length - 1 && <span className="absolute left-[5px] top-8 h-full w-px bg-border" />}
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-1">{item.year}</p>
                    <p className="text-base font-bold text-foreground mb-1">{item.title || item.year}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
        </div>
      </section>

    </PublicLayout>
  );
};

export default Index;
