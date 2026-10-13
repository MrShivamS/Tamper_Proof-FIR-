import { NextResponse } from "next/server";
import { verifyFir } from "@/lib/verify.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public endpoint: no login, no wallet. Returns only the integrity result, never personal data.
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    if (!/^\d{1,18}$/.test(id)) return NextResponse.json({ error: "Invalid FIR ID" }, { status: 400 });
    const h = new URL(req.url).searchParams.get("h");
    if (h && !/^0x[0-9a-fA-F]{64}$/.test(h)) return NextResponse.json({ error: "Invalid hash format" }, { status: 400 });
    return NextResponse.json(await verifyFir(id, h));
  } catch (e) {
    return NextResponse.json({ error: "Could not verify right now: " + e.message }, { status: 502 });
  }
}
