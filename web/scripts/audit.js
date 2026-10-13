// Background auditor: re-verifies EVERY FIR against the blockchain. Run on a schedule (cron / GitHub Actions).
//   npm run audit        -> exit code 1 if anything is not AUTHENTIC
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", ".env") });

const { db, ensureSchema } = await import("../lib/db.js");
const { verifyFir } = await import("../lib/verify.js");

await ensureSchema();
const { rows } = await db().query("SELECT id FROM firs ORDER BY id");
let bad = 0;
for (const { id } of rows) {
  const r = await verifyFir(id);
  const ok = r.code === "AUTHENTIC" || r.code === "PENDING";
  if (!ok) bad++;
  console.log(`${ok ? "OK  " : "FAIL"} FIR-${id}  ${r.code}`);
}
console.log(`\nAudited ${rows.length} FIR(s), ${bad} problem(s).`);
await db().end();
process.exit(bad ? 1 : 0);
