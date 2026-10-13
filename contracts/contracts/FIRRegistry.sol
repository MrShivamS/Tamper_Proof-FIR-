// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title FIRRegistry
/// @notice Stores only hashes of FIRs (never personal data). Append-only: amendments become new versions.
contract FIRRegistry is AccessControl {
    bytes32 public constant OFFICER_ROLE = keccak256("OFFICER_ROLE");

    struct Version {
        bytes32 docHash;
        uint64 timestamp;
        address officer;
    }

    mapping(uint256 => Version[]) private _versions;

    event FIRAnchored(uint256 indexed firId, uint256 version, bytes32 docHash, address officer);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function anchor(uint256 firId, bytes32 docHash) external onlyRole(OFFICER_ROLE) {
        require(docHash != bytes32(0), "Empty hash");
        _versions[firId].push(Version(docHash, uint64(block.timestamp), msg.sender));
        emit FIRAnchored(firId, _versions[firId].length, docHash, msg.sender);
    }

    function versionCount(uint256 firId) external view returns (uint256) {
        return _versions[firId].length;
    }

    function latest(uint256 firId) external view returns (Version memory) {
        require(_versions[firId].length > 0, "FIR not found");
        return _versions[firId][_versions[firId].length - 1];
    }

    function versionAt(uint256 firId, uint256 index) external view returns (Version memory) {
        require(index < _versions[firId].length, "Version not found");
        return _versions[firId][index];
    }
}
