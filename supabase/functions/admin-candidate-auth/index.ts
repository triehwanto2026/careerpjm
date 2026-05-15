import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Action = "activate_login" | "reset_password" | "create_or_update_user";

interface RequestBody {
  action: Action;
  email: string;
  password?: string;
  full_name?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Supabase service role environment is not configured" }, 500);
    }

    const body = (await req.json()) as RequestBody;
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const fullName = body.full_name?.trim();

    if (!body.action || !email) {
      return json({ error: "Action dan email wajib diisi" }, 400);
    }

    if ((body.action === "reset_password" || body.action === "create_or_update_user") && (!password || password.length < 6)) {
      return json({ error: "Password minimal 6 karakter" }, 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const user = await findUserByEmail(admin, email);

    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: password || "123456",
        email_confirm: true,
        user_metadata: fullName ? { full_name: fullName, created_by_admin: true } : { created_by_admin: true },
      });

      if (error) return json({ error: error.message }, 400);

      await upsertProfile(admin, data.user.id, email, fullName);

      return json({
        user_id: data.user.id,
        email,
        created: true,
        email_confirmed: true,
        message: "Akses login kandidat dibuat dan email sudah diaktivasi",
      });
    }

    const updatePayload: Record<string, unknown> = {
      email_confirm: true,
      user_metadata: fullName ? { ...(user.user_metadata || {}), full_name: fullName } : user.user_metadata,
    };

    if (body.action === "reset_password" || body.action === "create_or_update_user") {
      updatePayload.password = password;
    }

    const { data, error } = await admin.auth.admin.updateUserById(user.id, updatePayload);
    if (error) return json({ error: error.message }, 400);

    await upsertProfile(admin, user.id, email, fullName);

    return json({
      user_id: data.user.id,
      email,
      created: false,
      email_confirmed: true,
      message: body.action === "activate_login"
        ? "Login kandidat sudah diaktivasi tanpa email notifikasi"
        : "Password kandidat berhasil direset dan login sudah diaktivasi",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return json({ error: message }, 500);
  }
});

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const findUserByEmail = async (admin: ReturnType<typeof createClient>, email: string) => {
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const user = data.users.find((item) => item.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < perPage) return null;
    page += 1;
  }

  return null;
};

const upsertProfile = async (
  admin: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  fullName?: string,
) => {
  const { error } = await admin
    .from("candidate_profiles")
    .upsert(
      {
        user_id: userId,
        email,
        ...(fullName ? { full_name: fullName } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) {
    console.warn("Profile upsert failed", error.message);
  }
};
