const hre = require("hardhat");

async function main() {
  try {
    console.log("Starting deployment of CharityDonationPlatform...");

    // Get the Contract Factory
    const CharityDonationPlatform = await hre.ethers.getContractFactory("CharityDonationPlatform");

    // Deploy the contract
    const charityPlatform = await CharityDonationPlatform.deploy();

    // Wait for deployment to complete
    await charityPlatform.waitForDeployment();

    // Get the deployed contract address
    const charityPlatformAddress = await charityPlatform.getAddress();

    console.log(`CharityDonationPlatform deployed to: ${charityPlatformAddress}`);

    // Verify the contract on Etherscan if not on a local network
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("Waiting for block confirmations...");
      
      // Wait for 6 block confirmations
      await charityPlatform.deployTransaction.wait(6);
      
      console.log("Verifying contract...");
      
      await hre.run("verify:verify", {
        address: charityPlatformAddress,
        contract: "contracts/CharityDonationPlatform.sol:CharityDonationPlatform",
        constructorArguments: [],
      });
      
      console.log("Contract verified on Etherscan");
    }

    // Optional: Add initial charities
    // Uncomment and modify the following section if you want to add charities during deployment
    /*
    console.log("Adding initial charities...");
    
    const initialCharities = [
      {
        name: "Charity One",
        description: "Description for Charity One",
        wallet: "0x..." // Replace with actual wallet address
      },
      // Add more charities as needed
    ];

    for (const charity of initialCharities) {
      const tx = await charityPlatform.addCharity(
        charity.name,
        charity.description,
        charity.wallet
      );
      await tx.wait();
      console.log(`Added charity: ${charity.name}`);
    }
    */

  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  




  