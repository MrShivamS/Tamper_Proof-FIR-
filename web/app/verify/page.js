"use client";
import { useEffect, useState } from "react";

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function VerifyPage() {
  const [input, setInput] = useState("");
  const [hash, setHash] = useState("");
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);

  async function run(idArg, hArg) {
    const text = (idArg ?? input).trim();
    let h = (hArg ?? hash).trim() || null;
    const m = text.match(/id=(\d+)(?:&h=(0x[0-9a-fA-F]{64}))?/);
    const id = m ? m[1] : text.replace(/\D/g, "");
    if (m && m[2] && !h) h = m[2];
    if (!id) return setRes({ error: "Enter a valid FIR ID or paste the QR link." });
    setLoading(true); setRes(null);
    try {
      const r = await fetch(`/api/verify/${id}` + (h ? `?h=${h}` : ""));
      setRes(await r.json());
    } catch { setRes({ error: "Network error. Please try again." }); }
    setLoading(false);
  }

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("id")) { setInput("FIR-" + p.get("id")); setHash(p.get("h") || ""); run(p.get("id"), p.get("h") || ""); }
  }, []);

  async function demo(action) {
    await fetch(`/api/demo/${res.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    run(res.id, hash);
  }

  const cls = !res ? "" : res.error ? "bad" : res.code === "AUTHENTIC" ? "ok" : res.code === "PENDING" ? "pend" : "bad";

  return (
    <main>
      <section className="card">
        <h2 className="title">Verify FIR Authenticity</h2><hr className="t" />
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--muted)" }}>Open to everyone: citizens, lawyers, judges and auditors. No login or wallet needed. Enter the FIR ID, or paste the link from the QR code on your FIR copy.</p>
        <div className="grid">
          <div><label>FIR ID or QR link <i>*</i></label><input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="FIR-12 or pasted QR link" /></div>
          <div><label>Hash printed on your copy (optional)</label><input type="text" value={hash} onChange={(e) => setHash(e.target.value)} placeholder="0x..." /></div>
        </div>
        <div className="actions"><button className="btn p" onClick={() => run()} disabled={loading}>{loading ? "Checking blockchain..." : "Verify"}</button><a className="btn s" href="/">Back to portal</a></div>

        {res && (
          <div style={{ marginTop: 16 }}>
            {!res.error && <>
              <div className="row"><span>FIR ID</span><div className="mono">FIR-{res.id}</div></div>
              <div className="row"><span>Registered at police station</span><div className="mono">{res.policeStation || "-"}</div></div>
              <div className="row"><span>Anchored by (wallet)</span><div className="mono">{res.officer || "-"}</div></div>
              <div className="row"><span>Anchored on</span><div className="mono">{res.anchoredAt ? new Date(res.anchoredAt).toLocaleString() : "-"}</div></div>
              <div className="row"><span>On-chain hash</span><div className="mono">{res.chainHash || "no on-chain entry"}</div></div>
            </>}
            <div className={"res " + cls}>
              {res.error || (res.code === "AUTHENTIC" ? "\u2713 " : "\u2717 ") + res.message}
              {res.currentHash && <span className="mono" style={{ fontWeight: 400, display: "block", marginTop: 6 }}>on-chain: {res.chainHash}<br />current : {res.currentHash}</span>}
            </div>
            {DEMO && !res.error && res.policeStation && (
              <div className="actions"><button className="btn o" onClick={() => demo("tamper")}>Demo: simulate DB tampering</button><button className="btn o" onClick={() => demo("restore")}>Demo: restore record</button></div>
            )}
          </div>
        )}
        <div className="note" style={{ marginTop: 12 }}>Personal details (name, phone, address, complaint text) are never shown here. Only the integrity result is public.</div>
      </section>
    </main>
  );
}
