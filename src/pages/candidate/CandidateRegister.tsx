import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, UserPlus, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Swal from "sweetalert2";
import PublicLayout from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

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
    
    try {
      let user: any = null;
      let userId: string | null = null;
      
      // Try to create user using admin API with auto-confirmed email
      const { data: adminData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Attempt to auto-confirm
        user_metadata: {
          full_name: fullName,
        },
      });

      if (!authError && adminData?.user) {
        // Admin API succeeded
        user = adminData.user;
        userId = adminData.user.id;
        console.log('User created via admin API:', userId);
      } else {
        console.error('Admin API failed, trying signUp:', authError);
        // If admin API fails, try regular sign up
        const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (signUpError) {
          Swal.fire({ icon: "error", title: "Pendaftaran gagal", text: signUpError.message });
          setLoading(false);
          return;
        }
        
        if (signUpData?.user) {
          user = signUpData.user;
          userId = signUpData.user.id;
          console.log('User created via signUp:', userId);
          
          // Try to manually confirm email for the newly created user
          try {
            await supabase.auth.admin.updateUserById(userId, {
              email_confirm: true
            });
            console.log('Email confirmed for user:', userId);
          } catch (updateErr) {
            console.warn('Could not auto-confirm email:', updateErr);
          }
        }
      }

      // Insert candidate data into candidates table for admin management
      if (user && userId) {
        console.log('Inserting candidate:', { name: fullName, email, userId });
        
        const { error: insertError } = await supabase.from("candidates").insert({
          name: fullName,
          email: email,
          status: "pending",
          created_at: new Date().toISOString(),
        });
        
        if (insertError) {
          console.error("Error inserting candidate to candidates table:", insertError);
        } else {
          console.log('Candidate inserted successfully');
        }

        // Create candidate profile
        const { error: profileError } = await supabase.from("candidate_profiles").insert({
          user_id: userId,
          full_name: fullName,
          email: email,
          created_at: new Date().toISOString(),
        });
        
        if (profileError) {
          console.error("Profile creation error:", profileError);
        } else {
          console.log('Candidate profile created successfully');
        }
      } else {
        console.error('No user created, skipping candidate insertion');
      }

      setLoading(false);
      Swal.fire({
        icon: "success",
        title: "Pendaftaran berhasil!",
        text: "Akun Anda siap digunakan. Silakan login untuk melanjutkan.",
      }).then(() => navigate("/login"));
    } catch (error: any) {
      setLoading(false);
      console.error('Registration error:', error);
      Swal.fire({ icon: "error", title: "Pendaftaran gagal", text: error.message || "Terjadi kesalahan" });
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Buat Akun Baru</h1>
            <p className="text-muted-foreground mt-2">Daftar untuk mulai melamar di Recruit PJM GROUP</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nama lengkap sesuai KTP"
                  className="pl-10"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

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
              <Label htmlFor="password">Password (min. 6 karakter)</Label>
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
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Daftar"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Masuk
            </Link>
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
