import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreVertical, Eye, Edit, Trash2, MapPin, Clock, Filter, Building2, ToggleLeft, ToggleRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useJobs, useCreateJob, useUpdateJob, useDeleteJob } from "@/hooks/useJobs";

const statusBadge: Record<string, string> = { active: "bg-success/10 text-success", closed: "bg-muted text-muted-foreground", draft: "bg-warning/10 text-warning" };
const statusLabel: Record<string, string> = { active: "Aktif", closed: "Ditutup", draft: "Draft" };

const HRJobs = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newJob, setNewJob] = useState({ title: "", department: "", location: "", type: "", salary: "", deadline: "", description: "", qualifications: "" });

  const { data: jobs = [], isLoading } = useJobs();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const filtered = jobs.filter((j: any) => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.department.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "closed" : "active";
    await updateJob.mutateAsync({ id, status: newStatus });
    toast({ title: newStatus === "closed" ? "🔒 Lowongan Ditutup" : "✅ Lowongan Diaktifkan" });
  };

  const handleCreateJob = async () => {
    if (!newJob.title) { toast({ title: "⚠️ Error", description: "Judul posisi wajib diisi.", variant: "destructive" }); return; }
    try {
      await createJob.mutateAsync({
        title: newJob.title,
        department: newJob.department || "General",
        location: newJob.location || "Jakarta",
        type: newJob.type || "Full-time",
        salary: newJob.salary || undefined,
        description: newJob.description || undefined,
        qualifications: newJob.qualifications || undefined,
        deadline: newJob.deadline || undefined,
        status: "draft",
      });
      setNewJob({ title: "", department: "", location: "", type: "", salary: "", deadline: "", description: "", qualifications: "" });
      setDialogOpen(false);
      toast({ title: "✅ Lowongan Dibuat", description: `${newJob.title} berhasil ditambahkan.` });
    } catch (err: any) {
      toast({ title: "❌ Gagal", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    await deleteJob.mutateAsync(id);
    toast({ title: "🗑️ Lowongan Dihapus", description: `${title} telah dihapus.` });
  };

  return (
    <DashboardLayout role="hr">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div><h1 className="text-2xl font-bold">Kelola Lowongan</h1><p className="text-muted-foreground">Buat dan kelola lowongan pekerjaan</p></div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Buat Lowongan</Button></DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Buat Lowongan Baru</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Judul Posisi <span className="text-destructive">*</span></Label><Input placeholder="Contoh: Senior Frontend Developer" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Departemen</Label><Select value={newJob.department} onValueChange={(v) => setNewJob({ ...newJob, department: v })}><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger><SelectContent><SelectItem value="Engineering">Engineering</SelectItem><SelectItem value="Design">Design</SelectItem><SelectItem value="Marketing">Marketing</SelectItem><SelectItem value="Human Resources">Human Resources</SelectItem><SelectItem value="Data">Data</SelectItem><SelectItem value="Operations">Operations</SelectItem><SelectItem value="Finance">Finance</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Lokasi</Label><Input placeholder="Jakarta" value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Tipe Pekerjaan</Label><Select value={newJob.type} onValueChange={(v) => setNewJob({ ...newJob, type: v })}><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger><SelectContent><SelectItem value="Full-time">Full-time</SelectItem><SelectItem value="Part-time">Part-time</SelectItem><SelectItem value="Contract">Contract</SelectItem><SelectItem value="Internship">Internship</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Range Gaji</Label><Input placeholder="Rp 15-25 juta" value={newJob.salary} onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={newJob.deadline} onChange={(e) => setNewJob({ ...newJob, deadline: e.target.value })} /></div>
                <div className="space-y-2"><Label>Deskripsi Pekerjaan</Label><Textarea placeholder="Jelaskan tanggung jawab dan deskripsi pekerjaan..." rows={4} value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} /></div>
                <div className="space-y-2"><Label>Kualifikasi</Label><Textarea placeholder="Satu kualifikasi per baris..." rows={3} value={newJob.qualifications} onChange={(e) => setNewJob({ ...newJob, qualifications: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
                <Button onClick={handleCreateJob} disabled={createJob.isPending}>{createJob.isPending ? "Menyimpan..." : "Simpan Lowongan"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Cari posisi atau departemen..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full sm:w-40"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua Status</SelectItem><SelectItem value="active">Aktif</SelectItem><SelectItem value="closed">Ditutup</SelectItem><SelectItem value="draft">Draft</SelectItem></SelectContent></Select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Aktif", count: jobs.filter((j: any) => j.status === "active").length, color: "text-success" },
            { label: "Ditutup", count: jobs.filter((j: any) => j.status === "closed").length, color: "text-muted-foreground" },
            { label: "Draft", count: jobs.filter((j: any) => j.status === "draft").length, color: "text-warning" },
          ].map((s) => (
            <div key={s.label} className="card-elevated p-4 text-center"><p className={`text-2xl font-bold ${s.color}`}>{s.count}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card-elevated p-5 h-20 animate-pulse bg-muted/30" />)}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((job: any, i: number) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card-elevated p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Building2 className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{job.title}</h3>
                        <span className={`status-badge ${statusBadge[job.status]}`}>{statusLabel[job.status]}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{job.department}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{job.type}</span>
                        {job.deadline && <span>Deadline: {new Date(job.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleStatus(job.id, job.status)} title={job.status === "active" ? "Nonaktifkan" : "Aktifkan"}>
                      {job.status === "active" ? <ToggleRight className="h-5 w-5 text-success" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast({ title: "👁️ Detail", description: `Menampilkan detail ${job.title}` })}><Eye className="h-4 w-4 mr-2" /> Lihat Detail</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast({ title: "✏️ Edit", description: `Mode edit untuk ${job.title}` })}><Edit className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(job.id, job.title)}><Trash2 className="h-4 w-4 mr-2" /> Hapus</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HRJobs;
