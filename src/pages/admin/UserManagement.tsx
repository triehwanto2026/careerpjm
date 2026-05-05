import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, User, Check, X, Save, Lock, Unlock } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

interface AdminRole {
  id: string;
  name: string;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role_id: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  admin_roles?: { name: string } | null;
}

const SWAL_THEME = {
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  confirmButtonColor: "hsl(168, 76%, 42%)",
};

// Simple hash function for demo - in production use bcrypt
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const UserManagement = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    role_id: "",
    is_active: true,
  });

  const loadData = async () => {
    setLoading(true);

    const [{ data: usersData, error: usersError }, { data: rolesData, error: rolesError }] =
      await Promise.all([
        supabase
          .from("admin_users")
          .select("*, admin_roles(name)")
          .order("created_at", { ascending: false }),
        supabase.from("admin_roles").select("id, name").order("name"),
      ]);

    if (usersError) console.error("Error loading users:", usersError);
    if (rolesError) console.error("Error loading roles:", rolesError);

    setUsers((usersData as AdminUser[]) || []);
    setRoles((rolesData as AdminRole[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      full_name: "",
      role_id: "",
      is_active: true,
    });
    setEditingUser(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.email.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Username dan email wajib diisi",
        ...SWAL_THEME,
      });
      return;
    }

    if (!editingUser && !formData.password.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Password wajib diisi",
        ...SWAL_THEME,
      });
      return;
    }

    if (!formData.role_id) {
      Swal.fire({
        icon: "warning",
        title: "Pilih role untuk user",
        ...SWAL_THEME,
      });
      return;
    }

    setLoading(true);

    if (editingUser) {
      const updateData: {
        username: string;
        email: string;
        full_name: string;
        role_id: string;
        is_active: boolean;
        password_hash?: string;
      } = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        role_id: formData.role_id,
        is_active: formData.is_active,
      };

      if (formData.password.trim()) {
        updateData.password_hash = await hashPassword(formData.password);
      }

      const { data: updatedRows, error } = await supabase
        .from("admin_users")
        .update(updateData)
        .eq("id", editingUser.id)
        .select();

      if (error) {
        Swal.fire({
          icon: "error",
          title: "Gagal update user",
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
          text: "User tidak ditemukan atau Anda tidak memiliki izin. Pastikan RLS policy sudah benar.",
          ...SWAL_THEME,
        });
        setLoading(false);
        return;
      }

      Swal.fire({
        icon: "success",
        title: "User berhasil diupdate",
        timer: 1500,
        showConfirmButton: false,
        ...SWAL_THEME,
      });
    } else {
      const passwordHash = await hashPassword(formData.password);

      const { data: insertedRows, error } = await supabase
        .from("admin_users")
        .insert({
          username: formData.username,
          email: formData.email,
          password_hash: passwordHash,
          full_name: formData.full_name,
          role_id: formData.role_id,
          is_active: formData.is_active,
        })
        .select();

      if (error) {
        Swal.fire({
          icon: "error",
          title: "Gagal tambah user",
          text: error.message,
          ...SWAL_THEME,
        });
        setLoading(false);
        return;
      }

      if (!insertedRows || insertedRows.length === 0) {
        Swal.fire({
          icon: "warning",
          title: "Tambah user tidak berhasil",
          text: "User tidak berhasil disimpan. Pastikan RLS policy sudah benar.",
          ...SWAL_THEME,
        });
        setLoading(false);
        return;
      }

      Swal.fire({
        icon: "success",
        title: "User berhasil ditambahkan",
        timer: 1500,
        showConfirmButton: false,
        ...SWAL_THEME,
      });
    }

    resetForm();
    await loadData();
    setLoading(false);
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      full_name: user.full_name,
      role_id: user.role_id || "",
      is_active: user.is_active,
    });
    setShowForm(true);
  };

  const handleToggleActive = async (user: AdminUser) => {
    const { error } = await supabase
      .from("admin_users")
      .update({ is_active: !user.is_active })
      .eq("id", user.id);

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal update status",
        text: error.message,
        ...SWAL_THEME,
      });
    } else {
      await loadData();
    }
  };

  const handleDelete = async (user: AdminUser) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Hapus User?",
      text: `Yakin ingin menghapus user "${user.username}"? Tindakan ini tidak bisa dibatalkan.`,
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "hsl(0, 72%, 51%)",
      ...SWAL_THEME,
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    const { error } = await supabase.from("admin_users").delete().eq("id", user.id);

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal hapus user",
        text: error.message,
        ...SWAL_THEME,
      });
    } else {
      Swal.fire({
        icon: "success",
        title: "User berhasil dihapus",
        timer: 1500,
        showConfirmButton: false,
        ...SWAL_THEME,
      });
      await loadData();
    }
    setLoading(false);
  };

  if (loading && users.length === 0) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manajemen User</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola admin user dan akses login ke panel admin
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Batal" : "Tambah User"}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-card p-5 glow-border">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {editingUser ? "Edit User" : "Tambah User Baru"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Username <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, username: e.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
                    placeholder="Username login"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
                    placeholder="email@domain.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Password {editingUser ? "(kosongkan jika tidak diubah)" : <span className="text-destructive">*</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
                    placeholder={editingUser ? "••••••••" : "Password"}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
                    placeholder="Nama lengkap user"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">
                    Role <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={formData.role_id}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, role_id: e.target.value }))
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
                  >
                    <option value="">Pilih Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">User aktif</span>
                  </label>
                </div>
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
                  {editingUser ? "Update User" : "Simpan User"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden glow-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Login Terakhir</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground w-28">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                          {user.full_name && (
                            <p className="text-xs text-muted-foreground">{user.full_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {user.admin_roles?.name || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          user.is_active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {user.is_active ? (
                          <Unlock className="h-3 w-3" />
                        ) : (
                          <Lock className="h-3 w-3" />
                        )}
                        {user.is_active ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleString("id-ID")
                        : "Belum pernah login"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(user)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Belum ada user. Klik "Tambah User" untuk membuat user baru.
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

export default UserManagement;
