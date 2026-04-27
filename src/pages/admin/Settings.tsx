import { useEffect, useState } from "react";
import { Save, RefreshCw, Image, Palette, Settings as SettingsIcon, Mail, Shield, Layout, Upload, X } from "lucide-react";
import Swal from "sweetalert2";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

interface Setting {
  id: string;
  key: string;
  value: string;
  value_type: string;
  category: string;
  description: string;
  is_public: boolean;
  [key: string]: any;
}

const Settings = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("branding");
  const [formData, setFormData] = useState<Record<string, string>>({});

  const categories = [
    { id: "branding", name: "Branding", icon: Palette, description: "Logo, warna, header, footer" },
    { id: "login", name: "Halaman Login", icon: Layout, description: "Tampilan halaman login" },
    { id: "system", name: "Sistem", icon: Shield, description: "Konfigurasi sistem" },
    { id: "email", name: "Email", icon: Mail, description: "Pengaturan email" },
  ];

  const loadSettings = async () => {
    const { data } = await (supabase as any).from("app_settings").select("*").order("category, key");
    setSettings((data as Setting[]) || []);
    
    // Initialize form data
    const initialData: Record<string, string> = {};
    (data as Setting[])?.forEach(s => {
      initialData[s.key] = s.value;
    });
    setFormData(initialData);
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(formData).map(([key, value]) => 
        (supabase as any).from("app_settings").update({ value }).eq("key", key)
      );
      
      await Promise.all(updates);
      
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Pengaturan berhasil disimpan",
        confirmButtonColor: "#0f766e",
      });
      
      await loadSettings();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Terjadi kesalahan saat menyimpan pengaturan",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (setting: Setting, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${setting.key}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await (supabase as any).storage
        .from('settings-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = (supabase as any).storage
        .from('settings-images')
        .getPublicUrl(filePath);

      // Update form data with new URL
      setFormData(prev => ({ ...prev, [setting.key]: publicUrl }));

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Gambar berhasil diupload",
        confirmButtonColor: "#0f766e",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Upload error:', error);
      Swal.fire({
        icon: "error",
        title: "Gagal Upload",
        text: "Terjadi kesalahan saat mengupload gambar",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  const handleReset = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Reset Pengaturan?",
      text: "Pengaturan akan dikembalikan ke nilai default",
      showCancelButton: true,
      confirmButtonText: "Ya, Reset",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
    });

    if (result.isConfirmed) {
      await loadSettings();
      Swal.fire({
        icon: "success",
        title: "Direset",
        text: "Pengaturan telah dikembalikan ke nilai tersimpan",
        confirmButtonColor: "#0f766e",
      });
    }
  };

  const renderField = (setting: Setting) => {
    const handleChange = (value: string) => {
      setFormData(prev => ({ ...prev, [setting.key]: value }));
    };

    switch (setting.value_type) {
      case "boolean":
        return (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleChange(formData[setting.key] === "true" ? "false" : "true")}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                formData[setting.key] === "true" ? "bg-primary" : "bg-input"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  formData[setting.key] === "true" ? "left-7" : "left-1"
                }`}
              />
            </button>
            <span className="text-sm text-muted-foreground">
              {formData[setting.key] === "true" ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        );
      case "number":
        return (
          <input
            type="number"
            value={formData[setting.key] || ""}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        );
      case "image_url":
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={formData[setting.key] || ""}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="https://..."
                className="flex-1 px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-colors cursor-pointer">
                <Upload className="h-4 w-4" />
                <span className="text-sm font-medium">Upload</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(setting, file);
                    }
                  }}
                />
              </label>
            </div>
            {formData[setting.key] && (
              <div className="relative border border-border rounded-lg p-2">
                <img
                  src={formData[setting.key]}
                  alt="Preview"
                  className="max-w-full h-32 object-contain mx-auto"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <button
                  onClick={() => handleChange("")}
                  className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                  title="Hapus gambar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        );
      case "json":
        return (
          <textarea
            value={formData[setting.key] || ""}
            onChange={(e) => handleChange(e.target.value)}
            rows={3}
            placeholder='{"key": "value"}'
            className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
          />
        );
      default:
        return (
          <input
            type="text"
            value={formData[setting.key] || ""}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        );
    }
  };

  const categorySettings = settings.filter(s => s.category === activeCategory);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pengaturan Aplikasi</h1>
            <p className="text-sm text-muted-foreground">Kelola konfigurasi aplikasi</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar Categories */}
          <div className="lg:col-span-1">
            <div className="space-y-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                      activeCategory === cat.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{cat.name}</p>
                      <p className={`text-xs ${activeCategory === cat.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {cat.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Form */}
          <div className="lg:col-span-3">
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">
                {categories.find(c => c.id === activeCategory)?.name}
              </h2>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : categorySettings.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">
                  Tidak ada pengaturan untuk kategori ini
                </p>
              ) : (
                <div className="space-y-6">
                  {categorySettings.map((setting) => (
                    <div key={setting.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-foreground">
                          {setting.key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </label>
                        {setting.is_public && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                            Publik
                          </span>
                        )}
                      </div>
                      {setting.description && (
                        <p className="text-xs text-muted-foreground">{setting.description}</p>
                      )}
                      {renderField(setting)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
