import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function SimpleCandidateLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Swal.fire("Error", "Masukkan email terlebih dahulu", "error");
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    
    if (error) {
      Swal.fire("Error", "Gagal mengirim: " + error.message, "error");
    } else {
      Swal.fire("Sukses", "Link reset password dikirim. Silakan cek inbox email Anda", "success");
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      Swal.fire("Error", "Masukkan email terlebih dahulu", "error");
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    setLoading(false);
    
    if (error) {
      Swal.fire("Error", "Gagal mengirim: " + error.message, "error");
    } else {
      Swal.fire("Sukses", "Email konfirmasi dikirim. Silakan cek inbox email Anda", "success");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      Swal.fire("Error", "Email dan password harus diisi", "error");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

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
            confirmButtonColor: "#3085d6",
          }).then((result) => {
            if (result.isConfirmed) {
              handleResendConfirmation();
            }
          });
          return;
        }
        
        Swal.fire("Error", "Login gagal: " + error.message, "error");
      } else if (data.user) {
        // Check if user has candidate profile
        const { data: profile } = await supabase
          .from("candidate_profiles")
          .select("*")
          .eq("user_id", data.user.id)
          .single();

        if (profile) {
          navigate("/candidate/profile");
        } else {
          // Redirect to registration if no profile exists
          navigate("/candidate/register");
        }
      }
    } catch (error) {
      Swal.fire("Error", "Terjadi kesalahan saat login", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Login Kandidat
            </h1>
            <p className="text-sm text-muted-foreground">
              Masuk ke akun kandidat Anda
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="•••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2">Masuk...</span>
                </div>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-4">
            <div className="flex flex-col gap-2 text-sm">
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
            
            <div className="text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <button
                onClick={() => navigate("/candidate/register")}
                className="text-primary hover:underline font-medium"
              >
                Daftar sekarang
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
