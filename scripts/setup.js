// Creates .env from .env.example (if missing) and generates the evidence encryption key.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const root = path.join(__dirname, "..");
const envPath = path.join(root, ".env");
if (!fs.existsSync(envPath)) { fs.copyFileSync(path.join(root, ".env.example"), envPath); console.log("Created .env"); }
let env = fs.readFileSync(envPath, "utf8");
if (/^EVIDENCE_ENCRYPTION_KEY=\s*$/m.test(env)) {
  env = env.replace(/^EVIDENCE_ENCRYPTION_KEY=\s*$/m, "EVIDENCE_ENCRYPTION_KEY=" + crypto.randomBytes(32).toString("hex"));
  fs.writeFileSync(envPath, env); console.log("Generated EVIDENCE_ENCRYPTION_KEY");
}
console.log("Now open .env and replace the keys marked REPLACE.");
