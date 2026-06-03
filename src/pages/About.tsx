import PublicLayout from "@/components/layout/PublicLayout";
import * as LucideIcons from "lucide-react";
import { Building2, Target, Trophy, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  const aboutVision = settings.landing_about_vision || "Visi kami adalah Tumbuh Bersama untuk Masa Depan Yang Lebih Baik";
  const aboutMission = settings.landing_about_mission || "Visi kami adalah Tumbuh Bersama untuk Masa Depan Yang Lebih Baik";
  const aboutMilestones = parseJsonValue(settings.landing_about_milestones_items || "[]");
  const aboutValues = parseJsonValue(settings.landing_about_values_items || "[]");
  const defaultMilestones = [
    { year: "2018", description: "Berdiri sebagai platform rekrutmen inovatif." },
    { year: "2022", description: "Melayani lebih dari 1.000 kandidat." },
    { year: "2024", description: "Menjadi pilihan utama perusahaan dan talenta di Indonesia." },
  ];

  const renderValueIcon = (icon?: string) => {
    if (!icon) {
      return <span>⭐</span>;
    }

    const trimmed = icon.trim();
    const isUrl = /^https?:\/\//i.test(trimmed) || trimmed.includes("/") && !trimmed.includes(" ");
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
    if (emojiRegex.test(trimmed)) {
      return <span>{trimmed}</span>;
    }

    const NamedIcon = (LucideIcons as unknown as Record<string, React.ElementType>)[trimmed];
    if (NamedIcon) {
      return <NamedIcon className="h-8 w-8 text-primary" />;
    }

    return <span>{trimmed}</span>;
  };
  const defaultValues = [
    { name: "Integritas", description: "Bertindak Jujur dan bertanggung jawab", icon: "🤝" },
    { name: "Profesionalisme", description: "Menjaga kualitas kerja dan layanan profesional", icon: "💼" },
    { name: "Inovasi", description: "Beradaptasi dan berkembang dengan teknologi terbaru", icon: "⚡" },
  ];

  return (
    <PublicLayout>
      <div className="container py-16 md:py-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Tentang Kami</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Informasi visi, misi, milestone, dan nilai nilai PJM Recruitment.
          </p>
        </motion.div>

        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card-elevated p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Visi</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {aboutVision}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="card-elevated p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Misi</h2>
            </div>
            {settings.landing_about_mission ? (
              <div className="space-y-2 text-muted-foreground">
                {aboutMission.split("\n").map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            ) : (
              <ul className="text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Menyediakan platform rekrutmen yang modern dan efisien</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Menghubungkan talent terbaik dengan perusahaan yang tepat</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Mendukung pengembangan karir dan profesionalisme</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Inovasi berkelanjutan dalam solusi HR technology</span>
                </li>
              </ul>
            )}
          </motion.div>
        </div>

        {/* Milestones */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Perjalanan Kami</h2>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-border"></div>
            <div className="space-y-12">
              {(aboutMilestones.length > 0 ? aboutMilestones : defaultMilestones).map((milestone, i) => (
                <div key={i} className={`relative flex items-center ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`flex-1 ${i % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                    <div className="card-elevated p-6 inline-block">
                      <span className="text-2xl font-bold text-primary">{milestone.year}</span>
                      <h3 className="text-lg font-semibold mt-2">{milestone.title || milestone.year}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 h-12 w-12 rounded-full bg-primary flex items-center justify-center z-10">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Values */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <h2 className="text-3xl font-bold text-center mb-12">Nilai Kami</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {(aboutValues.length > 0 ? aboutValues : defaultValues).map((value, i) => (
              <div key={i} className="card-elevated p-6 text-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-2xl">
                  {renderValueIcon(value.icon)}
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.name || `Nilai ${i + 1}`}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
};

export default About;
