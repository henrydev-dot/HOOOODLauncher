// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./vendor/IERC20.sol";
import {SafeERC20} from "./vendor/SafeERC20.sol";
import {ReentrancyGuard} from "./vendor/ReentrancyGuard.sol";
import {Clones} from "./vendor/Clones.sol";
import {LaunchToken} from "./LaunchToken.sol";
import {LauncherRegistry} from "./LauncherRegistry.sol";
import {BondingCurve} from "./BondingCurve.sol";
import {FeeSplitter} from "./FeeSplitter.sol";

/// @title TokenFactory
/// @notice Deploys LaunchToken clones (EIP-1167) for any launcher. The full 1B
///         supply is minted straight to the shared BondingCurve; the creator can
///         optionally attach a "dev buy" executed atomically in the same tx.
contract TokenFactory is ReentrancyGuard {
    using SafeERC20 for IERC20;

    LauncherRegistry public immutable REGISTRY;
    IERC20 public immutable HOODIE;
    /// @notice The LaunchToken logic contract all clones point to.
    address public immutable TOKEN_IMPLEMENTATION;

    event TokenCreated(
        uint256 indexed launcherId,
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        string metadataURI
    );

    error LauncherNotFound();
    error InvalidName();
    error InvalidSymbol();

    constructor(LauncherRegistry registry) {
        REGISTRY = registry;
        HOODIE = registry.HOODIE();
        TOKEN_IMPLEMENTATION = address(new LaunchToken());
    }

    /// @notice Create a token under `launcherId`.
    /// @param devBuyHoodie Optional HOODIE amount for an atomic first buy (0 to skip).
    /// @param minTokensOut Slippage bound for the dev buy (ignored when devBuyHoodie is 0).
    function createToken(
        uint256 launcherId,
        string calldata name,
        string calldata symbol,
        string calldata metadataURI,
        uint256 devBuyHoodie,
        uint256 minTokensOut
    ) external nonReentrant returns (address token) {
        if (!REGISTRY.launcherExists(launcherId)) revert LauncherNotFound();
        if (bytes(name).length == 0 || bytes(name).length > 64) revert InvalidName();
        if (bytes(symbol).length == 0 || bytes(symbol).length > 16) revert InvalidSymbol();

        BondingCurve curve = BondingCurve(REGISTRY.bondingCurve());

        // Creation fee: 50% platform / 50% launcher owner, via the pull-payment splitter.
        uint256 fee = REGISTRY.tokenCreationFee();
        if (fee > 0) {
            address splitter = REGISTRY.feeSplitter();
            (, address launcherFeeRecipient,,,) = _launcherInfo(launcherId);
            HOODIE.safeTransferFrom(msg.sender, splitter, fee);
            uint256 launcherHalf = fee / 2;
            FeeSplitter(splitter).credit(launcherFeeRecipient, launcherHalf, fee - launcherHalf);
        }

        token = Clones.clone(TOKEN_IMPLEMENTATION);
        LaunchToken(token).initialize(name, symbol, address(curve));
        curve.registerToken(token, launcherId, msg.sender);

        emit TokenCreated(launcherId, token, msg.sender, name, symbol, metadataURI);

        if (devBuyHoodie > 0) {
            HOODIE.safeTransferFrom(msg.sender, address(this), devBuyHoodie);
            HOODIE.forceApprove(address(curve), devBuyHoodie);
            curve.buyTo(token, devBuyHoodie, minTokensOut, msg.sender);
        }
    }

    function tokenCreationFee() external view returns (uint256) {
        return REGISTRY.tokenCreationFee();
    }

    function _launcherInfo(uint256 launcherId)
        internal
        view
        returns (address owner, address feeRecipient, uint16 feeBps, string memory slug, bool antiSniper)
    {
        return REGISTRY.getLauncher(launcherId);
    }
}
