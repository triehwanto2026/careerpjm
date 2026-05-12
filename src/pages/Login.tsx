import { Link, useNavigate } from "react-router-dom";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, ArrowRight } from "lucide-react";
import logoPjm from "@/assets/logo-pjm.png";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, userRole, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect when user AND role are both loaded
  useEffect(() => {
    if (user && userRole && !authLoading) {
      const isHR = ["admin", "hr_admin", "hr_manager"].includes(userRole);
      navigate(isHR ? "/hr/dashboard" : "/candidate/dashboard", { replace: true });
    }
  }, [user, userRole, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "⚠️ Error", description: "Email dan password wajib diisi.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "❌ Login Gagal", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "✅ Login Berhasil", description: "Selamat datang kembali!" });
  };

  return (
    <PublicLayout>
      <div className="container flex items-center justify-center min-h-[calc(100vh-16rem)] py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={logoPjm} alt="PJM Group" className="h-16 object-contain" />
            </div>
            <h1 className="text-2xl font-bold">Selamat Datang Kembali</h1>
            <p className="text-muted-foreground mt-2">Masuk ke akun Recruit PJM GROUP Anda</p>
          </div>

          <div className="card-elevated p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="nama@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Memproses..." : <>Masuk <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <Link to="/register" className="text-primary font-medium hover:underline">Daftar Sekarang</Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
};

export default Login;
