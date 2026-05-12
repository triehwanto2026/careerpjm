import { Link } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, MapPin, Building2, Clock, ArrowRight, Users, Briefcase,
  Shield, ChevronRight, TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import heroBg from "@/assets/hero-bg.jpg";
import { useActiveJobs } from "@/hooks/useJobs";

const stats = [
  { label: "Lowongan Aktif", value: "24+", icon: Briefcase },
  { label: "Kandidat Bergabung", value: "1,200+", icon: Users },
  { label: "Tingkat Keberhasilan", value: "92%", icon: TrendingUp },
  { label: "Perusahaan Partner", value: "50+", icon: Shield },
];

const Index = () => {
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const { data: jobs = [], isLoading } = useActiveJobs();

  const filteredJobs = jobs.filter((job) => {
    const title = (job as any).title || (job as any).position || "";
    const department = (job as any).department || (job as any).category || "";
    const location = (job as any).location || "";
    const matchSearch = title.toLowerCase().includes(search.toLowerCase()) ||
      department.toLowerCase().includes(search.toLowerCase());
    const matchLocation = !locationFilter || location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchSearch && matchLocation;
  }).slice(0, 6);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/50 dark:from-background/95 dark:via-background/80 dark:to-background/60" />
        <div className="relative container py-24 md:py-32">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 hover:bg-primary/20">🚀 Platform Rekrutmen Resmi PJM Group</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-background dark:text-foreground">
              Temukan Karir<br /><span className="text-gradient">Impianmu</span>
            </h1>
            <p className="text-lg text-background/70 dark:text-muted-foreground mb-8 leading-relaxed">
              Jelajahi lowongan pekerjaan di PJM Group dan anak perusahaannya. Bangun karir yang bermakna bersama kami.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-xl bg-background/10 dark:bg-card/50 backdrop-blur-lg border border-background/20 dark:border-border">
              <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-background dark:bg-background">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input type="text" placeholder="Cari posisi atau departemen..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background dark:bg-background sm:w-48">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <input type="text" placeholder="Lokasi..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
              </div>
              <Button size="lg" className="sm:px-8"><Search className="h-4 w-4 mr-2" />Cari</Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="container -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }} className="stat-card">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><stat.icon className="h-5 w-5 text-primary" /></div>
                <div><p className="text-2xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Job Listings */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <div><h2 className="text-2xl font-bold">Lowongan Terbaru</h2><p className="text-muted-foreground mt-1">Temukan posisi yang sesuai dengan keahlianmu</p></div>
          <Button variant="ghost" asChild><Link to="/jobs">Lihat Semua <ChevronRight className="h-4 w-4 ml-1" /></Link></Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3].map(i => <div key={i} className="card-elevated p-6 h-48 animate-pulse bg-muted/30" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i, duration: 0.4 }}>
                <Link to={`/jobs/${job.id}`} className="block card-elevated p-6 h-full group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="h-5 w-5 text-primary" /></div>
                    <Badge variant="secondary" className="text-xs">{(job as any).employment_type || (job as any).type || "Full-time"}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">{(job as any).title || (job as any).position}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{(job as any).department || (job as any).category}</p>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{(job as any).description || "Klik untuk melihat detail lowongan ini."}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {(job as any).location || "-"}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {(job as any).deadline ? new Date((job as any).deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Open"}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
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
