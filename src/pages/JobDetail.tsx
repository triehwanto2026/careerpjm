import { useParams, Link, useNavigate } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, Clock, DollarSign, ArrowLeft, CheckCircle2, Briefcase, Send, FileText, Calendar, Users, Check } from "lucide-react";
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
  const salaryLabel =
    (job as any).salary_range ||
    ((job as any).min_salary ? `Rp ${Number((job as any).min_salary).toLocaleString("id-ID")}${(job as any).max_salary ? ` - Rp ${Number((job as any).max_salary).toLocaleString("id-ID")}` : ""}` : "") ||
    (job as any).salary ||
    "Negotiable";
  const showSalary = (job as any).show_salary !== false;

  const formatDate = (v?: string | null) => {
    if (!v) return "-";
    try { return new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); } catch { return v; }
  };

  return (
    <PublicLayout>
      <div className="container py-8">
        <Link to="/jobs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"><ArrowLeft className="h-4 w-4" /> Kembali ke Lowongan</Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-6">
            {/* Header with gradient */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border border-border">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full px-3 py-1 text-xs font-semibold bg-success/10 text-success">
                        Aktif
                      </span>
                      {showSalary && (
                        <span className="rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary">
                          Gaji Terlihat
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{(job as any).title || (job as any).position}</h1>
                    <p className="text-sm text-muted-foreground">{(job as any).department || (job as any).category}</p>
                  </div>
                </div>
                
                {/* Quick Info */}
                <div className="flex flex-wrap gap-3 mt-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-lg border border-border"><MapPin className="h-3.5 w-3.5" />{(job as any).location || "-"}</span>
                  <span className="inline-flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-lg border border-border"><Clock className="h-3.5 w-3.5" />{(job as any).employment_type || (job as any).type || "Full-time"}</span>
                  {(job as any).closes_at && <span className="inline-flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-lg border border-border"><Calendar className="h-3.5 w-3.5" />Deadline: {formatDate((job as any).closes_at)}</span>}
                </div>
              </div>
            </div>

            {/* Salary Section */}
            {showSalary && salaryLabel !== "Negotiable" && (
              <div className="rounded-xl border border-border bg-gradient-to-br from-success/5 to-background p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <DollarSign className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Rentang Gaji</h3>
                    <p className="text-xs text-muted-foreground">Per bulan</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-success">{salaryLabel}</div>
              </div>
            )}

            {/* Description */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Deskripsi Pekerjaan</h3>
              </div>
              <div className="space-y-2">
                {(job as any).description?.split('\n').filter(Boolean).map((desc: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <span className="leading-relaxed">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Kualifikasi & Tanggung Jawab</h3>
              </div>
              <div className="space-y-2">
                {requirements.map((q: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="leading-relaxed">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 sticky top-24">
              <div className="mb-4">
                <h3 className="font-semibold text-foreground mb-2">Tertarik dengan posisi ini?</h3>
                <p className="text-sm text-muted-foreground">Daftar atau masuk untuk melamar. Pastikan profil dan CV Anda siap.</p>
              </div>
              <div className="space-y-3">
                <Button className="w-full" size="lg" onClick={handleApplyDirect}><Send className="h-4 w-4 mr-2" /> Lamar Sekarang</Button>
                <Button variant="outline" className="w-full" size="lg" asChild><Link to="/login">Sudah punya akun? Masuk</Link></Button>
              </div>
              <div className="mt-6 pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Status:</span><span className="font-medium text-foreground">{(job as any).status}</span></div>
                <div className="flex justify-between"><span>Posted:</span><span className="font-medium text-foreground">{formatDate((job as any).created_at)}</span></div>
                {(job as any).closes_at && <div className="flex justify-between"><span>Deadline:</span><span className="font-medium text-foreground">{formatDate((job as any).closes_at)}</span></div>}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default JobDetail;
