import { useEffect, useState } from "react";
import { Save, RefreshCw, Image, Palette, Settings as SettingsIcon, Home, Mail, Shield, Layout, Upload, X, Database, Download, Plus, Archive, HardDrive, Trash2, AlertTriangle, FileDown } from "lucide-react";
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

type BackupFormat = "json" | "postgresql" | "mysql" | "full";
type StorageBackupMode = "manifest" | "full";
type MaintenanceActionId =
  | "expired_codes"
  | "old_test_sessions"
  | "old_notifications"
  | "old_activity_logs"
  | "old_storage_files"
  | "backup_bucket_files";

interface StorageObjectBackup {
  bucket: string;
  path: string;
  id?: string;
  name?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  last_accessed_at?: string;
  size?: number;
  mime_type?: string;
  base64?: string;
  download_error?: string;
}

const SWAL_THEME = {
  background: "hsl(var(--card))" as string,
  color: "hsl(var(--foreground))" as string,
  confirmButtonColor: "hsl(168, 76%, 42%)" as string,
};

const TABLES_TO_BACKUP = [
  "admin_roles",
  "admin_users",
  "app_settings",
  "activation_codes",
  "candidates",
  "candidate_profiles",
  "candidate_documents",
  "candidate_family_members",
  "candidate_education_history",
  "candidate_informal_education",
  "candidate_work_experience",
  "candidate_skills",
  "candidate_languages",
  "candidate_auth",
  "candidate_otps",
  "job_vacancies",
  "job_applications",
  "test_instruments",
  "test_questions",
  "test_question_options",
  "test_answer_keys",
  "test_interpretations",
  "test_sessions",
  "test_results",
  "notifications",
  "notification_templates",
  "activity_logs",
];

const STORAGE_BUCKETS = [
  "settings-images",
  "candidate-photos",
  "candidate-documents",
  "test-images",
  "database-backups",
  "app-backups",
];

const sqlIdentifier = (name: string, dialect: "postgresql" | "mysql") =>
  dialect === "mysql" ? `\`${name.replace(/`/g, "``")}\`` : `"${name.replace(/"/g, '""')}"`;

