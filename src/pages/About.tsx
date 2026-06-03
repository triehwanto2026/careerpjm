import PublicLayout from "@/components/layout/PublicLayout";
import * as LucideIcons from "lucide-react";
import { Target, Zap, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";

const About = () => {
  const { t } = useT();
  const [settings, setSettings] = useState<Record<string, string>>({});

  const parseJsonValue = (value: string) => {
    try { const p = JSON.parse(value); return Array.isArray(p) ? p : []; } catch { return []; }
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["landing_about_vision", "landing_about_mission", "landing_about_milestones_items", "landing_about_values_items"]);
      setSettings((data || []).reduce((acc, item) => { acc[item.key] = item.value; return acc; }, {} as Record<string, string>));
    };
    load();
  }, []);

  const aboutVision = settings.landing_about_vision || "Tumbuh Bersama untuk Masa Depan Yang Lebih Baik.";
  const aboutMission = settings.landing_about_mission || "Menjadi perusahaan pengembang yang terbaik dan terdepan.";
  const aboutMilestones = parseJsonValue(settings.landing_about_milestones_items || "[]");
  const aboutValues = parseJsonValue(settings.landing_about_values_items || "[]");

  const defaultMilestones = [
    { year: "2018", description: "Berdiri sebagai platform rekrutmen inovatif." },
    { year: "2022", description: "Melayani lebih dari 1.000 kandidat." },
    { year: "2024", description: "Menjadi pilihan utama perusahaan dan talenta di Indonesia." },
  ];

  const defaultValues = [
    { name: "Integritas", description: "Bertindak jujur dan bertanggung jawab", icon: "🤝" },
    { name: "Profesionalisme", description: "Menjaga kualitas kerja dan layanan profesional", icon: "💼" },
    { name: "Inovasi", description: "Beradaptasi dan berkembang dengan teknologi terbaru", icon: "⚡" },
  ];

  const renderValueIcon = (icon?: string) => {
    if (!icon) return <Sparkles className="h-7 w-7 text-[#5cbdb9]" />;
    const trimmed = icon.trim();
    const isUrl = /^https?:\/\//i.test(trimmed);
    if (isUrl) return <img src={trimmed} alt="" className="h-7 w-7 object-contain" />;
    const emojiRegex = /\p{Extended_Pictographic}/u;
    if (emojiRegex.test(trimmed)) return <span className="text-2xl">{trimmed}</span>;
    const NamedIcon = (LucideIcons as unknown as Record<string, React.ElementType>)[trimmed];
    if (NamedIcon) return <NamedIcon className="h-7 w-7 text-[#5cbdb9]" />;
    return <span className="text-2xl">{trimmed}</span>;
  };

  const milestones = aboutMilestones.length > 0 ? aboutMilestones : defaultMilestones;
  const values = aboutValues.length > 0 ? aboutValues : defaultValues;

  return (
    <PublicLayout>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 right-0 w-[600px] h-[500px] bg-[#2d8a9e]/15 blur-[140px] rounded-full" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-[500px] h-[400px] bg-[#1a4a6e]/40 blur-[120px] rounded-full" />

        <div className="container relative py-20 md:py-24">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a4a6e]/40 border border-[#2d8a9e]/30 mb-5">
              <span className="text-xs font-semibold tracking-widest text-[#5cbdb9] uppercase">{t("about.eyebrow")}</span>
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-white tracking-tight mb-4">
              {t("about.title").split(" ")[0]}{" "}
              <span className="bg-gradient-to-r from-[#5cbdb9] to-[#2d8a9e] bg-clip-text text-transparent">
                {t("about.title").split(" ").slice(1).join(" ") || ""}
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">{t("about.subtitle")}</p>
          </motion.div>

          {/* Vision & Mission */}
          <div className="grid md:grid-cols-2 gap-6 mb-24">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="group relative p-8 md:p-10 rounded-3xl bg-gradient-to-br from-[#1a4a6e]/40 to-transparent border border-white/10 overflow-hidden transition-all hover:border-[#5cbdb9]/40">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#2d8a9e]/10 rounded-full blur-3xl group-hover:bg-[#5cbdb9]/15 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#2d8a9e] to-[#0c2340] border border-[#5cbdb9]/30 mb-6 shadow-lg">
                  <Target className="w-7 h-7 text-[#5cbdb9]" />
                </div>
                <h2 className="font-display text-3xl font-bold text-white mb-4 tracking-tight">{t("about.vision")}</h2>
                <p className="text-slate-300 text-base md:text-lg leading-relaxed">{aboutVision}</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="group relative p-8 md:p-10 rounded-3xl bg-gradient-to-br from-[#1a4a6e]/40 to-transparent border border-white/10 overflow-hidden transition-all hover:border-[#5cbdb9]/40">
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#5cbdb9]/5 rounded-full blur-3xl group-hover:bg-[#2d8a9e]/15 transition-colors" />
              <div className="relative">
                <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#2d8a9e] to-[#0c2340] border border-[#5cbdb9]/30 mb-6 shadow-lg">
                  <Zap className="w-7 h-7 text-[#5cbdb9]" />
                </div>
                <h2 className="font-display text-3xl font-bold text-white mb-4 tracking-tight">{t("about.mission")}</h2>
                <div className="space-y-2 text-slate-300 leading-relaxed">
                  {aboutMission.split("\n").map((line, i) => <p key={i}>{line}</p>)}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Journey / Timeline */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-24">
            <div className="text-center mb-12">
              <div className="inline-block h-px w-12 bg-gradient-to-r from-transparent via-[#5cbdb9] to-transparent mb-4" />
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">{t("about.journey")}</h2>
            </div>

            {/* Desktop horizontal timeline */}
            <div className="hidden md:block relative">
              <div className="absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2d8a9e]/40 to-transparent" />
              <div className="grid" style={{ gridTemplateColumns: `repeat(${milestones.length}, minmax(0, 1fr))` }}>
                {milestones.map((m: any, i: number) => (
                  <div key={i} className="flex flex-col items-center px-3">
                    <div className="relative z-10 h-16 w-16 rounded-full bg-gradient-to-br from-[#2d8a9e] to-[#0c2340] border-2 border-[#5cbdb9]/40 flex items-center justify-center shadow-xl shadow-[#5cbdb9]/10 mb-5">
                      <span className="font-display font-bold text-[#5cbdb9] text-sm">{m.year}</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1a4a6e]/40 to-transparent border border-white/10 w-full text-center">
                      {m.title && <h3 className="font-display font-semibold text-white mb-1">{m.title}</h3>}
                      <p className="text-sm text-slate-400 leading-relaxed">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile vertical timeline */}
            <div className="md:hidden space-y-5">
              {milestones.map((m: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="shrink-0 h-14 w-14 rounded-full bg-gradient-to-br from-[#2d8a9e] to-[#0c2340] border-2 border-[#5cbdb9]/40 flex items-center justify-center shadow-lg">
                    <span className="font-display font-bold text-[#5cbdb9] text-xs">{m.year}</span>
                  </div>
                  <div className="flex-1 p-5 rounded-2xl bg-gradient-to-br from-[#1a4a6e]/40 to-transparent border border-white/10">
                    {m.title && <h3 className="font-display font-semibold text-white mb-1">{m.title}</h3>}
                    <p className="text-sm text-slate-400 leading-relaxed">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Values */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-center mb-12">
              <div className="inline-block h-px w-12 bg-gradient-to-r from-transparent via-[#5cbdb9] to-transparent mb-4" />
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight">{t("about.values")}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {values.map((v: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group p-7 rounded-2xl bg-gradient-to-br from-[#1a4a6e]/30 to-transparent border border-white/10 text-center transition-all hover:-translate-y-1 hover:border-[#5cbdb9]/40"
                >
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#2d8a9e] to-[#0c2340] border border-[#5cbdb9]/30 flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform">
                    {renderValueIcon(v.icon)}
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mb-2">{v.name || `Value ${i + 1}`}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{v.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default About;
