// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./utils/BaseTest.sol";
import {LaunchToken} from "../src/LaunchToken.sol";
import {TokenFactory} from "../src/TokenFactory.sol";

contract TokenFactoryTest is BaseTest {
    uint256 internal launcherId;

    function setUp() public {
        _deployProtocol();
        launcherId = _createLauncher(alice, "hoodie-arcade", 50);
    }

    function test_CreateTokenMintsFullSupplyToCurve() public {
        address token = _createToken(bob, launcherId);

        assertEq(LaunchToken(token).totalSupply(), 1_000_000_000e18, "1B supply");
        assertEq(LaunchToken(token).balanceOf(address(curve)), 1_000_000_000e18, "all supply on curve");
        assertEq(LaunchToken(token).balanceOf(bob), 0, "creator gets nothing for free");
    }

    function test_CreationFeeSplitFiftyFifty() public {
        _createToken(bob, launcherId);
        // 500 HOODIE fee: 250 to launcher owner (alice), 250 to treasury.
        assertEq(splitter.pendingFees(alice), 250e18, "launcher half");
        assertEq(splitter.pendingFees(TREASURY), 250e18, "platform half");
        assertEq(hoodie.balanceOf(address(splitter)), 500e18, "fee escrowed in splitter");
    }

    function test_DevBuyExecutesAtomically() public {
        vm.prank(bob);
        address token = factory.createToken(launcherId, "Dev Token", "DEV", "ipfs://m", 1_000e18, 1);
        assertGe(LaunchToken(token).balanceOf(bob), 1, "dev buy delivered tokens");
    }

    function test_TokenCannotBeReinitialized() public {
        address token = _createToken(bob, launcherId);
        vm.expectRevert(LaunchToken.AlreadyInitialized.selector);
        LaunchToken(token).initialize("Evil", "EVIL", bob);
    }

    function test_UnknownLauncherReverts() public {
        vm.prank(bob);
        vm.expectRevert(TokenFactory.LauncherNotFound.selector);
        factory.createToken(999, "Nope", "NO", "", 0, 0);
    }

    function test_NameSymbolBounds() public {
        vm.startPrank(bob);
        vm.expectRevert(TokenFactory.InvalidName.selector);
        factory.createToken(launcherId, "", "OK", "", 0, 0);
        vm.expectRevert(TokenFactory.InvalidSymbol.selector);
        factory.createToken(launcherId, "Name", "WAYTOOLONGSYMBOL12", "", 0, 0);
        vm.stopPrank();
    }
}
