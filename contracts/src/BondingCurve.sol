// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./vendor/IERC20.sol";
import {SafeERC20} from "./vendor/SafeERC20.sol";
import {ReentrancyGuard} from "./vendor/ReentrancyGuard.sol";
import {LauncherRegistry} from "./LauncherRegistry.sol";
import {FeeSplitter} from "./FeeSplitter.sol";

/// @title BondingCurve
/// @notice HOODIE-denominated constant-product bonding curve with virtual
///         reserves (pump.fun model, adapted to an ERC-20 quote asset).
///
///         One shared contract serves every token from every launcher. Each
///         token gets its own curve state, with the protocol parameters
///         snapshotted at registration so an admin change can never move the
///         goalposts of a live token.
///
///         Price is derived exclusively from curve state — no external oracle,
///         no spot reads from AMM pools. All rounding favors the curve, so the
///         invariant k = virtualHoodie * virtualToken never decreases and the
///         contract can always cover sells.
contract BondingCurve is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct TokenCurve {
        uint256 launcherId;
        address creator;
        uint256 virtualHoodie;
        uint256 virtualToken;
        uint256 realHoodie; //          HOODIE backing this token (fees excluded)
        uint256 saleRemaining; //       tokens still purchasable on the curve
        uint256 lpReserve; //           tokens reserved for graduation liquidity
        uint256 graduationThreshold; // real HOODIE reserve that closes the curve
        uint64 createdAtBlock;
        bool closed; //                 threshold reached; trading frozen, graduation pending
        bool graduated;
    }

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000e18;
    uint256 public constant BPS = 10_000;
    /// @notice Anti-sniper window: first 2 blocks after token creation.
    uint256 public constant ANTI_SNIPE_BLOCKS = 2;
    /// @notice Max buy per wallet inside the anti-sniper window: 1% of supply.
    uint256 public constant ANTI_SNIPE_MAX_BUY = TOTAL_SUPPLY / 100;

    LauncherRegistry public immutable REGISTRY;
    IERC20 public immutable HOODIE;

    mapping(address => TokenCurve) internal _curves;
    /// @dev token => buyer => tokens bought inside the anti-sniper window.
    mapping(address => mapping(address => uint256)) public sniperWindowBought;

    event Trade(
        address indexed token,
        address indexed trader,
        bool isBuy,
        uint256 hoodieAmount,
        uint256 tokenAmount,
        uint256 fee,
        uint256 virtualHoodieAfter,
        uint256 virtualTokenAfter
    );
    event TokenRegistered(address indexed token, uint256 indexed launcherId, address indexed creator);
    event CurveClosed(address indexed token, uint256 realHoodieReserve);
    event CurveFinalized(address indexed token, uint256 hoodieCollected, uint256 lpTokens, uint256 leftoverBurned);

    error NotFactory();
    error NotGraduationManager();
    error UnknownToken();
    error TokenAlreadyRegistered();
    error CurveNotActive();
    error CurveNotClosed();
    error ZeroAmount();
    error SlippageExceeded();
    error SaleSupplyExceeded();
    error AntiSniperLimit();
    error SupplyNotReceived();

    constructor(LauncherRegistry registry) {
        REGISTRY = registry;
        HOODIE = registry.HOODIE();
    }

    // ---------------------------------------------------------------- registration

    /// @notice Called by the TokenFactory right after the clone minted its full
    ///         supply to this contract. Snapshots the protocol curve parameters.
    function registerToken(address token, uint256 launcherId, address creator) external {
        if (msg.sender != REGISTRY.tokenFactory()) revert NotFactory();
        TokenCurve storage t = _curves[token];
        if (t.virtualToken != 0) revert TokenAlreadyRegistered();
        if (IERC20(token).balanceOf(address(this)) < TOTAL_SUPPLY) revert SupplyNotReceived();

        uint256 saleSupply = REGISTRY.saleSupply();
        t.launcherId = launcherId;
        t.creator = creator;
        t.virtualHoodie = REGISTRY.virtualHoodieReserve0();
        t.virtualToken = REGISTRY.virtualTokenReserve0();
        t.saleRemaining = saleSupply;
        t.lpReserve = TOTAL_SUPPLY - saleSupply;
        t.graduationThreshold = REGISTRY.graduationThreshold();
        t.createdAtBlock = uint64(block.number);

        emit TokenRegistered(token, launcherId, creator);
    }

    // ---------------------------------------------------------------- trading

    /// @notice Buy `token` with HOODIE. Caller must have approved this contract.
    function buy(address token, uint256 hoodieIn, uint256 minTokensOut) external returns (uint256) {
        return buyTo(token, hoodieIn, minTokensOut, msg.sender);
    }

    /// @notice Buy on behalf of `recipient` (used by the TokenFactory for dev buys).
    ///         HOODIE is always pulled from msg.sender; anti-sniper limits are
    ///         enforced against the recipient, so this is not a bypass vector.
    function buyTo(address token, uint256 hoodieIn, uint256 minTokensOut, address recipient)
        public
        nonReentrant
        returns (uint256 tokensOut)
    {
        TokenCurve storage t = _curves[token];
        if (t.virtualToken == 0) revert UnknownToken();
        if (t.closed || t.graduated) revert CurveNotActive();
        if (hoodieIn == 0) revert ZeroAmount();

        // Pull HOODIE, measuring the amount actually received (defensive against
        // fee-on-transfer behavior of the quote token).
        uint256 balanceBefore = HOODIE.balanceOf(address(this));
        HOODIE.safeTransferFrom(msg.sender, address(this), hoodieIn);
        uint256 actualIn = HOODIE.balanceOf(address(this)) - balanceBefore;
        if (actualIn == 0) revert ZeroAmount();

        (uint16 totalFeeBps, uint16 launcherFeeBps, address launcherRecipient,) = REGISTRY.feeInfo(t.launcherId);

        uint256 fee = (actualIn * totalFeeBps) / BPS;
        uint256 launcherCut = (actualIn * launcherFeeBps) / BPS;
        if (launcherCut > fee) launcherCut = fee;
        uint256 amountToCurve = actualIn - fee;

        // x*y=k with rounding in favor of the curve: the new virtual token
        // reserve is rounded UP so the invariant never decreases.
        uint256 k = t.virtualHoodie * t.virtualToken;
        uint256 newVirtualHoodie = t.virtualHoodie + amountToCurve;
        uint256 newVirtualToken = _ceilDiv(k, newVirtualHoodie);
        tokensOut = t.virtualToken - newVirtualToken;

        if (tokensOut == 0) revert ZeroAmount();
        if (tokensOut < minTokensOut) revert SlippageExceeded();
        if (tokensOut > t.saleRemaining) revert SaleSupplyExceeded();

        _checkAntiSniper(t, token, recipient, tokensOut);

        // Effects.
        t.virtualHoodie = newVirtualHoodie;
        t.virtualToken = newVirtualToken;
        t.realHoodie += amountToCurve;
        t.saleRemaining -= tokensOut;

        bool justClosed;
        if (t.realHoodie >= t.graduationThreshold) {
            t.closed = true;
            justClosed = true;
        }

        // Interactions.
        if (fee > 0) {
            address splitter = REGISTRY.feeSplitter();
            HOODIE.safeTransfer(splitter, fee);
            FeeSplitter(splitter).credit(launcherRecipient, launcherCut, fee - launcherCut);
        }
        IERC20(token).safeTransfer(recipient, tokensOut);

        emit Trade(token, recipient, true, actualIn, tokensOut, fee, t.virtualHoodie, t.virtualToken);
        if (justClosed) emit CurveClosed(token, t.realHoodie);
    }

    /// @notice Sell `token` back into the curve for HOODIE.
    function sell(address token, uint256 tokensIn, uint256 minHoodieOut)
        external
        nonReentrant
        returns (uint256 hoodieOut)
    {
        TokenCurve storage t = _curves[token];
        if (t.virtualToken == 0) revert UnknownToken();
        if (t.closed || t.graduated) revert CurveNotActive();
        if (tokensIn == 0) revert ZeroAmount();

        IERC20(token).safeTransferFrom(msg.sender, address(this), tokensIn);

        // Rounding favors the curve: new virtual HOODIE reserve rounds UP.
        uint256 k = t.virtualHoodie * t.virtualToken;
        uint256 newVirtualToken = t.virtualToken + tokensIn;
        uint256 newVirtualHoodie = _ceilDiv(k, newVirtualToken);
        uint256 grossHoodie = t.virtualHoodie - newVirtualHoodie;

        if (grossHoodie == 0) revert ZeroAmount();
        // Solvency: rounding guarantees this, but keep the hard check.
        if (grossHoodie > t.realHoodie) revert SaleSupplyExceeded();

        (uint16 totalFeeBps, uint16 launcherFeeBps, address launcherRecipient,) = REGISTRY.feeInfo(t.launcherId);
        uint256 fee = (grossHoodie * totalFeeBps) / BPS;
        uint256 launcherCut = (grossHoodie * launcherFeeBps) / BPS;
        if (launcherCut > fee) launcherCut = fee;
        hoodieOut = grossHoodie - fee;
        if (hoodieOut < minHoodieOut) revert SlippageExceeded();

        // Effects.
        t.virtualHoodie = newVirtualHoodie;
        t.virtualToken = newVirtualToken;
        t.realHoodie -= grossHoodie;
        t.saleRemaining += tokensIn;

        // Interactions.
        if (fee > 0) {
            address splitter = REGISTRY.feeSplitter();
            HOODIE.safeTransfer(splitter, fee);
            FeeSplitter(splitter).credit(launcherRecipient, launcherCut, fee - launcherCut);
        }
        HOODIE.safeTransfer(msg.sender, hoodieOut);

        emit Trade(token, msg.sender, false, hoodieOut, tokensIn, fee, t.virtualHoodie, t.virtualToken);
    }

    // ---------------------------------------------------------------- graduation hook

    /// @notice Hands the collected HOODIE + LP token reserve to the
    ///         GraduationManager and burns the unsold remainder.
    function finalizeGraduation(address token)
        external
        nonReentrant
        returns (uint256 hoodieCollected, uint256 lpTokens, uint256 launcherId)
    {
        if (msg.sender != REGISTRY.graduationManager()) revert NotGraduationManager();
        TokenCurve storage t = _curves[token];
        if (t.virtualToken == 0) revert UnknownToken();
        if (!t.closed || t.graduated) revert CurveNotClosed();

        t.graduated = true;
        hoodieCollected = t.realHoodie;
        lpTokens = t.lpReserve;
        launcherId = t.launcherId;
        uint256 leftover = t.saleRemaining;
        t.realHoodie = 0;
        t.saleRemaining = 0;
        t.lpReserve = 0;

        HOODIE.safeTransfer(msg.sender, hoodieCollected);
        IERC20(token).safeTransfer(msg.sender, lpTokens);
        // Unsold curve inventory is burned so graduation supply is deterministic.
        if (leftover > 0) IERC20(token).safeTransfer(address(0xdEaD), leftover);

        emit CurveFinalized(token, hoodieCollected, lpTokens, leftover);
    }

    // ---------------------------------------------------------------- views

    function quoteBuy(address token, uint256 hoodieIn) external view returns (uint256) {
        TokenCurve storage t = _curves[token];
        if (t.virtualToken == 0 || t.closed || t.graduated || hoodieIn == 0) return 0;
        uint16 totalFeeBps = REGISTRY.tradeFeeBps();
        uint256 amountToCurve = hoodieIn - (hoodieIn * totalFeeBps) / BPS;
        uint256 k = t.virtualHoodie * t.virtualToken;
        uint256 tokensOut = t.virtualToken - _ceilDiv(k, t.virtualHoodie + amountToCurve);
        return tokensOut > t.saleRemaining ? 0 : tokensOut;
    }

    function quoteSell(address token, uint256 tokensIn) external view returns (uint256) {
        TokenCurve storage t = _curves[token];
        if (t.virtualToken == 0 || t.closed || t.graduated || tokensIn == 0) return 0;
        uint256 k = t.virtualHoodie * t.virtualToken;
        uint256 grossHoodie = t.virtualHoodie - _ceilDiv(k, t.virtualToken + tokensIn);
        if (grossHoodie > t.realHoodie) return 0;
        return grossHoodie - (grossHoodie * REGISTRY.tradeFeeBps()) / BPS;
    }

    function getState(address token)
        external
        view
        returns (
            uint256 realHoodieReserve,
            uint256 realTokenReserve,
            uint256 virtualHoodieReserve,
            uint256 virtualTokenReserve,
            bool graduated,
            uint256 graduationThreshold,
            uint256 progressBps
        )
    {
        TokenCurve storage t = _curves[token];
        if (t.virtualToken == 0) revert UnknownToken();
        uint256 progress = t.graduationThreshold == 0 ? 0 : (t.realHoodie * BPS) / t.graduationThreshold;
        if (progress > BPS || t.closed || t.graduated) progress = BPS;
        return (
            t.realHoodie,
            t.saleRemaining + t.lpReserve,
            t.virtualHoodie,
            t.virtualToken,
            t.graduated,
            t.graduationThreshold,
            progress
        );
    }

    function getCurve(address token) external view returns (TokenCurve memory) {
        TokenCurve storage t = _curves[token];
        if (t.virtualToken == 0) revert UnknownToken();
        return t;
    }

    // ---------------------------------------------------------------- internal

    function _checkAntiSniper(TokenCurve storage t, address token, address recipient, uint256 tokensOut) internal {
        if (block.number >= t.createdAtBlock + ANTI_SNIPE_BLOCKS) return;
        (,,, bool antiSniperEnabled) = REGISTRY.feeInfo(t.launcherId);
        if (!antiSniperEnabled) return;
        uint256 bought = sniperWindowBought[token][recipient] + tokensOut;
        if (bought > ANTI_SNIPE_MAX_BUY) revert AntiSniperLimit();
        sniperWindowBought[token][recipient] = bought;
    }

    function _ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        return a == 0 ? 0 : (a - 1) / b + 1;
    }
}
