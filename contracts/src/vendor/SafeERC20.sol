// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./IERC20.sol";

/// @dev Vendored, minimal SafeERC20 (OpenZeppelin-style semantics).
///      Tolerates tokens that return nothing (USDT-style) and tokens that
///      return a bool; reverts on `false` or on a call to a non-contract.
library SafeERC20 {
    error SafeERC20FailedOperation(address token);

    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(IERC20.transfer, (to, value)));
    }

    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(IERC20.transferFrom, (from, to, value)));
    }

    /// @dev Sets allowance to `value`, handling non-standard tokens that
    ///      require the allowance to be zeroed first.
    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        bytes memory approveCall = abi.encodeCall(IERC20.approve, (spender, value));
        if (!_callOptionalReturnBool(token, approveCall)) {
            _callOptionalReturn(token, abi.encodeCall(IERC20.approve, (spender, 0)));
            _callOptionalReturn(token, approveCall);
        }
    }

    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        if (!_callOptionalReturnBool(token, data)) revert SafeERC20FailedOperation(address(token));
    }

    function _callOptionalReturnBool(IERC20 token, bytes memory data) private returns (bool) {
        if (address(token).code.length == 0) return false;
        (bool success, bytes memory returndata) = address(token).call(data);
        return success && (returndata.length == 0 || abi.decode(returndata, (bool)));
    }
}
