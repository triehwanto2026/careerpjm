import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Shield, Save, KeyRound, Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

interface AdminSession {
  id: string;
  username: string;
  full_name: string;
  role_id: string;
  role_name: string;
  permissions: string[];
}

const SWAL_THEME = {
  background: "hsl(var(--card))" as string,
  color: "hsl(var(--foreground))" as string,
  confirmButtonColor: "hsl(168, 76%, 42%)" as string,
};

const Profile = () => {
  const navigate = useNavigate();
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    const sessionData = sessionStorage.getItem("psytest_admin_user");
    if (!sessionData) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(sessionData) as AdminSession;
      setAdminSession(parsed);
      setFormData({
        full_name: parsed.full_name || "",
        username: parsed.username || "",
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch {
      navigate("/login", { replace: true });
    }
    setLoading(false);
  }, [navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileUpdate = async () => {
    if (!adminSession) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("admin_users")
        .update({
          full_name: formData.full_name,
          username: formData.username,
        })
        .eq("id", adminSession.id);

      if (error) {
        throw error;
      }

      // Update session
      const updatedSession = {
        ...adminSession,
        full_name: formData.full_name,
        username: formData.username,
      };
      sessionStorage.setItem("psytest_admin_user", JSON.stringify(updatedSession));
      setAdminSession(updatedSession);

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Profil berhasil diperbarui",
        timer: 2000,
        showConfirmButton: false,
        ...SWAL_THEME,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: `Terjadi kesalahan: ${errMsg}`,
        ...SWAL_THEME,
      });
    }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (!adminSession) return;

    if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
      await Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: "Silakan isi semua field password",
        ...SWAL_THEME,
      });
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      await Swal.fire({
        icon: "warning",
        title: "Password Tidak Cocok",
        text: "Password baru dan konfirmasi tidak sama",
        ...SWAL_THEME,
      });
      return;
    }

    if (formData.new_password.length < 6) {
      await Swal.fire({
        icon: "warning",
        title: "Password Terlalu Pendek",
        text: "Password minimal 6 karakter",
        ...SWAL_THEME,
      });
      return;
    }

    setSaving(true);
    try {
      // Hash passwords
      const hashPassword = async (password: string): Promise<string> => {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      };

      const currentPasswordHash = await hashPassword(formData.current_password);
      const newPasswordHash = await hashPassword(formData.new_password);

      // Verify current password
      const { data: user, error: verifyError } = await supabase
        .from("admin_users")
        .select("password_hash")
        .eq("id", adminSession.id)
        .single();

      if (verifyError || !user || user.password_hash !== currentPasswordHash) {
        await Swal.fire({
          icon: "error",
          title: "Password Salah",
          text: "Password saat ini tidak benar",
          ...SWAL_THEME,
        });
        setSaving(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase
        .from("admin_users")
        .update({ password_hash: newPasswordHash })
        .eq("id", adminSession.id);

      if (updateError) {
        throw updateError;
      }

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        current_password: "",
        new_password: "",
        confirm_password: "",
      }));

      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Password berhasil diubah",
        timer: 2000,
        showConfirmButton: false,
        ...SWAL_THEME,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      await Swal.fire({
        icon: "error",
        title: "Gagal",
        text: `Terjadi kesalahan: ${errMsg}`,
        ...SWAL_THEME,
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profil Admin</h1>
          <p className="text-sm text-muted-foreground">Kelola informasi profil dan password Anda</p>
        </div>

        {/* Profile Information */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Informasi Profil</h2>
              <p className="text-sm text-muted-foreground">Detail akun admin Anda</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User className="h-4 w-4 text-primary" />
                Nama Lengkap
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => handleInputChange("full_name", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Mail className="h-4 w-4 text-primary" />
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Shield className="h-4 w-4 text-primary" />
                Role
              </label>
              <input
                type="text"
                value={adminSession?.role_name || ""}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Shield className="h-4 w-4 text-primary" />
                Permissions
              </label>
              <input
                type="text"
                value={`${adminSession?.permissions?.length || 0} halaman diakses`}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm text-muted-foreground outline-none"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleProfileUpdate}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Ubah Password</h2>
              <p className="text-sm text-muted-foreground">Ganti password akun Anda</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-1">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password Saat Ini</label>
              <div className="relative">
                <input
                  type={showPassword.current ? "text" : "password"}
                  value={formData.current_password}
                  onChange={(e) => handleInputChange("current_password", e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword.current ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password Baru</label>
                <div className="relative">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    value={formData.new_password}
                    onChange={(e) => handleInputChange("new_password", e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword.new ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Konfirmasi Password Baru</label>
                <div className="relative">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    value={formData.confirm_password}
                    onChange={(e) => handleInputChange("confirm_password", e.target.value)}
                    className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword.confirm ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handlePasswordChange}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <KeyRound className="h-4 w-4" />
              {saving ? "Mengubah..." : "Ubah Password"}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Profile;
