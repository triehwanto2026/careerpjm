import PublicLayout from "@/components/layout/PublicLayout";
import { Search, MapPin, Building2, ArrowRight, Briefcase, Banknote } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveJobs } from "@/hooks/useJobs";
import { useT } from "@/lib/i18n";

const departments = ["Semua", "Engineering", "Design", "Marketing", "Data", "Human Resources", "Product", "Finance", "Sales", "Operations"];
const locations = ["Semua", "Jakarta", "Bandung", "Surabaya", "Remote"];
const types = ["Semua", "Full-time", "Part-time", "Contract", "Internship"];

const Jobs = () => {
  const { t } = useT();
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("Semua");
  const [loc, setLoc] = useState("Semua");
  const [jobType, setJobType] = useState("Semua");
  const { data: jobs = [], isLoading } = useActiveJobs();

  const filtered = jobs.filter((j: any) => {
    const title = j.title || j.position || "";
    const department = j.department || j.category || "";
    const location = j.location || "";
    const type = j.employment_type || j.type || "";
    const matchSearch = title.toLowerCase().includes(search.toLowerCase()) || department.toLowerCase().includes(search.toLowerCase());
    const matchDept = dept === "Semua" || department === dept;
    const matchLoc = loc === "Semua" || location === loc;
    const matchType = jobType === "Semua" || type === jobType;
    return matchSearch && matchDept && matchLoc && matchType;
  });

  const localizedAll = (label: string) => label === "Semua" ? t("jobs.filter.all") : label;

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#2d8a9e]/15 blur-[120px] rounded-full" />
        <div className="container relative py-16 md:py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a4a6e]/40 border border-[#2d8a9e]/30 mb-5">
              <Briefcase className="w-3.5 h-3.5 text-[#5cbdb9]" />
              <span className="text-xs font-semibold tracking-widest text-[#5cbdb9] uppercase">Career Portal</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">{t("jobs.title")}</h1>
            <p className="text-slate-400 text-lg">{t("jobs.subtitle", { count: jobs.length })}</p>
          </motion.div>

          <div className="max-w-3xl mx-auto mt-8">
            <div className="flex gap-2 p-2 rounded-2xl bg-[#1a4a6e]/30 border border-white/10 backdrop-blur-md shadow-2xl">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className="h-5 w-5 text-[#5cbdb9] shrink-0" />
                <input
                  type="text"
                  placeholder={t("jobs.search.placeholder")}
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 outline-none py-3"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="bg-[#5cbdb9] hover:bg-[#2d8a9e] text-[#0c2340] font-display font-bold px-6 py-3 rounded-xl transition-all">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="container pb-20">
        <div className="flex flex-wrap gap-3 mb-8 items-center">
          <Select value={dept} onValueChange={setDept}>
            <SelectTrigger className="w-full sm:w-52 bg-[#1a4a6e]/30 border-white/10 text-white">
              <Building2 className="h-4 w-4 mr-2 text-[#5cbdb9]" /><SelectValue />
            </SelectTrigger>
            <SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{localizedAll(d)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={loc} onValueChange={setLoc}>
            <SelectTrigger className="w-full sm:w-44 bg-[#1a4a6e]/30 border-white/10 text-white">
              <MapPin className="h-4 w-4 mr-2 text-[#5cbdb9]" /><SelectValue />
            </SelectTrigger>
            <SelectContent>{locations.map((l) => <SelectItem key={l} value={l}>{localizedAll(l)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={jobType} onValueChange={setJobType}>
            <SelectTrigger className="w-full sm:w-40 bg-[#1a4a6e]/30 border-white/10 text-white">
              <Briefcase className="h-4 w-4 mr-2 text-[#5cbdb9]" /><SelectValue />
            </SelectTrigger>
            <SelectContent>{types.map((tp) => <SelectItem key={tp} value={tp}>{localizedAll(tp)}</SelectItem>)}</SelectContent>
          </Select>
          <div className="text-sm text-slate-400 sm:ml-auto">{t("jobs.count", { count: filtered.length })}</div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 animate-pulse bg-[#1a4a6e]/20 rounded-2xl border border-white/5" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((job: any, i: number) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link
                  to={`/jobs/${job.id}`}
                  className="group block h-full rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a4a6e]/30 to-transparent p-6 transition-all hover:-translate-y-1 hover:border-[#5cbdb9]/40 hover:shadow-2xl hover:shadow-[#5cbdb9]/10"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#2d8a9e] to-[#1a4a6e] flex items-center justify-center border border-[#5cbdb9]/30">
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#5cbdb9]/10 text-[#5cbdb9] border border-[#5cbdb9]/20 text-xs font-medium">
                      {job.employment_type || job.type || "Full-time"}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-base text-white mb-1 group-hover:text-[#5cbdb9] transition-colors">{job.title || job.position}</h3>
                  <p className="text-xs text-slate-400 mb-3">{job.department || job.category}</p>
                  <p className="text-xs text-slate-400/80 mb-4 line-clamp-2 leading-relaxed">{job.description || ""}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-slate-400">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-[#5cbdb9]" />{job.location || "-"}</span>
                      <span className="flex items-center gap-1"><Banknote className="h-3 w-3 text-[#5cbdb9]" />{job.salary_range || job.salary || t("jobs.card.salary")}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#5cbdb9] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a4a6e]/40 border border-white/10 mb-4">
              <Briefcase className="h-7 w-7 text-[#5cbdb9]" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white mb-1">{t("jobs.empty.title")}</h3>
            <p className="text-slate-400 text-sm">{t("jobs.empty.subtitle")}</p>
          </div>
        )}
      </section>
    </PublicLayout>
  );
};

export default Jobs;
