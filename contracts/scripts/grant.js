const hre = require("hardhat");

async function main() {
  const { ethers } = hre;
  const addr = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
  if (!addr) throw new Error("NEXT_PUBLIC_REGISTRY_ADDRESS is empty in .env");
  const list = (process.env.OFFICER_ADDRESSES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!list.length)
    throw new Error("Put wallet address(es) in OFFICER_ADDRESSES in .env");

  const reg = await ethers.getContractAt("FIRRegistry", addr);
  const role = await reg.OFFICER_ROLE();
  for (const a of list) {
    if (await reg.hasRole(role, a)) {
      console.log("already officer:", a);
      continue;
    }
    await (await reg.grantRole(role, a)).wait();
    console.log("OFFICER_ROLE granted to", a);
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
