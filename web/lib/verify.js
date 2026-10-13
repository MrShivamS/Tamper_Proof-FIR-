import { db, ensureSchema } from "./db.js";
import { readLatest } from "./chain.js";
import { docHash, payloadOf } from "./hash.js";

const MSG = {
  AUTHENTIC: "Authentic: the database record matches the hash anchored on the blockchain. It has not been altered.",
  TAMPERED: "TAMPERING DETECTED: the record was modified after it was anchored.",
  DELETED: "RECORD MISSING: this FIR is on the blockchain but was deleted from the database.",
  NOT_ANCHORED: "NOT ANCHORED: this record exists in the database but has no blockchain proof (possibly backdated or injected).",
  PENDING: "PENDING: the FIR is saved but its blockchain anchoring has not completed yet.",
  FORGED_QR: "FORGED QR: the hash in this QR/copy does not match the hash anchored on the blockchain.",
  UNKNOWN: "UNKNOWN FIR: no database record and no blockchain entry exist for this ID."
};

// Public result. Never includes personal data (name, phone, address, complaint text).
export async function verifyFir(id, qrHash) {
  await ensureSchema();
  const { rows } = await db().query("SELECT * FROM firs WHERE id=$1", [id]);
  const row = rows[0] || null;
  const chain = await readLatest(id);

  const out = (code, extra = {}) => ({
    id: String(id), code, message: MSG[code], policeStation: row?.record?.policeStation || null,
    officer: chain?.officer || null, anchoredAt: chain ? new Date(chain.timestamp * 1000).toISOString() : null,
    chainHash: chain?.hash || null, txHash: row?.tx_hash || null, ...extra
  });

  if (!row && !chain) return out("UNKNOWN");
  if (qrHash && chain && qrHash.toLowerCase() !== chain.hash) return out("FORGED_QR");
  if (!row) return out("DELETED");
  if (!chain) return out(row.status === "PENDING" ? "PENDING" : "NOT_ANCHORED");

  const current = docHash(payloadOf(row));
  return current === chain.hash ? out("AUTHENTIC") : out("TAMPERED", { currentHash: current });
}
