import { ethers } from "ethers";

const ABI = [
  "function anchor(uint256 firId, bytes32 docHash)",
  "function versionCount(uint256 firId) view returns (uint256)",
  "function latest(uint256 firId) view returns (tuple(bytes32 docHash, uint64 timestamp, address officer))",
  "event FIRAnchored(uint256 indexed firId, uint256 version, bytes32 docHash, address officer)"
];

const address = () => {
  const a = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
  if (!a) throw new Error("NEXT_PUBLIC_REGISTRY_ADDRESS is empty. Run `npm run deploy` first.");
  return a;
};

export function provider() {
  if (!process.env.RPC_URL) throw new Error("RPC_URL is not set in .env");
  return new ethers.JsonRpcProvider(process.env.RPC_URL);
}
export const registry = (runner) => new ethers.Contract(address(), ABI, runner || provider());

// Latest anchored version for a FIR, or null if never anchored.
export async function readLatest(firId) {
  const c = registry();
  const n = await c.versionCount(firId);
  if (n === 0n) return null;
  const v = await c.latest(firId);
  return { hash: v.docHash.toLowerCase(), timestamp: Number(v.timestamp), officer: v.officer, version: Number(n) };
}

// Backend "relayer" wallet anchors on behalf of citizens (no MetaMask / gas needed for them)
export async function anchorViaRelayer(firId, hash) {
  const pk = process.env.RELAYER_PRIVATE_KEY;
  if (!pk) throw new Error("RELAYER_PRIVATE_KEY is not set in .env");
  const wallet = new ethers.Wallet(pk, provider());
  const tx = await registry(wallet).anchor(firId, hash);
  await tx.wait();
  return tx.hash;
}

// Trust nothing from the browser: re-read the tx and confirm the FIRAnchored event matches our DB hash.
export async function readAnchorTx(txHash, firId, hash) {
  const p = provider();
  const receipt = await p.getTransactionReceipt(txHash);
  if (!receipt || receipt.status !== 1) throw new Error("Transaction not found or failed");
  const iface = registry().interface;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== address().toLowerCase()) continue;
    try {
      const e = iface.parseLog(log);
      if (e?.name === "FIRAnchored" && e.args.firId.toString() === String(firId) && e.args.docHash.toLowerCase() === hash.toLowerCase()) {
        const block = await p.getBlock(receipt.blockNumber);
        return { officer: e.args.officer, timestamp: block.timestamp };
      }
    } catch { /* not our event */ }
  }
  throw new Error("No matching FIRAnchored event found in this transaction");
}
