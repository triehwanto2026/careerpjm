import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreVertical, Eye, Edit, Trash2, MapPin, Clock, Filter, Building2, ToggleLeft, ToggleRight, Grid, List, Briefcase, Users, Settings, X } from "lucide-react";
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [newJob, setNewJob] = useState({ title: "", department: "", location: "", employment_type: "", min_salary: "", max_salary: "", closes_at: "", description: "", requirements: "" });
  const [editJob, setEditJob] = useState({ id: "", title: "", department: "", location: "", employment_type: "", min_salary: "", max_salary: "", closes_at: "", description: "", requirements: "", status: "" });
  const [departments, setDepartments] = useState(["Engineering", "Design", "Marketing", "Human Resources", "Data", "Operations", "Finance"]);
  const [employmentTypes, setEmploymentTypes] = useState(["Full-time", "Part-time", "Contract", "Internship"]);
  const [newDepartment, setNewDepartment] = useState("");
  const [newEmploymentType, setNewEmploymentType] = useState("");

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

  const addDepartment = () => {
    if (newDepartment.trim() && !departments.includes(newDepartment.trim())) {
      setDepartments([...departments, newDepartment.trim()]);
      setNewDepartment("");
      toast({ title: "✅ Departemen Ditambah", description: `${newDepartment.trim()} berhasil ditambahkan.` });
    }
  };

  const removeDepartment = (dept: string) => {
    setDepartments(departments.filter(d => d !== dept));
    toast({ title: "✅ Departemen Dihapus", description: `${dept} telah dihapus.` });
  };

  const addEmploymentType = () => {
    if (newEmploymentType.trim() && !employmentTypes.includes(newEmploymentType.trim())) {
      setEmploymentTypes([...employmentTypes, newEmploymentType.trim()]);
      setNewEmploymentType("");
      toast({ title: "✅ Tipe Pekerjaan Ditambah", description: `${newEmploymentType.trim()} berhasil ditambahkan.` });
    }
  };

  const removeEmploymentType = (type: string) => {
    setEmploymentTypes(employmentTypes.filter(t => t !== type));
    toast({ title: "✅ Tipe Pekerjaan Dihapus", description: `${type} telah dihapus.` });
  };

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
        employment_type: newJob.employment_type || "Full-time",
        min_salary: newJob.min_salary ? parseInt(newJob.min_salary) : undefined,
        max_salary: newJob.max_salary ? parseInt(newJob.max_salary) : undefined,
        description: newJob.description || undefined,
        requirements: newJob.requirements || undefined,
        closes_at: newJob.closes_at || undefined,
        status: "active",
      });
      setNewJob({ title: "", department: "", location: "", employment_type: "", min_salary: "", max_salary: "", closes_at: "", description: "", requirements: "" });
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
        description: editJob.description || undefined,
        requirements: editJob.requirements || undefined,
        closes_at: editJob.closes_at || undefined,
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Kelola Lowongan</h1>
            <p className="text-muted-foreground">Buat dan kelola lowongan pekerjaan dengan sistem rekrutmen modern</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Pengaturan Departemen & Tipe Pekerjaan">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Pengaturan Departemen & Tipe Pekerjaan</DialogTitle></DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Departemen Section */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Departemen</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Tambah departemen baru..." 
                        value={newDepartment} 
                        onChange={(e) => setNewDepartment(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addDepartment()}
                      />
                      <Button onClick={addDepartment} size="sm"><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {departments.map((dept) => (
                        <div key={dept} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                          <span className="text-sm font-medium">{dept}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeDepartment(dept)}
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
                        onKeyPress={(e) => e.key === "Enter" && addEmploymentType()}
                      />
                      <Button onClick={addEmploymentType} size="sm"><Plus className="h-4 w-4" /></Button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {employmentTypes.map((type) => (
                        <div key={type} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                          <span className="text-sm font-medium">{type}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeEmploymentType(type)}
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
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Buat Lowongan</Button></DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Buat Lowongan Baru</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Judul Posisi <span className="text-destructive">*</span></Label><Input placeholder="Contoh: Senior Frontend Developer" value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Departemen</Label><Select value={newJob.department} onValueChange={(v) => setNewJob({ ...newJob, department: v })}><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Lokasi</Label><Input placeholder="Jakarta" value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Tipe Pekerjaan</Label><Select value={newJob.employment_type} onValueChange={(v) => setNewJob({ ...newJob, employment_type: v })}><SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger><SelectContent>{employmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Gaji Min (Rp)</Label><Input type="number" placeholder="15000000" value={newJob.min_salary} onChange={(e) => setNewJob({ ...newJob, min_salary: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Gaji Max (Rp)</Label><Input type="number" placeholder="25000000" value={newJob.max_salary} onChange={(e) => setNewJob({ ...newJob, max_salary: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label>Deadline</Label><Input type="date" value={newJob.closes_at} onChange={(e) => setNewJob({ ...newJob, closes_at: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Deskripsi Pekerjaan</Label><Textarea placeholder="Jelaskan tanggung jawab dan deskripsi pekerjaan..." rows={4} value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Kualifikasi</Label><Textarea placeholder="Satu kualifikasi per baris..." rows={3} value={newJob.requirements} onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })} /></div>
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
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari posisi atau departemen..." 
                className="pl-10 bg-background border-border" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-background border-border">
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
            <div className="flex gap-1 p-1 bg-muted rounded-lg border border-border">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div key={s.label} className={`relative overflow-hidden rounded-xl border ${s.bg} p-6 transition-all hover:shadow-lg`}>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
                  <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                </div>
                <div className={`h-12 w-12 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-gradient-to-br from-transparent to-current opacity-5"></div>
            </div>
          ))}
        </div>

        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="card-elevated p-5 h-48 animate-pulse bg-muted/30 rounded-xl" />)}</div>
          ) : (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card-elevated p-5 h-20 animate-pulse bg-muted/30 rounded-xl" />)}</div>
          )
        ) : (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((job: any, i: number) => (
                <motion.div 
                  key={job.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.1 }} 
                  className="group relative bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:border-primary/20"
                >
                  {/* Gradient Border Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Briefcase className="h-7 w-7 text-primary" />
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadge[job.status]} ${job.status === 'active' ? 'shadow-sm shadow-success/20' : ''}`}>
                        {statusLabel[job.status]}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="space-y-4 mb-6">
                      <div>
                        <h3 className="font-bold text-xl text-foreground mb-2 group-hover:text-primary transition-colors duration-300">{job.title}</h3>
                        <p className="text-sm text-muted-foreground font-medium">{job.department}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                            <MapPin className="h-4 w-4" />
                          </div>
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                            <Clock className="h-4 w-4" />
                          </div>
                          <span>{job.employment_type}</span>
                        </div>
                        {job.closes_at && (
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
                              <Users className="h-4 w-4" />
                            </div>
                            <span>Deadline: {new Date(job.closes_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewDetail(job)} 
                          className="flex-1 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                        >
                          <Eye className="h-4 w-4 mr-2" /> Detail
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(job)} 
                          className="flex-1 hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                        >
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleStatus(job.id, job.status)} 
                          className={`flex-1 ${job.status === 'active' ? 'hover:bg-destructive/10' : 'hover:bg-success/10'} transition-all duration-200`}
                        >
                          {job.status === "active" ? <ToggleRight className="h-5 w-5 text-destructive" /> : <ToggleLeft className="h-5 w-5 text-success" />}
                          {job.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-muted transition-colors">
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
            <div className="space-y-4">
              {filtered.map((job: any, i: number) => (
                <motion.div 
                  key={job.id} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.1 }} 
                  className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/20"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left Content */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-300">{job.title}</h3>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusBadge[job.status]} ${job.status === 'active' ? 'shadow-sm shadow-success/20' : ''}`}>
                              {statusLabel[job.status]}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground font-medium mb-3">{job.department}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-lg bg-muted/50 flex items-center justify-center">
                                <MapPin className="h-3 w-3" />
                              </div>
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-lg bg-muted/50 flex items-center justify-center">
                                <Clock className="h-3 w-3" />
                              </div>
                              <span>{job.employment_type}</span>
                            </div>
                            {job.closes_at && (
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-lg bg-muted/50 flex items-center justify-center">
                                  <Users className="h-3 w-3" />
                                </div>
                                <span>Deadline: {new Date(job.closes_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewDetail(job)}
                            className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                          >
                            <Eye className="h-4 w-4 mr-2" /> Detail
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(job)}
                            className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                          >
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => toggleStatus(job.id, job.status)} 
                            className={`${job.status === 'active' ? 'hover:bg-destructive/10' : 'hover:bg-success/10'} transition-all duration-200`}
                          >
                            {job.status === "active" ? <ToggleRight className="h-5 w-5 text-destructive" /> : <ToggleLeft className="h-5 w-5 text-success" />}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="hover:bg-muted transition-colors">
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Lowongan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Judul Posisi <span className="text-destructive">*</span></Label>
              <Input 
                placeholder="Contoh: Senior Frontend Developer" 
                value={editJob.title} 
                onChange={(e) => setEditJob({ ...editJob, title: e.target.value })} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Departemen</Label>
                <Select value={editJob.department} onValueChange={(v) => setEditJob({ ...editJob, department: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lokasi</Label>
                <Input 
                  placeholder="Jakarta" 
                  value={editJob.location} 
                  onChange={(e) => setEditJob({ ...editJob, location: e.target.value })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipe Pekerjaan</Label>
                <Select value={editJob.employment_type} onValueChange={(v) => setEditJob({ ...editJob, employment_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gaji Min (Rp)</Label>
                <Input 
                  type="number"
                  placeholder="15000000" 
                  value={editJob.min_salary} 
                  onChange={(e) => setEditJob({ ...editJob, min_salary: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Gaji Max (Rp)</Label>
                <Input 
                  type="number"
                  placeholder="25000000" 
                  value={editJob.max_salary} 
                  onChange={(e) => setEditJob({ ...editJob, max_salary: e.target.value })} 
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input 
                  type="date" 
                  value={editJob.closes_at} 
                  onChange={(e) => setEditJob({ ...editJob, closes_at: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editJob.status} onValueChange={(v) => setEditJob({ ...editJob, status: v })}>
                  <SelectTrigger><SelectValue placeholder="Pilih" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="closed">Ditutup</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi Pekerjaan</Label>
              <Textarea 
                placeholder="Jelaskan tanggung jawab dan deskripsi pekerjaan..." 
                rows={4} 
                value={editJob.description} 
                onChange={(e) => setEditJob({ ...editJob, description: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Kualifikasi</Label>
              <Textarea 
                placeholder="Satu kualifikasi per baris..." 
                rows={3} 
                value={editJob.requirements} 
                onChange={(e) => setEditJob({ ...editJob, requirements: e.target.value })} 
              />
            </div>
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
