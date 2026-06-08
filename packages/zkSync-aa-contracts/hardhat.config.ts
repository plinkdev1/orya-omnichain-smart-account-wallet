import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-verify";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    zkSyncTestnet: {
      url: process.env.ZKSYNC_TESTNET_RPC || "https://testnet.era.zksync.dev",
      ethNetwork: process.env.ZKSYNC_TESTNET_ETH_RPC || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      zksync: true,
      verifyURL:
        "https://explorer.testnet.era.zksync.dev/contract_verification",
    },
    zkSyncMainnet: {
      url: "https://mainnet.era.zksync.io",
      ethNetwork: "https://eth-mainnet.alchemyapi.io/v2/YOUR_ALCHEMY_KEY",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      zksync: true,
      verifyURL: "https://explorer.era.zksync.io/contract_verification",
    },
    hardhat: {
      zksync: false,
    },
  },
  paths: {
    sources: "./src/contracts",
    tests: "./test",
    artifacts: "./artifacts",
    cache: "./cache",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
};

export default config;