import { NextResponse } from "next/server";
import { ensureSchema } from "@/lib/db.js";
import { finalizeAnchor } from "@/lib/fir.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { txHash } = await req.json();
    if (!/^\d+$/.test(id) || !/^0x[0-9a-fA-F]{64}$/.test(txHash || ""))
      return NextResponse.json({ error: "Invalid id or transaction hash" }, { status: 400 });
    await ensureSchema();
    return NextResponse.json(await finalizeAnchor(id, txHash));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
