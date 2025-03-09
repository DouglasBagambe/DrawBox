const hre = require("hardhat");

async function main() {
  const [sender] = await hre.ethers.getSigners();
  const tx = await sender.sendTransaction({
    to: "0xa7d3e631d2310D1e7b6e8754600ef91974C788dF",
    value: hre.ethers.utils.parseEther("9900.0"),
  });
  await tx.wait();
  console.log("Funded MetaMask account!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
