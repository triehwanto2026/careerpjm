import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreVertical, Eye, Edit, Trash2, MapPin, Clock, Filter, Building2, ToggleLeft, ToggleRight, Grid, List, Briefcase, Users, Settings, X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useJobs, useCreateJob, useUpdateJob, useDeleteJob } from "@/hooks/useJobs";
import { supabase } from "@/integrations/supabase/client";
import { ACTIVE_APPLICATION_STATUSES, isPastDeadline } from "@/lib/recruitmentExpiry";

const statusBadge: Record<string, string> = { active: "bg-success/10 text-success", closed: "bg-muted text-muted-foreground", draft: "bg-warning/10 text-warning" };
const statusLabel: Record<string, string> = { active: "Aktif", closed: "Ditutup", draft: "Draft" };
const DEFAULT_DEPARTMENTS = ["Engineering", "Design", "Marketing", "Human Resources", "Data", "Operations", "Finance"];
const DEFAULT_EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];
const JOB_DEPARTMENTS_KEY = "job_departments";
const JOB_EMPLOYMENT_TYPES_KEY = "job_employment_types";

const parseOptionList = (value: string | null | undefined, fallback: string[]) => {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") && parsed.length ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const HRJobs = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [newJob, setNewJob] = useState({ title: "", department: "", location: "", employment_type: "", min_salary: "", max_salary: "", show_salary: true, closes_at: "", description: "", requirements: "" });
  const [editJob, setEditJob] = useState({ id: "", title: "", department: "", location: "", employment_type: "", min_salary: "", max_salary: "", show_salary: true, closes_at: "", description: "", requirements: "", status: "" });
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [employmentTypes, setEmploymentTypes] = useState(DEFAULT_EMPLOYMENT_TYPES);
  const [newDepartment, setNewDepartment] = useState("");
  const [newEmploymentType, setNewEmploymentType] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);

  const { data: jobs = [], isLoading } = useJobs();
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const formatDateForInput = (value: string | null | undefined) => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  useEffect(() => {
    const loadJobSettings = async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key,value")
        .in("key", [JOB_DEPARTMENTS_KEY, JOB_EMPLOYMENT_TYPES_KEY]);
      if (error) {
        toast({ title: "⚠️ Pengaturan belum termuat", description: error.message, variant: "destructive" });
        return;
      }
      const settings = new Map((data || []).map((item: any) => [item.key, item.value]));
      setDepartments(parseOptionList(settings.get(JOB_DEPARTMENTS_KEY), DEFAULT_DEPARTMENTS));
      setEmploymentTypes(parseOptionList(settings.get(JOB_EMPLOYMENT_TYPES_KEY), DEFAULT_EMPLOYMENT_TYPES));
    };
    loadJobSettings();
  }, [toast]);

  const persistOptionList = async (key: string, values: string[]) => {
    setSettingsSaving(true);
    const { error } = await supabase.from("app_settings").upsert({
      key,
      value: JSON.stringify(values),
      value_type: "json",
      category: "system",
      description: key === JOB_DEPARTMENTS_KEY ? "Daftar departemen untuk lowongan" : "Daftar tipe pekerjaan untuk lowongan",
      is_public: false,
    }, { onConflict: "key" });
    setSettingsSaving(false);
    if (error) throw error;
  };

  const addDepartment = async () => {
    const value = newDepartment.trim();
    if (!value || departments.some((dept) => dept.toLowerCase() === value.toLowerCase())) return;
    const next = [...departments, value];
    try {
      await persistOptionList(JOB_DEPARTMENTS_KEY, next);
      setDepartments(next);
      setNewDepartment("");
      toast({ title: "✅ Departemen Ditambah", description: `${value} berhasil disimpan.` });
    } catch (err: any) {
      toast({ title: "❌ Gagal Menyimpan", description: err.message, variant: "destructive" });
    }
  };

  const removeDepartment = async (dept: string) => {
    const next = departments.filter(d => d !== dept);
    try {
      await persistOptionList(JOB_DEPARTMENTS_KEY, next);
      setDepartments(next);
      toast({ title: "✅ Departemen Dihapus", description: `${dept} telah dihapus dari database.` });
    } catch (err: any) {
      toast({ title: "❌ Gagal Menyimpan", description: err.message, variant: "destructive" });
    }
  };

  const addEmploymentType = async () => {
    const value = newEmploymentType.trim();
    if (!value || employmentTypes.some((type) => type.toLowerCase() === value.toLowerCase())) return;
    const next = [...employmentTypes, value];
    try {
      await persistOptionList(JOB_EMPLOYMENT_TYPES_KEY, next);
      setEmploymentTypes(next);
      setNewEmploymentType("");
      toast({ title: "✅ Tipe Pekerjaan Ditambah", description: `${value} berhasil disimpan.` });
    } catch (err: any) {
      toast({ title: "❌ Gagal Menyimpan", description: err.message, variant: "destructive" });
    }
  };

  const removeEmploymentType = async (type: string) => {
    const next = employmentTypes.filter(t => t !== type);
    try {
      await persistOptionList(JOB_EMPLOYMENT_TYPES_KEY, next);
      setEmploymentTypes(next);
      toast({ title: "✅ Tipe Pekerjaan Dihapus", description: `${type} telah dihapus dari database.` });
    } catch (err: any) {
      toast({ title: "❌ Gagal Menyimpan", description: err.message, variant: "destructive" });
    }
  };

  const filtered = jobs.filter((j: any) => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.department.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleStatus = async (job: any) => {
    const { id, status: currentStatus } = job;
    const newStatus = currentStatus === "active" ? "closed" : "active";
    await updateJob.mutateAsync({
      id,
      status: newStatus,
      closes_at: newStatus === "active" && isPastDeadline(job.closes_at) ? null : job.closes_at,
    });
    if (newStatus === "closed") {
      await supabase
        .from("job_applications")
        .update({
          status: "expired",
          status_updated_at: new Date().toISOString(),
          admin_notes: "Lowongan ditutup oleh admin. Lamaran ini otomatis diarsipkan.",
        } as any)
        .eq("vacancy_id", id)
        .in("status", ACTIVE_APPLICATION_STATUSES);
    }
    toast({ title: newStatus === "closed" ? "🔒 Lowongan Ditutup" : "✅ Lowongan Diaktifkan" });
  };

  const handleCreateJob = async () => {
    if (!newJob.title) { toast({ title: "⚠️ Error", description: "Judul posisi wajib diisi.", variant: "destructive" }); return; }
    try {
      await createJob.mutateAsync({
        title: newJob.title,
        department: newJob.department || "General",
        location: newJob.location || "Jakarta",
        employment_type: newJob.employment_type || "Full-time",
        min_salary: newJob.min_salary ? parseInt(newJob.min_salary) : undefined,
        max_salary: newJob.max_salary ? parseInt(newJob.max_salary) : undefined,
        show_salary: newJob.show_salary,
        description: newJob.description || undefined,
        requirements: newJob.requirements || undefined,
        closes_at: newJob.closes_at || undefined,
        status: "active",
      });
      setNewJob({ title: "", department: "", location: "", employment_type: "", min_salary: "", max_salary: "", show_salary: true, closes_at: "", description: "", requirements: "" });
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

  const handleViewDetail = (job: any) => {
    setSelectedJob(job);
    setDetailDialogOpen(true);
  };

  const handleEdit = (job: any) => {
    setEditJob({
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
      employment_type: job.employment_type,
      min_salary: job.min_salary?.toString() || "",
      max_salary: job.max_salary?.toString() || "",
      show_salary: job.show_salary !== false,
      closes_at: formatDateForInput(job.closes_at),
      description: job.description || "",
      requirements: job.requirements || "",
      status: job.status
    });
    setEditDialogOpen(true);
  };

  const handleUpdateJob = async () => {
    if (!editJob.title) { toast({ title: "⚠️ Error", description: "Judul posisi wajib diisi.", variant: "destructive" }); return; }
    try {
      await updateJob.mutateAsync({
        id: editJob.id,
        title: editJob.title,
        department: editJob.department,
        location: editJob.location,
        employment_type: editJob.employment_type,
        min_salary: editJob.min_salary ? parseInt(editJob.min_salary) : undefined,
        max_salary: editJob.max_salary ? parseInt(editJob.max_salary) : undefined,
        show_salary: editJob.show_salary,
        description: editJob.description || undefined,
        requirements: editJob.requirements || undefined,
        closes_at: editJob.status === "active" && isPastDeadline(editJob.closes_at) ? null : editJob.closes_at || undefined,
        status: editJob.status
      });
      setEditDialogOpen(false);
      toast({ title: "✅ Lowongan Diperbarui", description: `${editJob.title} berhasil diperbarui.` });
    } catch (err: any) {
      toast({ title: "❌ Gagal", description: err.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Kelola Lowongan</h1>
            <p className="text-sm text-muted-foreground">Buat dan kelola lowongan pekerjaan dengan sistem rekrutmen modern</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Pengaturan Departemen & Tipe Pekerjaan">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Pengaturan Departemen & Tipe Pekerjaan</DialogTitle>
                  <p className="text-sm text-muted-foreground">Perubahan disimpan ke database dan digunakan saat membuat atau mengedit lowongan.</p>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Departemen Section */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Departemen</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Tambah departemen baru..." 
                        value={newDepartment} 
                        onChange={(e) => setNewDepartment(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addDepartment(); }}
                      />
                      <Button onClick={addDepartment} size="sm" disabled={settingsSaving}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {departments.map((dept) => (
                        <div key={dept} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                          <span className="text-sm font-medium">{dept}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeDepartment(dept)}
                            disabled={settingsSaving}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Employment Type Section */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Tipe Pekerjaan</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Tambah tipe pekerjaan baru..." 
                        value={newEmploymentType} 
                        onChange={(e) => setNewEmploymentType(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addEmploymentType(); }}
                      />
                      <Button onClick={addEmploymentType} size="sm" disabled={settingsSaving}><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {employmentTypes.map((type) => (
                        <div key={type} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                          <span className="text-sm font-medium">{type}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeEmploymentType(type)}
                            disabled={settingsSaving}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Tutup</Button></DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" /> Buat Lowongan</Button></DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Buat Lowongan Baru</DialogTitle>
                  <p className="text-sm text-muted-foreground">Lengkapi informasi inti, paket kompensasi, dan kebutuhan kandidat.</p>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  <section className="rounded-lg border border-border bg-muted/20 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-foreground">Informasi Posisi</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2"><Label>Judul Posisi <span className="text-destructive">*</span></Label><Input placeholder="Contoh: Senior Frontend Developer" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Departemen</Label><Select value={newJob.department} onValueChange={(v) => setNewJob({ ...newJob, department: v })}><SelectTrigger><SelectValue placeholder="Pilih departemen" /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                      <div className="space-y-2"><Label>Lokasi</Label><Input placeholder="Jakarta / Site Project / Remote" value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Tipe Pekerjaan</Label><Select value={newJob.employment_type} onValueChange={(v) => setNewJob({ ...newJob, employment_type: v })}><SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger><SelectContent>{employmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                      <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={newJob.closes_at} onChange={(e) => setNewJob({ ...newJob, closes_at: e.target.value })} /></div>
                    </div>
                  </section>

                  <section className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Informasi Gaji</h3>
                        <p className="text-xs text-muted-foreground">Data gaji tetap tersimpan untuk admin, meskipun disembunyikan dari kandidat.</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                        <Switch checked={newJob.show_salary} onCheckedChange={(checked) => setNewJob({ ...newJob, show_salary: checked })} />
                        <Label className="text-xs font-medium">{newJob.show_salary ? "Tampil di kandidat" : "Sembunyikan"}</Label>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2"><Label>Gaji Min (Rp)</Label><Input type="number" placeholder="15000000" value={newJob.min_salary} onChange={(e) => setNewJob({ ...newJob, min_salary: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Gaji Max (Rp)</Label><Input type="number" placeholder="25000000" value={newJob.max_salary} onChange={(e) => setNewJob({ ...newJob, max_salary: e.target.value })} /></div>
                    </div>
                  </section>

                  <section className="rounded-lg border border-border bg-muted/20 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-foreground">Deskripsi & Kualifikasi</h3>
                    <div className="grid gap-4">
                      <div className="space-y-2"><Label>Deskripsi Pekerjaan</Label><Textarea placeholder="Jelaskan tanggung jawab dan ruang lingkup pekerjaan..." rows={4} value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Kualifikasi</Label><Textarea placeholder="Satu kualifikasi per baris..." rows={3} value={newJob.requirements} onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })} /></div>
                    </div>
                  </section>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Batal</Button></DialogClose>
                  <Button onClick={handleCreateJob} disabled={createJob.isPending}>{createJob.isPending ? "Menyimpan..." : "Simpan Lowongan"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari posisi atau departemen..." 
                className="h-9 pl-10 bg-background border-border" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full bg-background border-border sm:w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="closed">Ditutup</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1 rounded-md border border-border bg-muted p-1">
              <Button 
                variant={viewMode === "grid" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 p-0"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === "list" ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setViewMode("list")}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { 
              label: "Lowongan Aktif", 
              count: jobs.filter((j: any) => j.status === "active").length, 
              color: "text-success",
              icon: Briefcase,
              bg: "bg-success/10 border-success/20"
            },
            { 
              label: "Lowongan Ditutup", 
              count: jobs.filter((j: any) => j.status === "closed").length, 
              color: "text-muted-foreground",
              icon: Users,
              bg: "bg-muted/50 border-border"
            },
            { 
              label: "Draft", 
              count: jobs.filter((j: any) => j.status === "draft").length, 
              color: "text-warning",
              icon: Clock,
              bg: "bg-warning/10 border-warning/20"
            },
          ].map((s) => (
            <div key={s.label} className={`rounded-lg border ${s.bg} p-3`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-2xl font-bold leading-none ${s.color}`}>{s.count}</p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{s.label}</p>
                </div>
                <div className={`flex h-8 w-8 items-center justify-center rounded-md ${s.bg}`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{[1,2,3,4,5,6].map(i => <div key={i} className="h-36 animate-pulse rounded-lg bg-muted/30" />)}</div>
          ) : (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-pulse rounded-lg bg-muted/30" />)}</div>
          )
        ) : (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((job: any, i: number) => (
                <motion.div 
                  key={job.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: Math.min(i * 0.03, 0.15) }} 
                  className="group rounded-lg border border-border bg-card transition-colors hover:border-primary/30"
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                        <Briefcase className="h-4 w-4 text-primary" />
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadge[job.status]}`}>
                        {statusLabel[job.status]}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="mb-4 space-y-3">
                      <div>
                        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-primary">{job.title}</h3>
                        <p className="mt-1 text-xs font-medium text-muted-foreground">{job.department}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{job.employment_type}</span>
                        </div>
                        {job.closes_at && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span>Deadline: {new Date(job.closes_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-2 border-t border-border/50 pt-3">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewDetail(job)} 
                          className="h-8 flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" /> Detail
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(job)} 
                          className="h-8 flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleStatus(job)} 
                          className={`h-8 flex-1 ${job.status === 'active' ? 'hover:bg-destructive/10' : 'hover:bg-success/10'}`}
                        >
                          {job.status === "active" ? <ToggleRight className="h-5 w-5 text-destructive" /> : <ToggleLeft className="h-5 w-5 text-success" />}
                          {job.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-border">
                            <DropdownMenuItem className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(job.id, job.title)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((job: any, i: number) => (
                <motion.div 
                  key={job.id} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: Math.min(i * 0.03, 0.15) }} 
                  className="group rounded-lg border border-border bg-card transition-colors hover:border-primary/30"
                >
                  <div className="p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Left Content */}
                      <div className="flex flex-1 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary">{job.title}</h3>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadge[job.status]}`}>
                              {statusLabel[job.status]}
                            </span>
                          </div>
                          <p className="mb-2 text-xs font-medium text-muted-foreground">{job.department}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{job.employment_type}</span>
                            </div>
                            {job.closes_at && (
                              <div className="flex items-center gap-2">
                                <Users className="h-3.5 w-3.5" />
                                <span>Deadline: {new Date(job.closes_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Actions */}
                      <div className="flex items-center gap-2 lg:justify-end">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewDetail(job)}
                            className="h-8"
                          >
                            <Eye className="h-4 w-4 mr-2" /> Detail
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(job)}
                            className="h-8"
                          >
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleStatus(job)} 
                            className={`h-8 ${job.status === 'active' ? 'hover:bg-destructive/10' : 'hover:bg-success/10'}`}
                          >
                            {job.status === "active" ? <ToggleRight className="h-5 w-5 text-destructive" /> : <ToggleLeft className="h-5 w-5 text-success" />}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="border-border">
                              <DropdownMenuItem className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(job.id, job.title)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Lowongan</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Judul Posisi</Label>
                  <p className="font-medium">{selectedJob.title}</p>
                </div>
                <div>
                  <Label>Departemen</Label>
                  <p className="font-medium">{selectedJob.department}</p>
                </div>
                <div>
                  <Label>Lokasi</Label>
                  <p className="font-medium">{selectedJob.location}</p>
                </div>
                <div>
                  <Label>Tipe Pekerjaan</Label>
                  <p className="font-medium">{selectedJob.employment_type}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <span className={`status-badge ${statusBadge[selectedJob.status]}`}>{statusLabel[selectedJob.status]}</span>
                </div>
                {selectedJob.min_salary && (
                  <div>
                    <Label>Gaji Min</Label>
                    <p className="font-medium">Rp {parseInt(selectedJob.min_salary).toLocaleString('id-ID')}</p>
                  </div>
                )}
                {selectedJob.max_salary && (
                  <div>
                    <Label>Gaji Max</Label>
                    <p className="font-medium">Rp {parseInt(selectedJob.max_salary).toLocaleString('id-ID')}</p>
                  </div>
                )}
                {selectedJob.closes_at && (
                  <div>
                    <Label>Deadline</Label>
                    <p className="font-medium">{new Date(selectedJob.closes_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                )}
              </div>
              {selectedJob.description && (
                <div>
                  <Label>Deskripsi Pekerjaan</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedJob.description}</p>
                </div>
              )}
              {selectedJob.requirements && (
                <div>
                  <Label>Kualifikasi</Label>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedJob.requirements}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Tutup</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Lowongan</DialogTitle>
            <p className="text-sm text-muted-foreground">Perbarui informasi lowongan dan kontrol visibilitas gaji untuk kandidat.</p>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <section className="rounded-lg border border-border bg-muted/20 p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Informasi Posisi</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Judul Posisi <span className="text-destructive">*</span></Label>
                  <Input placeholder="Contoh: Senior Frontend Developer" value={editJob.title} onChange={(e) => setEditJob({ ...editJob, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Departemen</Label>
                  <Select value={editJob.department} onValueChange={(v) => setEditJob({ ...editJob, department: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih departemen" /></SelectTrigger>
                    <SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lokasi</Label>
                  <Input placeholder="Jakarta / Site Project / Remote" value={editJob.location} onChange={(e) => setEditJob({ ...editJob, location: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tipe Pekerjaan</Label>
                  <Select value={editJob.employment_type} onValueChange={(v) => setEditJob({ ...editJob, employment_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
                    <SelectContent>{employmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input type="date" value={editJob.closes_at} onChange={(e) => setEditJob({ ...editJob, closes_at: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editJob.status} onValueChange={(v) => setEditJob({ ...editJob, status: v })}>
                    <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="closed">Ditutup</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Informasi Gaji</h3>
                  <p className="text-xs text-muted-foreground">Atur apakah rentang gaji tampil pada halaman kandidat.</p>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
                  <Switch checked={editJob.show_salary} onCheckedChange={(checked) => setEditJob({ ...editJob, show_salary: checked })} />
                  <Label className="text-xs font-medium">{editJob.show_salary ? "Tampil di kandidat" : "Sembunyikan"}</Label>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Gaji Min (Rp)</Label>
                  <Input type="number" placeholder="15000000" value={editJob.min_salary} onChange={(e) => setEditJob({ ...editJob, min_salary: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Gaji Max (Rp)</Label>
                  <Input type="number" placeholder="25000000" value={editJob.max_salary} onChange={(e) => setEditJob({ ...editJob, max_salary: e.target.value })} />
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-muted/20 p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Deskripsi & Kualifikasi</h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Deskripsi Pekerjaan</Label>
                  <Textarea placeholder="Jelaskan tanggung jawab dan ruang lingkup pekerjaan..." rows={4} value={editJob.description} onChange={(e) => setEditJob({ ...editJob, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Kualifikasi</Label>
                  <Textarea placeholder="Satu kualifikasi per baris..." rows={3} value={editJob.requirements} onChange={(e) => setEditJob({ ...editJob, requirements: e.target.value })} />
                </div>
              </div>
            </section>
            </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={handleUpdateJob} disabled={updateJob.isPending}>
              {updateJob.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default HRJobs;
