const hre = require("hardhat");
async function main() {
  const { ethers } = hre;
  const addr = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
  console.log("Registry in .env :", addr);
  console.log(
    "Contract code    :",
    (await ethers.provider.getCode(addr)).length > 2
      ? "yes"
      : "NO (nothing deployed here)",
  );
  const reg = await ethers.getContractAt("FIRRegistry", addr);
  const [admin] = await ethers.getSigners();
  console.log("Deployer (admin) :", admin.address);
  const wallet = process.env.CHECK_WALLET;
  if (wallet)
    console.log(
      "Is officer?      :",
      wallet,
      await reg.hasRole(await reg.OFFICER_ROLE(), wallet),
    );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
