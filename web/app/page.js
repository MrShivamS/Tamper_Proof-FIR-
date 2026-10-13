"use client";
import { useEffect, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import QRCode from "qrcode";

const REGISTRY = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);
const STATIONS = [
  "आरे",
  "आग्रीपाडा",
  "अंबोली",
  "अंधेरी",
  "आझाद मैदान",
  "बी.के.सी.",
  "वांद्रे",
  "बोरीवली",
  "भायखळा",
  "चेंबूर",
  "कुलाबा",
  "दादर",
  "गोरेगाव",
  "घाटकोपर",
  "जुहू",
  "कांदिवली",
  "कुर्ला",
  "मलबार हिल",
  "मालाड",
  "पवई",
  "सांताक्रुझ",
  "वरळी",
  "यलो गेट",
];
const newCode = () => Math.random().toString(36).slice(2, 7).toUpperCase();

export default function Home() {
  const [wallet, setWallet] = useState(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    setCode(newCode());
  }, []);
  useEffect(() => {
    if (!window.ethereum) return;
    const reload = () => window.location.reload();
    window.ethereum.on?.("accountsChanged", reload);
    window.ethereum.on?.("chainChanged", reload);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", reload);
      window.ethereum.removeListener?.("chainChanged", reload);
    };
  }, []);

  async function connect() {
    setErr("");
    try {
      if (!window.ethereum)
        throw new Error(
          "MetaMask not found. Install it, or submit without a wallet to use the station relayer.",
        );
      await window.ethereum.request({ method: "eth_requestAccounts" });
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x" + CHAIN_ID.toString(16) }],
        });
      } catch {
        throw new Error(
          `Please add/switch MetaMask to the network with chain ID ${CHAIN_ID} (Sepolia = 11155111).`,
        );
      }
      const signer = await new BrowserProvider(window.ethereum).getSigner();
      setWallet({ signer, address: await signer.getAddress() });
    } catch (e) {
      setErr(e.message);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (
      String(fd.get("captcha") || "")
        .trim()
        .toUpperCase() !== code
    ) {
      setErr("Captcha does not match.");
      setCode(newCode());
      return;
    }
    if (!fd.get("cert")) {
      setErr("Please accept the certification.");
      return;
    }
    if (!wallet) {
      setErr("Connect your officer wallet (MetaMask) first.");
      return;
    }
    fd.delete("captcha");
    fd.delete("cert");
    fd.set("relay", wallet ? "0" : "1");
    try {
      setBusy("Saving FIR and generating hash...");
      let res = await fetch("/api/fir", { method: "POST", body: fd });
      let data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.status === "PENDING") {
        // wallet mode: officer signs and pays gas
        if (!REGISTRY)
          throw new Error(
            "Contract address missing. Run `npm run deploy` first.",
          );
        setBusy("Confirm the transaction in MetaMask...");
        const tx = await new Contract(
          REGISTRY,
          ["function anchor(uint256,bytes32)"],
          wallet.signer,
        ).anchor(data.id, data.hash);
        setBusy("Waiting for the block to be mined...");
        await tx.wait();
        res = await fetch(`/api/fir/${data.id}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash: tx.hash }),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else setBusy("Anchored by station relayer.");
      setReceipt(data);
      form.reset();
    } catch (ex) {
      setErr(
        ex.code === "ACTION_REJECTED"
          ? "Transaction rejected in MetaMask. The FIR is saved as PENDING and is not yet anchored."
          : ex.message,
      );
    } finally {
      setBusy("");
      setCode(newCode());
    }
  }

  if (receipt) return <Receipt r={receipt} onNew={() => setReceipt(null)} />;

  return (
    <main>
      <a className="vbar" href="/verify">
        <b>Already have an FIR?</b> Check whether it is authentic using the FIR
        ID or the QR code on your copy &rarr;
      </a>
      <section className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 className="title">Online Complaint</h2>
            <hr className="t" />
          </div>
          <button type="button" className="btn o" onClick={connect}>
            {wallet
              ? wallet.address.slice(0, 6) + "..." + wallet.address.slice(-4)
              : "Connect Wallet (officer)"}
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="grid">
            <div>
              <label>
                Full Name <i>*</i>
              </label>
              <input type="text" name="name" required />
            </div>
            <div>
              <label>
                Contact Number <i>*</i>
              </label>
              <input
                type="tel"
                name="phone"
                maxLength={10}
                pattern="\d{10}"
                required
              />
            </div>
            <div>
              <label>
                E-mail ID <i>*</i>
              </label>
              <input type="email" name="email" required />
            </div>
            <div>
              <label>Room No. / Street Name</label>
              <input type="text" name="street" />
            </div>
            <div className="full">
              <label>Address</label>
              <input type="text" name="address" />
            </div>
            <div>
              <label>City</label>
              <input type="text" name="city" defaultValue="Mumbai" />
            </div>
            <div>
              <label>State</label>
              <input type="text" name="state" defaultValue="Maharashtra" />
            </div>
            <div>
              <label>Country</label>
              <input type="text" name="country" defaultValue="India" />
            </div>
            <div>
              <label>Pin code</label>
              <input type="text" name="pin" maxLength={6} />
            </div>
            <div className="full">
              <label>
                Police Station <i>*</i>
              </label>
              <select name="policeStation" required defaultValue="">
                <option value="" disabled>
                  Select Police Station
                </option>
                {STATIONS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="full">
              <label>
                Complaint <i>*</i>
              </label>
              <textarea name="complaint" required minLength={10} />
            </div>
            <div className="full">
              <label>
                Evidence files{" "}
                <span style={{ fontWeight: 400, color: "var(--muted)" }}>
                  (Max 3 MB per file, up to 5)
                </span>
              </label>
              <input
                type="file"
                name="files"
                multiple
                accept="image/*,video/*,.pdf"
              />
              <div className="note">
                Files are encrypted (AES-256-GCM) before upload to IPFS; their
                hash is bound to the FIR.
              </div>
            </div>
            <div className="full cert">
              <input type="checkbox" name="cert" id="cert" />
              <label htmlFor="cert" style={{ fontWeight: 400 }}>
                I certify that the information provided by me in above form is
                accurate and correct as per best of my knowledge. I understand
                that withholding of information or giving false information is a
                criminal offense and may result in legal action against me.
              </label>
            </div>
            <div className="full disc">
              <b>DISCLAIMER :</b>
              <br />
              As per the prevailing laws, FIR of a major crime (cognizable
              crimes) can only be registered at a Police Station. This site
              shall only entertain complaints about minor crimes (non-cognizable
              crimes). Your complaint shall be referred to the concerned Police
              Station.
            </div>
            <div className="full">
              <label>
                Captcha <i>*</i>
              </label>
              <div className="cap">
                <div className="capbox">{code}</div>
                <button
                  type="button"
                  className="btn s"
                  onClick={() => setCode(newCode())}
                >
                  &#8635;
                </button>
                <input
                  type="text"
                  name="captcha"
                  placeholder="Enter captcha"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>
          <div className="actions">
            <button type="reset" className="btn s">
              Reset
            </button>
            <button className="btn p" disabled={!!busy}>
              {busy || (wallet ? "Submit & anchor with my wallet" : "Submit")}
            </button>
          </div>
          <div className="note" style={{ textAlign: "center", marginTop: 8 }}>
            {wallet
              ? "Your connected wallet will sign and pay gas for the blockchain anchoring."
              : "No wallet connected: the station relayer will anchor this FIR for you (no gas needed)."}
          </div>
          <div className="note" style={{ textAlign: "center" }}>
            Contract: {REGISTRY || "not set"} (chain {CHAIN_ID})
          </div>
          <div className="err">{err}</div>
        </form>
      </section>
    </main>
  );
}

function Receipt({ r, onNew }) {
  const [qr, setQr] = useState("");
  const url =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/verify?id=${r.id}&h=${r.hash}`;
  useEffect(() => {
    if (url)
      QRCode.toString(url, { type: "svg", margin: 0, width: 190 }).then(setQr);
  }, [url]);
  const explorer =
    CHAIN_ID === 11155111
      ? `https://sepolia.etherscan.io/tx/${r.txHash}`
      : null;
  return (
    <main>
      <section className="card">
        <h2 className="title">FIR Registered &amp; Anchored</h2>
        <hr className="t" />
        <div className="row">
          <span>FIR ID</span>
          <div className="mono">FIR-{r.id}</div>
        </div>
        <div className="row">
          <span>Document hash (SHA-256)</span>
          <div className="mono">{r.hash}</div>
        </div>
        <div className="row">
          <span>Anchored by wallet</span>
          <div className="mono">{r.officer}</div>
        </div>
        <div className="row">
          <span>Blockchain timestamp</span>
          <div className="mono">
            {new Date(r.timestamp * 1000).toLocaleString()}
          </div>
        </div>
        <div className="row">
          <span>Transaction</span>
          <div className="mono">
            {explorer ? (
              <a
                className="lnk"
                href={explorer}
                target="_blank"
                rel="noreferrer"
              >
                {r.txHash}
              </a>
            ) : (
              r.txHash
            )}
          </div>
        </div>
        <div
          className="row"
          style={{
            display: "flex",
            gap: 18,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 210,
              background: "#fff",
              padding: 10,
              borderRadius: 6,
              border: "1px solid var(--line)",
            }}
            dangerouslySetInnerHTML={{ __html: qr }}
          />
          <div style={{ flex: 1, minWidth: 220 }}>
            <b>Scan to verify authenticity</b>
            <div className="note">
              Keep this QR on the printed FIR copy. Anyone can scan it to
              re-check the record against the blockchain.
            </div>
            <div className="mono" style={{ marginTop: 8 }}>
              {url}
            </div>
          </div>
        </div>
        <div className="actions">
          <button className="btn p" onClick={() => window.print()}>
            Print receipt
          </button>
          <a className="btn o" href={`/verify?id=${r.id}&h=${r.hash}`}>
            Verify now
          </a>
          <button className="btn s" onClick={onNew}>
            New complaint
          </button>
        </div>
      </section>
    </main>
  );
}
