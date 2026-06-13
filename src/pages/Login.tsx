import { Link, useNavigate } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState({ name: "Recruit PJM GROUP", logo: "/pjmgroup-logo.svg" });

  useEffect(() => {
    const loadBrand = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["app_name", "app_logo_url", "landing_header_title"]);
      const settings = (data || []).reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);
      setBrand({
        name: settings.app_name || settings.landing_header_title || "Recruit PJM GROUP",
        logo: settings.app_logo_url || "/pjmgroup-logo.svg",
      });
    };
    loadBrand();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "⚠️ Error", description: "Email dan password wajib diisi.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      toast({ title: "❌ Login Gagal", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Login Berhasil", description: "Selamat datang kembali!" });
    navigate("/candidate/profile", { replace: true });
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={brand.logo} alt={brand.name} className="h-16 w-auto max-w-[180px] rounded-xl bg-white object-contain p-2 shadow-sm" />
            </div>
            <h1 className="text-2xl font-bold">Selamat Datang Kembali</h1>
            <p className="text-muted-foreground mt-2">Masuk ke akun {brand.name} Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Daftar Sekarang
            </Link>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
};

export default Login;
