// Konversi file dump MySQL (CREATE TABLE + INSERT) menjadi SQL PostgreSQL.
// Dipakai oleh fungsi admin-db-restore agar file backup MySQL yang dihasilkan
// oleh admin-db-backup bisa di-restore kembali ke database aplikasi.

const pgQ = (ident: string) => `"${ident.replace(/"/g, '""')}"`;

/** Split SQL text into statements on top-level semicolons, respecting quotes/comments. */
export function splitStatements(input: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inS = false, inD = false, inB = false;
  let inLine = false, inHash = false, inBlock = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1] ?? "";
    // Komentar dibuang sepenuhnya (jangan menempel ke statement berikutnya)
    if (inLine || inHash) {
      if (ch === "\n") { inLine = false; inHash = false; cur += "\n"; }
      continue;
    }
    if (inBlock) {
      if (ch === "*" && next === "/") { i++; inBlock = false; }
      continue;
    }
    if (!inS && !inD && !inB) {
      if (ch === "-" && next === "-") { inLine = true; i++; continue; }
      if (ch === "#") { inHash = true; continue; }
      if (ch === "/" && next === "*") { inBlock = true; i++; continue; }
    }
    if (inS) {
      cur += ch;
      if (ch === "\\") { cur += next; i++; continue; }
      if (ch === "'") {
        if (next === "'") { cur += next; i++; } else inS = false;
      }
      continue;
    }
    if (inD) {
      cur += ch;
      if (ch === '"') {
        if (next === '"') { cur += next; i++; } else inD = false;
      }
      continue;
    }
    if (inB) {
      cur += ch;
      if (ch === "`") inB = false;
      continue;
    }
    if (ch === "'") { inS = true; cur += ch; continue; }
    if (ch === '"') { inD = true; cur += ch; continue; }
    if (ch === "`") { inB = true; cur += ch; continue; }
    if (ch === ";") { out.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}

/** Split a list (e.g. column definitions) on top-level commas. */
function splitTopLevel(input: string): string[] {
  const out: string[] = [];
  let cur = "";
  let depth = 0;
  let inS = false, inB = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inS) {
      cur += ch;
      if (ch === "\\") { cur += input[i + 1] ?? ""; i++; continue; }
      if (ch === "'") inS = false;
      continue;
    }
    if (inB) {
      cur += ch;
      if (ch === "`") inB = false;
      continue;
    }
    if (ch === "'") { inS = true; cur += ch; continue; }
    if (ch === "`") { inB = true; cur += ch; continue; }
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

function mapType(base: string, args: string): string {
  switch (base) {
    case "TINYINT": return args === "1" ? "boolean" : "smallint";
    case "BOOL":
    case "BOOLEAN": return "boolean";
    case "SMALLINT": return "smallint";
    case "MEDIUMINT":
    case "INT":
    case "INTEGER": return "integer";
    case "BIGINT": return "bigint";
    case "VARCHAR": {
      const n = parseInt(args, 10);
      return `varchar(${Number.isNaN(n) ? 255 : n})`;
    }
    case "CHAR": {
      const n = parseInt(args, 10);
      return `char(${Number.isNaN(n) ? 36 : n})`;
    }
    case "TINYTEXT":
    case "MEDIUMTEXT":
    case "LONGTEXT":
    case "TEXT": return "text";
    case "DATETIME": return "timestamp";
    case "TIMESTAMP": return "timestamptz";
    case "DATE": return "date";
    case "TIME": return "time";
    case "YEAR": return "smallint";
    case "DECIMAL":
    case "NUMERIC": return args ? `numeric(${args.replace(/\s+/g, "")})` : "numeric";
    case "DOUBLE":
    case "REAL":
    case "FLOAT": return "double precision";
    case "JSON": return "jsonb";
    case "BLOB":
    case "TINYBLOB":
    case "MEDIUMBLOB":
    case "LONGBLOB":
    case "BINARY":
    case "VARBINARY": return "bytea";
    case "ENUM":
    case "SET": return "text";
    case "BIT": return args === "1" ? "boolean" : "bytea";
    default: return "text";
  }
}

