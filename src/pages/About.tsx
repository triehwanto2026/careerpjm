import PublicLayout from "@/components/layout/PublicLayout";
import * as LucideIcons from "lucide-react";
import { Building2, Target, Zap, Sparkles, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    { year: "2018", title: "Awal Perjalanan", description: "Berdiri sebagai platform rekrutmen inovatif." },
    { year: "2022", title: "Pertumbuhan", description: "Melayani lebih dari 1.000 kandidat." },
    { year: "2024", title: "Hari Ini", description: "Menjadi pilihan utama perusahaan dan talenta di Indonesia." },
  ];

  const defaultValues = [
    { name: "Integritas", description: "Bertindak jujur dan bertanggung jawab.", icon: "🤝" },
    { name: "Profesionalisme", description: "Menjaga kualitas kerja dan layanan profesional.", icon: "💼" },
    { name: "Inovasi", description: "Beradaptasi dan berkembang dengan teknologi terbaru.", icon: "⚡" },
  ];

  const renderValueIcon = (icon?: string) => {
    if (!icon) return <Sparkles className="h-8 w-8 text-primary" />;
    const trimmed = icon.trim();
    const isUrl = /^https?:\/\//i.test(trimmed) || (trimmed.includes("/") && !trimmed.includes(" "));
    if (isUrl) {
      return (
        <img
          src={trimmed}
          alt="Ikon Nilai"
          className="h-8 w-8 object-contain"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/favicon.ico"; }}
        />
      );
    }
    const emojiRegex = /\p{Extended_Pictographic}/u;
    if (emojiRegex.test(trimmed)) return <span className="text-3xl">{trimmed}</span>;
    const NamedIcon = (LucideIcons as unknown as Record<string, React.ElementType>)[trimmed];
    if (NamedIcon) return <NamedIcon className="h-8 w-8 text-primary" />;
    return <span className="text-3xl">{trimmed}</span>;
  };

  const visionMissionSlides = [
    {
      key: "visi",
      icon: Target,
      title: "Visi",
      body: aboutVision,
      isList: false,
    },
    {
      key: "misi",
      icon: Zap,
      title: "Misi",
      body: aboutMission,
      isList: true,
    },
  ];

  const valuesToShow = aboutValues.length > 0 ? aboutValues : defaultValues;
  const milestonesToShow = aboutMilestones.length > 0 ? aboutMilestones : defaultMilestones;

  return (
    <PublicLayout>
      <div className="container py-16 md:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="inline-block rounded-full bg-primary/10 text-primary px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-4">
            Tentang Kami
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Mengenal <span className="text-primary">PJM Group</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Visi, misi, perjalanan, dan nilai-nilai yang membentuk PJM Recruitment.
          </p>
        </motion.div>

        {/* Vision & Mission Carousel */}
        <section className="mb-24">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">Visi & Misi</h2>
              <p className="text-muted-foreground text-sm mt-1">Geser untuk melihat visi dan misi kami.</p>
            </div>
          </div>
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
            <CarouselContent>
              {visionMissionSlides.map((slide) => {
                const Icon = slide.icon;
                return (
                  <CarouselItem key={slide.key} className="md:basis-full">
                    <div className="card-elevated p-8 md:p-12 min-h-[260px] bg-gradient-to-br from-card to-primary/[0.04] border border-border rounded-2xl">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Icon className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold">{slide.title}</h3>
                      </div>
                      {slide.isList ? (
                        <ul className="space-y-3 text-muted-foreground text-base leading-relaxed">
                          {slide.body
                            .split("\n")
                            .filter((l) => l.trim().length > 0)
                            .map((line, idx) => (
                              <li key={idx} className="flex items-start gap-3">
                                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                <span>{line.replace(/^[-•]\s*/, "")}</span>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                          {slide.body}
                        </p>
                      )}
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </section>

        {/* Milestones */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Perjalanan Kami</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Tonggak penting dalam perjalanan PJM Recruitment.
            </p>
          </div>

          {/* Desktop timeline */}
          <div className="hidden md:block relative">
            <div className="absolute left-1/2 -translate-x-1/2 h-full w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
            <div className="space-y-12">
              {milestonesToShow.map((m: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
                >
                  <div className={`flex-1 ${i % 2 === 0 ? "text-right pr-10" : "text-left pl-10"}`}>
                    <div className="card-elevated inline-block p-6 rounded-2xl border border-border bg-card">
                      <span className="text-2xl font-bold text-primary">{m.year}</span>
                      <h3 className="text-lg font-semibold mt-1">{m.title || m.year}</h3>
                      <p className="text-sm text-muted-foreground mt-2 max-w-xs">{m.description}</p>
                    </div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 h-12 w-12 rounded-full bg-primary flex items-center justify-center z-10 ring-4 ring-background shadow-lg">
                    <Calendar className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile stacked timeline */}
          <div className="md:hidden relative pl-8">
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-primary/30" />
            <div className="space-y-6">
              {milestonesToShow.map((m: any, i: number) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[26px] top-2 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
                  <div className="card-elevated p-5 rounded-2xl border border-border bg-card">
                    <span className="text-xl font-bold text-primary">{m.year}</span>
                    <h3 className="font-semibold mt-1">{m.title || m.year}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Carousel */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">Nilai Kami</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Geser untuk melihat seluruh nilai yang kami pegang.
              </p>
            </div>
          </div>
          <Carousel opts={{ align: "start", loop: valuesToShow.length > 1 }} className="w-full">
            <CarouselContent className="-ml-4">
              {valuesToShow.map((value: any, i: number) => (
                <CarouselItem key={i} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                  <div className="card-elevated h-full p-6 rounded-2xl border border-border bg-card hover:border-primary/40 transition">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      {renderValueIcon(value.icon)}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {value.name || `Nilai ${i + 1}`}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </section>
      </div>
    </PublicLayout>
  );
};

export default About;
