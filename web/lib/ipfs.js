import crypto from "node:crypto";

// AES-256-GCM. Stored layout on IPFS: [12-byte IV][16-byte auth tag][ciphertext]
function encrypt(buf) {
  const key = Buffer.from(process.env.EVIDENCE_ENCRYPTION_KEY || "", "hex");
  if (key.length !== 32) throw new Error("EVIDENCE_ENCRYPTION_KEY must be 64 hex characters (run `npm run setup`)");
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([c.update(buf), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]);
}

// Returns { name, cid, sha256 }. If PINATA_JWT is empty, evidence is hashed but not uploaded (cid = null).
export async function storeEvidence(file) {
  const plain = Buffer.from(await file.arrayBuffer());
  const sha256 = crypto.createHash("sha256").update(plain).digest("hex");
  if (!process.env.PINATA_JWT) return { name: file.name, cid: null, sha256 };

  const form = new FormData();
  form.append("file", new Blob([encrypt(plain)]), file.name + ".enc");
  form.append("pinataMetadata", JSON.stringify({ name: "fir-evidence-" + sha256.slice(0, 12) }));
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST", headers: { Authorization: "Bearer " + process.env.PINATA_JWT }, body: form
  });
  if (!res.ok) throw new Error("Pinata upload failed: " + res.status);
  const json = await res.json();
  return { name: file.name, cid: json.IpfsHash, sha256 };
}
