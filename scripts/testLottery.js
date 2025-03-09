const hre = require("hardhat");
const { ethers } = hre;
const { LOTTERY_CONTRACT_ADDRESS, LOTTERY_ABI } = require("../utils/constants");

async function main() {
  // Get the first Hardhat account as the signer (default authority)
  const [authority, participant] = await ethers.getSigners();
  console.log("Authority address:", authority.address);
  console.log("Participant address:", participant.address);

  // Connect to the deployed LotterySystem contract
  const lotterySystem = new ethers.Contract(
    LOTTERY_CONTRACT_ADDRESS,
    LOTTERY_ABI,
    authority
  );
  console.log("Connected to LotterySystem at:", lotterySystem.address);

  // Step 1: Check the current lotteryIdCounter
  const lotteryIdCounter = await lotterySystem.lotteryIdCounter();
  console.log("Current lotteryIdCounter:", lotteryIdCounter.toString());

  // Step 2: Create a lottery if none exists
  let currentLotteryId = lotteryIdCounter;
  if (currentLotteryId.eq(0)) {
    console.log("No lotteries exist. Creating a new lottery...");
    const ticketPrice = ethers.utils.parseEther("0.01");
    const tx = await lotterySystem.createLottery(ticketPrice);
    const receipt = await tx.wait();
    console.log("Lottery created! Tx hash:", tx.hash);
    console.log("Confirmed in block:", receipt.blockNumber);

    currentLotteryId = await lotterySystem.lotteryIdCounter();
    console.log("New lotteryIdCounter:", currentLotteryId.toString());
  } else {
    console.log(
      "A lottery already exists with ID:",
      currentLotteryId.toString()
    );
  }

  // Step 3: Check lottery details
  const lotteryInfo = await lotterySystem.getLotteryInfo(currentLotteryId);
  console.log("Lottery Info:", {
    id: lotteryInfo.id.toString(),
    authority: lotteryInfo.authority,
    ticketPrice: ethers.utils.formatEther(lotteryInfo.ticketPrice),
    lastTicketId: lotteryInfo.lastTicketId.toString(),
    winnerId: lotteryInfo.winnerId.toString(),
    winnerChosen: lotteryInfo.winnerChosen,
    claimed: lotteryInfo.claimed,
    totalPrize: ethers.utils.formatEther(lotteryInfo.totalPrize),
  });

  // Step 4: Assign participant role to the second account
  console.log("Assigning participant role to:", participant.address);
  const roleTx = await lotterySystem.assignRole(
    participant.address,
    "participant"
  );
  const roleReceipt = await roleTx.wait();
  console.log("Participant role assigned! Tx hash:", roleTx.hash);

  const isParticipant = await lotterySystem.isParticipant(participant.address);
  console.log("Is participant role assigned?", isParticipant);

  // Step 5: Buy a ticket using the participant account
  const participantContract = lotterySystem.connect(participant);
  console.log("Buying ticket for lottery ID:", currentLotteryId.toString());
  const buyTx = await participantContract.buyTicket(currentLotteryId, {
    value: ethers.utils.parseEther("0.01"),
  });
  const buyReceipt = await buyTx.wait();
  console.log("Ticket purchased! Tx hash:", buyTx.hash);
  console.log("Confirmed in block:", buyReceipt.blockNumber);

  // Step 6: Check updated lottery and ticket info
  const updatedLotteryInfo = await lotterySystem.getLotteryInfo(
    currentLotteryId
  );
  console.log("Updated Lottery Info:", {
    id: updatedLotteryInfo.id.toString(),
    authority: updatedLotteryInfo.authority,
    ticketPrice: ethers.utils.formatEther(updatedLotteryInfo.ticketPrice),
    lastTicketId: updatedLotteryInfo.lastTicketId.toString(),
    winnerId: updatedLotteryInfo.winnerId.toString(),
    winnerChosen: updatedLotteryInfo.winnerChosen,
    claimed: updatedLotteryInfo.claimed,
    totalPrize: ethers.utils.formatEther(updatedLotteryInfo.totalPrize),
  });

  const ticketInfo = await lotterySystem.getTicketInfo(currentLotteryId, 1);
  console.log("Ticket Info (Ticket #1):", {
    id: ticketInfo.id ? ticketInfo.id.toString() : "0",
    lotteryId: ticketInfo.lotteryId ? ticketInfo.lotteryId.toString() : "0",
    owner: ticketInfo._owner || "None",
  });

  console.log("Picking winner for lottery ID:", currentLotteryId.toString());
  const pickTx = await lotterySystem.pickWinner(currentLotteryId);
  await pickTx.wait();
  console.log("Winner picked!");

  // In testLottery.js, after assigning participant role to 0x70997970...
  console.log(
    "Assigning participant role to MetaMask address: 0xa7d3e631d2310D1e7b6e8754600ef91974C788dF"
  );
  const metaMaskTx = await lotterySystem.assignRole(
    "0xa7d3e631d2310D1e7b6e8754600ef91974C788dF",
    "participant"
  );
  await metaMaskTx.wait();
  console.log("Participant role assigned to MetaMask address!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
