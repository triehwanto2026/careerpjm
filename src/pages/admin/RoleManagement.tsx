import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Shield, Check, X, Save, RefreshCw, Search, Filter } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_PAGES, ADMIN_PAGE_PATHS, isSuperAdmin } from "@/config/adminPages";

interface AdminRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  created_at: string;
}

const AVAILABLE_PAGES = ADMIN_PAGES;

const SWAL_THEME = {
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  confirmButtonColor: "hsl(168, 76%, 42%)",
};

const RoleManagement = () => {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
  });

  const loadRoles = async () => {
    const { data, error } = await supabase
      .from("admin_roles")
      .select("*")
      .order("name");
    if (error) {
      console.error("Error loading roles:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal memuat data role",
        text: error.message,
        ...SWAL_THEME,
      });
    } else {
      const mappedRoles = (data || []).map((r) => {
        let perms: string[] = [];
        if (Array.isArray(r.permissions)) {
          perms = r.permissions as string[];
        } else if (typeof r.permissions === "string") {
          try {
            const parsed = JSON.parse(r.permissions);
            perms = Array.isArray(parsed) ? parsed : [];
          } catch {
            perms = [];
          }
        }
        return {
          id: r.id,
          name: r.name,
          description: r.description || "",
          permissions: isSuperAdmin(r.name) ? Array.from(new Set([...perms, ...ADMIN_PAGE_PATHS])) : perms,
          created_at: r.created_at,
        };
      });
      setRoles(mappedRoles);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const resetForm = () => {
    setFormData({ name: "", description: "", permissions: [] });
    setEditingRole(null);
    setShowForm(false);
  };

  const handlePermissionToggle = (path: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(path)
        ? prev.permissions.filter((p) => p !== path)
        : [...prev.permissions, path],
    }));
  };

  const handleSelectAll = () => {
    const allPaths = AVAILABLE_PAGES.map((p) => p.path);
    const allSelected = allPaths.every((p) => formData.permissions.includes(p));
    setFormData((prev) => ({
      ...prev,
      permissions: allSelected ? [] : allPaths,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Nama role wajib diisi",
        ...SWAL_THEME,
      });
      return;
    }

    if (formData.permissions.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Pilih minimal 1 halaman",
        text: "Role harus memiliki akses ke minimal 1 halaman",
        ...SWAL_THEME,
      });
      return;
    }

    setLoading(true);

    if (editingRole) {
      const { data: updatedRows, error } = await supabase
        .from("admin_roles")
        .update({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        })
        .eq("id", editingRole.id)
        .select();

      if (error) {
        Swal.fire({
          icon: "error",
          title: "Gagal update role",
          text: error.message,
          ...SWAL_THEME,
        });
        setLoading(false);
        return;
      }

      if (!updatedRows || updatedRows.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "Update tidak berhasil",
          text: "Role tidak ditemukan atau Anda tidak memiliki izin untuk mengubahnya. Pastikan RLS policy sudah benar.",
          ...SWAL_THEME,
        });
        setLoading(false);
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Role berhasil diupdate",
        timer: 1500,
        showConfirmButton: false,
        ...SWAL_THEME,
      });
    } else {
      const { data: insertedRows, error } = await supabase
        .from("admin_roles")
        .insert({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        })
        .select();

      if (error) {
        Swal.fire({
          icon: "error",
          title: "Gagal tambah role",
          text: error.message,
          ...SWAL_THEME,
        });
        setLoading(false);
        return;
      }

      if (!insertedRows || insertedRows.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "Tambah role tidak berhasil",
          text: "Role tidak berhasil disimpan. Pastikan RLS policy sudah benar.",
          ...SWAL_THEME,
        });
        setLoading(false);
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Role berhasil ditambahkan",
        timer: 1500,
        showConfirmButton: false,
        ...SWAL_THEME,
      });
    }

    resetForm();
    await loadRoles();
    setLoading(false);
  };

  const handleEdit = (role: AdminRole) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: isSuperAdmin(role.name) ? ADMIN_PAGE_PATHS : (role.permissions || []),
    });
    setShowForm(true);
  };

  const handleDelete = async (role: AdminRole) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Hapus Role?",
      text: `Yakin ingin menghapus role "${role.name}"? Role yang sedang digunakan user tidak bisa dihapus.`,
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "hsl(0, 72%, 51%)",
      ...SWAL_THEME,
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    const { error } = await supabase
      .from("admin_roles")
      .delete()
      .eq("id", role.id);

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal hapus role",
        text: error.message,
        ...SWAL_THEME,
      });
    } else {
      Swal.fire({
        icon: "success",
        title: "Role berhasil dihapus",
        timer: 1500,
        showConfirmButton: false,
        ...SWAL_THEME,
      });
      await loadRoles();
    }
    setLoading(false);
  };

  if (loading && roles.length === 0) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manajemen Role</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Atur role dan hak akses halaman untuk admin
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadRoles()}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition"
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:brightness-110 transition"
            >
              <Plus className="h-4 w-4" />
              Tambah Role
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama role atau deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Role</p>
                <p className="text-2xl font-bold text-foreground">{roles.length}</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Halaman</p>
                <p className="text-2xl font-bold text-foreground">{AVAILABLE_PAGES.length}</p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Role Aktif</p>
                <p className="text-2xl font-bold text-foreground">
                  {roles.filter((r) => r.permissions.length > 0).length}
                </p>
              </div>
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Check className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rata-rata Akses</p>
                <p className="text-2xl font-bold text-foreground">
                  {roles.length > 0
                    ? Math.round(
                        roles.reduce((acc, r) => acc + r.permissions.length, 0) / roles.length
                      )
                    : 0}
                </p>
              </div>
              <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-card p-5 glow-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {editingRole ? "Edit Role" : "Tambah Role Baru"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Nama Role <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
                    placeholder="Contoh: Admin, Viewer, Editor"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Deskripsi
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
                    placeholder="Deskripsi singkat role ini"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                    Hak Akses Halaman <span className="text-destructive">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-xs text-primary hover:underline"
                  >
                    {formData.permissions.length === AVAILABLE_PAGES.length
                      ? "Batal Pilih Semua"
                      : "Pilih Semua"}
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {AVAILABLE_PAGES.map((page) => {
                    const checked = formData.permissions.includes(page.path);
                    return (
                      <button
                        key={page.path}
                        type="button"
                        onClick={() => handlePermissionToggle(page.path)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                          checked
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {checked ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded border border-muted-foreground/30" />
                        )}
                        {page.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.permissions.length} halaman dipilih
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all"
                >
                  <Save className="h-4 w-4" />
                  {editingRole ? "Update Role" : "Simpan Role"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Roles Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden glow-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Deskripsi</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Akses Halaman</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {roles
                  .filter(role => 
                    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    role.description.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((role) => (
                  <tr
                    key={role.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{role.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{role.description || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(role.permissions || []).slice(0, 4).map((path) => {
                          const page = AVAILABLE_PAGES.find((p) => p.path === path);
                          return (
                            <span
                              key={path}
                              className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                            >
                              {page?.label || path}
                            </span>
                          );
                        })}
                        {(role.permissions || []).length > 4 && (
                          <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            +{(role.permissions || []).length - 4} lainnya
                          </span>
                        )}
                        {(role.permissions || []).length === 0 && (
                          <span className="text-xs text-muted-foreground">Tidak ada akses</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(role)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(role)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {roles.filter(role => 
                  role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  role.description.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      {searchTerm ? "Tidak ada hasil pencarian" : "Belum ada role. Klik \"Tambah Role\" untuk membuat role baru."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default RoleManagement;
