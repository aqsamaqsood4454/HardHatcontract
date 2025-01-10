// ignition/modules/CharityPlatform.ts
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "ethers";

const INITIAL_CHARITIES = [
  {
    name: "Save The Trees",
    description: "Environmental conservation charity focusing on reforestation",
    wallet: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" // Example address - replace in production
  },
  {
    name: "Food For All",
    description: "Global hunger relief organization",
    wallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" // Example address - replace in production
  }
];

export default buildModule("CharityPlatformModule", async ({ deployments, getNamedAccounts }) => {
  const module = {};

  // Deploy the main contract
  const charityPlatform = await deployments.deploy("CharityDonationPlatform");

  // Store contract instance
  module.charityPlatform = charityPlatform;

  // Post-deployment setup function
  module.setup = async () => {
    // Setup initial charities
    for (const charity of INITIAL_CHARITIES) {
      await charityPlatform.write.addCharity([
        charity.name,
        charity.description,
        charity.wallet
      ]);
      
      console.log(`Added charity: ${charity.name}`);
    }
  };

  // Contract verification data
  module.verify = {
    contract: "CharityDonationPlatform",
    constructorArguments: []
  };

  return module;
});