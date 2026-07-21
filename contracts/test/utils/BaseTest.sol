// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MockHoodie} from "../../src/mocks/MockHoodie.sol";
import {MockUniswapV2Factory, MockUniswapV2Router} from "../../src/mocks/MockUniswapV2.sol";
import {LauncherRegistry} from "../../src/LauncherRegistry.sol";
import {TokenFactory} from "../../src/TokenFactory.sol";
import {BondingCurve} from "../../src/BondingCurve.sol";
import {GraduationManager} from "../../src/GraduationManager.sol";
import {FeeSplitter} from "../../src/FeeSplitter.sol";

/// @dev Foundry cheatcode interface — minimal subset, so the repo builds with a
///      bare `forge test` and no lib dependencies.
interface Vm {
    function prank(address) external;
    function startPrank(address) external;
    function stopPrank() external;
    function expectRevert(bytes4) external;
    function expectRevert() external;
    function roll(uint256) external;
    function warp(uint256) external;
    function assume(bool) external pure;
}

/// @dev Minimal test base: assertion helpers revert on failure, which Foundry
///      reports as a failing test.
abstract contract BaseTest {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address internal constant TREASURY = address(0xBEEF);
    address internal constant DEAD = 0x000000000000000000000000000000000000dEaD;

    MockHoodie internal hoodie;
    LauncherRegistry internal registry;
    TokenFactory internal factory;
    BondingCurve internal curve;
    GraduationManager internal graduation;
    FeeSplitter internal splitter;
    MockUniswapV2Factory internal uniFactory;
    MockUniswapV2Router internal uniRouter;

    address internal alice = address(0xA11CE);
    address internal bob = address(0xB0B);
    address internal carol = address(0xCA401);

    function _deployProtocol() internal {
        hoodie = new MockHoodie();
        registry = new LauncherRegistry(address(hoodie), TREASURY, address(this));
        curve = new BondingCurve(registry);
        factory = new TokenFactory(registry);
        splitter = new FeeSplitter(registry);
        uniFactory = new MockUniswapV2Factory();
        uniRouter = new MockUniswapV2Router(uniFactory);
        graduation = new GraduationManager(registry, address(uniFactory), address(uniRouter));
        registry.wireContracts(address(factory), address(curve), address(graduation), address(splitter));

        address[3] memory users = [alice, bob, carol];
        for (uint256 i = 0; i < 3; i++) {
            address user = users[i];
            hoodie.mint(user, 1_000_000_000e18);
            vm.prank(user);
            hoodie.approve(address(curve), type(uint256).max);
            vm.prank(user);
            hoodie.approve(address(factory), type(uint256).max);
            vm.prank(user);
            hoodie.approve(address(registry), type(uint256).max);
        }
    }

    function _createLauncher(address owner, string memory slug, uint16 feeBps) internal returns (uint256 id) {
        vm.prank(owner);
        id = registry.createLauncher(slug, owner, feeBps);
    }

    function _createToken(address creator, uint256 launcherId) internal returns (address token) {
        vm.prank(creator);
        token = factory.createToken(launcherId, "Test Token", "TEST", "ipfs://meta", 0, 0);
    }

    // ------------------------------------------------------------ assertions

    function assertEq(uint256 a, uint256 b, string memory message) internal pure {
        if (a != b) revert(string.concat("assertEq(uint) failed: ", message));
    }

    function assertEq(address a, address b, string memory message) internal pure {
        if (a != b) revert(string.concat("assertEq(address) failed: ", message));
    }

    function assertTrue(bool condition, string memory message) internal pure {
        if (!condition) revert(string.concat("assertTrue failed: ", message));
    }

    function assertGe(uint256 a, uint256 b, string memory message) internal pure {
        if (a < b) revert(string.concat("assertGe failed: ", message));
    }

    function assertLe(uint256 a, uint256 b, string memory message) internal pure {
        if (a > b) revert(string.concat("assertLe failed: ", message));
    }

    function assertApproxEq(uint256 a, uint256 b, uint256 tolerance, string memory message) internal pure {
        uint256 diff = a > b ? a - b : b - a;
        if (diff > tolerance) revert(string.concat("assertApproxEq failed: ", message));
    }
}
