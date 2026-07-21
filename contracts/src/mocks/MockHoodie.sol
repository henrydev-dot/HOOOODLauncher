// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Test/testnet stand-in for $HOODIE. Supports an optional
///         fee-on-transfer mode so the protocol's balance-measured accounting
///         can be exercised against a non-standard quote token.
contract MockHoodie {
    string public name = "HOODIE (Mock)";
    string public symbol = "HOODIE";
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    /// @notice Transfer tax in bps, burned on every transfer (0 = standard ERC-20).
    uint256 public transferFeeBps;
    address public immutable deployer;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        deployer = msg.sender;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function setTransferFeeBps(uint256 feeBps) external {
        require(msg.sender == deployer, "only deployer");
        require(feeBps <= 1000, "fee too high");
        transferFeeBps = feeBps;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= value, "allowance");
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(balanceOf[from] >= value, "balance");
        balanceOf[from] -= value;
        uint256 fee = (value * transferFeeBps) / 10_000;
        balanceOf[to] += value - fee;
        totalSupply -= fee; // burned
        emit Transfer(from, to, value - fee);
    }
}
