import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { Building2, Menu, X, LogIn, Mail, Phone, MapPin, ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [publicSettings, setPublicSettings] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState("beranda");

  useEffect(() => {
    const loadPublicSettings = async () => {
      const keys = [
        "app_name",
        "app_logo_url",
        "landing_header_title",
        "landing_header_subtitle",
        "landing_contact_email",
        "landing_contact_phone",
        "landing_contact_address",
      ];
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", keys);

      if (error) {
        console.error("Error loading public settings:", error);
        return;
      }

      setPublicSettings(
        (data || []).reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, string>)
      );
    };

    loadPublicSettings();

    const channel = supabase
      .channel("public-settings")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "app_settings" }, () => {
        loadPublicSettings();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const companyName = publicSettings.app_name || publicSettings.landing_header_title || "PJM GROUP Career Management";
  const logoUrl = publicSettings.app_logo_url || "/pjmgroup-logo.svg";
  const brandSubtitle = publicSettings.landing_header_subtitle || "Platform rekrutmen resmi PJM Group. Temukan karir impian Anda bersama kami.";
  const contactEmail = publicSettings.landing_contact_email || "hrd@pjm-group.com";
  const contactPhone = publicSettings.landing_contact_phone || "(031) 5962700";
  const contactAddress = publicSettings.landing_contact_address || "Jl. Raya Kertajaya Indah No.47, Manyar Sabrangan, Kec. Mulyorejo, Surabaya, Jawa Timur 60116";

  useEffect(() => {
    if (location.pathname === "/jobs") {
      setActiveSection("lowongan");
      return;
    }
    if (location.pathname === "/about") {
      setActiveSection("tentang");
      return;
    }
    if (location.pathname !== "/") {
      setActiveSection("");
      return;
    }

    const syncHash = () => {
      const hash = window.location.hash.replace("#", "");
      setActiveSection(hash || "beranda");
    };

    syncHash();
    window.addEventListener("hashchange", syncHash);

    const sections = ["beranda", "lowongan", "tentang"]
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("hashchange", syncHash);
      observer.disconnect();
    };
  }, [location.pathname, location.hash]);

  const navClass = (section: string) =>
    activeSection === section
      ? "rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:bg-sky-600 dark:bg-sky-400 dark:text-slate-950 dark:shadow-sky-400/20"
      : "rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-500 transition-all hover:bg-sky-50 hover:text-sky-600 hover:shadow-sm dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground";

  const mobileNavClass = (section: string) =>
    activeSection === section
      ? "block rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-sky-500/25"
      : "block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 text-slate-950 shadow-sm backdrop-blur-xl dark:border-border dark:bg-card/90 dark:text-foreground">
        <div className="container flex h-[74px] items-center justify-between px-4 md:px-6">
          <Link to="/#beranda" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-9 w-auto max-w-[132px] object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-2 rounded-full md:flex">
            <a href="/#beranda" className={navClass("beranda")}>
              Beranda
            </a>
            <a href="/#lowongan" className={navClass("lowongan")}>
              Lowongan
            </a>
            <a href="/#tentang" className={navClass("tentang")}>
              Tentang Kami
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              asChild
              variant="outline"
              className="hidden rounded-xl border-sky-300 bg-white px-4 text-sky-600 hover:bg-sky-50 hover:text-sky-700 md:inline-flex dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
            >
              <Link to="/test-login" className="inline-flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" /> Tes Psikotes
              </Link>
            </Button>
            <Button 
              asChild 
              className="hidden rounded-xl bg-sky-500 px-5 text-white hover:bg-sky-600 md:inline-flex"
            >
              <Link to="/login" className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" /> Masuk/Daftar
              </Link>
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-200 bg-white dark:border-border dark:bg-card">
              <nav className="container px-4 py-4 space-y-3">
                <a
                  href="/#beranda"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileNavClass("beranda")}
                >
                  Beranda
                </a>
                <a
                  href="/#lowongan"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileNavClass("lowongan")}
                >
                  Lowongan
                </a>
                <a
                  href="/#tentang"
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileNavClass("tentang")}
                >
                  Tentang Kami
                </a>
                <Button 
                  asChild
                  variant="outline"
                  className="w-full border-sky-300 text-sky-600 hover:bg-sky-50 dark:border-sky-500/40 dark:text-sky-300 dark:hover:bg-sky-500/10"
                >
                  <Link to="/test-login" onClick={() => setMobileMenuOpen(false)} className="inline-flex w-full items-center justify-center gap-2">
                    <ClipboardCheck className="h-4 w-4" /> Tes Psikotes
                  </Link>
                </Button>
                <Button 
                  asChild 
                  className="w-full bg-sky-500 text-white hover:bg-sky-600"
                >
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="inline-flex w-full items-center justify-center gap-2">
                    <LogIn className="h-4 w-4" /> Masuk/Daftar
                  </Link>
                </Button>
              </nav>
            </div>
          )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-slate-950 text-white">
        <div className="container px-4 py-10 md:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="max-w-lg">
              <div className="flex items-center gap-2 mb-4">
                {logoUrl ? (
                  <img src={logoUrl} alt={companyName} className="h-10 w-auto max-w-[150px] rounded-lg bg-white object-contain p-1.5" />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                )}
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                {brandSubtitle}
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">Kontak</h3>
              <ul className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
                <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                  <span>{contactEmail}</span>
                </li>
                <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                  <span>{contactPhone}</span>
                </li>
                <li className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:col-span-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
                  <span>{contactAddress}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
