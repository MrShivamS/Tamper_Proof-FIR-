import { createHash } from "node:crypto";

// Deterministic JSON: sorted keys, Unicode NFC, collapsed whitespace (safe for Devanagari/Marathi text)
export function canonicalize(v) {
  if (v === null || v === undefined) return "null";
  if (typeof v === "string") return JSON.stringify(v.normalize("NFC").trim().replace(/\s+/g, " "));
  if (typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonicalize).join(",") + "]";
  return "{" + Object.keys(v).sort().map(k => JSON.stringify(k) + ":" + canonicalize(v[k])).join(",") + "}";
}

export const docHash = (payload) => "0x" + createHash("sha256").update(canonicalize(payload), "utf8").digest("hex");

// The exact object that is hashed for a FIR row. Used when anchoring AND when verifying.
export const payloadOf = (row) => ({
  firId: String(row.id),
  record: row.record,
  evidence: row.evidence,
  salt: row.salt
});
