import { useParams, Link, useNavigate } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, Clock, Banknote, ArrowLeft, CheckCircle2, Briefcase, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPastDeadline, syncExpiredRecruitment } from "@/lib/recruitmentExpiry";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      await syncExpiredRecruitment();
      const { data, error } = await supabase.from("job_vacancies").select("*").eq("id", id!).single();
      if (error) throw error;
      if ((data as any).status !== "active" || isPastDeadline((data as any).closes_at)) return null;
      return data;
    },
    enabled: !!id,
  });

  const handleApplyDirect = () => {
    toast({ title: "🚀 Silakan Login Terlebih Dahulu", description: "Untuk melamar posisi ini, Anda perlu masuk atau mendaftar akun terlebih dahulu." });
    navigate("/login");
  };

  if (isLoading) return <PublicLayout><div className="container py-16 text-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" /></div></PublicLayout>;
  if (!job) return <PublicLayout><div className="container py-16 text-center"><h2 className="text-xl font-bold">Lowongan tidak ditemukan</h2><Button asChild className="mt-4"><Link to="/jobs">Kembali</Link></Button></div></PublicLayout>;

  const requirements = (job as any).requirements?.split("\n").filter(Boolean) || ["Sesuai dengan kualifikasi yang dibutuhkan"];

  return (
    <PublicLayout>
      <div className="container py-8">
        <Link to="/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"><ArrowLeft className="h-4 w-4" /> Kembali ke Lowongan</Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="h-5 w-5 text-primary" /></div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold">{(job as any).title || (job as any).position}</h1>
                  <p className="text-xs md:text-sm text-muted-foreground">{(job as any).department || (job as any).category}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge variant="secondary" className="gap-1.5"><MapPin className="h-3 w-3" /> {(job as any).location || "-"}</Badge>
                <Badge variant="secondary" className="gap-1.5"><Briefcase className="h-3 w-3" /> {(job as any).employment_type || (job as any).type || "Full-time"}</Badge>
                <Badge variant="secondary" className="gap-1.5"><Banknote className="h-3 w-3" /> {(job as any).salary_range || (job as any).salary || "Negotiable"}</Badge>
                {(job as any).closes_at && <Badge variant="secondary" className="gap-1.5"><Clock className="h-3 w-3" /> Deadline: {new Date((job as any).closes_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</Badge>}
              </div>
            </div>

            <div className="card-elevated p-4">
              <h2 className="text-base md:text-lg font-semibold mb-2">Deskripsi Pekerjaan</h2>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{(job as any).description || "Detail deskripsi pekerjaan akan segera diupdate."}</p>
            </div>

            <div className="card-elevated p-4">
              <h2 className="text-base md:text-lg font-semibold mb-3">Kualifikasi</h2>
              <ul className="space-y-2">
                {requirements.map((q: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm md:text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />{q}</li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            <div className="card-elevated p-4 sticky top-20">
              <h3 className="font-semibold mb-3">Tertarik dengan posisi ini?</h3>
              <p className="text-xs md:text-sm text-muted-foreground mb-4">Daftar atau masuk untuk melamar posisi ini. Pastikan profil kamu sudah lengkap.</p>
              <div className="space-y-3">
                <Button className="w-full" size="lg" onClick={handleApplyDirect}><Send className="h-4 w-4 mr-2" /> Apply Now</Button>
                <Button variant="outline" className="w-full" size="lg" asChild><Link to="/login">Sudah punya akun? Masuk</Link></Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default JobDetail;
