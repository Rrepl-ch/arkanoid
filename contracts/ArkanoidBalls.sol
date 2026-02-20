// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ArkanoidBalls
 * @notice Mint premium balls: Emerald (0.00025 ETH), Ruby (0.0005 ETH), Gold (0.001 ETH).
 */
contract ArkanoidBalls {
    uint256 public constant EMERALD_PRICE = 0.00025 ether;
    uint256 public constant RUBY_PRICE = 0.0005 ether;
    uint256 public constant GOLD_PRICE = 0.001 ether;

    address public owner;
    mapping(address => bool) public hasEmerald;
    mapping(address => bool) public hasRuby;
    mapping(address => bool) public hasGold;

    event BallMinted(address indexed user, string ballId);

    constructor() {
        owner = msg.sender;
    }

    function mintEmerald() external payable {
        require(msg.value == EMERALD_PRICE, "Wrong amount");
        require(!hasEmerald[msg.sender], "Already minted");
        hasEmerald[msg.sender] = true;
        emit BallMinted(msg.sender, "emerald");
    }

    function mintRuby() external payable {
        require(msg.value == RUBY_PRICE, "Wrong amount");
        require(!hasRuby[msg.sender], "Already minted");
        hasRuby[msg.sender] = true;
        emit BallMinted(msg.sender, "ruby");
    }

    function mintGold() external payable {
        require(msg.value == GOLD_PRICE, "Wrong amount");
        require(!hasGold[msg.sender], "Already minted");
        hasGold[msg.sender] = true;
        emit BallMinted(msg.sender, "gold");
    }

    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        (bool ok,) = payable(owner).call{value: address(this).balance}("");
        require(ok, "Transfer failed");
    }
}
