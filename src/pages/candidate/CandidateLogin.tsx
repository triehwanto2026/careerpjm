import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Brain, Mail, Lock, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

export default function CandidateLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/candidate/profile");
    });
  }, [navigate]);

  const handleResendConfirmation = async () => {
    if (!email) {
      Swal.fire({ icon: "warning", title: "Email diperlukan", text: "Masukkan email Anda terlebih dahulu" });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    setLoading(false);
    
    if (error) {
      Swal.fire({ icon: "error", title: "Gagal mengirim", text: error.message });
    } else {
      Swal.fire({ 
        icon: "success", 
        title: "Email konfirmasi dikirim", 
        text: "Silakan cek inbox email Anda dan klik link konfirmasi untuk mengaktifkan akun." 
      });
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      Swal.fire({ icon: "warning", title: "Email diperlukan", text: "Masukkan email Anda terlebih dahulu" });
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    
    if (error) {
      Swal.fire({ icon: "error", title: "Gagal mengirim", text: error.message });
    } else {
      Swal.fire({ 
        icon: "success", 
        title: "Link reset password dikirim", 
        text: "Silakan cek inbox email Anda untuk instruksi reset password." 
      });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const errorMessage = error.message.toLowerCase();
      
      // Check if error is related to unconfirmed email
      if (errorMessage.includes("email not confirmed") || errorMessage.includes("email confirmation")) {
        Swal.fire({
          icon: "warning",
          title: "Email belum dikonfirmasi",
          text: "Akun Anda belum dikonfirmasi. Silakan klik tombol di bawah untuk mengirim ulang email konfirmasi.",
          showCancelButton: true,
          confirmButtonText: "Kirim Ulang Konfirmasi",
          cancelButtonText: "Batal",
          confirmButtonColor: "hsl(168, 76%, 42%)",
        }).then((result) => {
          if (result.isConfirmed) {
            handleResendConfirmation();
          }
        });
        return;
      }
      
      // Check if error is related to invalid credentials
      if (errorMessage.includes("invalid login credentials") || errorMessage.includes("wrong password")) {
        Swal.fire({
          icon: "error",
          title: "Login gagal",
          text: "Email atau password salah. Silakan periksa kembali atau gunakan fitur reset password.",
          footer: '<a href="#" onclick="window.handleResetPassword()" class="text-primary hover:underline">Lupa password?</a>',
          didOpen: () => {
            (window as any).handleResetPassword = handleResetPassword;
          }
        });
        return;
      }
      
      Swal.fire({ icon: "error", title: "Login gagal", text: error.message });
      return;
    }
    navigate("/candidate/profile");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan-500 mb-3">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Portal Kandidat</h1>
          <p className="text-sm text-muted-foreground">Masuk untuk mengakses lowongan & tes psikologi</p>
        </div>

        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-lg">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="email@contoh.com"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Memproses..." : "Masuk"}
          </button>
          <div className="flex flex-col gap-2 text-center text-sm">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={loading}
              className="text-muted-foreground hover:text-primary transition disabled:opacity-50"
            >
              Lupa password?
            </button>
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={loading}
              className="text-muted-foreground hover:text-primary transition disabled:opacity-50"
            >
              Kirim ulang email konfirmasi
            </button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link to="/candidate/register" className="text-primary font-semibold hover:underline">
              Daftar di sini
            </Link>
          </div>
          <div className="text-center text-xs">
            <Link to="/" className="text-muted-foreground hover:text-primary">← Kembali ke beranda</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
