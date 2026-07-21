// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./vendor/IERC20.sol";
import {SafeERC20} from "./vendor/SafeERC20.sol";
import {ReentrancyGuard} from "./vendor/ReentrancyGuard.sol";
import {IUniswapV2Factory, IUniswapV2Router02} from "./interfaces/IUniswapV2.sol";
import {LauncherRegistry} from "./LauncherRegistry.sol";
import {BondingCurve} from "./BondingCurve.sol";
import {FeeSplitter} from "./FeeSplitter.sol";

/// @title GraduationManager
/// @notice When a curve reaches its HOODIE threshold it closes, and anyone may
///         call `graduate()` (small incentive paid to the caller). Graduation
///         atomically:
///           1. takes the graduation fee (platform) and caller incentive,
///           2. creates/funds the Uniswap V2 TOKEN/HOODIE pool,
///           3. burns 100% of the LP to 0xdead (or 12-month lock, per registry
///              lpMode snapshot at graduation time),
///           4. burns leftover curve inventory.
///         Router/factory addresses are constructor parameters, so the same
///         bytecode deploys to mainnet, Sepolia, or any L2.
contract GraduationManager is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;
    uint256 public constant BPS = 10_000;
    uint256 public constant LP_LOCK_DURATION = 365 days;

    LauncherRegistry public immutable REGISTRY;
    IERC20 public immutable HOODIE;
    IUniswapV2Factory public immutable UNI_FACTORY;
    IUniswapV2Router02 public immutable UNI_ROUTER;

    struct LpLock {
        address pair;
        uint256 amount;
        uint256 unlockAt;
        address beneficiary;
    }

    /// @notice token => LP lock (only used when registry.lpMode() == 1).
    mapping(address => LpLock) public lpLocks;

    event TokenGraduated(address indexed token, address indexed pair, uint256 hoodieLiquidity, uint256 tokenLiquidity);
    event LpBurned(address indexed token, address indexed pair, uint256 amount);
    event LpLocked(address indexed token, address indexed pair, uint256 amount, uint256 unlockAt, address beneficiary);
    event LpLockClaimed(address indexed token, address indexed pair, uint256 amount, address beneficiary);

    error ZeroAddress();
    error LockNotReady();
    error NotLockBeneficiary();

    constructor(LauncherRegistry registry, address uniFactory, address uniRouter) {
        if (uniFactory == address(0) || uniRouter == address(0)) revert ZeroAddress();
        REGISTRY = registry;
        HOODIE = registry.HOODIE();
        UNI_FACTORY = IUniswapV2Factory(uniFactory);
        UNI_ROUTER = IUniswapV2Router02(uniRouter);
    }

    /// @notice Graduate a closed curve. Callable by anyone; msg.sender earns the incentive.
    function graduate(address token) external nonReentrant returns (address pair) {
        BondingCurve curve = BondingCurve(REGISTRY.bondingCurve());

        // Pull assets out of the curve, measuring HOODIE actually received
        // (defensive against fee-on-transfer quote tokens).
        uint256 hoodieBefore = HOODIE.balanceOf(address(this));
        (, uint256 lpTokens, uint256 launcherId) = curve.finalizeGraduation(token);
        uint256 hoodieReceived = HOODIE.balanceOf(address(this)) - hoodieBefore;

        // Caller incentive + graduation fee.
        uint256 incentive = (hoodieReceived * REGISTRY.graduateIncentiveBps()) / BPS;
        uint256 gradFee = (hoodieReceived * REGISTRY.graduationFeeBps()) / BPS;
        if (incentive > 0) HOODIE.safeTransfer(msg.sender, incentive);
        if (gradFee > 0) {
            address splitter = REGISTRY.feeSplitter();
            HOODIE.safeTransfer(splitter, gradFee);
            FeeSplitter(splitter).credit(address(0), 0, gradFee);
        }
        uint256 hoodieForPool = hoodieReceived - incentive - gradFee;

        // Create + fund the Uniswap V2 TOKEN/HOODIE pool. amountMins are 0 by
        // design: on a fresh pair the deposit ratio is exact, and if a griefer
        // pre-seeded the pair with dust the deposit still lands (their donation
        // is simply gifted to the burned LP).
        HOODIE.forceApprove(address(UNI_ROUTER), hoodieForPool);
        IERC20(token).forceApprove(address(UNI_ROUTER), lpTokens);
        (uint256 usedToken, uint256 usedHoodie,) = UNI_ROUTER.addLiquidity(
            token, address(HOODIE), lpTokens, hoodieForPool, 0, 0, address(this), block.timestamp
        );
        HOODIE.forceApprove(address(UNI_ROUTER), 0);
        IERC20(token).forceApprove(address(UNI_ROUTER), 0);

        pair = UNI_FACTORY.getPair(token, address(HOODIE));

        // LP handling: burn (default) or 12-month lock for the launcher owner.
        uint256 lpBalance = IERC20(pair).balanceOf(address(this));
        if (REGISTRY.lpMode() == 0) {
            IERC20(pair).safeTransfer(DEAD, lpBalance);
            emit LpBurned(token, pair, lpBalance);
        } else {
            (address launcherOwner,,,,) = REGISTRY.getLauncher(launcherId);
            lpLocks[token] =
                LpLock({pair: pair, amount: lpBalance, unlockAt: block.timestamp + LP_LOCK_DURATION, beneficiary: launcherOwner});
            emit LpLocked(token, pair, lpBalance, block.timestamp + LP_LOCK_DURATION, launcherOwner);
        }

        // Sweep dust: unused tokens burn, unused HOODIE goes to the treasury.
        uint256 tokenDust = IERC20(token).balanceOf(address(this));
        if (tokenDust > 0) IERC20(token).safeTransfer(DEAD, tokenDust);
        uint256 hoodieDust = hoodieForPool - usedHoodie;
        if (hoodieDust > 0) HOODIE.safeTransfer(REGISTRY.treasury(), hoodieDust);

        emit TokenGraduated(token, pair, usedHoodie, usedToken);
    }

    /// @notice Claim a matured LP lock (lpMode 1 only).
    function claimLockedLp(address token) external nonReentrant {
        LpLock memory lock = lpLocks[token];
        if (lock.beneficiary != msg.sender) revert NotLockBeneficiary();
        if (block.timestamp < lock.unlockAt) revert LockNotReady();
        delete lpLocks[token];
        IERC20(lock.pair).safeTransfer(lock.beneficiary, lock.amount);
        emit LpLockClaimed(token, lock.pair, lock.amount, lock.beneficiary);
    }
}
