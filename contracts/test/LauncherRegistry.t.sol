// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./utils/BaseTest.sol";
import {LauncherRegistry} from "../src/LauncherRegistry.sol";

contract LauncherRegistryTest is BaseTest {
    function setUp() public {
        _deployProtocol();
    }

    function test_CreateLauncherChargesFeeAndStoresConfig() public {
        uint256 treasuryBefore = hoodie.balanceOf(TREASURY);

        vm.prank(alice);
        uint256 id = registry.createLauncher("hoodie-arcade", alice, 50);

        assertEq(id, 1, "first launcher id");
        assertEq(hoodie.balanceOf(TREASURY) - treasuryBefore, 50_000e18, "creation fee to treasury");

        (address owner, address feeRecipient, uint16 feeBps, string memory slug, bool antiSniper) = registry.getLauncher(id);
        assertEq(owner, alice, "owner");
        assertEq(feeRecipient, alice, "feeRecipient");
        assertEq(uint256(feeBps), 50, "feeBps");
        assertTrue(keccak256(bytes(slug)) == keccak256("hoodie-arcade"), "slug");
        assertTrue(!antiSniper, "anti-sniper off by default");
        assertEq(registry.launcherIdBySlugHash(keccak256("hoodie-arcade")), id, "slug hash lookup");
    }

    function test_SlugValidation() public {
        vm.startPrank(alice);
        vm.expectRevert(LauncherRegistry.InvalidSlug.selector);
        registry.createLauncher("ab", alice, 0); // too short
        vm.expectRevert(LauncherRegistry.InvalidSlug.selector);
        registry.createLauncher("Hoodie", alice, 0); // uppercase
        vm.expectRevert(LauncherRegistry.InvalidSlug.selector);
        registry.createLauncher("has_underscore", alice, 0);
        vm.expectRevert(LauncherRegistry.InvalidSlug.selector);
        registry.createLauncher("a-slug-that-is-far-too-long-for-us-1", alice, 0); // 36 chars
        vm.stopPrank();
    }

    function test_DuplicateSlugReverts() public {
        _createLauncher(alice, "my-launcher", 0);
        vm.prank(bob);
        vm.expectRevert(LauncherRegistry.SlugTaken.selector);
        registry.createLauncher("my-launcher", bob, 0);
    }

    function test_LauncherFeeCapEnforced() public {
        vm.prank(alice);
        vm.expectRevert(LauncherRegistry.FeeTooHigh.selector);
        registry.createLauncher("my-launcher", alice, 101);
    }

    function test_ZeroCreationFeeAllowed() public {
        registry.setFees(0, 500e18, 100, 200, 5);
        uint256 balBefore = hoodie.balanceOf(alice);
        _createLauncher(alice, "free-launcher", 0);
        assertEq(hoodie.balanceOf(alice), balBefore, "no fee charged");
    }

    function test_OnlyAdminSetsParams() public {
        vm.prank(alice);
        vm.expectRevert();
        registry.setFees(1, 1, 1, 1, 1);

        vm.expectRevert(LauncherRegistry.ParamOutOfRange.selector);
        registry.setFees(0, 0, 301, 0, 0); // trade fee above 3% cap

        vm.expectRevert(LauncherRegistry.ParamOutOfRange.selector);
        registry.setCurveParams(0, 1, 1_000_000e18, 1, 0); // zero threshold
    }

    function test_LauncherConfigOnlyLauncherOwner() public {
        uint256 id = _createLauncher(alice, "my-launcher", 10);

        vm.prank(bob);
        vm.expectRevert(LauncherRegistry.NotLauncherOwner.selector);
        registry.setLauncherConfig(id, bob, 20, true);

        vm.prank(alice);
        registry.setLauncherConfig(id, carol, 100, true);
        (, address feeRecipient, uint16 feeBps,, bool antiSniper) = registry.getLauncher(id);
        assertEq(feeRecipient, carol, "recipient updated");
        assertEq(uint256(feeBps), 100, "fee updated");
        assertTrue(antiSniper, "anti-sniper enabled");
    }

    function test_TransferLauncherOwnership() public {
        uint256 id = _createLauncher(alice, "my-launcher", 0);
        vm.prank(alice);
        registry.transferLauncherOwnership(id, bob);
        (address owner,,,,) = registry.getLauncher(id);
        assertEq(owner, bob, "ownership moved");
    }

    function test_WireContractsOnlyOnce() public {
        vm.expectRevert(LauncherRegistry.AlreadyWired.selector);
        registry.wireContracts(address(1), address(2), address(3), address(4));
    }
}
