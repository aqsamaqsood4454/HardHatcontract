require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/InR6QE9UbummkQ-DWwlFKJNp3A9DtfGW",
      accounts: [
        "bb64097a4955f01a0f8497c070b3665e5a5e59cac89bb70b068ccbd66cb0f8b4"
      ],
      chainId: 11155111
    }
  },
  defaultNetwork: "sepolia"
};




