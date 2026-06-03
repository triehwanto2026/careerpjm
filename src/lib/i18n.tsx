import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "id" | "en";

type Dict = Record<string, { id: string; en: string }>;

const dict: Dict = {
  // Nav
  "nav.home": { id: "Beranda", en: "Home" },
  "nav.jobs": { id: "Lowongan", en: "Jobs" },
  "nav.about": { id: "Tentang Kami", en: "About Us" },
  "nav.register": { id: "Daftar", en: "Sign Up" },
  "nav.login": { id: "Login", en: "Login" },

  // Footer
  "footer.menu": { id: "Menu", en: "Menu" },
  "footer.contact": { id: "Kontak", en: "Contact" },
  "footer.rights": { id: "Semua hak dilindungi.", en: "All rights reserved." },
  "footer.tagline": {
    id: "Platform rekrutmen resmi PJM Group. Temukan karir impian Anda bersama kami.",
    en: "PJM Group’s official recruitment platform. Find your dream career with us.",
  },

  // Home hero
  "home.badge": { id: "Situs Karir Resmi", en: "Official Career Site" },
  "home.title.line1": { id: "Bangun Masa Depan", en: "Build the Future" },
  "home.title.line2": { id: "Bersama PJM Group", en: "With PJM Group" },
  "home.subtitle": {
    id: "Platform rekrutmen resmi PJM Group. Temukan peluang karir strategis dan bergabunglah dengan tim profesional kami untuk menciptakan dampak nyata.",
    en: "PJM Group's official recruitment platform. Discover strategic career opportunities and join our team of professionals to create real impact.",
  },
  "home.search.position": { id: "Cari posisi atau departemen...", en: "Search position or department..." },
  "home.search.location": { id: "Lokasi...", en: "Location..." },
  "home.search.cta": { id: "Cari", en: "Search" },
  "home.stats.jobs": { id: "Lowongan Aktif", en: "Active Jobs" },
  "home.stats.candidates": { id: "Kandidat Bergabung", en: "Candidates Joined" },
  "home.stats.success": { id: "Tingkat Keberhasilan", en: "Success Rate" },
  "home.stats.partners": { id: "Perusahaan Partner", en: "Partner Companies" },
  "home.latest.title": { id: "Lowongan Terbaru", en: "Latest Openings" },
  "home.latest.subtitle": { id: "Temukan posisi yang sesuai dengan keahlianmu", en: "Find the role that matches your skills" },
  "home.latest.viewAll": { id: "Lihat Semua", en: "View All" },

  // Jobs page
  "jobs.title": { id: "Semua Lowongan", en: "All Job Openings" },
  "jobs.subtitle": {
    id: "Jelajahi {count} lowongan pekerjaan yang tersedia",
    en: "Explore {count} job openings available",
  },
  "jobs.search.placeholder": { id: "Cari posisi, skill, atau kata kunci...", en: "Search position, skill, or keyword..." },
  "jobs.filter.department": { id: "Departemen", en: "Department" },
  "jobs.filter.location": { id: "Lokasi", en: "Location" },
  "jobs.filter.type": { id: "Jenis", en: "Type" },
  "jobs.filter.all": { id: "Semua", en: "All" },
  "jobs.count": { id: "{count} lowongan ditemukan", en: "{count} jobs found" },
  "jobs.empty.title": { id: "Tidak ada lowongan ditemukan", en: "No jobs found" },
  "jobs.empty.subtitle": { id: "Coba ubah filter pencarian Anda", en: "Try adjusting your search filters" },
  "jobs.card.salary": { id: "Negosiasi", en: "Negotiable" },

  // About page
  "about.eyebrow": { id: "Siapa Kami", en: "Who We Are" },
  "about.title": { id: "Tentang Kami", en: "About Us" },
  "about.subtitle": {
    id: "Informasi visi, misi, milestone, dan nilai-nilai utama yang membentuk fondasi PJM Recruitment.",
    en: "Vision, mission, milestones, and core values that form the foundation of PJM Recruitment.",
  },
  "about.vision": { id: "Visi", en: "Vision" },
  "about.mission": { id: "Misi", en: "Mission" },
  "about.journey": { id: "Perjalanan Kami", en: "Our Journey" },
  "about.values": { id: "Nilai Kami", en: "Our Values" },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LangCtx = createContext<Ctx | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "id";
    const stored = window.localStorage.getItem("app.lang");
    return stored === "en" || stored === "id" ? stored : "id";
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { window.localStorage.setItem("app.lang", l); } catch {}
  };

  const t = (key: string, vars?: Record<string, string | number>) => {
    const entry = dict[key];
    let str = entry ? entry[lang] : key;
    if (vars) for (const k of Object.keys(vars)) str = str.replace(`{${k}}`, String(vars[k]));
    return str;
  };

  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
};

export const useT = () => {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useT must be used inside LanguageProvider");
  return ctx;
};
