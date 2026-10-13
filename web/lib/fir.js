import { db } from "./db.js";
import { readAnchorTx } from "./chain.js";

// Marks a FIR as ANCHORED after validating the on-chain event against the DB hash.
export async function finalizeAnchor(id, txHash) {
  const { rows } = await db().query("SELECT * FROM firs WHERE id=$1", [id]);
  const row = rows[0];
  if (!row) throw new Error("FIR not found");
  const info = await readAnchorTx(txHash, id, row.doc_hash);
  await db().query(
    "UPDATE firs SET status='ANCHORED', tx_hash=$2, officer=$3, anchored_at=to_timestamp($4) WHERE id=$1",
    [id, txHash, info.officer, info.timestamp]
  );
  return { id: String(id), hash: row.doc_hash, status: "ANCHORED", txHash, officer: info.officer, timestamp: info.timestamp };
}
