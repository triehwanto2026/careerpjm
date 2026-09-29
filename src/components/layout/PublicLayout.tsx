import { Link, useLocation, useNavigate } from "react-router-dom";
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
  const brandSubtitle = "Platform rekrutmen resmi PJM Group. Temukan karir impian Anda bersama kami.";
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

    const sectionIds = ["beranda", "lowongan", "tentang"];

    const updateActive = () => {
      const offset = 120; // header height + a bit
      const scrollPos = window.scrollY + offset;

      // If near top, force beranda
      if (window.scrollY < 80) {
        setActiveSection("beranda");
        return;
      }

      // If near bottom, force last section
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 20) {
        setActiveSection(sectionIds[sectionIds.length - 1]);
        return;
      }

      let current = "beranda";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive);

    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [location.pathname, location.hash]);

  const navClass = (section: string) =>
    activeSection === section
      ? "rounded-full bg-white px-5 py-2 text-sm font-semibold text-sky-600 shadow-sm ring-1 ring-slate-900/5 transition-all dark:bg-slate-700 dark:text-sky-300 dark:ring-white/10"
      : "rounded-full px-5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white";

  const navigate = useNavigate();

  const scrollToSection = (section: string) => {
    if (location.pathname !== "/") {
      navigate(`/#${section}`);
      return;
    }

    const element = document.getElementById(section);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      window.history.replaceState(null, "", `/#${section}`);
      setActiveSection(section);
    }
  };

  const mobileNavClass = (section: string) =>
    activeSection === section
      ? "block rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-sky-500/25"
      : "block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-background overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 text-slate-950 shadow-sm backdrop-blur-xl dark:border-border dark:bg-card/90 dark:text-foreground">
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
          <nav className="hidden items-center gap-1 rounded-full border border-slate-200/70 bg-slate-100/80 p-1 backdrop-blur-sm md:flex dark:border-slate-700/50 dark:bg-slate-800/50">
            <button type="button" onClick={() => scrollToSection("beranda")} className={navClass("beranda")}>
              Beranda
            </button>
            <button type="button" onClick={() => scrollToSection("lowongan")} className={navClass("lowongan")}>
              Lowongan
            </button>
            <button type="button" onClick={() => scrollToSection("tentang")} className={navClass("tentang")}>
              Tentang Kami
            </button>
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
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollToSection("beranda");
                  }}
                  className={mobileNavClass("beranda")}
                >
                  Beranda
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollToSection("lowongan");
                  }}
                  className={mobileNavClass("lowongan")}
                >
                  Lowongan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    scrollToSection("tentang");
                  }}
                  className={mobileNavClass("tentang")}
                >
                  Tentang Kami
                </button>
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
      <main className="flex-1 pt-[74px]">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container px-4 py-6 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_minmax(420px,1.2fr)] lg:items-start">
            <div>
              <p className="max-w-xl text-[15px] font-medium leading-7 text-foreground md:text-base">
                {brandSubtitle}
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                PJM Group Recruitment
              </p>
            </div>
            <div className="min-w-0">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Contact Us</p>
              <ul className="grid gap-3 text-sm md:grid-cols-[minmax(180px,0.8fr)_minmax(150px,0.65fr)_minmax(260px,1.4fr)]">
                <li className="min-w-0 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 font-semibold text-foreground transition hover:text-primary">
                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate">{contactEmail}</span>
                  </a>
                </li>
                <li className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <a href={`tel:${contactPhone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 font-semibold text-foreground transition hover:text-primary">
                    <Phone className="h-4 w-4 shrink-0 text-primary" />
                    <span>{contactPhone}</span>
                  </a>
                </li>
                <li className="min-w-0 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="leading-5">{contactAddress}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
            Copyright @pjmgroup.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
