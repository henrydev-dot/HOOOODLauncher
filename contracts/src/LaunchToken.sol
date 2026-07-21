// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title LaunchToken
/// @notice The ERC-20 deployed (as an EIP-1167 clone) for every token created on a
///         HOODIEPAD launcher. Deliberately featureless: fixed 1B supply minted once
///         to the bonding curve, no owner, no mint, no transfer tax, no hooks.
///         Rug-resistance is a property of what this contract cannot do.
contract LaunchToken {
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000e18;

    string public name;
    string public symbol;
    uint8 public constant decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    bool private _initialized;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error AlreadyInitialized();
    error InsufficientBalance();
    error InsufficientAllowance();

    /// @notice Called exactly once by the TokenFactory right after cloning.
    /// @param curve The bonding curve that receives the entire supply.
    function initialize(string calldata name_, string calldata symbol_, address curve) external {
        if (_initialized) revert AlreadyInitialized();
        _initialized = true;
        name = name_;
        symbol = symbol_;
        totalSupply = TOTAL_SUPPLY;
        balanceOf[curve] = TOTAL_SUPPLY;
        emit Transfer(address(0), curve, TOTAL_SUPPLY);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < value) revert InsufficientAllowance();
            unchecked {
                allowance[from][msg.sender] = allowed - value;
            }
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
        uint256 fromBalance = balanceOf[from];
        if (fromBalance < value) revert InsufficientBalance();
        unchecked {
            balanceOf[from] = fromBalance - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }
}
