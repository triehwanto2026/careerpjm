import { Link } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search, MapPin, Building2, Clock, ArrowRight, Users, Briefcase,
  Shield, ChevronRight, TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
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
  const { data: jobs = [], isLoading, error } = useActiveJobs();

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
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjMCAwIDAgMiAyIDJzMiAyIDIgMiAyIDItMiAyLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="relative container py-24 md:py-32">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
            <Badge className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm">🚀 Platform Rekrutmen Resmi PJM Group</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-white">
              Temukan Karir<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">Impianmu</span>
            </h1>
            <p className="text-lg text-white/90 mb-8 leading-relaxed">
              Jelajahi lowongan pekerjaan di PJM Group dan anak perusahaannya. Bangun karir yang bermakna bersama kami.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <div className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20">
                <Search className="h-4 w-4 text-white/70 shrink-0" />
                <input type="text" placeholder="Cari posisi atau departemen..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/50 text-white" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 sm:w-48">
                <MapPin className="h-4 w-4 text-white/70 shrink-0" />
                <input type="text" placeholder="Lokasi..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/50 text-white" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
              </div>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 sm:px-8"><Search className="h-4 w-4 mr-2" />Cari</Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="container -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }} className="card-elevated p-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><stat.icon className="h-6 w-6 text-primary" /></div>
                <div><p className="text-2xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Job Listings */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <div><h2 className="text-3xl font-bold">Lowongan Terbaru</h2><p className="text-muted-foreground mt-2">Temukan posisi yang sesuai dengan keahlianmu</p></div>
          <Button variant="outline" asChild><Link to="/jobs">Lihat Semua <ChevronRight className="h-4 w-4 ml-1" /></Link></Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="card-elevated p-6 h-48 animate-pulse bg-muted/30" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i, duration: 0.4 }}>
                <Link to={`/jobs/${job.id}`} className="block card-elevated p-6 h-full group hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 className="h-6 w-6 text-primary" /></div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{job.employment_type}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{job.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{job.department}</p>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{job.description || "Klik untuk melihat detail lowongan ini."}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {job.closes_at ? new Date(job.closes_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Open"}</span>
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
