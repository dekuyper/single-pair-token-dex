pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/token/ERC20/StandardBurnableToken.sol";


contract ICMToken is StandardBurnableToken {
    /*
    * Token Metadata
    */
    string public name_;
    string public symbol_;
    uint8 public constant decimals_ = 18;

    constructor(address initialAccount, uint initialBalance, string _name, string _symbol) public {
        name_ = _name;
        symbol_ = _symbol;
        balances[initialAccount] = initialBalance;
        totalSupply_ = initialBalance;
    }

}
