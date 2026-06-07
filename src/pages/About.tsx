import PublicLayout from "@/components/layout/PublicLayout";
import * as LucideIcons from "lucide-react";
import {
  Building2,
  Target,
  Zap,
  Sparkles,
  Calendar,
  ArrowRight,
  Users,
  Award,
  Globe2,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const About = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});

  const parseJsonValue = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      const keys = [
        "app_name",
        "app_logo_url",
        "landing_about_vision",
        "landing_about_mission",
        "landing_about_milestones_items",
        "landing_about_values_items",
      ];
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", keys);

      if (error) {
        console.error("Error loading about settings:", error);
        return;
      }

      setSettings(
        (data || []).reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, string>)
      );
    };

    loadSettings();
  }, []);

  const brandName = settings.app_name || "PJM Group";
  const aboutVision =
    settings.landing_about_vision ||
    "Tumbuh bersama untuk masa depan yang lebih baik melalui talenta unggul Indonesia.";
  const aboutMission =
    settings.landing_about_mission ||
    "Menyediakan platform rekrutmen yang modern dan efisien.\nMenghubungkan talent terbaik dengan perusahaan yang tepat.\nMendukung pengembangan karir dan profesionalisme.\nInovasi berkelanjutan dalam solusi HR technology.";

  const aboutMilestones = parseJsonValue(
    settings.landing_about_milestones_items || "[]"
  );
  const aboutValues = parseJsonValue(
    settings.landing_about_values_items || "[]"
  );

  const defaultMilestones = [
    { year: "2018", title: "Awal Perjalanan", description: "Berdiri sebagai platform rekrutmen inovatif untuk PJM Group." },
    { year: "2020", title: "Ekspansi Digital", description: "Membangun fondasi assessment digital terintegrasi." },
    { year: "2022", title: "Pertumbuhan", description: "Melayani lebih dari 1.000 kandidat di berbagai posisi strategis." },
    { year: "2024", title: "Hari Ini", description: "Menjadi pilihan utama perusahaan dan talenta di Indonesia." },
  ];

  const defaultValues = [
    { name: "Integritas", description: "Bertindak jujur, transparan, dan bertanggung jawab dalam setiap proses.", icon: "ShieldCheck" },
    { name: "Profesionalisme", description: "Menjaga kualitas kerja dan standar layanan yang konsisten.", icon: "Award" },
    { name: "Inovasi", description: "Beradaptasi dan berkembang dengan teknologi serta metode terbaru.", icon: "Zap" },
    { name: "Kolaborasi", description: "Bekerja bersama lintas tim untuk menghasilkan solusi terbaik.", icon: "Users" },
  ];

  const renderValueIcon = (icon?: string) => {
    if (!icon) return <Sparkles className="h-7 w-7 text-primary" />;
    const trimmed = icon.trim();
    const isUrl = /^https?:\/\//i.test(trimmed) || (trimmed.includes("/") && !trimmed.includes(" "));
    if (isUrl) {
      return (
        <img
          src={trimmed}
          alt="Ikon Nilai"
          className="h-7 w-7 object-contain"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/favicon.ico"; }}
        />
      );
    }
    const emojiRegex = /\p{Extended_Pictographic}/u;
    if (emojiRegex.test(trimmed)) return <span className="text-3xl leading-none">{trimmed}</span>;
    const NamedIcon = (LucideIcons as unknown as Record<string, React.ElementType>)[trimmed];
    if (NamedIcon) return <NamedIcon className="h-7 w-7 text-primary" />;
    return <span className="text-2xl leading-none">{trimmed}</span>;
  };

  const valuesToShow = aboutValues.length > 0 ? aboutValues : defaultValues;
  const milestonesToShow = aboutMilestones.length > 0 ? aboutMilestones : defaultMilestones;

  const missionItems = aboutMission
    .split("\n")
    .map((l) => l.replace(/^[-•]\s*/, "").trim())
    .filter((l) => l.length > 0);

  const quickFacts = [
    { label: "Tahun Berkarya", value: "6+", icon: Calendar },
    { label: "Kandidat Terkurasi", value: "1.200+", icon: Users },
    { label: "Perusahaan Mitra", value: "50+", icon: Building2 },
    { label: "Tingkat Keberhasilan", value: "92%", icon: Award },
  ];

  return (
    <PublicLayout>
      {/* HERO — Newspaper / editorial style */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(circle_at_80%_30%,hsl(var(--primary)/0.10),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
        <div className="relative container py-16 md:py-24">
          {/* Masthead bar */}
          <div className="flex items-center justify-between border-y border-foreground/20 py-3 mb-10">
            <div className="flex items-center gap-3">
              {settings.app_logo_url ? (
                <img src={settings.app_logo_url} alt={brandName} className="h-10 w-10 rounded-md object-contain bg-card p-1 border border-border" />
              ) : (
                <div className="h-10 w-10 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">The {brandName} Gazette</p>
                <p className="text-xs font-semibold">Edisi Profil Perusahaan</p>
              </div>
            </div>
            <p className="hidden sm:block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              Vol. 01 · Tentang Kami
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid gap-10 md:grid-cols-12 md:gap-12 items-start"
          >
            <div className="md:col-span-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Globe2 className="h-3.5 w-3.5" /> Tentang Kami
              </span>
              <h1 className="mt-5 font-serif text-4xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
                Menghubungkan talenta terbaik dengan masa depan <span className="text-primary">{brandName}</span>.
              </h1>
              <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground first-letter:float-left first-letter:mr-2 first-letter:text-5xl first-letter:font-bold first-letter:text-primary first-letter:leading-none">
                Kami adalah jembatan antara perusahaan dan talenta — memadukan teknologi rekrutmen modern,
                asesmen psikologi yang teruji, dan proses yang transparan, untuk menghadirkan pengalaman
                karir yang bermakna dan berdampak.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-xl">
                  <Link to="/jobs">Lihat Lowongan <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-xl">
                  <Link to="/login">Masuk Akun</Link>
                </Button>
              </div>
            </div>

            {/* Pull-quote sidebar */}
            <aside className="md:col-span-4 md:border-l md:border-border md:pl-8">
              <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-semibold">Kredo</p>
              <blockquote className="mt-3 font-serif text-xl md:text-2xl leading-snug">
                “Setiap karir hebat dimulai dari proses rekrutmen yang adil, manusiawi, dan berbasis data.”
              </blockquote>
              <p className="mt-4 text-xs text-muted-foreground">— Tim {brandName}</p>
            </aside>
          </motion.div>
        </div>
      </section>

      {/* VISION & MISSION */}
      <section className="container py-20 md:py-24">
        <div className="mb-10 flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Arah Kami</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">Visi &amp; Misi</h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Tujuan jangka panjang dan komitmen harian yang menuntun setiap keputusan kami.
          </p>
        </div>

        {/* Desktop side-by-side */}
        <div className="hidden md:grid md:grid-cols-5 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="md:col-span-2 relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-8 md:p-10"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Target className="h-6 w-6" />
              </div>
              <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-primary/80 font-semibold">Visi</p>
              <h3 className="mt-1 text-2xl font-bold leading-snug">Menjadi mitra karir terpercaya bagi talenta Indonesia.</h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{aboutVision}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-3 relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card to-background p-8 md:p-10"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
            <div className="flex items-center gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-primary/80 font-semibold">Misi</p>
                <h3 className="text-2xl font-bold">Langkah Nyata Kami</h3>
              </div>
            </div>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2">
              {missionItems.map((m, idx) => (
                <li
                  key={idx}
                  className="group relative flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 transition hover:border-primary/40 hover:shadow-md"
                >
                  <span className="mt-0.5 inline-flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-bold shadow-sm">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground/90">{m}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        </div>

        {/* Mobile carousel */}
        <div className="md:hidden">
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent>
              <CarouselItem>
                <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-7">
                  <Target className="h-7 w-7 text-primary" />
                  <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-primary/80 font-semibold">Visi</p>
                  <h3 className="text-xl font-bold">Mitra karir tepercaya.</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{aboutVision}</p>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="rounded-2xl border border-border bg-card p-7">
                  <Zap className="h-7 w-7 text-primary" />
                  <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-primary/80 font-semibold">Misi</p>
                  <h3 className="text-xl font-bold">Langkah nyata kami.</h3>
                  <ol className="mt-3 space-y-2">
                    {missionItems.map((m, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-primary/15 text-[10px] font-bold text-primary">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>
      </section>

      {/* MILESTONES */}
      <section className="relative border-y border-border/60 bg-muted/30">
        <div className="container py-20 md:py-24">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Perjalanan</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">Tonggak Penting Kami</h2>
            <p className="mt-3 max-w-xl mx-auto text-sm md:text-base text-muted-foreground">
              Dari langkah pertama hingga hari ini — setiap babak membangun fondasi yang kami percaya.
            </p>
          </div>

          {/* Desktop horizontal scrollable timeline */}
          <div className="hidden lg:block relative">
            <div className="overflow-x-auto pb-4 -mx-4 px-4 [scrollbar-width:thin]">
              <div className="relative min-w-max">
                <div className="absolute left-0 right-0 top-12 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                <div className="flex gap-8">
                  {milestonesToShow.map((m: any, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="relative flex flex-col items-center px-2 w-[260px] flex-none"
                    >
                      <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-background ring-1 ring-border">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-xl shadow-primary/20">
                          <span className="text-lg font-bold tracking-tight">{m.year}</span>
                        </div>
                      </div>
                      <div className="mt-6 w-full rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
                        <h3 className="text-base font-semibold">{m.title || m.year}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">Geser ke kanan untuk melihat lebih banyak →</p>
          </div>

          {/* Tablet / mobile vertical timeline */}
          <div className="lg:hidden relative pl-10">
            <div className="absolute left-4 top-1 bottom-1 w-0.5 bg-gradient-to-b from-primary via-primary/40 to-transparent" />
            <div className="space-y-6">
              {milestonesToShow.map((m: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="relative"
                >
                  <div className="absolute -left-[26px] top-2 h-5 w-5 rounded-full bg-primary ring-4 ring-background shadow-md shadow-primary/30" />
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">{m.year}</span>
                    <h3 className="mt-2 text-base font-semibold">{m.title || m.year}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="container py-20 md:py-24">
        <div className="mb-10 flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Prinsip</p>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold">Nilai yang Kami Pegang</h2>
            <p className="mt-2 text-sm text-muted-foreground">Geser untuk melihat seluruh nilai kami.</p>
          </div>
        </div>

        <Carousel opts={{ align: "start", loop: valuesToShow.length > 3 }} className="w-full">
          <CarouselContent className="-ml-4">
            {valuesToShow.map((value: any, i: number) => (
              <CarouselItem key={i} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative h-full overflow-hidden rounded-3xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl opacity-0 group-hover:opacity-100 transition" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    {renderValueIcon(value.icon)}
                  </div>
                  <h3 className="relative mt-5 text-lg font-semibold">{value.name || `Nilai ${i + 1}`}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                  <span className="relative mt-5 inline-flex items-center text-xs font-semibold uppercase tracking-wider text-primary/80">
                    0{i + 1}
                  </span>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4" />
          <CarouselNext className="hidden md:flex -right-4" />
        </Carousel>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card p-8 md:p-14">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h3 className="text-2xl md:text-3xl font-bold">Siap bergabung dengan kami?</h3>
              <p className="mt-2 text-muted-foreground">
                Telusuri lowongan terbaru atau daftarkan diri Anda untuk peluang karir bersama
                {" "}{brandName}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl">
                <Link to="/jobs">Telusuri Lowongan <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link to="/login">Masuk / Daftar</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default About;
