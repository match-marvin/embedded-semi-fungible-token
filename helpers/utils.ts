import fs from "fs";
import path from "path";

import { ContractTransactionResponse, ethers } from "ethers";
import { loadAllDeployments } from "hardhat-deploy/dist/src/utils";
import { Export } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

declare var hre: HardhatRuntimeEnvironment;

export const loadTasks = (taskFolders: string[]): void =>
  taskFolders.forEach((folder) => {
    const tasksPath = path.join(__dirname, "../tasks", folder);
    fs.readdirSync(tasksPath)
      .filter((pth) => pth.includes(".ts") || pth.includes(".js"))
      .forEach((task) => {
        require(`${tasksPath}/${task}`);
      });
  });

export const waitForTx = async (tx: ContractTransactionResponse) =>
  await tx.wait(1);

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getDeployments = async (
  network: string
): Promise<Export | undefined> => {
  const allDeployments = Object.values(
    loadAllDeployments(hre, hre.config.paths.deployments)
  ).flat();
  return allDeployments.find((v) => v.name === network);
};

export const getForkedETH = async (amount: string, to: string) => {
  const balance = await hre.ethers.provider.getBalance(to);
  await hre.network.provider.send("hardhat_setBalance", [
    to,
    ethers
      .toBeHex(ethers.parseEther(amount.toString()) + balance)
      .replace("0x0", "0x"),
  ]);
};

export const getImpersonatedSigner = async (
  user: string
): Promise<HardhatEthersSigner> => {
  await getForkedETH("1", user);
  return await hre.ethers.getImpersonatedSigner(user);
};

export const getTransparentUpgradeableProxyInfo = async (
  provider: ethers.Provider,
  proxy: string
): Promise<{
  implementation: string;
  proxyAdmin: string;
  owner: string;
}> => {
  const proxyAdminAddress = `0x${(
    await provider.getStorage(
      proxy,
      "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
    )
  ).slice(-40)}`;
  const { ProxyAdmin__factory } = require("../typechain");
  const proxyAdmin = ProxyAdmin__factory.connect(proxyAdminAddress, provider);
  const owner = await proxyAdmin.owner();
  const currentImplAddress = `0x${(
    await hre.ethers.provider.getStorage(
      proxy,
      "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
    )
  ).slice(-40)}`;
  return {
    implementation: currentImplAddress,
    proxyAdmin: proxyAdminAddress,
    owner,
  };
};