const sqlValue = (value: unknown, dialect: "postgresql" | "mysql") => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return dialect === "mysql" ? (value ? "1" : "0") : value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "object") return `'${JSON.stringify(value).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
};

const generateInsertSql = (tables: Record<string, any[]>, dialect: "postgresql" | "mysql") => {
  const generatedAt = new Date().toISOString();
  let sql = `-- CareerPJM backup\n-- Generated: ${generatedAt}\n-- Dialect: ${dialect}\n\n`;
  if (dialect === "mysql") {
    sql += "SET FOREIGN_KEY_CHECKS=0;\nSTART TRANSACTION;\n\n";
  } else {
    sql += "BEGIN;\n\n";
  }

  Object.entries(tables).forEach(([table, rows]) => {
    sql += `-- Table: ${table}\n`;
    if (!rows.length) {
      sql += `-- No rows\n\n`;
      return;
    }

    rows.forEach((row) => {
      const columns = Object.keys(row);
      const columnSql = columns.map((column) => sqlIdentifier(column, dialect)).join(", ");
      const valuesSql = columns.map((column) => sqlValue(row[column], dialect)).join(", ");
      sql += `INSERT INTO ${sqlIdentifier(table, dialect)} (${columnSql}) VALUES (${valuesSql});\n`;
    });
    sql += "\n";
  });

  sql += dialect === "mysql" ? "COMMIT;\nSET FOREIGN_KEY_CHECKS=1;\n" : "COMMIT;\n";
  return sql;
};

const downloadTextFile = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const Settings = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("branding");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [backupFormat, setBackupFormat] = useState<BackupFormat>("full");
  const [storageBackupMode, setStorageBackupMode] = useState<StorageBackupMode>("manifest");
  const [includeStorage, setIncludeStorage] = useState(true);
  const [maintenanceDays, setMaintenanceDays] = useState(30);
  const [maintenanceLoading, setMaintenanceLoading] = useState<MaintenanceActionId | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);

  const categories = [
    { id: "branding", name: "Branding", icon: Palette, description: "Logo, warna, header, footer" },
    { id: "landing", name: "Landing Page", icon: Home, description: "Konten halaman depan, kontak, dan background" },
    { id: "login", name: "Halaman Login", icon: Layout, description: "Tampilan halaman login" },
    { id: "system", name: "Sistem", icon: Shield, description: "Konfigurasi sistem" },
    { id: "backup", name: "Backup & Maintenance", icon: Database, description: "Migrasi data, bucket, dan perawatan storage" },
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
      const anyChanged = Object.entries(next).some(([k, v]) => {
        const orig = settings.find((s) => s.key === k)?.value;
        return v !== orig;
      });
      setHasChanges(anyChanged);
      return next;
    });
  };

  const parseJsonValue = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const updateJsonList = (key: string, updater: (items: any[]) => any[]) => {
    const currentValue = formData[key] ?? settings.find((s) => s.key === key)?.value ?? "[]";
    const currentList = parseJsonValue(currentValue);
    const nextList = updater(currentList);
    handleFieldChange(key, JSON.stringify(nextList));
  };

  const landingMilestonesKey = "landing_about_milestones_items";
  const landingValuesKey = "landing_about_values_items";

  const landingMilestones = parseJsonValue(formData[landingMilestonesKey] ?? settings.find((s) => s.key === landingMilestonesKey)?.value ?? "[]");
  const landingValues = parseJsonValue(formData[landingValuesKey] ?? settings.find((s) => s.key === landingValuesKey)?.value ?? "[]");

  const addMilestone = () => updateJsonList(landingMilestonesKey, (items) => [...items, { year: "", description: "", icon: "" }]);
  const removeMilestone = (index: number) => updateJsonList(landingMilestonesKey, (items) => items.filter((_: any, i: number) => i !== index));
  const updateMilestone = (index: number, field: string, value: string) =>
    updateJsonList(landingMilestonesKey, (items) => items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

  const addValueItem = () => updateJsonList(landingValuesKey, (items) => [...items, { name: "", description: "", icon: "" }]);
  const removeValueItem = (index: number) => updateJsonList(landingValuesKey, (items) => items.filter((_: any, i: number) => i !== index));
  const updateValueItem = (index: number, field: string, value: string) =>
    updateJsonList(landingValuesKey, (items) => items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));

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

  const fetchTableData = async () => {
    const backupData: Record<string, any[]> = {};
    const skippedTables: string[] = [];

    for (const table of TABLES_TO_BACKUP) {
      const { data, error } = await supabase.from(table as any).select("*");
      if (error) {
        skippedTables.push(`${table}: ${error.message}`);
      } else {
        backupData[table] = data || [];
      }
    }

    return { backupData, skippedTables };
  };

  const listStorageObjects = async (bucket: string, prefix = ""): Promise<StorageObjectBackup[]> => {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      return [{
        bucket,
        path: prefix || "/",
        download_error: error.message,
      }];
    }

    const objects: StorageObjectBackup[] = [];

    for (const item of data || []) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (!item.id && item.metadata === null) {
        objects.push(...await listStorageObjects(bucket, path));
        continue;
      }

      const metadata = (item.metadata || {}) as Record<string, unknown>;
      const storageObject: StorageObjectBackup = {
        bucket,
        path,
        id: item.id,
        name: item.name,
        metadata,
        created_at: item.created_at,
        updated_at: item.updated_at,
        last_accessed_at: item.last_accessed_at,
        size: typeof metadata.size === "number" ? metadata.size : undefined,
        mime_type: typeof metadata.mimetype === "string" ? metadata.mimetype : undefined,
      };

      if (storageBackupMode === "full") {
        const { data: fileBlob, error: downloadError } = await supabase.storage.from(bucket).download(path);
        if (downloadError || !fileBlob) {
          storageObject.download_error = downloadError?.message || "File tidak dapat diunduh";
        } else {
          storageObject.base64 = await blobToBase64(fileBlob);
          storageObject.mime_type = fileBlob.type || storageObject.mime_type;
          storageObject.size = fileBlob.size || storageObject.size;
        }
      }

      objects.push(storageObject);
    }

    return objects;
  };

  const fetchStorageBackup = async () => {
    const objects: StorageObjectBackup[] = [];
    for (const bucket of STORAGE_BUCKETS) {
      objects.push(...await listStorageObjects(bucket));
    }
    return objects;
  };

  const handleManualBackup = async () => {
    setBackupLoading(true);
    try {
      const { backupData, skippedTables } = await fetchTableData();
      const storageObjects = includeStorage || backupFormat === "full" ? await fetchStorageBackup() : [];
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const rowCount = Object.values(backupData).reduce((total, rows) => total + rows.length, 0);

      if (backupFormat === "json") {
        downloadTextFile(`database-backup-${timestamp}.json`, JSON.stringify(backupData, null, 2), "application/json");
      } else if (backupFormat === "postgresql") {
        downloadTextFile(`database-backup-postgresql-${timestamp}.sql`, generateInsertSql(backupData, "postgresql"), "text/plain");
      } else if (backupFormat === "mysql") {
        downloadTextFile(`database-migration-mysql-${timestamp}.sql`, generateInsertSql(backupData, "mysql"), "text/plain");
      } else {
        const fullBackup = {
          version: 1,
          generated_at: new Date().toISOString(),
          source: "CareerPJM Supabase",
          database: backupData,
          storage: {
            mode: storageBackupMode,
            buckets: STORAGE_BUCKETS,
            objects: storageObjects,
          },
          migration_sql: {
            postgresql: generateInsertSql(backupData, "postgresql"),
            mysql: generateInsertSql(backupData, "mysql"),
          },
          warnings: skippedTables,
        };
        downloadTextFile(`full-backup-with-buckets-${timestamp}.json`, JSON.stringify(fullBackup, null, 2), "application/json");
      }

      await Swal.fire({
        icon: "success",
        title: "Backup Berhasil",
        html: `<div style="text-align:left;font-size:13px;">
          <div><b>${rowCount}</b> baris database diproses.</div>
          <div><b>${storageObjects.length}</b> objek bucket tercatat${storageBackupMode === "full" ? " / disalin" : ""}.</div>
          ${skippedTables.length ? `<br><b>Tabel dilewati:</b><br>${skippedTables.map((e) => `• ${e}`).join("<br>")}` : ""}
        </div>`,
        ...SWAL_THEME,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("Backup error:", error);
      await Swal.fire({
        icon: "error",
        title: "Backup Gagal",
        text: `Terjadi kesalahan: ${errMsg}`,
        ...SWAL_THEME,
      });
    }
    setBackupLoading(false);
  };

  const cutoffIso = () => new Date(Date.now() - maintenanceDays * 24 * 60 * 60 * 1000).toISOString();

  const deleteOldStorageFiles = async (bucket: string, olderThanIso: string) => {
    const objects = await listStorageObjects(bucket);
    const paths = objects
      .filter((object) => !object.download_error)
      .filter((object) => {
        const dateValue = object.updated_at || object.created_at;
        return dateValue ? dateValue < olderThanIso : false;
      })
      .map((object) => object.path);

    let deleted = 0;
    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100);
      const { data, error } = await supabase.storage.from(bucket).remove(chunk);
      if (!error) deleted += data?.length || chunk.length;
    }
    return deleted;
  };

  const runMaintenanceAction = async (actionId: MaintenanceActionId, label: string, run: () => Promise<number>) => {
    const confirmation = await Swal.fire({
      icon: "warning",
      title: label,
      text: `Data yang memenuhi kriteria akan dihapus permanen. Gunakan backup terbaru sebelum melanjutkan.`,
      input: "text",
      inputPlaceholder: "Ketik HAPUS",
      showCancelButton: true,
      confirmButtonText: "Jalankan",
      cancelButtonText: "Batal",
      confirmButtonColor: "hsl(0, 72%, 51%)",
      preConfirm: (value) => {
        if (value !== "HAPUS") {
          Swal.showValidationMessage("Ketik HAPUS untuk konfirmasi");
          return false;
        }
        return value;
      },
      ...SWAL_THEME,
    });

    if (!confirmation.isConfirmed) return;

    setMaintenanceLoading(actionId);
    try {
      const deleted = await run();
      await Swal.fire({
        icon: "success",
        title: "Maintenance Selesai",
        text: `${deleted} item berhasil dihapus.`,
        ...SWAL_THEME,
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      await Swal.fire({
        icon: "error",
        title: "Maintenance Gagal",
        text: errMsg,
        ...SWAL_THEME,
      });
    }
    setMaintenanceLoading(null);
  };

  const maintenanceActions = [
    {
      id: "expired_codes" as const,
      title: "Hapus kode aktivasi kedaluwarsa",
      description: "Membersihkan activation code yang sudah melewati tanggal kedaluwarsa.",
      icon: Trash2,
      run: async () => {
        const { data, error } = await supabase.from("activation_codes" as any).delete().lt("expires_at", new Date().toISOString()).select("id");
        if (error) throw error;
        return data?.length || 0;
      },
    },
    {
      id: "old_test_sessions" as const,
      title: "Hapus sesi tes lama",
      description: `Menghapus test session lebih lama dari ${maintenanceDays} hari.`,
      icon: RefreshCw,
      run: async () => {
        const { data, error } = await supabase.from("test_sessions" as any).delete().lt("created_at", cutoffIso()).select("id");
        if (error) throw error;
        return data?.length || 0;
      },
    },
    {
      id: "old_notifications" as const,
      title: "Hapus notifikasi lama",
      description: `Membersihkan notifikasi lebih lama dari ${maintenanceDays} hari.`,
      icon: Mail,
      run: async () => {
        const { data, error } = await supabase.from("notifications" as any).delete().lt("created_at", cutoffIso()).select("id");
        if (error) throw error;
        return data?.length || 0;
      },
    },
    {
      id: "old_activity_logs" as const,
      title: "Hapus activity logs lama",
      description: `Membersihkan log aktivitas lebih lama dari ${maintenanceDays} hari.`,
      icon: Archive,
      run: async () => {
        const { data, error } = await supabase.from("activity_logs" as any).delete().lt("created_at", cutoffIso()).select("id");
        if (error) throw error;
        return data?.length || 0;
      },
    },
    {
      id: "old_storage_files" as const,
      title: "Hapus file bucket lama",
      description: `Membersihkan file storage lebih lama dari ${maintenanceDays} hari di bucket aplikasi.`,
      icon: HardDrive,
      run: async () => {
        let deleted = 0;
        for (const bucket of STORAGE_BUCKETS.filter((bucket) => !["database-backups", "app-backups"].includes(bucket))) {
          deleted += await deleteOldStorageFiles(bucket, cutoffIso());
        }
        return deleted;
      },
    },
    {
      id: "backup_bucket_files" as const,
      title: "Hapus file backup di bucket",
      description: "Menghapus isi bucket database-backups dan app-backups agar storage tidak penuh.",
      icon: AlertTriangle,
      run: async () => {
        let deleted = 0;
        for (const bucket of ["database-backups", "app-backups"]) {
          deleted += await deleteOldStorageFiles(bucket, new Date(Date.now() + 1000).toISOString());
        }
        return deleted;
      },
    },
  ];

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

  const landingKeys = [
    "landing_header_title",
    "landing_header_subtitle",
    "landing_contact_email",
    "landing_contact_phone",
    "landing_contact_address",
    "landing_about_vision",
    "landing_about_mission",
    "landing_about_milestones",
    "landing_about_values",
    "landing_hero_background_url",
    "landing_about_milestones_items",
    "landing_about_values_items",
  ];

  const categorySettings = settings.filter(s => {
    if (activeCategory === "backup") {
      // Backup settings are stored in "system" category
      return ["auto_backup_enabled", "auto_backup_period", "auto_backup_format", "backup_retention_days"].includes(s.key);
    }
    if (activeCategory === "landing") {
      return landingKeys.includes(s.key) && ![landingMilestonesKey, landingValuesKey, "landing_about_milestones", "landing_about_values"].includes(s.key);
    }
    if (activeCategory === "branding") {
      return s.category === "branding" && !landingKeys.includes(s.key);
    }
    return s.category === activeCategory;
  });

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
              ) : activeCategory === "backup" ? (
                <div className="space-y-8">
                  {/* Manual Backup Section */}
                  <div className="border border-border rounded-lg p-6 bg-muted/30">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                      <FileDown className="h-5 w-5 text-primary" />
                      Backup & Migrasi Manual
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Download backup database untuk arsip, migrasi PostgreSQL, migrasi MySQL, atau paket lengkap beserta bucket storage.
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Format Backup</label>
                        <select
                          value={backupFormat}
                          onChange={(e) => setBackupFormat(e.target.value as BackupFormat)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary"
                        >
                          <option value="full">Paket Lengkap + SQL Migrasi</option>
                          <option value="mysql">SQL Migrasi MySQL</option>
                          <option value="postgresql">SQL PostgreSQL</option>
                          <option value="json">JSON Database</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Mode Bucket</label>
                        <select
                          value={storageBackupMode}
                          onChange={(e) => setStorageBackupMode(e.target.value as StorageBackupMode)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground outline-none focus:border-primary"
                        >
                          <option value="manifest">Manifest file bucket</option>
                          <option value="full">Manifest + isi file base64</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-4 rounded-lg border border-border bg-background p-4">
                      <label className="flex items-center gap-3 text-sm text-foreground">
                        <input
                          type="checkbox"
                          checked={includeStorage || backupFormat === "full"}
                          disabled={backupFormat === "full"}
                          onChange={(e) => setIncludeStorage(e.target.checked)}
                          className="h-4 w-4 accent-primary"
                        />
                        Sertakan data bucket storage
                      </label>
                      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <div className="rounded-md bg-muted p-3">
                          <span className="font-medium text-foreground">Database:</span> {TABLES_TO_BACKUP.length} tabel utama akan diekspor.
                        </div>
                        <div className="rounded-md bg-muted p-3">
                          <span className="font-medium text-foreground">Bucket:</span> {STORAGE_BUCKETS.join(", ")}.
                        </div>
                      </div>
                      <button
                        onClick={handleManualBackup}
                        disabled={backupLoading}
                        className="flex w-fit items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {backupLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                            Backup...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Buat & Download Backup
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Maintenance Section */}
                  <div className="border border-border rounded-lg p-6 bg-muted/30">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-primary" />
                      Maintenance Aplikasi
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Bersihkan data operasional dan file lama agar database serta storage tidak penuh. Jalankan backup sebelum menghapus data.
                    </p>
                    <div className="mb-4 max-w-xs space-y-2">
                      <label className="text-sm font-medium text-foreground">Batas data lama (hari)</label>
                      <input
                        type="number"
                        min={1}
                        value={maintenanceDays}
                        onChange={(e) => setMaintenanceDays(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {maintenanceActions.map((action) => {
                        const Icon = action.icon;
                        const isRunning = maintenanceLoading === action.id;
                        return (
                          <div key={action.id} className="rounded-lg border border-border bg-background p-4">
                            <div className="mb-3 flex items-start gap-3">
                              <Icon className="mt-0.5 h-5 w-5 text-primary" />
                              <div>
                                <h4 className="text-sm font-semibold text-foreground">{action.title}</h4>
                                <p className="text-xs text-muted-foreground">{action.description}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!!maintenanceLoading}
                              onClick={() => runMaintenanceAction(action.id, action.title, action.run)}
                              className="inline-flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive transition hover:bg-destructive hover:text-destructive-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isRunning ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              {isRunning ? "Memproses..." : "Jalankan"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Auto Backup Settings */}
                  <div className="border border-border rounded-lg p-6 bg-muted/30">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      Backup Otomatis
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Konfigurasi backup otomatis berdasarkan periode yang ditentukan.
                    </p>
                    <div className="space-y-4">
                      {categorySettings.map((setting) => (
                        <div key={setting.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-foreground">
                              {setting.key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </label>
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
                  </div>
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

                  <div className="rounded-xl border border-border bg-muted/40 p-5">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">Milestone Halaman Depan</h3>
                        <p className="text-sm text-muted-foreground">Tambahkan tahun dan keterangan milestone yang akan tampil di landing page.</p>
                      </div>
                      <button
                        type="button"
                        onClick={addMilestone}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition"
                      >
                        <Plus className="h-4 w-4" /> Tambah Baris
                      </button>
                    </div>
                    <div className="space-y-4">
                      {landingMilestones.map((item, index) => (
                        <div key={index} className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[120px_1fr]">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Tahun</label>
                            <input
                              type="text"
                              value={item.year || ""}
                              onChange={(e) => updateMilestone(index, "year", e.target.value)}
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-4">
                              <label className="text-sm font-medium text-foreground">Keterangan</label>
                              <button
                                type="button"
                                onClick={() => removeMilestone(index)}
                                className="text-sm text-destructive hover:text-destructive-foreground"
                              >
                                Hapus
                              </button>
                            </div>
                            <textarea
                              value={item.description || ""}
                              onChange={(e) => updateMilestone(index, "description", e.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none"
                            />
                          </div>
                        </div>
                      ))}
                      {landingMilestones.length === 0 && (
                        <p className="text-sm text-muted-foreground">Belum ada milestone. Tambahkan baris terlebih dahulu.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/40 p-5">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">Nilai Nilai</h3>
                        <p className="text-sm text-muted-foreground">Tambahkan nama nilai, penjelasan, dan simbol/logo untuk setiap nilai.</p>
                      </div>
                      <button
                        type="button"
                        onClick={addValueItem}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:brightness-110 transition"
                      >
                        <Plus className="h-4 w-4" /> Tambah Baris
                      </button>
                    </div>
                    <div className="space-y-4">
                      {landingValues.map((item, index) => (
                        <div key={index} className="space-y-4 rounded-xl border border-border bg-card p-4">
                          <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-4">
                                <label className="text-sm font-medium text-foreground">Nama Nilai</label>
                                <button
                                  type="button"
                                  onClick={() => removeValueItem(index)}
                                  className="text-sm text-destructive hover:text-destructive-foreground"
                                >
                                  Hapus
                                </button>
                              </div>
                              <input
                                type="text"
                                value={item.name || ""}
                                onChange={(e) => updateValueItem(index, "name", e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">Simbol / Logo</label>
                              <input
                                type="text"
                                value={item.icon || ""}
                                onChange={(e) => updateValueItem(index, "icon", e.target.value)}
                                placeholder="Emoji, nama icon Lucide, atau URL icon"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none"
                                list="icon-suggestions"
                              />
                              <p className="text-xs text-muted-foreground">Pilih dari daftar atau ketik emoji, nama ikon Lucide, atau URL gambar.</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Penjelasan</label>
                            <textarea
                              value={item.description || ""}
                              onChange={(e) => updateValueItem(index, "description", e.target.value)}
                              rows={3}
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none"
                            />
                          </div>
                        </div>
                      ))}
                      {landingValues.length === 0 && (
                        <p className="text-sm text-muted-foreground">Belum ada nilai. Tambahkan baris terlebih dahulu.</p>
                      )}
                    <datalist id="icon-suggestions">
                      {[
                        "Award",
                        "Badge",
                        "Briefcase",
                        "Building2",
                        "Calendar",
                        "CheckCircle2",
                        "ClipboardText",
                        "Globe",
                        "Heart",
                        "Lightbulb",
                        "MapPin",
                        "Rocket",
                        "Shield",
                        "Sparkles",
                        "Star",
                        "Target",
                        "ThumbsUp",
                        "TrendingUp",
                        "Users",
                        "Zap",
                        "🤝",
                        "💼",
                        "⚡",
                        "❤️",
                        "🌟",
                      ].map((icon) => (
                        <option key={icon} value={icon} />
                      ))}
                    </datalist>
                    </div>
                  </div>
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
