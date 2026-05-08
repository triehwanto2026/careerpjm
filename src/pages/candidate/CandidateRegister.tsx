import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Brain, Mail, Lock, User, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";

export default function CandidateRegister() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      Swal.fire({ icon: "warning", title: "Kata sandi terlalu pendek", text: "Minimal 6 karakter." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/candidate/profile`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      Swal.fire({ icon: "error", title: "Pendaftaran gagal", text: error.message });
      return;
    }
    Swal.fire({
      icon: "success",
      title: "Pendaftaran berhasil!",
      text: "Silakan cek email Anda untuk verifikasi sebelum login.",
    }).then(() => navigate("/candidate/login"));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan-500 mb-3">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Daftar Akun Kandidat</h1>
          <p className="text-sm text-muted-foreground">Buat akun untuk melamar pekerjaan & ikuti tes</p>
        </div>

        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-lg">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nama lengkap sesuai KTP"
              />
            </div>
          </div>
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
            <label className="text-sm font-medium mb-1.5 block">Kata Sandi (min. 6 karakter)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
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
            <UserPlus className="h-4 w-4" />
            {loading ? "Memproses..." : "Daftar Sekarang"}
          </button>
          <div className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/candidate/login" className="text-primary font-semibold hover:underline">
              Masuk
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
