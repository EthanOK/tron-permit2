// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockTokens is Ownable {
    address[] public tokens;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function getDeployedTokens() public view returns (address[] memory) {
        return tokens;
    }

    function deployMockToken(
        uint256 number,
        address initialOwner
    ) public onlyOwner {
        for (uint256 i = 0; i < number; i++) {
            MockToken token = new MockToken(initialOwner);
            tokens.push(address(token));
        }
    }
}

contract MockToken is ERC20, Ownable {
    constructor(
        address initialOwner
    ) ERC20("Mock Token", "MOCK") Ownable(initialOwner) {
        _mint(initialOwner, 100_000_000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}
