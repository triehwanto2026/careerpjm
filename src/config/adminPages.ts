import {
  BarChart3,
  Briefcase,
  ClipboardList,
  FileText,
  KeyRound,
  LayoutDashboard,
  Settings,
  Shield,
  UserCog,
  Users,
  Workflow,
} from "lucide-react";

export interface AdminPageDefinition {
  path: string;
  label: string;
  group?: "Alat Tes" | "Manajemen Kandidat" | "Pengaturan";
  icon: React.ComponentType<{ className?: string }>;
}

// Satu-satunya registry untuk halaman admin. Setiap halaman baru cukup didaftarkan
// di sini agar otomatis muncul di sidebar dan pilihan hak akses role.
export const ADMIN_PAGES: AdminPageDefinition[] = [
  { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/test-instruments", label: "Alat Tes", group: "Alat Tes", icon: ClipboardList },
  { path: "/admin/activation-codes", label: "Kode Aktivasi", group: "Alat Tes", icon: KeyRound },
  { path: "/admin/results", label: "Hasil Tes", group: "Alat Tes", icon: BarChart3 },
  { path: "/admin/answer-keys", label: "Kunci Jawaban", group: "Alat Tes", icon: ClipboardList },
  { path: "/admin/interpretations", label: "Interpretasi", group: "Alat Tes", icon: FileText },
  { path: "/admin/candidates", label: "Daftar Kandidat", group: "Manajemen Kandidat", icon: Users },
  { path: "/admin/hr-jobs", label: "Lowongan", group: "Manajemen Kandidat", icon: Briefcase },
  { path: "/admin/applicants", label: "Pelamar", group: "Manajemen Kandidat", icon: Users },
  { path: "/admin/recruitment-process", label: "Recruitment", group: "Manajemen Kandidat", icon: Workflow },
  { path: "/admin/recruitment-reports", label: "Screening Report", group: "Manajemen Kandidat", icon: FileText },
  { path: "/admin/settings", label: "Pengaturan Aplikasi", group: "Pengaturan", icon: Settings },
  { path: "/admin/users", label: "Manajemen User", group: "Pengaturan", icon: UserCog },
  { path: "/admin/roles", label: "Manajemen Role", group: "Pengaturan", icon: Shield },
  { path: "/admin/candidate-settings", label: "Manajemen Kandidat", group: "Pengaturan", icon: Users },
];

export const ADMIN_PAGE_PATHS = ADMIN_PAGES.map((page) => page.path);

export const isSuperAdmin = (roleName?: string | null) =>
  String(roleName || "").trim().toLowerCase().replace(/[\s_-]+/g, " ") === "super admin";

export const getAdminPermissionPath = (pathname: string) => {
  if (pathname.startsWith("/admin/test-instruments/")) return "/admin/test-instruments";
  if (pathname.startsWith("/admin/candidates/")) return "/admin/candidates";
  return pathname;
};
