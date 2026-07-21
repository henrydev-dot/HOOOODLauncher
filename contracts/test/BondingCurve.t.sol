// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest} from "./utils/BaseTest.sol";
import {BondingCurve} from "../src/BondingCurve.sol";
import {LaunchToken} from "../src/LaunchToken.sol";

contract BondingCurveTest is BaseTest {
    uint256 internal launcherId;
    address internal token;

    function setUp() public {
        _deployProtocol();
        launcherId = _createLauncher(alice, "hoodie-arcade", 50); // launcher takes 0.5% of trades
        token = _createToken(alice, launcherId);
    }

    function test_QuoteMatchesBuy() public {
        uint256 quoted = curve.quoteBuy(token, 10_000e18);
        vm.prank(bob);
        uint256 got = curve.buy(token, 10_000e18, 0);
        assertEq(got, quoted, "quote == execution");
        assertEq(LaunchToken(token).balanceOf(bob), got, "tokens delivered");
    }

    function test_BuySellRoundTripNeverProfitable() public {
        uint256 balBefore = hoodie.balanceOf(bob);

        vm.startPrank(bob);
        uint256 tokensOut = curve.buy(token, 50_000e18, 0);
        LaunchToken(token).approve(address(curve), tokensOut);
        curve.sell(token, tokensOut, 0);
        vm.stopPrank();

        assertLe(hoodie.balanceOf(bob), balBefore, "round trip cannot profit");
        // ~2% total fees on the round trip; the loss should be in that ballpark.
        assertGe(hoodie.balanceOf(bob), balBefore - 2_000e18, "loss bounded by fees");
    }

    function test_SlippageProtection() public {
        uint256 quoted = curve.quoteBuy(token, 1_000e18);
        vm.prank(bob);
        vm.expectRevert(BondingCurve.SlippageExceeded.selector);
        curve.buy(token, 1_000e18, quoted + 1);

        vm.startPrank(bob);
        uint256 tokensOut = curve.buy(token, 1_000e18, quoted);
        LaunchToken(token).approve(address(curve), tokensOut);
        uint256 sellQuote = curve.quoteSell(token, tokensOut);
        vm.expectRevert(BondingCurve.SlippageExceeded.selector);
        curve.sell(token, tokensOut, sellQuote + 1);
        vm.stopPrank();
    }

    function test_TradeFeeSplitAccounting() public {
        vm.prank(bob);
        curve.buy(token, 100_000e18, 0);

        // 1% total fee = 1000 HOODIE; launcher (alice) at 50 bps = 500, platform 500.
        // Token creation in setUp already credited 250/250 from the 500 HOODIE fee.
        assertEq(splitter.pendingFees(alice), 250e18 + 500e18, "launcher trade cut");
        assertEq(splitter.pendingFees(TREASURY), 250e18 + 500e18, "platform trade cut");
    }

    function test_FeeOnTransferHoodieHandled() public {
        hoodie.setTransferFeeBps(100); // HOODIE suddenly taxes 1% per transfer

        vm.prank(bob);
        uint256 tokensOut = curve.buy(token, 10_000e18, 0);
        assertGe(tokensOut, 1, "buy still works");

        // The curve must remain solvent: its HOODIE balance covers the recorded reserve.
        (uint256 realHoodie,,,,,,) = curve.getState(token);
        assertGe(hoodie.balanceOf(address(curve)), realHoodie, "solvent under FoT");
    }

    function test_AntiSniperWindowLimitsBuys() public {
        vm.prank(alice);
        registry.setAntiSniper(launcherId, true);
        vm.prank(alice);
        address sniped = factory.createToken(launcherId, "Sniped", "SNIPE", "", 0, 0);

        // 1% of supply = 10M tokens. A huge buy in the creation block must revert.
        vm.prank(bob);
        vm.expectRevert(BondingCurve.AntiSniperLimit.selector);
        curve.buy(sniped, 50_000_000e18, 0);

        // Small buy passes, and the window expires after 2 blocks.
        vm.prank(bob);
        curve.buy(sniped, 1_000e18, 0);
        vm.roll(block.number + 2);
        vm.prank(bob);
        curve.buy(sniped, 50_000_000e18, 0);
    }

    function test_CurveClosesAtGraduationThreshold() public {
        // 86M gross → ~85.14M to curve ≥ 85M threshold.
        vm.prank(bob);
        curve.buy(token, 86_000_000e18, 0);

        (uint256 realHoodie,,,, bool graduated,, uint256 progress) = curve.getState(token);
        assertGe(realHoodie, 85_000_000e18, "threshold reached");
        assertTrue(!graduated, "not yet graduated");
        assertEq(progress, 10_000, "progress pinned to 100%");

        vm.prank(carol);
        vm.expectRevert(BondingCurve.CurveNotActive.selector);
        curve.buy(token, 1e18, 0);
        vm.prank(bob);
        vm.expectRevert(BondingCurve.CurveNotActive.selector);
        curve.sell(token, 1e18, 0);
    }

    function test_UnknownTokenReverts() public {
        vm.expectRevert(BondingCurve.UnknownToken.selector);
        curve.buy(address(0x1234), 1e18, 0);
    }

    /// @dev Invariant under fuzzed buy/sell sequences: k never decreases and the
    ///      curve always holds enough HOODIE to cover its recorded reserve.
    function testFuzz_InvariantKNonDecreasingAndSolvent(uint96 rawBuy1, uint96 rawBuy2, uint96 rawSellPct) public {
        uint256 buy1 = uint256(rawBuy1) % 40_000_000e18 + 1e18;
        uint256 buy2 = uint256(rawBuy2) % 40_000_000e18 + 1e18;
        uint256 sellPct = uint256(rawSellPct) % 100 + 1;

        (,, uint256 vh0, uint256 vt0,,,) = curve.getState(token);
        uint256 k0 = vh0 * vt0;

        vm.startPrank(bob);
        uint256 out1 = curve.buy(token, buy1, 0);
        uint256 toSell = (out1 * sellPct) / 100;
        if (toSell > 0) {
            LaunchToken(token).approve(address(curve), toSell);
            curve.sell(token, toSell, 0);
        }
        vm.stopPrank();

        (,,,, bool graduated,,) = curve.getState(token);
        (, ,uint256 vh1, uint256 vt1,,,) = curve.getState(token);
        if (!graduated && !_isClosed()) {
            vm.prank(carol);
            curve.buy(token, buy2, 0);
        }

        (uint256 realHoodie,, uint256 vh2, uint256 vt2,,,) = curve.getState(token);
        assertGe(vh1 * vt1, k0, "k never decreases (mid)");
        assertGe(vh2 * vt2, k0, "k never decreases (end)");
        assertGe(hoodie.balanceOf(address(curve)), realHoodie, "curve solvent");
    }

    /// @dev A buyer can never extract more HOODIE than they put in.
    function testFuzz_RoundTripNeverProfitable(uint96 rawAmount) public {
        uint256 amount = uint256(rawAmount) % 50_000_000e18 + 1e18;
        uint256 balBefore = hoodie.balanceOf(bob);

        vm.startPrank(bob);
        uint256 tokensOut = curve.buy(token, amount, 0);
        if (!_isClosed()) {
            LaunchToken(token).approve(address(curve), tokensOut);
            curve.sell(token, tokensOut, 0);
        }
        vm.stopPrank();

        assertLe(hoodie.balanceOf(bob), balBefore, "no free HOODIE");
    }

    function _isClosed() internal view returns (bool) {
        BondingCurve.TokenCurve memory c = curve.getCurve(token);
        return c.closed;
    }
}
