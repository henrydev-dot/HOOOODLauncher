// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./vendor/IERC20.sol";
import {SafeERC20} from "./vendor/SafeERC20.sol";
import {ReentrancyGuard} from "./vendor/ReentrancyGuard.sol";
import {LauncherRegistry} from "./LauncherRegistry.sol";

/// @title FeeSplitter
/// @notice Accumulates HOODIE fees and pays them out pull-style via `claim()`.
///         No push payments: a malicious fee recipient can never block trading,
///         and there is no external call into unknown code during trades.
///
///         Callers (curve / factory / graduation manager) transfer HOODIE here
///         first and then call `credit` with the split. Claims are capped by the
///         actual HOODIE balance, so a fee-on-transfer HOODIE would degrade
///         payouts proportionally instead of bricking the contract.
contract FeeSplitter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    LauncherRegistry public immutable REGISTRY;
    IERC20 public immutable HOODIE;

    /// @notice Claimable HOODIE per account (launcher fee recipients + treasury).
    mapping(address => uint256) public pendingFees;
    uint256 public totalPending;

    event FeesCredited(address indexed launcherRecipient, uint256 launcherAmount, uint256 platformAmount);
    event FeesClaimed(address indexed account, uint256 amount);

    error NotAuthorized();
    error NothingToClaim();

    constructor(LauncherRegistry registry) {
        REGISTRY = registry;
        HOODIE = registry.HOODIE();
    }

    /// @dev Only the wired protocol contracts may credit fees.
    modifier onlyProtocol() {
        if (
            msg.sender != REGISTRY.bondingCurve() && msg.sender != REGISTRY.tokenFactory()
                && msg.sender != REGISTRY.graduationManager()
        ) revert NotAuthorized();
        _;
    }

    /// @notice Record a fee split. The HOODIE MUST already have been transferred
    ///         to this contract by the caller in the same transaction.
    /// @param launcherRecipient Launcher owner's fee recipient (zero if none).
    function credit(address launcherRecipient, uint256 launcherAmount, uint256 platformAmount) external onlyProtocol {
        if (launcherAmount > 0 && launcherRecipient != address(0)) {
            pendingFees[launcherRecipient] += launcherAmount;
        } else {
            // No valid launcher recipient: the launcher share falls to the platform.
            platformAmount += launcherAmount;
        }
        if (platformAmount > 0) pendingFees[REGISTRY.treasury()] += platformAmount;
        totalPending += launcherAmount + platformAmount;
        emit FeesCredited(launcherRecipient, launcherAmount, platformAmount);
    }

    /// @notice Pull-payment claim of all accrued fees for msg.sender.
    function claim() external nonReentrant returns (uint256 paid) {
        uint256 amount = pendingFees[msg.sender];
        if (amount == 0) revert NothingToClaim();
        uint256 balance = HOODIE.balanceOf(address(this));
        paid = amount < balance ? amount : balance;
        if (paid == 0) revert NothingToClaim();
        pendingFees[msg.sender] = amount - paid;
        totalPending -= paid;
        HOODIE.safeTransfer(msg.sender, paid);
        emit FeesClaimed(msg.sender, paid);
    }
}
