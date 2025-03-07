// utils/helper.js

import { ethers } from "ethers";

export const shortenAddress = (address, chars = 4) => {
  if (!address) return "";
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const formatEther = (wei) => {
  return ethers.utils.formatEther(wei);
};

export const parseEther = (ether) => {
  return ethers.utils.parseEther(ether);
};
