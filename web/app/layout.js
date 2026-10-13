import "./globals.css";

export const metadata = { title: "Web3 Police Portal (Demo)", description: "Tamper-proof FIR management" };

const menu = [
  ["Home", [], "/"],
  ["About Us", ["History", "Our Mission", "Hierarchy", "Initiatives"]],
  ["Report Us", ["Tenant Information", "Online Complaint", "Lost / Found", "Inform Us / Feedback"]],
  ["Special Units", ["Crime Branch", "Cyber Crime", "Anti Narcotics Cell", "Traffic Branch"]],
  ["Citizen Corner", ["Safety Tips", "FAQ", "Police Clearance Services"]],
  ["Contact Us", ["Police Station Incharge", "Senior Police Officers", "Emergency Contacts"]]
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="demo">Portfolio prototype &mdash; not an official Mumbai Police website. Do not submit real personal data.</div>
        <div className="util"><span>Maharashtra &middot; India</span></div>
        <header className="top">
          <div className="logo"><div className="crest">MP</div><div><b>MUMBAI POLICE</b><small>Decentralized FIR Portal &middot; Tamper-proof records</small></div></div>
        </header>
        <nav>
          <ul>
            {menu.map(([label, items, href]) => (
              <li key={label}>
                <a href={href || undefined}>{label}</a>
                {items.length > 0 && <ul>{items.map((i) => <a key={i}>{i}</a>)}</ul>}
              </li>
            ))}
            <li className="vf"><a href="/verify">Verify FIR</a></li>
          </ul>
        </nav>
        {children}
        <footer>
          <div className="help"><span>Control Room : <b>100</b></span><span>Citizen Wall : <b>103</b></span><span>Elder Line : <b>1090</b></span></div>
          <div className="copy">Portfolio demo &middot; UI inspired by mumbaipolice.gov.in &middot; Not affiliated with Mumbai Police</div>
        </footer>
      </body>
    </html>
  );
}