function quoteCols(raw: string): string {
  return raw
    .split(",")
    .map((c) => pgQ(c.trim().replace(/`/g, "")))
    .join(", ");
}

function convertColumnDef(item: string): string | null {
  const m = item.match(/^`([^`]+)`\s*([\s\S]*)$/);
  if (!m) return null;
  const name = pgQ(m[1]);
  const rest = m[2].trim();
  const tm = rest.match(/^([A-Za-z]+)\s*(\([^)]*\))?/);
  if (!tm) return null;
  const base = tm[1].toUpperCase();
  const args = tm[2] ? tm[2].slice(1, -1).trim() : "";
  let type = mapType(base, args);
  let tail = rest.slice(tm[0].length);
  const isAuto = /\bAUTO_INCREMENT\b/i.test(tail);
  if (isAuto) type = base === "BIGINT" ? "bigserial" : "serial";
  tail = tail
    .replace(/\bAUTO_INCREMENT\b/gi, "")
    .replace(/\bUNSIGNED\b/gi, "")
    .replace(/\bZEROFILL\b/gi, "")
    .replace(/\bCHARACTER SET\s+\S+/gi, "")
    .replace(/\bCOLLATE\s+\S+/gi, "")
    .replace(/\bCOMMENT\s+'(?:[^'\\]|\\.)*'/gi, "")
    .replace(/\bON UPDATE CURRENT_TIMESTAMP(\(\d*\))?/gi, "")
    .trim();
  if (type === "boolean") {
    tail = tail.replace(/DEFAULT\s+0\b/gi, "DEFAULT false").replace(/DEFAULT\s+1\b/gi, "DEFAULT true");
  }
  return `  ${name} ${type}${tail ? " " + tail : ""}`;
}

function convertCreateTable(st: string): string | null {
  const nameMatch = st.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([A-Za-z0-9_$.]+)`?\s*\(/i);
  if (!nameMatch) return null;
  const tableName = nameMatch[1].split(".").pop() as string;
  const openIdx = st.indexOf("(", nameMatch.index as number);
  if (openIdx < 0) return null;
  // Find the matching close paren (quote-aware)
  let depth = 0, closeIdx = -1, inS = false, inB = false;
  for (let i = openIdx; i < st.length; i++) {
    const ch = st[i];
    if (inS) {
      if (ch === "\\") { i++; continue; }
      if (ch === "'") inS = false;
      continue;
    }
    if (inB) {
      if (ch === "`") inB = false;
      continue;
    }
    if (ch === "'") { inS = true; continue; }
    if (ch === "`") { inB = true; continue; }
    if (ch === "(") depth++;
    if (ch === ")") { depth--; if (depth === 0) { closeIdx = i; break; } }
  }
  if (closeIdx < 0) return null;
  const inner = st.slice(openIdx + 1, closeIdx);

  const parts: string[] = [];
  for (const rawItem of splitTopLevel(inner)) {
    const item = rawItem.trim();
    if (!item) continue;
    if (/^PRIMARY KEY/i.test(item)) {
      parts.push(`  ${item.replace(/`([^`]+)`/g, (_x, c: string) => pgQ(c))}`);
      continue;
    }
    const uk = item.match(/^UNIQUE\s+(?:KEY|INDEX)\s+`([^`]+)`\s*\(([\s\S]*)\)/i);
    if (uk) {
      parts.push(`  CONSTRAINT ${pgQ(uk[1])} UNIQUE (${quoteCols(uk[2])})`);
      continue;
    }
    if (/^(KEY|INDEX|FULLTEXT|SPATIAL)\b/i.test(item)) continue; // secondary indexes
    if (/^CONSTRAINT\b/i.test(item)) {
      parts.push(`  ${item.replace(/`([^`]+)`/g, (_x, c: string) => pgQ(c))}`);
      continue;
    }
    const col = convertColumnDef(item);
    if (col) parts.push(col);
  }

  return `CREATE TABLE public.${pgQ(tableName)} (\n${parts.join(",\n")}\n);`;
}

function convertInsert(st: string): string | null {
  let s = st.replace(/`([^`]+)`/g, "$1");
  const m = s.match(/^INSERT\s+INTO\s+([A-Za-z0-9_$]+)/i);
  if (!m) return null;
  s = `INSERT INTO public.${pgQ(m[1])}${s.slice(m[0].length)}`;
  // Fix MySQL backslash escapes inside string literals
  let out = "";
  let inS = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (!inS) {
      if (ch === "'") inS = true;
      out += ch;
      continue;
    }
    if (ch === "\\") {
      const n = s[i + 1] ?? "";
      if (n === "'") out += "''";
      else if (n === "\\") out += "\\";
      else if (n === '"') out += '"';
      else out += "\\" + n;
      i++;
      continue;
    }
    if (ch === "'") {
      if (s[i + 1] === "'") { out += "''"; i++; continue; }
      inS = false;
    }
    out += ch;
  }
  return `${out};`;
}

function convertStatement(st: string): string | null {
  const s = st.trim();
  if (!s) return null;
  const upper = s.toUpperCase();
  if (
    upper.startsWith("SET ") ||
    upper.startsWith("LOCK ") ||
    upper.startsWith("UNLOCK ") ||
    upper.startsWith("START TRANSACTION") ||
    upper === "BEGIN" ||
    upper === "COMMIT" ||
    upper.startsWith("USE ")
  ) return null;
  if (/^DROP\s+TABLE/i.test(s)) {
    const m = s.match(/`([^`]+)`/);
    if (m) return `DROP TABLE IF EXISTS public.${pgQ(m[1])} CASCADE;`;
    return null;
  }
  if (/^CREATE\s+TABLE/i.test(s)) return convertCreateTable(s);
  if (/^INSERT\s+INTO/i.test(s)) return convertInsert(s);
  return null;
}

/** Convert a MySQL dump (structure + INSERTs) into PostgreSQL SQL wrapped in a transaction. */
export function convertMysqlToPostgres(content: string): string {
  const statements = splitStatements(content);
  const converted: string[] = [];
  for (const st of statements) {
    const out = convertStatement(st);
    if (out) converted.push(out);
  }
  return `BEGIN;\n\n${converted.join("\n\n")}\n\nCOMMIT;\n`;
}
