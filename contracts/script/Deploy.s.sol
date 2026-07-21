// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {LauncherRegistry} from "../src/LauncherRegistry.sol";
import {TokenFactory} from "../src/TokenFactory.sol";
import {BondingCurve} from "../src/BondingCurve.sol";
import {GraduationManager} from "../src/GraduationManager.sol";
import {FeeSplitter} from "../src/FeeSplitter.sol";
import {Timelock48} from "../src/Timelock48.sol";
import {MockHoodie} from "../src/mocks/MockHoodie.sol";

/// @dev Minimal script cheatcode surface (kept dependency-free; forge runs this
///      via `forge script script/Deploy.s.sol --broadcast`).
interface VmScript {
    function startBroadcast() external;
    function stopBroadcast() external;
    function envAddress(string calldata name) external view returns (address);
    function envOr(string calldata name, address defaultValue) external view returns (address);
    function envOr(string calldata name, bool defaultValue) external view returns (bool);
}

/// @notice Deploys the full HOODIEPAD protocol.
///
/// Required env vars:
///   TREASURY            — platform fee treasury
///   UNIV2_FACTORY       — Uniswap V2 factory for the target chain
///   UNIV2_ROUTER        — Uniswap V2 router02 for the target chain
/// Optional:
///   HOODIE              — HOODIE token address (mainnet: 0xC72c01AAB5f5678dc1d6f5C6d2B417d91D402Ba3).
///                         If unset, a MockHoodie is deployed (testnet flow).
///   ADMIN               — final owner of the Timelock48 (defaults to broadcaster-controlled treasury)
contract Deploy {
    VmScript internal constant vm = VmScript(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external {
        address treasury = vm.envAddress("TREASURY");
        address uniFactory = vm.envAddress("UNIV2_FACTORY");
        address uniRouter = vm.envAddress("UNIV2_ROUTER");
        address hoodie = vm.envOr("HOODIE", address(0));
        address admin = vm.envOr("ADMIN", treasury);

        vm.startBroadcast();

        if (hoodie == address(0)) {
            hoodie = address(new MockHoodie());
        }

        // Registry is initially owned by the broadcaster so it can be wired,
        // then handed to the 48h timelock (2-step: the timelock must accept
        // ownership via a queued acceptOwnership() call).
        Timelock48 timelock = new Timelock48(admin);
        LauncherRegistry registry = new LauncherRegistry(hoodie, treasury, msg.sender);
        BondingCurve curve = new BondingCurve(registry);
        TokenFactory factory = new TokenFactory(registry);
        FeeSplitter splitter = new FeeSplitter(registry);
        GraduationManager graduation = new GraduationManager(registry, uniFactory, uniRouter);

        registry.wireContracts(address(factory), address(curve), address(graduation), address(splitter));
        // Hand the registry to the 48h timelock; every future parameter change
        // must be queued publicly for 48 hours before it can execute.
        registry.transferOwnership(address(timelock));

        vm.stopBroadcast();
    }
}
