// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {KRNL, KrnlPayload, KernelParameter, KernelResponse} from "./KRNL.sol";

contract LotterySystem is KRNL {
    address public owner;
    uint256 public lotteryIdCounter;

    struct Lottery {
        uint256 id;
        address authority;
        uint256 ticketPrice;
        uint256 lastTicketId;
        uint256 winnerId;
        bool winnerChosen;
        bool claimed;
        uint256 totalPrize;
    }

    struct Ticket {
        uint256 id;
        uint256 lotteryId;
        address owner;
    }

    mapping(uint256 => Lottery) public lotteries;
    mapping(uint256 => mapping(uint256 => Ticket)) public tickets;

    event LotteryCreated(uint256 indexed lotteryId, address indexed authority, uint256 ticketPrice);
    event TicketPurchased(uint256 indexed lotteryId, uint256 indexed ticketId, address indexed buyer);
    event WinnerSelected(uint256 indexed lotteryId, uint256 indexed ticketId);
    event PrizeClaimed(uint256 indexed lotteryId, uint256 indexed ticketId, address indexed winner, uint256 amount);

    error WinnerAlreadyExists();
    error NoTickets();
    error WinnerNotChosen();
    error InvalidWinner();
    error AlreadyClaimed();
    error NotAuthorized();
    error InsufficientFunds();

    constructor(address _tokenAuthorityPublicKey) KRNL(_tokenAuthorityPublicKey) {
        owner = msg.sender;
    }

    function createLottery(uint256 ticketPrice) external {
        lotteryIdCounter++;
        Lottery storage lottery = lotteries[lotteryIdCounter];
        lottery.id = lotteryIdCounter;
        lottery.authority = msg.sender;
        lottery.ticketPrice = ticketPrice;
        lottery.lastTicketId = 0;
        lottery.winnerChosen = false;
        lottery.claimed = false;

        emit LotteryCreated(lotteryIdCounter, msg.sender, ticketPrice);
    }

    function buyTicket(uint256 lotteryId) external payable {
        Lottery storage lottery = lotteries[lotteryId];
        if (lottery.authority == address(0)) revert("Lottery does not exist");
        if (lottery.winnerChosen) revert WinnerAlreadyExists();
        if (msg.value != lottery.ticketPrice) revert InsufficientFunds();

        lottery.lastTicketId++;
        uint256 ticketId = lottery.lastTicketId;

        Ticket storage ticket = tickets[lotteryId][ticketId];
        ticket.id = ticketId;
        ticket.lotteryId = lotteryId;
        ticket.owner = msg.sender;

        lottery.totalPrize += msg.value;

        emit TicketPurchased(lotteryId, ticketId, msg.sender);
    }

    function pickWinner(KrnlPayload memory krnlPayload, uint256 lotteryId) 
        external 
        onlyAuthorized(krnlPayload, abi.encode(lotteryId)) 
    {
        Lottery storage lottery = lotteries[lotteryId];
        require(msg.sender == lottery.authority, "Only lottery creator can pick winner");
        if (lottery.winnerChosen) revert WinnerAlreadyExists();
        if (lottery.lastTicketId == 0) revert NoTickets();

        // Decode kernel response for randomness (assuming kernel ID 337 returns uint256)
        KernelResponse[] memory kernelResponses = abi.decode(krnlPayload.kernelResponses, (KernelResponse[]));
        uint256 randomNumber;
        for (uint i = 0; i < kernelResponses.length; i++) {
            if (kernelResponses[i].kernelId == 337) { // Replace with real kernel ID
                randomNumber = abi.decode(kernelResponses[i].result, (uint256));
            }
        }

        uint256 winnerId = (randomNumber % lottery.lastTicketId) + 1;
        lottery.winnerId = winnerId;
        lottery.winnerChosen = true;

        emit WinnerSelected(lotteryId, winnerId);
    }

    function claimPrize(uint256 lotteryId, uint256 ticketId) external {
        Lottery storage lottery = lotteries[lotteryId];
        Ticket storage ticket = tickets[lotteryId][ticketId];

        if (!lottery.winnerChosen) revert WinnerNotChosen();
        if (lottery.claimed) revert AlreadyClaimed();
        if (lottery.winnerId != ticketId) revert InvalidWinner();
        if (ticket.owner != msg.sender) revert NotAuthorized();

        lottery.claimed = true;
        uint256 prizeAmount = lottery.totalPrize;

        (bool success, ) = payable(msg.sender).call{value: prizeAmount}("");
        require(success, "Transfer failed");

        emit PrizeClaimed(lotteryId, ticketId, msg.sender, prizeAmount);
    }

    function getLotteryInfo(uint256 lotteryId) external view returns (
        uint256 id, address authority, uint256 ticketPrice, uint256 lastTicketId,
        uint256 winnerId, bool winnerChosen, bool claimed, uint256 totalPrize
    ) {
        Lottery storage lottery = lotteries[lotteryId];
        return (
            lottery.id, lottery.authority, lottery.ticketPrice, lottery.lastTicketId,
            lottery.winnerId, lottery.winnerChosen, lottery.claimed, lottery.totalPrize
        );
    }

    function getTicketInfo(uint256 lotteryId, uint256 ticketId) external view returns (
        uint256 id, uint256 lottery, address _owner
    ) {
        Ticket storage ticket = tickets[lotteryId][ticketId];
        return (ticket.id, ticket.lotteryId, ticket.owner);
    }
}