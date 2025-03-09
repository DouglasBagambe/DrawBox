// scripts/deploy.js

const hre = require("hardhat");

async function main() {
  const LotterySystem = await hre.ethers.getContractFactory("LotterySystem");
  const lotterySystem = await LotterySystem.deploy();
  await lotterySystem.deployed();
  console.log("LotterySystem deployed to:", lotterySystem.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
