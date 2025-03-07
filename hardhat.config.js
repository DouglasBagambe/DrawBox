require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.28", // Match your contract’s pragma
  networks: {
    hardhat: {}, // Local testing network
    localhost: {
      url: "http://127.0.0.1:8545", // Default Hardhat node
    },
    // Add testnet/mainnet later if needed
  },
};
