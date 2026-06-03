// Admin login that accepts username OR email + password.
// Resolves the username to an email via admin_users (server-side, service role),
// then signs in with Supabase Auth and returns the session for the client to set.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: { identifier?: string; password?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const identifier = (body.identifier || "").trim();
  const password = body.password || "";
  if (!identifier || !password) return json({ error: "Username/email dan password wajib diisi" }, 400);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // Resolve identifier to email
  let email = identifier.includes("@") ? identifier.toLowerCase() : null;
  let legacy: any = null;
  if (!email) {
    const { data } = await admin
      .from("admin_users")
      .select("id, username, email, full_name, role_id, is_active")
      .eq("username", identifier)
      .maybeSingle();
    if (data) {
      legacy = data;
      email = (data.email || `${data.username}@admin.local`).toLowerCase();
    }
  } else {
    const { data } = await admin
      .from("admin_users")
      .select("id, username, email, full_name, role_id, is_active")
      .ilike("email", email)
      .maybeSingle();
    if (data) legacy = data;
  }
  if (!email) return json({ error: "Username atau password salah" }, 401);

  if (legacy && legacy.is_active === false) return json({ error: "Akun tidak aktif" }, 403);

  // Sign in with anon client
  const anon = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({ email, password });
  if (signErr || !signIn.session) return json({ error: "Username atau password salah" }, 401);

  // Verify they have any admin role
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", signIn.user!.id);
  const roleSet = new Set((roles || []).map((r: any) => r.role));
  const isAdmin = ["super_admin", "admin", "hr", "recruiter"].some((r) => roleSet.has(r));
  if (!isAdmin) {
    await anon.auth.signOut();
    return json({ error: "Akun ini tidak memiliki akses admin" }, 403);
  }

  // Lookup legacy permissions for menu visibility
  let permissions: string[] = [];
  let roleName = "";
  if (legacy?.role_id) {
    const { data: roleRow } = await admin.from("admin_roles").select("name, permissions").eq("id", legacy.role_id).maybeSingle();
    if (roleRow) {
      roleName = roleRow.name || "";
      permissions = Array.isArray(roleRow.permissions) ? roleRow.permissions : [];
    }
  }
  if (!roleName) roleName = roleSet.has("super_admin") ? "Super Admin" : "Admin";

  // Last login bookkeeping (best effort)
  if (legacy?.id) {
    await admin.from("admin_users").update({ last_login: new Date().toISOString() }).eq("id", legacy.id);
  }

  return json({
    session: { access_token: signIn.session.access_token, refresh_token: signIn.session.refresh_token },
    user: {
      id: signIn.user!.id,
      email,
      username: legacy?.username || signIn.user!.user_metadata?.admin_username || email,
      full_name: legacy?.full_name || signIn.user!.user_metadata?.admin_full_name || "",
      role_id: legacy?.role_id || null,
      role_name: roleName,
      roles: Array.from(roleSet),
      permissions,
      force_password_reset: signIn.user!.user_metadata?.force_password_reset === true,
    },
  });
});

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
