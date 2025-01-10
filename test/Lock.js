const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("CharityDonationPlatform", function () {
    let charityPlatform;
    let owner;
    let charity1Wallet;
    let charity2Wallet;
    let donor1;
    let donor2;
    
    // Test values
    const CHARITY1_NAME = "Save The Trees";
    const CHARITY1_DESC = "Environmental conservation charity";
    const CHARITY2_NAME = "Food For All";
    const CHARITY2_DESC = "Fighting hunger worldwide";
    const DONATION_AMOUNT = ethers.parseEther("1.0");
    const DONATION_MESSAGE = "Good luck with your mission!";

    beforeEach(async function () {
        // Get signers
        [owner, charity1Wallet, charity2Wallet, donor1, donor2] = await ethers.getSigners();

        // Deploy contract
        const CharityDonationPlatform = await ethers.getContractFactory("CharityDonationPlatform");
        charityPlatform = await CharityDonationPlatform.deploy();
        await charityPlatform.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await charityPlatform.owner()).to.equal(owner.address);
        });

        it("Should start with zero charities", async function () {
            expect(await charityPlatform.getCharityCount()).to.equal(0);
        });

        it("Should start with zero total donations", async function () {
            expect(await charityPlatform.totalPlatformDonations()).to.equal(0);
        });
    });

    describe("Charity Management", function () {
        it("Should add a new charity correctly", async function () {
            await charityPlatform.addCharity(
                CHARITY1_NAME,
                CHARITY1_DESC,
                charity1Wallet.address
            );

            const charity = await charityPlatform.getCharity(0);
            expect(charity.name).to.equal(CHARITY1_NAME);
            expect(charity.description).to.equal(CHARITY1_DESC);
            expect(charity.wallet).to.equal(charity1Wallet.address);
            expect(charity.totalDonations).to.equal(0);
            expect(charity.isActive).to.be.true;
        });

        it("Should emit CharityAdded event", async function () {
            await expect(charityPlatform.addCharity(
                CHARITY1_NAME,
                CHARITY1_DESC,
                charity1Wallet.address
            ))
            .to.emit(charityPlatform, "CharityAdded")
            .withArgs(0, CHARITY1_NAME, charity1Wallet.address);
        });

        it("Should update charity details correctly", async function () {
            await charityPlatform.addCharity(
                CHARITY1_NAME,
                CHARITY1_DESC,
                charity1Wallet.address
            );

            const NEW_NAME = "New Charity Name";
            const NEW_DESC = "New description";

            await charityPlatform.updateCharity(
                0,
                NEW_NAME,
                NEW_DESC,
                charity1Wallet.address
            );

            const charity = await charityPlatform.getCharity(0);
            expect(charity.name).to.equal(NEW_NAME);
            expect(charity.description).to.equal(NEW_DESC);
        });

        it("Should toggle charity status", async function () {
            await charityPlatform.addCharity(
                CHARITY1_NAME,
                CHARITY1_DESC,
                charity1Wallet.address
            );

            await charityPlatform.toggleCharityStatus(0);
            const charity = await charityPlatform.getCharity(0);
            expect(charity.isActive).to.be.false;
        });

        it("Should fail when non-owner tries to add charity", async function () {
            await expect(
                charityPlatform.connect(donor1).addCharity(
                    CHARITY1_NAME,
                    CHARITY1_DESC,
                    charity1Wallet.address
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Donations", function () {
        beforeEach(async function () {
            await charityPlatform.addCharity(
                CHARITY1_NAME,
                CHARITY1_DESC,
                charity1Wallet.address
            );
        });

        it("Should accept donations correctly", async function () {
            await charityPlatform.connect(donor1).donate(0, DONATION_MESSAGE, {
                value: DONATION_AMOUNT
            });

            const charity = await charityPlatform.getCharity(0);
            expect(charity.totalDonations).to.equal(DONATION_AMOUNT);
            
            const platformDonations = await charityPlatform.totalPlatformDonations();
            expect(platformDonations).to.equal(DONATION_AMOUNT);
        });

        it("Should emit DonationMade event", async function () {
            await expect(
                charityPlatform.connect(donor1).donate(0, DONATION_MESSAGE, {
                    value: DONATION_AMOUNT
                })
            )
            .to.emit(charityPlatform, "DonationMade")
            .withArgs(0, donor1.address, DONATION_AMOUNT, DONATION_MESSAGE);
        });

        it("Should store donation details correctly", async function () {
            await charityPlatform.connect(donor1).donate(0, DONATION_MESSAGE, {
                value: DONATION_AMOUNT
            });

            const donations = await charityPlatform.getDonationsForCharity(0);
            expect(donations.length).to.equal(1);
            expect(donations[0].donor).to.equal(donor1.address);
            expect(donations[0].amount).to.equal(DONATION_AMOUNT);
            expect(donations[0].message).to.equal(DONATION_MESSAGE);
        });

        it("Should fail when donating to inactive charity", async function () {
            await charityPlatform.toggleCharityStatus(0);
            
            await expect(
                charityPlatform.connect(donor1).donate(0, DONATION_MESSAGE, {
                    value: DONATION_AMOUNT
                })
            ).to.be.revertedWith("Charity is not active");
        });

        it("Should fail when donation amount is zero", async function () {
            await expect(
                charityPlatform.connect(donor1).donate(0, DONATION_MESSAGE, {
                    value: 0
                })
            ).to.be.revertedWith("Donation amount must be greater than 0");
        });
    });

    describe("Fund Withdrawal", function () {
        beforeEach(async function () {
            await charityPlatform.addCharity(
                CHARITY1_NAME,
                CHARITY1_DESC,
                charity1Wallet.address
            );

            await charityPlatform.connect(donor1).donate(0, DONATION_MESSAGE, {
                value: DONATION_AMOUNT
            });
        });

        it("Should allow charity wallet to withdraw funds", async function () {
            const initialBalance = await ethers.provider.getBalance(charity1Wallet.address);
            
            await charityPlatform.connect(charity1Wallet).withdrawFunds(0);
            
            const finalBalance = await ethers.provider.getBalance(charity1Wallet.address);
            expect(finalBalance).to.be.gt(initialBalance);

            const charity = await charityPlatform.getCharity(0);
            expect(charity.totalDonations).to.equal(0);
        });

        it("Should emit FundsWithdrawn event", async function () {
            await expect(
                charityPlatform.connect(charity1Wallet).withdrawFunds(0)
            )
            .to.emit(charityPlatform, "FundsWithdrawn")
            .withArgs(0, charity1Wallet.address, DONATION_AMOUNT);
        });

        it("Should fail when non-charity wallet tries to withdraw", async function () {
            await expect(
                charityPlatform.connect(donor1).withdrawFunds(0)
            ).to.be.revertedWith("Only charity wallet can withdraw");
        });

        it("Should fail when trying to withdraw with no funds", async function () {
            await charityPlatform.connect(charity1Wallet).withdrawFunds(0);
            
            await expect(
                charityPlatform.connect(charity1Wallet).withdrawFunds(0)
            ).to.be.revertedWith("No funds to withdraw");
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            await charityPlatform.addCharity(
                CHARITY1_NAME,
                CHARITY1_DESC,
                charity1Wallet.address
            );
        });

        it("Should return correct charity count", async function () {
            expect(await charityPlatform.getCharityCount()).to.equal(1);

            await charityPlatform.addCharity(
                CHARITY2_NAME,
                CHARITY2_DESC,
                charity2Wallet.address
            );

            expect(await charityPlatform.getCharityCount()).to.equal(2);
        });

        it("Should return correct charity details", async function () {
            const charity = await charityPlatform.getCharity(0);
            expect(charity.name).to.equal(CHARITY1_NAME);
            expect(charity.description).to.equal(CHARITY1_DESC);
            expect(charity.wallet).to.equal(charity1Wallet.address);
        });

        it("Should return correct donation history", async function () {
            await charityPlatform.connect(donor1).donate(0, DONATION_MESSAGE, {
                value: DONATION_AMOUNT
            });

            const donations = await charityPlatform.getDonationsForCharity(0);
            expect(donations.length).to.equal(1);
            expect(donations[0].donor).to.equal(donor1.address);
            expect(donations[0].amount).to.equal(DONATION_AMOUNT);
        });
    });
});