// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ArkanoidGames
 * @notice Mint game access: minesweeper, space_shooter. Free mint per game per user.
 *         Arkanoid is played after minting a ball (separate flow).
 */
contract ArkanoidGames {
    bytes32 public constant MINESWEEPER = keccak256("minesweeper");
    bytes32 public constant SPACE_SHOOTER = keccak256("space_shooter");

    mapping(address => mapping(bytes32 => bool)) public hasGame;

    event GameMinted(address indexed user, bytes32 indexed gameId);

    function mintMinesweeper() external {
        require(!hasGame[msg.sender][MINESWEEPER], "Already minted");
        hasGame[msg.sender][MINESWEEPER] = true;
        emit GameMinted(msg.sender, MINESWEEPER);
    }

    function mintSpaceShooter() external {
        require(!hasGame[msg.sender][SPACE_SHOOTER], "Already minted");
        hasGame[msg.sender][SPACE_SHOOTER] = true;
        emit GameMinted(msg.sender, SPACE_SHOOTER);
    }

    function hasMinesweeper(address user) external view returns (bool) {
        return hasGame[user][MINESWEEPER];
    }

    function hasSpaceShooter(address user) external view returns (bool) {
        return hasGame[user][SPACE_SHOOTER];
    }
}
