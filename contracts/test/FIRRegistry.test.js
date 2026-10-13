const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FIRRegistry", () => {
  let reg, admin, officer, outsider;
  const H1 = "0x" + "11".repeat(32);
  const H2 = "0x" + "22".repeat(32);

  beforeEach(async () => {
    [admin, officer, outsider] = await ethers.getSigners();
    reg = await ethers.deployContract("FIRRegistry");
    await reg.grantRole(await reg.OFFICER_ROLE(), officer.address);
  });

  it("lets an officer anchor and stores hash, officer and timestamp", async () => {
    await expect(reg.connect(officer).anchor(1, H1)).to.emit(reg, "FIRAnchored").withArgs(1, 1, H1, officer.address);
    const v = await reg.latest(1);
    expect(v.docHash).to.equal(H1);
    expect(v.officer).to.equal(officer.address);
    expect(v.timestamp).to.be.gt(0);
  });

  it("rejects non-officers", async () => {
    await expect(reg.connect(outsider).anchor(1, H1)).to.be.revertedWithCustomError(reg, "AccessControlUnauthorizedAccount");
  });

  it("rejects an empty hash", async () => {
    await expect(reg.connect(officer).anchor(1, ethers.ZeroHash)).to.be.revertedWith("Empty hash");
  });

  it("keeps history: amendments append new versions", async () => {
    await reg.connect(officer).anchor(7, H1);
    await reg.connect(officer).anchor(7, H2);
    expect(await reg.versionCount(7)).to.equal(2);
    expect((await reg.versionAt(7, 0)).docHash).to.equal(H1);
    expect((await reg.latest(7)).docHash).to.equal(H2);
  });

  it("reverts for unknown FIR and has no way to delete", async () => {
    await expect(reg.latest(999)).to.be.revertedWith("FIR not found");
    expect(reg.interface.getFunction("delete")).to.equal(null);
  });
});
