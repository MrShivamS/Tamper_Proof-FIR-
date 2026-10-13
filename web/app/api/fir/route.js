import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db.js";
import { docHash, payloadOf } from "@/lib/hash.js";
import { storeEvidence } from "@/lib/ipfs.js";
import { anchorViaRelayer } from "@/lib/chain.js";
import { finalizeAnchor } from "@/lib/fir.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (msg, status = 400) => NextResponse.json({ error: msg }, { status });

export async function POST(req) {
  try {
    const fd = await req.formData();
    const f = (k) => String(fd.get(k) || "").trim();

    if (!f("name") || !/^\d{10}$/.test(f("phone")) || !/^\S+@\S+\.\S+$/.test(f("email")) || !f("policeStation") || f("complaint").length < 10)
      return bad("Please fill all required fields correctly (phone must be 10 digits, complaint at least 10 characters).");

    const files = fd.getAll("files").filter((x) => x && typeof x === "object" && x.size > 0);
    if (files.length > 5) return bad("Maximum 5 evidence files.");
    for (const file of files) if (file.size > 3 * 1024 * 1024) return bad(`${file.name} is larger than 3 MB.`);

    const evidence = [];
    for (const file of files) evidence.push(await storeEvidence(file));
    evidence.sort((a, b) => a.sha256.localeCompare(b.sha256)); // deterministic order for hashing

    const record = {
      name: f("name"), phone: f("phone"), email: f("email"), street: f("street"), address: f("address"),
      city: f("city"), state: f("state"), country: f("country"), pin: f("pin"),
      policeStation: f("policeStation"), complaint: f("complaint")
    };
    const salt = randomBytes(32).toString("hex");

    await ensureSchema();
    // 1) Save as PENDING first, so a rejected/failed transaction never loses the FIR
    const ins = await db().query(
      "INSERT INTO firs (record, evidence, salt) VALUES ($1,$2,$3) RETURNING *",
      [JSON.stringify(record), JSON.stringify(evidence), salt]
    );
    const row = ins.rows[0];
    const hash = docHash(payloadOf(row));
    await db().query("UPDATE firs SET doc_hash=$2 WHERE id=$1", [row.id, hash]);

    // 2a) Relayer mode: backend anchors for citizens
    if (fd.get("relay") === "1") {
      const txHash = await anchorViaRelayer(row.id, hash);
      return NextResponse.json(await finalizeAnchor(row.id, txHash));
    }
    // 2b) Wallet mode: the browser anchors with MetaMask, then calls /confirm
    return NextResponse.json({ id: String(row.id), hash, status: "PENDING" });
  } catch (e) {
    console.error(e);
    return bad(e.message || "Server error", 500);
  }
}
