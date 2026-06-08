// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockReceiver
 * @notice Simple contract for testing AA account transaction execution
 */
contract MockReceiver {
    bool public called;

    event Received();

    function receive() external returns (bool) {
        called = true;
        emit Received();
        return true;
    }

    receive() external payable {}
}