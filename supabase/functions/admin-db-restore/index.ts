// ============= Full file contents =============

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";
import postgres from "npm:postgres@3.4.5";
import { convertMysqlToPostgres } from "../_shared/mysqlToPostgres.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!supabaseUrl || !serviceRoleKey || !dbUrl) {
      return json({ error: "Konfigurasi server tidak lengkap" }, 500);
    }

    // Verifikasi admin
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return json({ error: "Tidak terautentikasi" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    // Verifikasi JWT secara lokal (getClaims) — lebih tahan terhadap token
    // yang baru saja di-refresh dibanding getUser yang memanggil server auth.
    const { data: claimsData, error: claimsError } = await admin.auth.getClaims(token);
    const userId = claimsData?.claims?.sub as string | undefined;
    if (claimsError || !userId) return json({ error: "Sesi tidak valid. Silakan masuk ulang." }, 401);

    const { data: isAdmin, error: roleError } = await admin.rpc("is_any_admin", { _user_id: userId });
    if (roleError || !isAdmin) return json({ error: "Akses ditolak. Hanya admin." }, 403);

    const body = await req.json();
    const format = String(body.format || "").toLowerCase();
    const content = String(body.content || "");
    if (!content) return json({ error: "File kosong" }, 400);

    const sql = postgres(dbUrl, { max: 1, prepare: false });

    try {
      if (format === "sql") {
        // Jalankan seluruh isi file SQL apa adanya (mendukung banyak statement)
        await sql.unsafe(content);
        return json({ success: true, message: "Database berhasil di-restore dari file SQL" });
      }

      if (format === "mysql") {
        // Konversi dump MySQL menjadi PostgreSQL lalu jalankan
        const converted = convertMysqlToPostgres(content);
        console.log("admin-db-restore: converting MySQL dump,", converted.length, "chars");
        await sql.unsafe(converted);
        return json({
          success: true,
          message: "Database berhasil di-restore dari file MySQL (dikonversi otomatis ke format database aplikasi)",
        });
      }

      if (format === "json") {
        const parsed = JSON.parse(content);
        const database = parsed.database && typeof parsed.database === "object" ? parsed.database : parsed;
        if (!database || typeof database !== "object" || Array.isArray(database)) {
          return json({ error: "Format JSON tidak valid. Harus berisi objek { nama_tabel: [baris] }" }, 400);
        }

        const summary: Record<string, number> = {};
        await sql.begin(async (tx) => {
          for (const [table, rows] of Object.entries(database)) {
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
              throw new Error(`Nama tabel tidak valid: ${table}`);
            }
            if (!Array.isArray(rows)) continue;

            // Kosongkan tabel lalu isi ulang sesuai file
            await tx.unsafe(`TRUNCATE TABLE public."${table}" CASCADE`);
            const batchSize = 500;
            for (let i = 0; i < rows.length; i += batchSize) {
              const batch = rows.slice(i, i + batchSize);
              if (batch.length) {
                await tx`INSERT INTO ${tx(table)} ${tx(batch)}`;
              }
            }
            summary[table] = rows.length;
          }
        });

        return json({ success: true, message: "Database berhasil di-restore dari file JSON", summary });
      }

      return json({ error: "Format tidak didukung. Gunakan sql, mysql, atau json." }, 400);
    } finally {
      await sql.end({ timeout: 5 }).catch(() => {});
    }
  } catch (error) {
    console.error("admin-db-restore error:", error);
    return json({ error: error instanceof Error ? error.message : "Restore gagal" }, 500);
  }
});
