// Admin login (legacy mode): verifies username/email + password against the
// admin_users table using SHA-256, then provisions / syncs a Supabase Auth
// user so RLS policies that rely on auth.uid() + user_roles keep working.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { identifier?: string; password?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  const identifier = (body.identifier || "").trim();
  const password = body.password || "";
  if (!identifier || !password) return json({ error: "Username/email dan password wajib diisi" }, 400);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // Lookup admin_users row by username or email
  const query = admin.from("admin_users").select("id, username, email, full_name, role_id, is_active, password_hash");
  const { data: legacy } = identifier.includes("@")
    ? await query.ilike("email", identifier).maybeSingle()
    : await query.eq("username", identifier).maybeSingle();

  if (!legacy) return json({ error: "Username atau password salah" }, 401);
  if (legacy.is_active === false) return json({ error: "Akun tidak aktif" }, 403);

  // Verify legacy SHA-256 password
  const hashed = await sha256Hex(password);
  if (hashed.toLowerCase() !== String(legacy.password_hash || "").toLowerCase()) {
    return json({ error: "Username atau password salah" }, 401);
  }

  const email = (legacy.email || `${legacy.username}@admin.local`).toLowerCase();

  // Ensure a Supabase Auth user exists with this password so we can issue a session
  let authUserId: string | null = null;
  {
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listErr) return json({ error: "list_failed: " + listErr.message }, 500);
    const existing = list?.users.find((u) => (u.email || "").toLowerCase() === email);
    if (existing) {
      authUserId = existing.id;
      const { error: upErr } = await admin.auth.admin.updateUserById(existing.id, { password });
      if (upErr) return json({ error: "update_failed: " + upErr.message }, 500);
    } else {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { admin_username: legacy.username, admin_full_name: legacy.full_name, legacy_admin_user_id: legacy.id },
      });
      if (cErr || !created.user) return json({ error: "create_failed: " + (cErr?.message || "unknown") }, 500);
      authUserId = created.user.id;
    }
  }

  // Ensure user_roles has at least one admin role (default to super_admin for superadmin username, else admin)
  const desiredRole = legacy.username === "superadmin" ? "super_admin" : "admin";
  await admin.from("user_roles").upsert({ user_id: authUserId, role: desiredRole }, { onConflict: "user_id,role" });

  // Sign in via anon client to get tokens
  const anon = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: signIn, error: signErr } = await anon.auth.signInWithPassword({ email, password });
  if (signErr || !signIn.session) return json({ error: "Gagal membuat sesi" }, 500);

  // Fetch permissions and role name from admin_roles
  let permissions: string[] = [];
  let roleName = "";
  if (legacy.role_id) {
    const { data: roleRow } = await admin.from("admin_roles").select("name, permissions").eq("id", legacy.role_id).maybeSingle();
    if (roleRow) {
      roleName = roleRow.name || "";
      permissions = Array.isArray(roleRow.permissions) ? roleRow.permissions : [];
    }
  }
  if (!roleName) roleName = desiredRole === "super_admin" ? "Super Admin" : "Admin";

  const { data: roleRows } = await admin.from("user_roles").select("role").eq("user_id", authUserId);
  const roles = (roleRows || []).map((r: any) => r.role);

  await admin.from("admin_users").update({ last_login: new Date().toISOString() }).eq("id", legacy.id);

  return json({
    session: { access_token: signIn.session.access_token, refresh_token: signIn.session.refresh_token },
    user: {
      id: signIn.user!.id,
      email,
      username: legacy.username,
      full_name: legacy.full_name,
      role_id: legacy.role_id,
      role_name: roleName,
      roles,
      permissions,
      force_password_reset: false,
    },
  });
});

function json(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
