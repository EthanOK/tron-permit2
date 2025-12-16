// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@alexroan/permit2-tron/contracts/Permit2.sol";

contract Permit2Tron is Permit2 {
    function permitBatch(
        address owner,
        PermitBatch memory permitBatch_input,
        bytes calldata signature
    ) external {
        Permit2(address(this)).permit(owner, permitBatch_input, signature);
    }

    function permitSingle(
        address owner,
        PermitSingle memory permitSingle_input,
        bytes calldata signature
    ) external {
        Permit2(address(this)).permit(owner, permitSingle_input, signature);
    }
}
