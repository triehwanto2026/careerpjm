import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Building2, Clock, ArrowRight, Filter, Briefcase, Banknote } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActiveJobs } from "@/hooks/useJobs";

const departments = ["Semua", "Engineering", "Design", "Marketing", "Data", "Human Resources", "Product", "Finance", "Sales", "Operations"];
const locations = ["Semua", "Jakarta", "Bandung", "Surabaya", "Remote"];
const types = ["Semua", "Full-time", "Part-time", "Contract", "Internship"];

const Jobs = () => {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("Semua");
  const [loc, setLoc] = useState("Semua");
  const [jobType, setJobType] = useState("Semua");
  const { data: jobs = [], isLoading } = useActiveJobs();

  const filtered = jobs.filter((j) => {
    const title = (j as any).title || (j as any).position || "";
    const department = (j as any).department || (j as any).category || "";
    const location = (j as any).location || "";
    const type = (j as any).employment_type || (j as any).type || "";
    const matchSearch = title.toLowerCase().includes(search.toLowerCase()) || department.toLowerCase().includes(search.toLowerCase());
    const matchDept = dept === "Semua" || department === dept;
    const matchLoc = loc === "Semua" || location === loc;
    const matchType = jobType === "Semua" || type === jobType;
    return matchSearch && matchDept && matchLoc && matchType;
  });

  return (
    <PublicLayout>
      <section className="bg-gradient-to-br from-primary/5 to-primary/10 py-16">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Semua Lowongan</h1>
            <p className="text-muted-foreground">Jelajahi {jobs.length} lowongan pekerjaan yang tersedia</p>
          </motion.div>
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 p-2 rounded-xl bg-background border border-border shadow-sm">
              <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input type="text" placeholder="Cari posisi, skill, atau kata kunci..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button size="lg"><Search className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="flex flex-wrap gap-3 mb-8">
          <Select value={dept} onValueChange={setDept}><SelectTrigger className="w-full sm:w-48"><Building2 className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
          <Select value={loc} onValueChange={setLoc}><SelectTrigger className="w-full sm:w-44"><MapPin className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent>{locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select>
          <Select value={jobType} onValueChange={setJobType}><SelectTrigger className="w-full sm:w-40"><Briefcase className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent>{types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          <div className="text-sm text-muted-foreground flex items-center ml-auto">{filtered.length} lowongan ditemukan</div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="card-elevated p-6 h-48 animate-pulse bg-muted/30" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link to={`/jobs/${job.id}`} className="block card-elevated p-6 h-full group hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 className="h-6 w-6 text-primary" /></div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{(job as any).employment_type || (job as any).type || "Full-time"}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{(job as any).title || (job as any).position}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{(job as any).department || (job as any).category}</p>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{(job as any).description || ""}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{(job as any).location || "-"}</span>
                      <span className="flex items-center gap-1"><Banknote className="h-3 w-3" />{(job as any).salary_range || (job as any).salary || "Negotiable"}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">Tidak ada lowongan ditemukan</h3>
            <p className="text-muted-foreground">Coba ubah filter pencarian Anda</p>
          </div>
        )}
      </section>
    </PublicLayout>
  );
};

export default Jobs;
