const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const LotterySystem = await hre.ethers.getContractFactory("LotterySystem");
  const lottery = await LotterySystem.deploy();

  await lottery.deployed();
  console.log("LotterySystem deployed to:", lottery.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
