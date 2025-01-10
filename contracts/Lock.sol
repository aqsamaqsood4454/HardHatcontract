// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CharityDonationPlatform is Ownable, ReentrancyGuard {
    // Structs
    struct Charity {
        string name;
        string description;
        address payable wallet;
        uint256 totalDonations;
        bool isActive;
    }

    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
        string message;
    }

    // State variables
    mapping(uint256 => Charity) public charities;
    mapping(uint256 => Donation[]) public donations;
    uint256 public charityCount;
    uint256 public totalPlatformDonations;

    // Events
    event CharityAdded(uint256 indexed charityId, string name, address wallet);
    event CharityUpdated(uint256 indexed charityId, string name, address wallet);
    event DonationMade(
        uint256 indexed charityId,
        address indexed donor,
        uint256 amount,
        string message
    );
    event FundsWithdrawn(
        uint256 indexed charityId,
        address indexed wallet,
        uint256 amount
    );

    // Modifiers
    modifier charityExists(uint256 _charityId) {
        require(_charityId < charityCount, "Charity does not exist");
        _;
    }

    modifier charityActive(uint256 _charityId) {
        require(charities[_charityId].isActive, "Charity is not active");
        _;
    }

    // Constructor
    constructor() {
        charityCount = 0;
        totalPlatformDonations = 0;
    }

    // External functions
    function addCharity(
        string memory _name,
        string memory _description,
        address payable _wallet
    ) external onlyOwner {
        require(_wallet != address(0), "Invalid wallet address");
        
        charities[charityCount] = Charity({
            name: _name,
            description: _description,
            wallet: _wallet,
            totalDonations: 0,
            isActive: true
        });

        emit CharityAdded(charityCount, _name, _wallet);
        charityCount++;
    }

    function updateCharity(
        uint256 _charityId,
        string memory _name,
        string memory _description,
        address payable _wallet
    ) external onlyOwner charityExists(_charityId) {
        require(_wallet != address(0), "Invalid wallet address");
        
        Charity storage charity = charities[_charityId];
        charity.name = _name;
        charity.description = _description;
        charity.wallet = _wallet;

        emit CharityUpdated(_charityId, _name, _wallet);
    }

    function toggleCharityStatus(uint256 _charityId) 
        external 
        onlyOwner 
        charityExists(_charityId) 
    {
        charities[_charityId].isActive = !charities[_charityId].isActive;
    }

    function donate(uint256 _charityId, string memory _message) 
        external 
        payable 
        charityExists(_charityId)
        charityActive(_charityId)
        nonReentrant 
    {
        require(msg.value > 0, "Donation amount must be greater than 0");

        Charity storage charity = charities[_charityId];
        charity.totalDonations += msg.value;
        totalPlatformDonations += msg.value;

        donations[_charityId].push(Donation({
            donor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            message: _message
        }));

        emit DonationMade(_charityId, msg.sender, msg.value, _message);
    }

    function withdrawFunds(uint256 _charityId) 
        external 
        charityExists(_charityId)
        nonReentrant 
    {
        Charity storage charity = charities[_charityId];
        require(msg.sender == charity.wallet, "Only charity wallet can withdraw");
        
        uint256 balance = charity.totalDonations;
        require(balance > 0, "No funds to withdraw");

        charity.totalDonations = 0;
        (bool success, ) = charity.wallet.call{value: balance}("");
        require(success, "Transfer failed");

        emit FundsWithdrawn(_charityId, charity.wallet, balance);
    }

    // View functions
    function getCharity(uint256 _charityId) 
        external 
        view 
        charityExists(_charityId) 
        returns (
            string memory name,
            string memory description,
            address wallet,
            uint256 totalDonations,
            bool isActive
        ) 
    {
        Charity storage charity = charities[_charityId];
        return (
            charity.name,
            charity.description,
            charity.wallet,
            charity.totalDonations,
            charity.isActive
        );
    }

    function getDonationsForCharity(uint256 _charityId)
        external
        view
        charityExists(_charityId)
        returns (Donation[] memory)
    {
        return donations[_charityId];
    }

    function getCharityCount() external view returns (uint256) {
        return charityCount;
    }
}