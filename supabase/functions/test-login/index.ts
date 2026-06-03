// Test login edge function — validates activation code + bcrypt password,
// ensures a Supabase Auth user exists for the candidate email, and returns
// a real Supabase session so RLS can scope subsequent reads to auth.email().
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const body = await req.json().catch(() => ({}));
    const rawCode = String(body?.code ?? "").trim().toUpperCase();
    const rawPassword = String(body?.password ?? "").trim();

    if (!rawCode || !rawPassword) {
      return json({ error: "Kode tes dan password wajib diisi." }, 400);
    }
    if (rawCode.length > 64 || rawPassword.length > 200) {
      return json({ error: "Input tidak valid." }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Look up activation code with service role
    const { data: code, error: codeErr } = await admin
      .from("activation_codes")
      .select("*")
      .eq("code", rawCode)
      .maybeSingle();

    if (codeErr || !code) {
      return json({ error: "Kode tes atau password salah." }, 401);
    }

    // Verify bcrypt password using pgcrypto via RPC (service role)
    const { data: pwOk, error: pwErr } = await admin.rpc("verify_activation_password", {
      _code: rawCode,
      _password: rawPassword,
    });
    if (pwErr || pwOk !== true) {
      return json({ error: "Kode tes atau password salah." }, 401);
    }

    // Status checks
    const now = new Date();
    const expiresAt = code.expires_at ? new Date(code.expires_at) : null;
    const status = (code as any).status || "active";
    if (expiresAt && expiresAt < now) {
      return json({ error: "Kode tes telah kadaluarsa." }, 403);
    }
    if (status === "completed") {
      return json({ error: "Tes sudah selesai." }, 403);
    }
    if (status === "invalid") {
      return json({ error: "Kode tes tidak valid." }, 403);
    }

    const email = String(code.candidate_email).toLowerCase().trim();
    // Use the activation code id as a stable server-only password for the auth account
    const authPassword = `tc_${code.id}_${SERVICE_KEY.slice(-12)}`;

    // Ensure auth user exists; if it does, reset password so we can sign in
    let userId: string | null = null;
    {
      // Try to look up existing user by email
      const { data: list } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      const existing = list?.users?.find(
        (u) => u.email?.toLowerCase() === email,
      );
      if (existing) {
        userId = existing.id;
        await admin.auth.admin.updateUserById(existing.id, {
          password: authPassword,
          email_confirm: true,
        });
      } else {
        const created = await admin.auth.admin.createUser({
          email,
          password: authPassword,
          email_confirm: true,
          user_metadata: {
            full_name: code.candidate_name,
            test_candidate: true,
          },
        });
        if (created.error || !created.data.user) {
          return json({ error: "Gagal membuat sesi tes." }, 500);
        }
        userId = created.data.user.id;
      }
    }

    // Sign in to get a real session
    const anon = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
      email,
      password: authPassword,
    });
    if (signInErr || !signIn?.session) {
      return json({ error: "Gagal membuat sesi tes." }, 500);
    }

    // Ensure a candidate row exists
    let candidateId: string | null = null;
    {
      const { data: existingCand } = await admin
        .from("candidates")
        .select("id, photo_url, phone, birth_date, education, gender")
        .eq("email", email)
        .maybeSingle();
      if (existingCand?.id) {
        candidateId = existingCand.id;
      } else {
        const { data: inserted } = await admin
          .from("candidates")
          .insert({
            name: code.candidate_name,
            email,
            position: code.position,
            status: "in_progress",
            activation_code_id: code.id,
          } as any)
          .select("id")
          .single();
        candidateId = inserted?.id ?? null;
      }
    }

    return json({
      session: signIn.session,
      candidate: {
        id: candidateId,
        name: code.candidate_name,
        email,
        position: code.position,
        activationCodeId: code.id,
        assignedTests: code.assigned_tests || [],
      },
    });
  } catch (e) {
    console.error("test-login error", e);
    return json({ error: "Terjadi kesalahan server." }, 500);
  }
});
