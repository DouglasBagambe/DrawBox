const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LotterySystem", function () {
  let LotterySystem, lottery, owner, addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    LotterySystem = await ethers.getContractFactory("LotterySystem");
    lottery = await LotterySystem.deploy();
    await lottery.deployed();
  });

  it("Should create a lottery", async function () {
    await lottery.createLottery(ethers.utils.parseEther("0.01"));
    const lotteryInfo = await lottery.getLotteryInfo(1);
    expect(lotteryInfo.id.toString()).to.equal("1");
    expect(lotteryInfo.authority).to.equal(owner.address);
  });

  it("Should buy a ticket", async function () {
    await lottery.createLottery(ethers.utils.parseEther("0.01"));
    await lottery
      .connect(addr1)
      .buyTicket(1, { value: ethers.utils.parseEther("0.01") });
    const ticketInfo = await lottery.getTicketInfo(1, 1);
    expect(ticketInfo.owner).to.equal(addr1.address);
  });
});
