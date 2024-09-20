import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-deploy";
import { loadTasks } from "./helpers/utils";
import {
  FORKING_ENABLED,
  MNEMONIC,
  MNEMONIC_PATH,
  PRIVATE_KEY,
  SKIP_LOAD,
} from "./helpers/env";

// Prevent to load tasks before compilation and typechain
if (!SKIP_LOAD) {
  loadTasks(["deploy", "misc"]); // load task folders
}

const accounts =
  (PRIVATE_KEY && { accounts: [PRIVATE_KEY] }) ||
  (MNEMONIC && {
    accounts: {
      mnemonic: MNEMONIC,
      path: MNEMONIC_PATH,
      initialIndex: 0,
      count: 10,
    },
  });

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    ],
  },
  defaultNetwork: "matchain-testnet",
  networks: {
    hardhat: {
      forking: {
        enabled: FORKING_ENABLED,
        url: "https://rpc.matchain.io",
      },
      gasPrice: 1_000_000,
      initialBaseFeePerGas: 1_000_000,
      chains: {
        698: {
          hardforkHistory: {
            shanghai: 1,
          },
        },
        699: {
          hardforkHistory: {
            shanghai: 1,
          },
        },
      },
    },
    matchain: {
      url: "https://rpc.matchain.io",
      ...accounts,
      chainId: 698,
    },
    "matchain-testnet": {
      url: "https://testnet-rpc.matchain.io",
      ...accounts,
      chainId: 699,
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
    },
  },
  paths: {
    deployments: "deployments",
  },
  typechain: {
    outDir: "typechain",
  },
};

export default config;
