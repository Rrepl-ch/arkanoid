// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ArkanoidNicknames
 * @notice One nickname per wallet. Nickname is globally unique (case-insensitive).
 *         Allowed chars: a-z, A-Z, 0-9, underscore. Length: 2..24.
 */
contract ArkanoidNicknames {
    mapping(address => string) public ownerToNickname;
    mapping(bytes32 => address) public nicknameToOwner;

    event NicknameMinted(address indexed owner, string nickname);

    function mint(string calldata nickname) external {
        bytes memory raw = bytes(nickname);
        require(raw.length >= 2 && raw.length <= 24, "Invalid length");
        require(bytes(ownerToNickname[msg.sender]).length == 0, "Already has nickname");

        bytes32 key = _normalizeKey(raw);
        require(nicknameToOwner[key] == address(0), "Nickname taken");

        ownerToNickname[msg.sender] = nickname;
        nicknameToOwner[key] = msg.sender;
        emit NicknameMinted(msg.sender, nickname);
    }

    function hasNickname(address owner) external view returns (bool) {
        return bytes(ownerToNickname[owner]).length > 0;
    }

    function getNickname(address owner) external view returns (string memory) {
        return ownerToNickname[owner];
    }

    function isAvailable(string calldata nickname) external view returns (bool) {
        bytes memory raw = bytes(nickname);
        if (raw.length < 2 || raw.length > 24) return false;
        bytes32 key = _normalizeKey(raw);
        return nicknameToOwner[key] == address(0);
    }

    function _normalizeKey(bytes memory src) internal pure returns (bytes32) {
        bytes memory out = new bytes(src.length);
        for (uint256 i = 0; i < src.length; i++) {
            bytes1 c = src[i];
            bool isLower = c >= 0x61 && c <= 0x7A; // a-z
            bool isUpper = c >= 0x41 && c <= 0x5A; // A-Z
            bool isDigit = c >= 0x30 && c <= 0x39; // 0-9
            bool isUnderscore = c == 0x5F; // _
            require(isLower || isUpper || isDigit || isUnderscore, "Invalid chars");

            // lowercase A-Z
            out[i] = isUpper ? bytes1(uint8(c) + 32) : c;
        }
        return keccak256(out);
    }
}
