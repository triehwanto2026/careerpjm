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
}

const SWAL_THEME = {
  background: "hsl(var(--card))" as string,
  color: "hsl(var(--foreground))" as string,
  confirmButtonColor: "hsl(168, 76%, 42%)" as string,
};

const Settings = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("branding");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const categories = [
    { id: "branding", name: "Branding", icon: Palette, description: "Logo, warna, header, footer" },
    { id: "login", name: "Halaman Login", icon: Layout, description: "Tampilan halaman login" },
    { id: "system", name: "Sistem", icon: Shield, description: "Konfigurasi sistem" },
    { id: "email", name: "Email", icon: Mail, description: "Pengaturan email" },
  ];

  const loadSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .order("category, key");

    if (error) {
      console.error("Error loading settings:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal memuat pengaturan",
        text: error.message,
        ...SWAL_THEME,
      });
    } else {
      const loaded = (data as Setting[]) || [];
      setSettings(loaded);
      const initialData: Record<string, string> = {};
      loaded.forEach((s) => {
        initialData[s.key] = s.value;
      });
      setFormData(initialData);
      setHasChanges(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      // Check if any value differs from original
      const original = settings.find((s) => s.key === key)?.value;
      const anyChanged = Object.entries(next).some(([k, v]) => {
        const orig = settings.find((s) => s.key === k)?.value;
        return v !== orig;
      });
      setHasChanges(anyChanged);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const errors: string[] = [];
    let successCount = 0;

    for (const [key, value] of Object.entries(formData)) {
      const originalValue = settings.find((s) => s.key === key)?.value;
      if (value === originalValue) continue; // Skip unchanged

      const { data: updatedRows, error } = await supabase
        .from("app_settings")
        .update({ value })
        .eq("key", key)
        .select();

      if (error) {
        errors.push(`${key}: ${error.message}`);
      } else if (!updatedRows || updatedRows.length === 0) {
        errors.push(`${key}: Tidak berhasil disimpan (cek RLS policy)`);
      } else {
        successCount++;
      }
    }

    if (errors.length > 0) {
      await Swal.fire({
        icon: "warning",
        title: `${successCount} tersimpan, ${errors.length} gagal`,
        html: `<div style="text-align:left;font-size:12px;">${errors.map((e) => `• ${e}`).join("<br>")}</div>`,
        ...SWAL_THEME,
      });
    } else if (successCount > 0) {
      await Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: `${successCount} pengaturan berhasil disimpan`,
        timer: 1500,
        showConfirmButton: false,
        ...SWAL_THEME,
      });
      setHasChanges(false);
    } else {
      await Swal.fire({
        icon: "info",
        title: "Tidak ada perubahan",
        text: "Tidak ada pengaturan yang diubah",
        timer: 1500,
        showConfirmButton: false,
        ...SWAL_THEME,
      });
    }

    await loadSettings();
    setSaving(false);
  };

  const handleImageUpload = async (settingKey: string, file: File) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${settingKey}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("settings-images")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("settings-images")
        .getPublicUrl(fileName);

      handleFieldChange(settingKey, urlData.publicUrl);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Gambar berhasil diupload",
        timer: 1500,
        showConfirmButton: false,
        ...SWAL_THEME,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("Upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal Upload",
        text: `Terjadi kesalahan saat mengupload gambar: ${errMsg}`,
        ...SWAL_THEME,
      });
    }
  };

  const handleReset = async () => {
    if (!hasChanges) {
      await Swal.fire({
        icon: "info",
        title: "Tidak ada perubahan",
        text: "Belum ada pengaturan yang diubah",
        timer: 1500,
        showConfirmButton: false,
        ...SWAL_THEME,
      });
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Batalkan Perubahan?",
      text: "Perubahan yang belum disimpan akan dibatalkan",
      showCancelButton: true,
      confirmButtonText: "Ya, Batalkan",
      cancelButtonText: "Tetap Edit",
      confirmButtonColor: "hsl(0, 72%, 51%)",
      ...SWAL_THEME,
    });

    if (result.isConfirmed) {
      await loadSettings();
    }
  };

  const renderField = (setting: Setting) => {
    const currentValue = formData[setting.key] || "";
    const originalValue = settings.find((s) => s.key === setting.key)?.value || "";
    const isChanged = currentValue !== originalValue;

    const baseInputClass =
      "w-full px-3 py-2 rounded-lg border bg-background text-sm text-foreground outline-none transition-colors";
    const borderClass = isChanged
      ? "border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
      : "border-input focus:border-primary";

    switch (setting.value_type) {
      case "boolean":
        return (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleFieldChange(setting.key, currentValue === "true" ? "false" : "true")}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                currentValue === "true" ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  currentValue === "true" ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-muted-foreground">
              {currentValue === "true" ? "Aktif" : "Nonaktif"}
            </span>
            {isChanged && <span className="text-xs text-primary font-medium">(diubah)</span>}
          </div>
        );
      case "number":
        return (
          <input
            type="number"
            value={currentValue}
            onChange={(e) => handleFieldChange(setting.key, e.target.value)}
            className={`${baseInputClass} ${borderClass}`}
          />
        );
      case "image_url":
        return (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={currentValue}
                onChange={(e) => handleFieldChange(setting.key, e.target.value)}
                placeholder="https://..."
                className={`${baseInputClass} ${borderClass} flex-1`}
              />
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all cursor-pointer shrink-0">
                <Upload className="h-4 w-4" />
                <span className="text-sm font-medium">Upload</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(setting.key, file);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
            {currentValue && (
              <div className="relative border border-border rounded-lg p-2 inline-block">
                <img
                  src={currentValue}
                  alt="Preview"
                  className="max-h-32 object-contain rounded"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => handleFieldChange(setting.key, "")}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                  title="Hapus gambar"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        );
      case "json":
        return (
          <textarea
            value={currentValue}
            onChange={(e) => handleFieldChange(setting.key, e.target.value)}
            rows={4}
            placeholder='{"key": "value"}'
            className={`${baseInputClass} ${borderClass} font-mono text-xs`}
          />
        );
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => handleFieldChange(setting.key, e.target.value)}
            className={`${baseInputClass} ${borderClass}`}
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm"
              disabled={loading || !hasChanges}
            >
              <RefreshCw className="h-4 w-4" />
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading || !hasChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                hasChanges
                  ? "bg-primary text-primary-foreground hover:brightness-110"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              <Save className="h-4 w-4" />
              {saving ? "Menyimpan..." : hasChanges ? "Simpan Perubahan" : "Tersimpan"}
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
                          {setting.key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </label>
                        {setting.is_public && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                            Publik
                          </span>
                        )}
                        {(formData[setting.key] || "") !== (settings.find((s) => s.key === setting.key)?.value || "") && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Diubah
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
