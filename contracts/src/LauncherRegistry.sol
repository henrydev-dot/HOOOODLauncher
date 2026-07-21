// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./vendor/IERC20.sol";
import {SafeERC20} from "./vendor/SafeERC20.sol";
import {ReentrancyGuard} from "./vendor/ReentrancyGuard.sol";
import {Ownable2Step} from "./vendor/Ownable2Step.sol";

/// @title LauncherRegistry
/// @notice On-chain registry of HOODIEPAD launchers and the single source of truth
///         for protocol parameters. Launchers do NOT get their own contracts: a
///         launcher is a registry record (slug, owner, fee recipient, fee share)
///         that the shared TokenFactory / BondingCurve consult.
///
///         Admin functions are expected to sit behind Ownable2Step + a 48h
///         timelock (see Timelock48.sol); parameters are bounded so even the
///         admin cannot push them outside safe ranges.
contract LauncherRegistry is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Launcher {
        address owner;
        address feeRecipient;
        uint16 launcherFeeBps; // launcher owner's share of each trade, in bps of trade size
        bool antiSniperEnabled;
        string slug;
    }

    // ---------------------------------------------------------------- constants

    /// @notice Hard cap on the launcher owner's per-trade share: 100 bps = 1%.
    uint16 public constant MAX_LAUNCHER_FEE_BPS = 100;
    /// @notice Hard cap on the total trade fee: 300 bps = 3%.
    uint16 public constant MAX_TRADE_FEE_BPS = 300;
    /// @notice Hard cap on the graduation fee: 500 bps = 5%.
    uint16 public constant MAX_GRADUATION_FEE_BPS = 500;
    /// @notice Hard cap on the graduate-caller incentive: 100 bps = 1%.
    uint16 public constant MAX_GRADUATE_INCENTIVE_BPS = 100;
    uint256 public constant MAX_LAUNCHER_CREATION_FEE = 10_000_000e18;
    uint256 public constant MAX_TOKEN_CREATION_FEE = 100_000e18;

    // ---------------------------------------------------------------- storage

    IERC20 public immutable HOODIE;

    uint256 public nextLauncherId = 1;
    mapping(uint256 => Launcher) internal _launchers;
    mapping(bytes32 => uint256) public launcherIdBySlugHash;

    // Protocol parameters (defaults from the HOODIEPAD spec; admin-tunable within caps).
    uint256 public launcherCreationFee = 50_000e18; // HOODIE, to platform treasury
    uint256 public tokenCreationFee = 500e18; //       HOODIE, 50/50 platform/launcher
    uint16 public tradeFeeBps = 100; //                 1% total per trade
    uint16 public graduationFeeBps = 200; //            2% of collected HOODIE
    uint16 public graduateIncentiveBps = 5; //          0.05% to graduate() caller
    uint256 public graduationThreshold = 85_000_000e18; // real HOODIE reserve target
    uint256 public virtualHoodieReserve0 = 300_000_000e18;
    uint256 public virtualTokenReserve0 = 1_073_000_000e18;
    uint256 public saleSupply = 793_100_000e18; //      sold on the curve; rest is LP reserve
    /// @notice 0 = burn LP to 0xdead (default), 1 = lock LP for 12 months.
    uint8 public lpMode = 0;

    address public treasury;

    // Wired once after deployment.
    address public tokenFactory;
    address public bondingCurve;
    address public graduationManager;
    address public feeSplitter;

    // ---------------------------------------------------------------- events

    event LauncherCreated(
        uint256 indexed launcherId, string slug, address indexed owner, address feeRecipient, uint16 launcherFeeBps
    );
    event LauncherConfigUpdated(uint256 indexed launcherId, address feeRecipient, uint16 launcherFeeBps, bool antiSniperEnabled);
    event LauncherOwnershipTransferred(uint256 indexed launcherId, address indexed oldOwner, address indexed newOwner);
    event ParamsUpdated();
    event ContractsWired(address tokenFactory, address bondingCurve, address graduationManager, address feeSplitter);
    event TreasuryUpdated(address treasury);

    // ---------------------------------------------------------------- errors

    error InvalidSlug();
    error SlugTaken();
    error ZeroAddress();
    error LauncherNotFound();
    error NotLauncherOwner();
    error FeeTooHigh();
    error ParamOutOfRange();
    error AlreadyWired();

    constructor(address hoodie, address treasury_, address admin) Ownable2Step(admin) {
        if (hoodie == address(0) || treasury_ == address(0)) revert ZeroAddress();
        HOODIE = IERC20(hoodie);
        treasury = treasury_;
    }

    // ---------------------------------------------------------------- launchers

    /// @notice Create a launcher. Charges `launcherCreationFee` HOODIE to the treasury.
    /// @param slug URL slug, ^[a-z0-9-]{3,32}$, globally unique (checked via keccak hash).
    function createLauncher(string calldata slug, address feeRecipient, uint16 launcherFeeBps)
        external
        nonReentrant
        returns (uint256 launcherId)
    {
        if (feeRecipient == address(0)) revert ZeroAddress();
        if (launcherFeeBps > MAX_LAUNCHER_FEE_BPS) revert FeeTooHigh();
        _validateSlug(slug);
        bytes32 slugHash = keccak256(bytes(slug));
        if (launcherIdBySlugHash[slugHash] != 0) revert SlugTaken();

        uint256 fee = launcherCreationFee;
        if (fee > 0) HOODIE.safeTransferFrom(msg.sender, treasury, fee);

        launcherId = nextLauncherId++;
        _launchers[launcherId] = Launcher({
            owner: msg.sender,
            feeRecipient: feeRecipient,
            launcherFeeBps: launcherFeeBps,
            antiSniperEnabled: false,
            slug: slug
        });
        launcherIdBySlugHash[slugHash] = launcherId;

        emit LauncherCreated(launcherId, slug, msg.sender, feeRecipient, launcherFeeBps);
    }

    function getLauncher(uint256 launcherId)
        external
        view
        returns (address owner, address feeRecipient, uint16 launcherFeeBps, string memory slug, bool antiSniperEnabled)
    {
        Launcher storage l = _launchers[launcherId];
        if (l.owner == address(0)) revert LauncherNotFound();
        return (l.owner, l.feeRecipient, l.launcherFeeBps, l.slug, l.antiSniperEnabled);
    }

    function launcherExists(uint256 launcherId) external view returns (bool) {
        return _launchers[launcherId].owner != address(0);
    }

    /// @notice Trade-fee routing info for the bonding curve, in one call.
    function feeInfo(uint256 launcherId)
        external
        view
        returns (uint16 totalTradeFeeBps, uint16 launcherFeeBps, address launcherFeeRecipient, bool antiSniperEnabled)
    {
        Launcher storage l = _launchers[launcherId];
        if (l.owner == address(0)) revert LauncherNotFound();
        return (tradeFeeBps, l.launcherFeeBps, l.feeRecipient, l.antiSniperEnabled);
    }

    function setLauncherConfig(uint256 launcherId, address feeRecipient, uint16 launcherFeeBps, bool antiSniperEnabled)
        external
    {
        Launcher storage l = _launchers[launcherId];
        if (l.owner == address(0)) revert LauncherNotFound();
        if (l.owner != msg.sender) revert NotLauncherOwner();
        if (feeRecipient == address(0)) revert ZeroAddress();
        if (launcherFeeBps > MAX_LAUNCHER_FEE_BPS) revert FeeTooHigh();
        l.feeRecipient = feeRecipient;
        l.launcherFeeBps = launcherFeeBps;
        l.antiSniperEnabled = antiSniperEnabled;
        emit LauncherConfigUpdated(launcherId, feeRecipient, launcherFeeBps, antiSniperEnabled);
    }

    function setAntiSniper(uint256 launcherId, bool enabled) external {
        Launcher storage l = _launchers[launcherId];
        if (l.owner == address(0)) revert LauncherNotFound();
        if (l.owner != msg.sender) revert NotLauncherOwner();
        l.antiSniperEnabled = enabled;
        emit LauncherConfigUpdated(launcherId, l.feeRecipient, l.launcherFeeBps, enabled);
    }

    function transferLauncherOwnership(uint256 launcherId, address newOwner) external {
        Launcher storage l = _launchers[launcherId];
        if (l.owner == address(0)) revert LauncherNotFound();
        if (l.owner != msg.sender) revert NotLauncherOwner();
        if (newOwner == address(0)) revert ZeroAddress();
        emit LauncherOwnershipTransferred(launcherId, l.owner, newOwner);
        l.owner = newOwner;
    }

    // ---------------------------------------------------------------- admin

    /// @notice One-time wiring of the shared protocol contracts.
    function wireContracts(address tokenFactory_, address bondingCurve_, address graduationManager_, address feeSplitter_)
        external
        onlyOwner
    {
        if (tokenFactory != address(0)) revert AlreadyWired();
        if (
            tokenFactory_ == address(0) || bondingCurve_ == address(0) || graduationManager_ == address(0)
                || feeSplitter_ == address(0)
        ) revert ZeroAddress();
        tokenFactory = tokenFactory_;
        bondingCurve = bondingCurve_;
        graduationManager = graduationManager_;
        feeSplitter = feeSplitter_;
        emit ContractsWired(tokenFactory_, bondingCurve_, graduationManager_, feeSplitter_);
    }

    function setTreasury(address treasury_) external onlyOwner {
        if (treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    function setFees(uint256 launcherCreationFee_, uint256 tokenCreationFee_, uint16 tradeFeeBps_, uint16 graduationFeeBps_, uint16 graduateIncentiveBps_)
        external
        onlyOwner
    {
        if (launcherCreationFee_ > MAX_LAUNCHER_CREATION_FEE) revert ParamOutOfRange();
        if (tokenCreationFee_ > MAX_TOKEN_CREATION_FEE) revert ParamOutOfRange();
        if (tradeFeeBps_ > MAX_TRADE_FEE_BPS) revert ParamOutOfRange();
        if (graduationFeeBps_ > MAX_GRADUATION_FEE_BPS) revert ParamOutOfRange();
        if (graduateIncentiveBps_ > MAX_GRADUATE_INCENTIVE_BPS) revert ParamOutOfRange();
        launcherCreationFee = launcherCreationFee_;
        tokenCreationFee = tokenCreationFee_;
        tradeFeeBps = tradeFeeBps_;
        graduationFeeBps = graduationFeeBps_;
        graduateIncentiveBps = graduateIncentiveBps_;
        emit ParamsUpdated();
    }

    /// @notice Curve shape + graduation parameters. Only affects tokens created AFTER
    ///         the change: the bonding curve snapshots these at token registration.
    function setCurveParams(
        uint256 graduationThreshold_,
        uint256 virtualHoodieReserve0_,
        uint256 virtualTokenReserve0_,
        uint256 saleSupply_,
        uint8 lpMode_
    ) external onlyOwner {
        // Sanity bounds: sale supply must fit in the 1B fixed supply and inside the
        // virtual token reserve; virtual reserves must be non-zero.
        if (graduationThreshold_ == 0 || graduationThreshold_ > 1_000_000_000_000e18) revert ParamOutOfRange();
        if (virtualHoodieReserve0_ == 0 || virtualTokenReserve0_ == 0) revert ParamOutOfRange();
        if (saleSupply_ == 0 || saleSupply_ > 1_000_000_000e18) revert ParamOutOfRange();
        if (saleSupply_ >= virtualTokenReserve0_) revert ParamOutOfRange();
        if (lpMode_ > 1) revert ParamOutOfRange();
        graduationThreshold = graduationThreshold_;
        virtualHoodieReserve0 = virtualHoodieReserve0_;
        virtualTokenReserve0 = virtualTokenReserve0_;
        saleSupply = saleSupply_;
        lpMode = lpMode_;
        emit ParamsUpdated();
    }

    // ---------------------------------------------------------------- internal

    /// @dev Enforces ^[a-z0-9-]{3,32}$ on-chain.
    function _validateSlug(string calldata slug) internal pure {
        bytes calldata b = bytes(slug);
        if (b.length < 3 || b.length > 32) revert InvalidSlug();
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            bool ok = (c >= 0x61 && c <= 0x7a) // a-z
                || (c >= 0x30 && c <= 0x39) // 0-9
                || c == 0x2d; // -
            if (!ok) revert InvalidSlug();
        }
    }
}
