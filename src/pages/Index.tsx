import { Link } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import { Search, MapPin, Building2, Clock, ArrowRight, Users, Briefcase, Shield, ChevronRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useActiveJobs } from "@/hooks/useJobs";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";

const Index = () => {
  const { t, lang } = useT();
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [landingSettings, setLandingSettings] = useState<Record<string, string>>({});
  const { data: jobs = [], isLoading } = useActiveJobs();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["app_name", "landing_header_title", "landing_header_subtitle", "landing_hero_background_url"]);
      setLandingSettings((data || []).reduce((acc, i) => { acc[i.key] = i.value; return acc; }, {} as Record<string, string>));
    };
    load();
  }, []);

  const fallbackJobs = [
    { id: "1", title: "Senior Frontend Developer", department: "Engineering", location: "Jakarta", employment_type: "Full-time", closes_at: "2024-12-31", description: "Build the next generation of our recruitment platform." },
    { id: "2", title: "UI/UX Designer", department: "Design", location: "Bandung", employment_type: "Full-time", closes_at: "2024-12-31", description: "Craft beautiful, accessible interfaces." },
    { id: "3", title: "Marketing Specialist", department: "Marketing", location: "Jakarta", employment_type: "Full-time", closes_at: "2024-12-31", description: "Drive brand awareness and acquisition." },
  ];

  const jobsToDisplay = jobs.length > 0 ? jobs : fallbackJobs;
  const filteredJobs = jobsToDisplay.filter((job: any) => {
    const matchSearch = job.title.toLowerCase().includes(search.toLowerCase()) || (job.department || "").toLowerCase().includes(search.toLowerCase());
    const matchLocation = !locationFilter || (job.location || "").toLowerCase().includes(locationFilter.toLowerCase());
    return matchSearch && matchLocation;
  }).slice(0, 6);

  const stats = [
    { label: t("home.stats.jobs"), value: "24+", icon: Briefcase },
    { label: t("home.stats.candidates"), value: "1,200+", icon: Users },
    { label: t("home.stats.success"), value: "92%", icon: TrendingUp },
    { label: t("home.stats.partners"), value: "50+", icon: Shield },
  ];

  const dateFmt = lang === "id" ? "id-ID" : "en-US";

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-32 right-0 w-[600px] h-[600px] bg-[#2d8a9e]/15 blur-[140px] rounded-full" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 w-[500px] h-[500px] bg-[#1a4a6e]/40 blur-[120px] rounded-full" />

        <div className="container relative py-20 md:py-28">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a4a6e]/40 border border-[#2d8a9e]/30 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#5cbdb9] animate-pulse" />
              <span className="text-xs font-semibold tracking-widest text-[#5cbdb9] uppercase">{t("home.badge")}</span>
            </div>

            <h1 className="font-display font-bold text-white leading-[1.05] tracking-tight text-5xl md:text-6xl lg:text-7xl mb-6">
              {t("home.title.line1")}<br />
              <span className="bg-gradient-to-r from-[#5cbdb9] to-[#2d8a9e] bg-clip-text text-transparent">
                {t("home.title.line2")}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed mb-8">
              {t("home.subtitle")}
            </p>

            {/* Search bar */}
            <div className="p-2 bg-[#1a4a6e]/30 border border-white/10 rounded-2xl backdrop-blur-md shadow-2xl shadow-black/30 flex flex-col md:flex-row gap-2 max-w-3xl">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5cbdb9]" />
                <input
                  type="text"
                  placeholder={t("home.search.position")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent pl-12 pr-4 py-4 text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
              <div className="hidden md:block w-px self-center h-8 bg-white/10" />
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5cbdb9]" />
                <input
                  type="text"
                  placeholder={t("home.search.location")}
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full bg-transparent pl-12 pr-4 py-4 text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
              <Link
                to="/jobs"
                className="bg-[#5cbdb9] hover:bg-[#2d8a9e] text-[#0c2340] font-display font-bold px-8 py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-[#5cbdb9]/20 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                {t("home.search.cta")}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="container relative -mt-2 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
              className="group relative p-6 bg-gradient-to-br from-[#1a4a6e]/40 to-transparent border border-white/10 rounded-2xl transition-all duration-500 hover:border-[#2d8a9e]/60 hover:bg-[#1a4a6e]/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <p className="font-display text-3xl md:text-4xl font-bold text-white">
                    {stat.value.replace(/[+%]/, '')}<span className="text-[#5cbdb9]">{stat.value.match(/[+%]/)?.[0]}</span>
                  </p>
                  <p className="text-xs md:text-sm text-slate-400 font-medium">{stat.label}</p>
                </div>
                <div className="p-2.5 bg-[#0c2340] rounded-xl border border-white/10 text-[#5cbdb9] group-hover:scale-110 transition-transform">
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="container py-12 md:py-20">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white">{t("home.latest.title")}</h2>
            <p className="mt-2 text-slate-400">{t("home.latest.subtitle")}</p>
          </div>
          <Link to="/jobs" className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl border border-white/10 text-slate-200 hover:text-white hover:bg-white/5 transition-colors w-fit text-sm font-medium">
            {t("home.latest.viewAll")} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-56 animate-pulse bg-[#1a4a6e]/20 rounded-2xl border border-white/5" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job: any, i: number) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 * i, duration: 0.4 }}
              >
                <Link
                  to={`/jobs/${job.id}`}
                  className="group block h-full rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a4a6e]/30 to-transparent p-6 transition-all hover:-translate-y-1 hover:border-[#5cbdb9]/40 hover:shadow-2xl hover:shadow-[#5cbdb9]/10"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#2d8a9e] to-[#1a4a6e] border border-[#5cbdb9]/30">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#5cbdb9]/10 text-[#5cbdb9] border border-[#5cbdb9]/20 text-xs font-medium">
                      {job.employment_type}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-semibold leading-snug text-white group-hover:text-[#5cbdb9] transition-colors mb-1.5">
                    {job.title}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">{job.department}</p>
                  <p className="text-sm text-slate-400/80 line-clamp-2 leading-6 mb-6">{job.description}</p>
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-[#5cbdb9]" /> {job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-[#5cbdb9]" /> {job.closes_at ? new Date(job.closes_at).toLocaleDateString(dateFmt, { day: "numeric", month: "short", year: "numeric" }) : "Open"}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#5cbdb9] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
};

export default Index;
