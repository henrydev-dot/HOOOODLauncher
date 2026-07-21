// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./utils/BaseTest.sol";
import {BondingCurve} from "../src/BondingCurve.sol";
import {GraduationManager} from "../src/GraduationManager.sol";
import {LaunchToken} from "../src/LaunchToken.sol";
import {IERC20} from "../src/vendor/IERC20.sol";
import {FeeSplitter} from "../src/FeeSplitter.sol";

contract GraduationTest is BaseTest {
    uint256 internal launcherId;
    address internal token;

    function setUp() public {
        _deployProtocol();
        launcherId = _createLauncher(alice, "hoodie-arcade", 50);
        token = _createToken(alice, launcherId);
    }

    function _fillCurve() internal {
        vm.prank(bob);
        curve.buy(token, 86_000_000e18, 0);
    }

    function test_GraduateBeforeCloseReverts() public {
        vm.prank(carol);
        vm.expectRevert(BondingCurve.CurveNotClosed.selector);
        graduation.graduate(token);
    }

    function test_GraduationEndToEnd() public {
        _fillCurve();
        (uint256 collected,,,,,,) = curve.getState(token);
        uint256 carolBefore = hoodie.balanceOf(carol);
        uint256 treasuryPendingBefore = splitter.pendingFees(TREASURY);

        vm.prank(carol);
        address pair = graduation.graduate(token);

        // Caller incentive: 0.05% of collected HOODIE.
        assertEq(hoodie.balanceOf(carol) - carolBefore, (collected * 5) / 10_000, "caller incentive");
        // Graduation fee: 2% credited to the platform.
        assertEq(splitter.pendingFees(TREASURY) - treasuryPendingBefore, (collected * 200) / 10_000, "graduation fee");

        // The pool holds the LP reserve tokens and the remaining HOODIE.
        assertEq(LaunchToken(token).balanceOf(pair), 206_900_000e18, "LP token reserve in pool");
        uint256 expectedHoodie = collected - (collected * 5) / 10_000 - (collected * 200) / 10_000;
        assertEq(hoodie.balanceOf(pair), expectedHoodie, "HOODIE liquidity in pool");

        // 100% of LP is burned.
        assertGe(IERC20(pair).balanceOf(DEAD), 1, "LP burned to dead");
        assertEq(IERC20(pair).balanceOf(address(graduation)), 0, "no LP kept");
        assertEq(IERC20(pair).balanceOf(carol), 0, "caller gets no LP");

        // Unsold curve inventory was burned; graduation manager keeps no assets.
        assertEq(LaunchToken(token).balanceOf(address(graduation)), 0, "no token dust");
        assertEq(LaunchToken(token).balanceOf(address(curve)), 0, "curve emptied");
        assertGe(LaunchToken(token).balanceOf(DEAD), 1, "leftover burned");

        // Trading on the curve is over.
        (,,,, bool graduated,,) = curve.getState(token);
        assertTrue(graduated, "state graduated");
        vm.prank(bob);
        vm.expectRevert(BondingCurve.CurveNotActive.selector);
        curve.buy(token, 1e18, 0);

        // Cannot graduate twice.
        vm.prank(carol);
        vm.expectRevert(BondingCurve.CurveNotClosed.selector);
        graduation.graduate(token);
    }

    function test_LpLockModeInsteadOfBurn() public {
        registry.setCurveParams(85_000_000e18, 300_000_000e18, 1_073_000_000e18, 793_100_000e18, 1); // lpMode = lock
        _fillCurve();

        vm.prank(carol);
        address pair = graduation.graduate(token);

        (address lockPair, uint256 amount, uint256 unlockAt, address beneficiary) = graduation.lpLocks(token);
        assertEq(lockPair, pair, "lock pair");
        assertGe(amount, 1, "lock amount");
        assertEq(beneficiary, alice, "launcher owner is beneficiary");
        assertEq(IERC20(pair).balanceOf(DEAD), 0, "nothing burned in lock mode");

        vm.prank(alice);
        vm.expectRevert(GraduationManager.LockNotReady.selector);
        graduation.claimLockedLp(token);

        vm.prank(bob);
        vm.expectRevert(GraduationManager.NotLockBeneficiary.selector);
        graduation.claimLockedLp(token);

        vm.warp(unlockAt);
        vm.prank(alice);
        graduation.claimLockedLp(token);
        assertEq(IERC20(pair).balanceOf(alice), amount, "LP released after 12 months");
    }

    function test_FeeSplitterClaims() public {
        _fillCurve();
        vm.prank(carol);
        graduation.graduate(token);

        uint256 pendingAlice = splitter.pendingFees(alice);
        assertGe(pendingAlice, 1, "launcher earned fees");
        vm.prank(alice);
        uint256 paid = splitter.claim();
        assertEq(paid, pendingAlice, "full claim");
        assertEq(splitter.pendingFees(alice), 0, "pending cleared");

        vm.prank(alice);
        vm.expectRevert(FeeSplitter.NothingToClaim.selector);
        splitter.claim();

        vm.prank(TREASURY);
        splitter.claim();
        assertEq(splitter.totalPending(), 0, "all fees paid out");
    }

    function test_OnlyGraduationManagerCanFinalize() public {
        _fillCurve();
        vm.prank(bob);
        vm.expectRevert(BondingCurve.NotGraduationManager.selector);
        curve.finalizeGraduation(token);
    }
}
