import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(root, ".env.local");
const values = new Map();
if (existsSync(target)) {
  for (const line of readFileSync(target, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line);
    if (match) values.set(match[1], match[2]);
  }
  const existing = values.get("NEXT_PUBLIC_SUPABASE_URL");
  if (existing && existing !== "https://xnlnzdixcwuichejzgbg.supabase.co") {
    throw new Error(".env.local menunjuk project berbeda. Cadangkan berkas itu sebelum menjalankan setup ini.");
  }
}
values.set("NEXT_PUBLIC_SUPABASE_URL", "https://xnlnzdixcwuichejzgbg.supabase.co");
values.set("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_0X4VQ__gGqIYapoUNUgNxw_SqPGltU1");
if (!values.get("PARENT_UNLOCK_SECRET") || values.get("PARENT_UNLOCK_SECRET").length < 32) {
  values.set("PARENT_UNLOCK_SECRET", randomBytes(32).toString("hex"));
}
values.set("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
if (existsSync(target)) {
  const backup = target + ".backup-" + Date.now();
  writeFileSync(backup, readFileSync(target), { mode: 0o600, flag: "wx" });
}
writeFileSync(target, "# EJA local environment — jangan commit atau bagikan file ini.\n" +
  [...values].map(([name, value]) => name + "=" + value).join("\n") + "\n", { mode: 0o600 });
console.log("Konfigurasi lokal EJA tersimpan. Jalankan npm run dev, lalu buka http://localhost:3000/daftar.");

