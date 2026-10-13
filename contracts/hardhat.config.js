require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env" });

const accounts = process.env.DEPLOYER_PRIVATE_KEY && process.env.DEPLOYER_PRIVATE_KEY.startsWith("0x") && process.env.DEPLOYER_PRIVATE_KEY.length === 66
  ? [process.env.DEPLOYER_PRIVATE_KEY] : [];

module.exports = {
  solidity: "0.8.24",
  networks: {
    localhost: { url: "http://127.0.0.1:8545" },
    sepolia: { url: process.env.RPC_URL || "", accounts }
  }
};
