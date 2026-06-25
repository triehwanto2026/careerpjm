import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, LogIn, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we have the access token from the reset link
    const accessToken = searchParams.get("access_token");
    if (!accessToken) {
      Swal.fire({
        icon: "error",
        title: "Link tidak valid",
        text: "Link reset password tidak valid atau sudah kadaluarsa. Silakan minta link reset baru.",
      }).then(() => navigate("/login"));
    }
  }, [searchParams, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      Swal.fire({ icon: "error", title: "Password tidak cocok", text: "Password dan konfirmasi password harus sama." });
      return;
    }
    
    if (password.length < 6) {
      Swal.fire({ icon: "error", title: "Password terlalu pendek", text: "Password minimal harus 6 karakter." });
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      await Swal.fire({
        icon: "success",
        title: "Password berhasil diubah",
        text: "Password Anda telah berhasil diubah. Silakan login dengan password baru.",
      });

      navigate("/login");
    } catch (error: any) {
      Swal.fire({ 
        icon: "error", 
        title: "Gagal mengubah password", 
        text: error.message || "Terjadi kesalahan. Link reset mungkin sudah kadaluarsa. Silakan minta link reset baru." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan-500 mb-3">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-sm text-muted-foreground">Masukkan password baru untuk akun Anda</p>
        </div>

        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-lg">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Password Baru</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Konfirmasi Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Simpan Password Baru
              </>
            )}
          </button>
          <div className="text-center text-xs">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-muted-foreground hover:text-primary"
            >
              ← Kembali ke halaman login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
