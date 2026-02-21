// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ArkanoidBalls
 * @dev Soulbound ERC-721: 1 NFT per ball type per wallet, non-transferable.
 * Ball types: 0..8 free | 9 Emerald (0.00025 ETH) | 10 Ruby (0.0005 ETH) | 11 Gold (0.001 ETH)
 */
contract ArkanoidBalls is ERC721, Ownable, ReentrancyGuard {
    uint256 public constant MAX_BALL_TYPES = 12;
    uint256 private _nextTokenId;

    // ballType => price in wei (0 = free)
    uint256[MAX_BALL_TYPES] public prices;
    // base URI for token metadata
    string private _baseTokenURI;
    // ETH recipient
    address public immutable treasury;

    mapping(uint256 => uint8) public tokenIdToBallType;
    mapping(address => mapping(uint8 => bool)) public hasMinted;

    event Minted(address indexed to, uint256 indexed tokenId, uint8 ballType);

    error AlreadyMinted();
    error InvalidBallType();
    error InsufficientPayment();
    error TransferNotAllowed();

    constructor(address _treasury, string memory baseURI_) ERC721("Arkanoid Balls", "ARB") Ownable(msg.sender) {
        treasury = _treasury;
        _baseTokenURI = baseURI_;

        // Free: 0..8 (classic, cyan, orange, pink, purple, brown, blue, lime, teal)
        prices[0] = 0;
        prices[1] = 0;
        prices[2] = 0;
        prices[3] = 0;
        prices[4] = 0;
        prices[5] = 0;
        prices[6] = 0;
        prices[7] = 0;
        prices[8] = 0;
        // Paid
        prices[9] = 0.00025 ether;  // Emerald
        prices[10] = 0.0005 ether;  // Ruby
        prices[11] = 0.001 ether;   // Gold
    }

    function mint(uint8 ballType) external payable nonReentrant {
        if (ballType >= MAX_BALL_TYPES) revert InvalidBallType();
        if (hasMinted[msg.sender][ballType]) revert AlreadyMinted();
        if (msg.value < prices[ballType]) revert InsufficientPayment();

        hasMinted[msg.sender][ballType] = true;
        uint256 tokenId = _nextTokenId++;
        tokenIdToBallType[tokenId] = ballType;

        _safeMint(msg.sender, tokenId);

        if (msg.value > 0) {
            (bool sent, ) = treasury.call{value: msg.value}("");
            require(sent, "ETH transfer failed");
        }

        emit Minted(msg.sender, tokenId, ballType);
    }

    function balanceOfBallType(address owner, uint8 ballType) external view returns (uint256) {
        return hasMinted[owner][ballType] ? 1 : 0;
    }

    function ownsBallType(address owner, uint8 ballType) external view returns (bool) {
        return hasMinted[owner][ballType];
    }

    // Alias for older frontend reads.
    function hasBall(address owner, uint8 ballType) external view returns (bool) {
        return hasMinted[owner][ballType];
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
    }

    // Soulbound: block transfers except mint/burn.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert TransferNotAllowed();
        return super._update(to, tokenId, auth);
    }
}
