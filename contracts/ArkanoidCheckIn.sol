// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ArkanoidCheckIn
 * @notice Check-in once per day. For every 5 days of check-in, player gets +0.2 score multiplier (summed).
 *         Example: 5 days -> 1.2x, 10 days -> 1.4x, 15 days -> 1.6x.
 */
contract ArkanoidCheckIn {
    uint256 public constant BONUS_PER_5_DAYS_BP = 20; // 0.2 in basis points (100 = 1.0)
    uint256 public constant DAY = 1 days;

    mapping(address => uint256) public lastCheckInDay;  // timestamp / DAY of last check-in
    mapping(address => uint256) public totalCheckInDays; // total number of check-in days (never reset)

    event CheckIn(address indexed user, uint256 day, uint256 totalDays);

    /// @notice Check in once per calendar day (UTC). Each 5 days add +0.2 to score multiplier.
    function checkIn() external {
        uint256 today = block.timestamp / DAY;
        require(lastCheckInDay[msg.sender] != today, "Already checked in today");

        lastCheckInDay[msg.sender] = today;
        totalCheckInDays[msg.sender] += 1;

        emit CheckIn(msg.sender, today, totalCheckInDays[msg.sender]);
    }

    /// @notice Get score bonus in basis points. 100 = 1.0 (no bonus), 120 = 1.2 (+0.2), 140 = 1.4 (+0.4).
    ///         Frontend: displayScore = rawScore * (100 + getScoreBonusBp(user)) / 100
    function getScoreBonusBp(address user) external view returns (uint256) {
        return (totalCheckInDays[user] / 5) * BONUS_PER_5_DAYS_BP;
    }

    /// @notice Number of full 5-day blocks (0.2 multiplier each).
    function getBonusUnits(address user) external view returns (uint256) {
        return totalCheckInDays[user] / 5;
    }

    /// @notice Whether the user has already checked in today.
    function hasCheckedInToday(address user) external view returns (bool) {
        return lastCheckInDay[user] == block.timestamp / DAY;
    }
}
