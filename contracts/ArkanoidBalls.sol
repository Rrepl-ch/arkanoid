// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ArkanoidBalls
 * @notice Mint balls: types 0–8 free, 9 Emerald (0.00025 ETH), 10 Ruby (0.0005 ETH), 11 Gold (0.001 ETH).
 *         Ball type IDs match site order: classic, cyan, orange, pink, purple, brown, blue, lime, teal, green, red, gold.
 */
contract ArkanoidBalls {
    uint256 public constant MAX_BALL_TYPES = 12;

    // ballTypeId => price in wei (0 = free)
    uint256[MAX_BALL_TYPES] public prices;

    address public owner;
    mapping(address => mapping(uint8 => bool)) public hasMinted;

    event BallMinted(address indexed user, uint8 ballType);

    constructor() {
        owner = msg.sender;
        // Free: 0–8 (classic, cyan, orange, pink, purple, brown, blue, lime, teal)
        for (uint256 i = 0; i < 9; i++) {
            prices[i] = 0;
        }
        prices[9] = 0.00025 ether;  // green (Emerald)
        prices[10] = 0.0005 ether;  // red (Ruby)
        prices[11] = 0.001 ether;   // gold (Gold)
    }

    function mint(uint8 ballType) external payable {
        require(ballType < MAX_BALL_TYPES, "Invalid ball type");
        require(!hasMinted[msg.sender][ballType], "Already minted");
        require(msg.value >= prices[ballType], "Insufficient payment");

        hasMinted[msg.sender][ballType] = true;
        emit BallMinted(msg.sender, ballType);

        if (msg.value > 0) {
            (bool ok, ) = payable(owner).call{value: msg.value}("");
            require(ok, "Transfer failed");
        }
    }

    function hasBall(address user, uint8 ballType) external view returns (bool) {
        return ballType < MAX_BALL_TYPES && hasMinted[user][ballType];
    }

    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        (bool ok, ) = payable(owner).call{value: address(this).balance}("");
        require(ok, "Transfer failed");
    }
}
