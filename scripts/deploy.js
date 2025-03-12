// scripts/deploy.js

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const TokenAuthority = await hre.ethers.getContractFactory("TokenAuthority");
  const tokenAuthority = await TokenAuthority.deploy(deployer.address);
  await tokenAuthority.deployed();
  console.log("TokenAuthority deployed to:", tokenAuthority.address);

  const LotterySystem = await hre.ethers.getContractFactory("LotterySystem");
  const lotterySystem = await LotterySystem.deploy(tokenAuthority.address);
  await lotterySystem.deployed();
  console.log("LotterySystem deployed to:", lotterySystem.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
