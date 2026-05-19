import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { Building2, Menu, X, UserPlus, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [publicSettings, setPublicSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadPublicSettings = async () => {
      const keys = [
        "app_name",
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

  const companyName = publicSettings.app_name || publicSettings.landing_header_title || "PJM Recruitment";
  const brandSubtitle = publicSettings.landing_header_subtitle || "Platform rekrutmen resmi PJM Group. Temukan karir impian Anda bersama kami.";
  const contactEmail = publicSettings.landing_contact_email || "hr@pjmgroup.com";
  const contactPhone = publicSettings.landing_contact_phone || "+62 21 1234 5678";
  const contactAddress = publicSettings.landing_contact_address || "Jakarta, Indonesia";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between px-4 py-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground">{companyName}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Beranda
            </Link>
            <Link to="/jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Lowongan
            </Link>
            <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Tentang Kami
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              variant={location.pathname === "/register" ? "default" : "outline"} 
              asChild 
              className="hidden md:inline-flex"
            >
              <Link to="/register" className="inline-flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Daftar
              </Link>
            </Button>
            <Button 
              variant={location.pathname === "/login" ? "default" : "outline"} 
              asChild 
              className="hidden md:inline-flex"
            >
              <Link to="/login" className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" /> Login
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
            <div className="md:hidden border-t border-border bg-card">
              <nav className="container px-4 py-4 space-y-3">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Beranda
                </Link>
                <Link
                  to="/jobs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Lowongan
                </Link>
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tentang Kami
                </Link>
                <Button 
                  variant={location.pathname === "/register" ? "default" : "outline"} 
                  asChild 
                  className="w-full"
                >
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="inline-flex w-full items-center justify-center gap-2">
                    <UserPlus className="h-4 w-4" /> Daftar
                  </Link>
                </Button>
                <Button 
                  variant={location.pathname === "/login" ? "default" : "outline"} 
                  asChild 
                  className="w-full"
                >
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="inline-flex w-full items-center justify-center gap-2">
                    <LogIn className="h-4 w-4" /> Login
                  </Link>
                </Button>
              </nav>
            </div>
          )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container px-4 py-8 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <span className="text-lg font-bold text-foreground">{companyName}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {brandSubtitle}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Menu</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link to="/jobs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Lowongan
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Kontak</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{contactEmail}</li>
                <li>{contactPhone}</li>
                <li>{contactAddress}</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-xs text-muted-foreground">
            <p>© 2024 PJM Recruitment. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
