import { NextResponse } from "next/server";
import { db, ensureSchema } from "@/lib/db.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const SUFFIX = " [edited]";

// DEMO ONLY: simulates a corrupt insider editing the database. Disabled unless NEXT_PUBLIC_DEMO_MODE=true.
export async function POST(req, { params }) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return NextResponse.json({ error: "Demo mode is off" }, { status: 403 });
  const { id } = await params;
  const { action } = await req.json();
  await ensureSchema();
  const { rows } = await db().query("SELECT record FROM firs WHERE id=$1", [id]);
  if (!rows[0]) return NextResponse.json({ error: "FIR not found" }, { status: 404 });
  const rec = rows[0].record;
  if (action === "tamper") rec.complaint = rec.complaint + SUFFIX;
  else if (action === "restore" && rec.complaint.endsWith(SUFFIX)) rec.complaint = rec.complaint.slice(0, -SUFFIX.length);
  await db().query("UPDATE firs SET record=$2 WHERE id=$1", [id, JSON.stringify(rec)]);
  return NextResponse.json({ ok: true });
}
