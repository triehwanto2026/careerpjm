import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LanguageToggle from "@/components/LanguageToggle";
import { Building2, Menu, X, UserPlus, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { t } = useT();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [publicSettings, setPublicSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadPublicSettings = async () => {
      const keys = [
        "app_name", "app_logo_url",
        "landing_header_title", "landing_header_subtitle",
        "landing_contact_email", "landing_contact_phone", "landing_contact_address",
      ];
      const { data } = await supabase.from("app_settings").select("key, value").in("key", keys);
      setPublicSettings((data || []).reduce((acc, item) => { acc[item.key] = item.value; return acc; }, {} as Record<string, string>));
    };
    loadPublicSettings();
    const channel = supabase
      .channel("public-settings")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "app_settings" }, loadPublicSettings)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  const companyName = publicSettings.app_name || publicSettings.landing_header_title || "PJM GROUP Career";
  const logoUrl = publicSettings.app_logo_url;
  const contactEmail = publicSettings.landing_contact_email || "hr@pjmgroup.com";
  const contactPhone = publicSettings.landing_contact_phone || "+62 21 1234 5678";
  const contactAddress = publicSettings.landing_contact_address || "Jakarta, Indonesia";

  const navItems = [
    { to: "/", label: t("nav.home") },
    { to: "/jobs", label: t("nav.jobs") },
    { to: "/about", label: t("nav.about") },
  ];

  const isActive = (to: string) => location.pathname === to;

  return (
    <div className="min-h-screen flex flex-col bg-[#0c2340] text-white font-body">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0c2340]/85 backdrop-blur-xl">
        <div className="container flex items-center justify-between px-4 py-4 md:px-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            {logoUrl ? (
              <img src={logoUrl} alt={companyName} className="h-9 w-9 rounded-xl bg-[#1a4a6e]/40 object-contain p-1 border border-white/10" />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#2d8a9e] to-[#1a4a6e] flex items-center justify-center border border-[#5cbdb9]/30 shadow-lg shadow-[#5cbdb9]/10">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="text-base md:text-lg font-display font-bold text-white tracking-tight">{companyName}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                  isActive(item.to)
                    ? "text-white bg-white/5"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
                {isActive(item.to) && (
                  <span className="absolute -bottom-px left-1/2 -translate-x-1/2 h-0.5 w-6 bg-[#5cbdb9] rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Button asChild variant="ghost" className="hidden md:inline-flex text-slate-200 hover:text-white hover:bg-white/10 border border-white/10">
              <Link to="/register" className="inline-flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> {t("nav.register")}
              </Link>
            </Button>
            <Button asChild className="hidden md:inline-flex bg-[#5cbdb9] hover:bg-[#2d8a9e] text-[#0c2340] font-semibold border-0 shadow-lg shadow-[#5cbdb9]/20">
              <Link to="/login" className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" /> {t("nav.login")}
              </Link>
            </Button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-200 hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0c2340]">
            <nav className="container px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.to) ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <Button asChild variant="ghost" className="text-white border border-white/10 hover:bg-white/10">
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="inline-flex w-full items-center justify-center gap-2">
                    <UserPlus className="h-4 w-4" /> {t("nav.register")}
                  </Link>
                </Button>
                <Button asChild className="bg-[#5cbdb9] hover:bg-[#2d8a9e] text-[#0c2340] font-semibold">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="inline-flex w-full items-center justify-center gap-2">
                    <LogIn className="h-4 w-4" /> {t("nav.login")}
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#081a30] mt-12">
        <div className="container px-4 py-12 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                {logoUrl ? (
                  <img src={logoUrl} alt={companyName} className="h-9 w-9 rounded-xl bg-[#1a4a6e]/40 object-contain p-1 border border-white/10" />
                ) : (
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#2d8a9e] to-[#1a4a6e] flex items-center justify-center border border-[#5cbdb9]/30">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                )}
                <span className="text-lg font-display font-bold text-white">{companyName}</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{t("footer.tagline")}</p>
            </div>
            <div>
              <h3 className="font-display font-semibold text-white mb-4 text-sm uppercase tracking-widest text-[#5cbdb9]">{t("footer.menu")}</h3>
              <ul className="space-y-2.5">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className="text-sm text-slate-400 hover:text-[#5cbdb9] transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display font-semibold text-white mb-4 text-sm uppercase tracking-widest text-[#5cbdb9]">{t("footer.contact")}</h3>
              <ul className="space-y-2.5 text-sm text-slate-400">
                <li>{contactEmail}</li>
                <li>{contactPhone}</li>
                <li>{contactAddress}</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-white/5 text-center text-xs text-slate-500">
            <p>© {new Date().getFullYear()} {companyName}. {t("footer.rights")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
