// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step} from "./vendor/Ownable2Step.sol";

/// @title Timelock48
/// @notice Minimal 48-hour timelock that owns the LauncherRegistry in production.
///         Every admin parameter change must be queued, wait 48 hours in public
///         view, and only then execute — giving users time to exit if they
///         disagree with a change. Deliberately tiny and non-upgradeable.
contract Timelock48 is Ownable2Step {
    uint256 public constant DELAY = 48 hours;
    /// @notice Queued operations expire if not executed within this grace period.
    uint256 public constant GRACE_PERIOD = 14 days;

    /// @notice operation id => timestamp when it becomes executable (0 = not queued).
    mapping(bytes32 => uint256) public readyAt;

    event OperationQueued(bytes32 indexed id, address target, uint256 value, bytes data, uint256 readyAt);
    event OperationExecuted(bytes32 indexed id, address target, uint256 value, bytes data);
    event OperationCancelled(bytes32 indexed id);

    error AlreadyQueued();
    error NotQueued();
    error NotReady();
    error Expired();
    error ExecutionFailed(bytes returndata);

    constructor(address admin) Ownable2Step(admin) {}

    function operationId(address target, uint256 value, bytes calldata data, bytes32 salt)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(target, value, data, salt));
    }

    function queue(address target, uint256 value, bytes calldata data, bytes32 salt) external onlyOwner returns (bytes32 id) {
        id = operationId(target, value, data, salt);
        if (readyAt[id] != 0) revert AlreadyQueued();
        readyAt[id] = block.timestamp + DELAY;
        emit OperationQueued(id, target, value, data, readyAt[id]);
    }

    function execute(address target, uint256 value, bytes calldata data, bytes32 salt) external payable onlyOwner {
        bytes32 id = operationId(target, value, data, salt);
        uint256 ts = readyAt[id];
        if (ts == 0) revert NotQueued();
        if (block.timestamp < ts) revert NotReady();
        if (block.timestamp > ts + GRACE_PERIOD) revert Expired();
        delete readyAt[id];
        (bool ok, bytes memory ret) = target.call{value: value}(data);
        if (!ok) revert ExecutionFailed(ret);
        emit OperationExecuted(id, target, value, data);
    }

    function cancel(address target, uint256 value, bytes calldata data, bytes32 salt) external onlyOwner {
        bytes32 id = operationId(target, value, data, salt);
        if (readyAt[id] == 0) revert NotQueued();
        delete readyAt[id];
        emit OperationCancelled(id);
    }
}
