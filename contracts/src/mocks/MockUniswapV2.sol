// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../vendor/IERC20.sol";

/// @notice Minimal Uniswap V2 stand-ins for unit tests. Fork tests against the
///         real deployment cover the production path.
contract MockUniswapV2Pair {
    address public token0;
    address public token1;
    string public constant name = "Mock LP";
    string public constant symbol = "UNI-V2";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor(address token0_, address token1_) {
        token0 = token0_;
        token1 = token1_;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function getReserves() external view returns (uint112, uint112, uint32) {
        return (
            uint112(IERC20(token0).balanceOf(address(this))),
            uint112(IERC20(token1).balanceOf(address(this))),
            uint32(block.timestamp)
        );
    }
}

contract MockUniswapV2Factory {
    mapping(address => mapping(address => address)) public getPair;

    function createPair(address tokenA, address tokenB) public returns (address pair) {
        require(getPair[tokenA][tokenB] == address(0), "exists");
        pair = address(new MockUniswapV2Pair(tokenA, tokenB));
        getPair[tokenA][tokenB] = pair;
        getPair[tokenB][tokenA] = pair;
    }
}

contract MockUniswapV2Router {
    MockUniswapV2Factory public immutable factoryContract;

    constructor(MockUniswapV2Factory factory_) {
        factoryContract = factory_;
    }

    function factory() external view returns (address) {
        return address(factoryContract);
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256,
        uint256,
        address to,
        uint256
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        address pair = factoryContract.getPair(tokenA, tokenB);
        if (pair == address(0)) pair = factoryContract.createPair(tokenA, tokenB);
        IERC20(tokenA).transferFrom(msg.sender, pair, amountADesired);
        IERC20(tokenB).transferFrom(msg.sender, pair, amountBDesired);
        liquidity = _sqrt(amountADesired * amountBDesired);
        MockUniswapV2Pair(pair).mint(to, liquidity);
        return (amountADesired, amountBDesired, liquidity);
    }

    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }
}
