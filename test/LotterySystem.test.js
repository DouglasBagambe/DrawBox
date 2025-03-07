const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LotterySystem", function () {
  let LotterySystem, lottery, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    LotterySystem = await ethers.getContractFactory("LotterySystem");
    lottery = await LotterySystem.deploy();
    await lottery.deployed();
    await lottery.assignRole(addr1.address, "authority");
    await lottery.assignRole(addr2.address, "participant");
  });

  it("Should create a lottery", async function () {
    await lottery.connect(addr1).createLottery(ethers.utils.parseEther("0.01"));
    const lotteryInfo = await lottery.getLotteryInfo(1);
    expect(lotteryInfo.id.toString()).to.equal("1");
    expect(lotteryInfo.authority).to.equal(addr1.address);
  });

  it("Should buy a ticket", async function () {
    await lottery.connect(addr1).createLottery(ethers.utils.parseEther("0.01"));
    await lottery
      .connect(addr2)
      .buyTicket(1, { value: ethers.utils.parseEther("0.01") });
    const [id, lotteryId, ticketOwner] = await lottery.getTicketInfo(1, 1);
    expect(ticketOwner).to.equal(addr2.address);
  });
});
