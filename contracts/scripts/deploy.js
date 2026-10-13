const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const { ethers } = hre;
  const [admin] = await ethers.getSigners();
  console.log("Deploying with admin:", admin.address);

  const reg = await ethers.deployContract("FIRRegistry");
  await reg.waitForDeployment();
  const address = await reg.getAddress();
  console.log("FIRRegistry deployed at:", address);

  // Wallets allowed to anchor: relayer (backend) + optional officer wallets
  const officers = new Set();
  const pk = process.env.RELAYER_PRIVATE_KEY;
  if (pk && pk.startsWith("0x") && pk.length === 66) officers.add(new ethers.Wallet(pk).address);
  (process.env.OFFICER_ADDRESSES || "").split(",").map(s => s.trim()).filter(Boolean).forEach(a => officers.add(a));
  officers.add(admin.address); // admin can anchor too, handy for demos

  const role = await reg.OFFICER_ROLE();
  for (const a of officers) {
    await (await reg.grantRole(role, a)).wait();
    console.log("OFFICER_ROLE granted to", a);
  }

  // Write the address into the root .env automatically
  const envPath = path.join(__dirname, "..", "..", ".env");
  if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, "utf8");
    env = /^NEXT_PUBLIC_REGISTRY_ADDRESS=.*$/m.test(env)
      ? env.replace(/^NEXT_PUBLIC_REGISTRY_ADDRESS=.*$/m, `NEXT_PUBLIC_REGISTRY_ADDRESS=${address}`)
      : env + `\nNEXT_PUBLIC_REGISTRY_ADDRESS=${address}\n`;
    fs.writeFileSync(envPath, env);
    console.log("Saved NEXT_PUBLIC_REGISTRY_ADDRESS to .env");
  }
}
main().catch(e => { console.error(e); process.exit(1); });
