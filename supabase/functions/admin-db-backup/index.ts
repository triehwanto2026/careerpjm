// ============= Full file contents =============

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
const bq = (ident: string) => "`" + ident.replace(/`/g, "``") + "`";

function sqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

// ---- MySQL helpers ----

function toMysqlType(c: any): string {
  const dt = c.data_type;
  const udt = c.udt_name;
  const len = c.character_maximum_length;
  const prec = c.numeric_precision;
  const scale = c.numeric_scale;
  switch (dt) {
    case "uuid": return "CHAR(36)";
    case "character varying": return len ? `VARCHAR(${len})` : "TEXT";
    case "character": return len ? `CHAR(${len})` : "CHAR(255)";
    case "text": return "TEXT";
    case "integer": return "INT";
    case "bigint": return "BIGINT";
    case "smallint": return "SMALLINT";
    case "boolean": return "TINYINT(1)";
    case "numeric": return prec != null ? `DECIMAL(${prec},${scale ?? 0})` : "DOUBLE";
    case "double precision": return "DOUBLE";
    case "real": return "FLOAT";
    case "jsonb":
    case "json": return "JSON";
    case "timestamp with time zone":
    case "timestamp without time zone": return "DATETIME";
    case "date": return "DATE";
    case "time without time zone":
    case "time with time zone": return "TIME";
    case "bytea": return "LONGBLOB";
    case "ARRAY": return "JSON";
    case "USER-DEFINED": return udt === "uuid" ? "CHAR(36)" : "TEXT";
    default: return "TEXT";
  }
}

function mysqlDefault(col: any, autoInc: boolean, type: string): string {
  if (autoInc || !col.column_default) return "";
  let d = String(col.column_default).trim();
  if (/^nextval\(/i.test(d)) return "";
  // buang cast tipe Postgres, mis. 'aktif'::text / '{}'::text[]
  d = d.replace(/::[a-zA-Z_]+(?: ?(?:with|without) ?time ?zone)?(\[\])?/g, "");
  if (/^gen_random_uuid\(\)/i.test(d)) d = "(uuid())";
  else if (/^now\(\)/i.test(d)) d = "CURRENT_TIMESTAMP";
  else if (type === "JSON") d = `(${d})`;
  return ` DEFAULT ${d}`;
}

function mysqlLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "bigint") return String(value);
  if (value instanceof Uint8Array) return "NULL";
  if (value instanceof Date) {
    return `'${value.toISOString().replace("T", " ").slice(0, 23)}'`;
  }
  if (typeof value === "object") {
    return `'${JSON.stringify(value).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
  }
  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
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

    const body = await req.json().catch(() => ({}));
    const format = String((body as any)?.format || "postgres").toLowerCase();
    if (format !== "postgres" && format !== "mysql") {
      return json({ error: "Format tidak didukung. Gunakan postgres atau mysql." }, 400);
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

      const defs: { name: string; columns: any[]; constraints: any[] }[] = [];
      for (const { table_name } of tables) {
        const columns = await sql<any[]>`
          SELECT column_name, data_type, udt_name, is_nullable, column_default,
                 character_maximum_length, numeric_precision, numeric_scale
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = ${table_name}
          ORDER BY ordinal_position
        `;
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
        defs.push({ name: table_name, columns, constraints });
      }

      const dataSection = async (fmt: string): Promise<string> => {
        let out = "";
        for (const tableName of DATA_TABLES) {
          if (!defs.some((d) => d.name === tableName)) continue;
          const rows = await sql<any[]>`SELECT * FROM ${sql(tableName)}`;
          out += `-- Data: ${tableName} (${rows.length} baris)\n`;
          for (const row of rows) {
            const cols = Object.keys(row);
            if (fmt === "mysql") {
              const values = cols.map((c) => mysqlLiteral(row[c])).join(", ");
              out += `INSERT INTO ${bq(tableName)} (${cols.map(bq).join(", ")}) VALUES (${values});\n`;
            } else {
              const values = cols.map((c) => sqlLiteral(row[c])).join(", ");
              out += `INSERT INTO public.${q(tableName)} (${cols.map(q).join(", ")}) VALUES (${values});\n`;
            }
          }
          out += "\n";
        }
        return out;
      };

      let out = "";
      if (format === "mysql") {
        const generated = new Date().toISOString();
        out += `-- CareerPJM Structure Backup (MySQL)\n-- Generated: ${generated}\n-- Isi: struktur tabel + data user/login (manajemen user)\n-- File ini bisa di-import langsung ke MySQL (phpMyAdmin / MySQL Workbench / mysql CLI).\n\nSET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\nSET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n\n`;
        for (const d of defs) {
          const colDefs = d.columns.map((c) => {
            const autoInc = (c.column_default || "").includes("nextval");
            const type = toMysqlType(c);
            const def = mysqlDefault(c, autoInc, type);
            const nullable = c.is_nullable === "NO" ? " NOT NULL" : "";
            return `  ${bq(c.column_name)} ${type}${autoInc ? " AUTO_INCREMENT" : ""}${def}${nullable}`;
          });
          for (const con of d.constraints) {
            const cols = con.cols.split(", ").map((c: string) => bq(c.trim())).join(", ");
            if (con.constraint_type === "PRIMARY KEY") {
              colDefs.push(`  PRIMARY KEY (${cols})`);
            } else {
              colDefs.push(`  UNIQUE KEY ${bq(con.constraint_name)} (${cols})`);
            }
          }
          out += `DROP TABLE IF EXISTS ${bq(d.name)};\n`;
          out += `CREATE TABLE ${bq(d.name)} (\n${colDefs.join(",\n")}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;
        }
        out += await dataSection("mysql");
        out += "SET FOREIGN_KEY_CHECKS = 1;\n";
      } else {
        out += `-- CareerPJM Structure Backup\n-- Generated: ${new Date().toISOString()}\n-- Isi: struktur tabel + data user/login (manajemen user)\n\nBEGIN;\n\n`;
        for (const d of defs) {
          const colDefs = d.columns.map((c) => {
            let type = c.data_type;
            if (type === "USER-DEFINED") type = c.udt_name;
            else if (type === "character varying") type = c.character_maximum_length ? `varchar(${c.character_maximum_length})` : "varchar";
            else if (type === "numeric" && c.numeric_precision) type = `numeric(${c.numeric_precision}${c.numeric_scale != null ? `,${c.numeric_scale}` : ""})`;
            else if (type === "ARRAY") type = `${c.udt_name.replace(/^_/, "")}[]`;
            const nullable = c.is_nullable === "YES" ? "" : " NOT NULL";
            const def = c.column_default ? ` DEFAULT ${c.column_default}` : "";
            return `  ${q(c.column_name)} ${type}${def}${nullable}`;
          });
          for (const con of d.constraints) {
            const cols = con.cols.split(", ").map((c: string) => q(c.trim())).join(", ");
            colDefs.push(`  CONSTRAINT ${q(con.constraint_name)} ${con.constraint_type} (${cols})`);
          }
          out += `DROP TABLE IF EXISTS public.${q(d.name)} CASCADE;\n`;
          out += `CREATE TABLE public.${q(d.name)} (\n${colDefs.join(",\n")}\n);\n\n`;
        }
        out += await dataSection("postgres");
        out += "COMMIT;\n";
      }

      return json({ sql: out, format, tables: tables.length, data_tables: DATA_TABLES });
    } finally {
      await sql.end({ timeout: 5 }).catch(() => {});
    }
  } catch (error) {
    console.error("admin-db-backup error:", error);
    return json({ error: error instanceof Error ? error.message : "Backup gagal" }, 500);
  }
});
