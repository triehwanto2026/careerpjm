// One-shot edge function to seed psychology test questions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" }});
  }
  try {
    const sql: string = (await req.json()).sql;
    if (!sql) return new Response(JSON.stringify({ error: "no sql" }), { status: 400 });
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    // Use raw fetch to PostgREST RPC won't work; use pg via supabase-js doesn't exec raw SQL.
    // Workaround: use the database via the postgres-meta endpoint
    const res = await fetch(`${url}/rest/v1/rpc/exec_seed_sql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` },
      body: JSON.stringify({ sql_text: sql }),
    });
    const text = await res.text();
    return new Response(JSON.stringify({ status: res.status, body: text }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "Access-Control-Allow-Origin": "*" }});
  }
});
