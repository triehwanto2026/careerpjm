// One-time helper: copy admin_users into Supabase Auth and assign super_admin role.
// Idempotent — safe to re-run.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TEMP_PASSWORD = "ChangeMe123!";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  // Gate: only allow when no super_admin exists yet (bootstrap mode),
  // OR when the caller is already authenticated as super_admin.
  const { count: existingSuperAdmins } = await admin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "super_admin");

  if ((existingSuperAdmins ?? 0) > 0) {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return new Response(JSON.stringify({ error: "Forbidden: super_admin already exists" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: userData } = await admin.auth.getUser(token);
    if (!userData?.user) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id);
    if (!(roles || []).some((r: any) => r.role === "super_admin")) {
      return new Response(JSON.stringify({ error: "Forbidden: super_admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }


  const { data: adminUsers, error: listErr } = await admin
    .from("admin_users")
    .select("id, username, email, full_name, role_id, is_active");

  if (listErr) {
    return new Response(JSON.stringify({ error: listErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // List existing auth users once
  const existing = new Map<string, any>();
  {
    let page = 1;
    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) break;
      data.users.forEach((u) => u.email && existing.set(u.email.toLowerCase(), u));
      if (data.users.length < 1000) break;
      page++;
    }
  }

  const results: Array<{ username: string; email: string; status: string; user_id?: string; error?: string }> = [];

  for (const row of adminUsers || []) {
    const email = (row.email || `${row.username}@admin.local`).toLowerCase();
    let user = existing.get(email);

    if (!user) {
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email,
        password: TEMP_PASSWORD,
        email_confirm: true,
        user_metadata: {
          admin_username: row.username,
          admin_full_name: row.full_name,
          legacy_admin_user_id: row.id,
          force_password_reset: true,
        },
      });
      if (cErr) { results.push({ username: row.username, email, status: "create_failed", error: cErr.message }); continue; }
      user = created.user;
    } else {
      // Ensure password is set to TEMP_PASSWORD so they can sign in with it.
      // Comment out the next call if you do NOT want existing auth users' passwords reset.
      await admin.auth.admin.updateUserById(user.id, {
        password: TEMP_PASSWORD,
        email_confirm: true,
        user_metadata: { ...(user.user_metadata || {}), admin_username: row.username, admin_full_name: row.full_name, legacy_admin_user_id: row.id, force_password_reset: true },
      });
    }

    // Grant super_admin role (idempotent)
    const { error: roleErr } = await admin
      .from("user_roles")
      .upsert({ user_id: user.id, role: "super_admin" }, { onConflict: "user_id,role" });
    if (roleErr) { results.push({ username: row.username, email, status: "role_failed", user_id: user.id, error: roleErr.message }); continue; }

    results.push({ username: row.username, email, status: "ok", user_id: user.id });
  }

  return new Response(JSON.stringify({ temp_password: TEMP_PASSWORD, count: results.length, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
