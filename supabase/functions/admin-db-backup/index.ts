import { createClient } from "https://esm.sh/@supabase/supabase-js@2.103.0";
import postgres from "npm:postgres@3.4.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Tabel yang datanya ikut di-backup (data login / manajemen user)
const DATA_TABLES = ["admin_roles", "admin_users", "user_roles"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const q = (ident: string) => `"${ident.replace(/"/g, '""')}"`;

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  return `'${String(value).replace(/'/g, "''")}'`;
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

    const sql = postgres(dbUrl, { max: 1, prepare: false });

    try {
      // Ambil semua tabel di schema public
      const tables = await sql<{ table_name: string }[]>`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;

      let out = `-- CareerPJM Structure Backup\n-- Generated: ${new Date().toISOString()}\n-- Isi: struktur tabel + data user/login (manajemen user)\n\nBEGIN;\n\n`;

      for (const { table_name } of tables) {
        const columns = await sql<any[]>`
          SELECT column_name, data_type, udt_name, is_nullable, column_default,
                 character_maximum_length, numeric_precision, numeric_scale
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ${table_name}
          ORDER BY ordinal_position
        `;

        const colDefs = columns.map((c) => {
          let type = c.data_type;
          if (type === "USER-DEFINED") type = c.udt_name;
          else if (type === "character varying") type = c.character_maximum_length ? `varchar(${c.character_maximum_length})` : "varchar";
          else if (type === "numeric" && c.numeric_precision) type = `numeric(${c.numeric_precision}${c.numeric_scale != null ? `,${c.numeric_scale}` : ""})`;
          else if (type === "ARRAY") type = `${c.udt_name.replace(/^_/, "")}[]`;
          const nullable = c.is_nullable === "YES" ? "" : " NOT NULL";
          const def = c.column_default ? ` DEFAULT ${c.column_default}` : "";
          return `  ${q(c.column_name)} ${type}${def}${nullable}`;
        });

        const constraints = await sql<any[]>`
          SELECT tc.constraint_name, tc.constraint_type,
                 string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS cols
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          WHERE tc.table_schema = 'public' AND tc.table_name = ${table_name}
            AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
          GROUP BY tc.constraint_name, tc.constraint_type
        `;

        for (const con of constraints) {
          const cols = con.cols.split(", ").map((c: string) => q(c.trim())).join(", ");
          colDefs.push(`  CONSTRAINT ${q(con.constraint_name)} ${con.constraint_type} (${cols})`);
        }

        out += `DROP TABLE IF EXISTS public.${q(table_name)} CASCADE;\n`;
        out += `CREATE TABLE public.${q(table_name)} (\n${colDefs.join(",\n")}\n);\n\n`;
      }

      // Data hanya untuk tabel user/login
      for (const tableName of DATA_TABLES) {
        const exists = tables.some((t) => t.table_name === tableName);
        if (!exists) continue;
        const rows = await sql<any[]>`SELECT * FROM ${sql(tableName)}`;
        out += `-- Data: ${tableName} (${rows.length} baris)\n`;
        for (const row of rows) {
          const cols = Object.keys(row);
          const values = cols.map((c) => sqlLiteral(row[c])).join(", ");
          out += `INSERT INTO public.${q(tableName)} (${cols.map(q).join(", ")}) VALUES (${values});\n`;
        }
        out += "\n";
      }

      out += "COMMIT;\n";

      return json({ sql: out, tables: tables.length, data_tables: DATA_TABLES });
    } finally {
      await sql.end({ timeout: 5 }).catch(() => {});
    }
  } catch (error) {
    console.error("admin-db-backup error:", error);
    return json({ error: error instanceof Error ? error.message : "Backup gagal" }, 500);
  }
});
