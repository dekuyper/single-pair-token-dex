pragma solidity 0.4.24;

import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


contract Exchange is Ownable {
    using SafeMath for uint256;

    ERC20 public token;

    bool public conversionsEnabled = false;
    uint256 public contractFunding;
    uint256 public startPrice;
    // Amount of debt this contract has towards the owner
    OwnerCredit public ownerCredit;

    struct OwnerCredit {
        uint256 tokens;
        uint256 eth;
    }

    /**
     * Event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param sellAmount of tokens purchased
     * @param purchaseReturn wei paid for purchase
     */
    event TokenPurchase(
        address indexed purchaser,
        address indexed beneficiary,
        uint256 sellAmount,
        uint256 purchaseReturn
    );

    /**
     * Event for token purchase logging
     * @param seller who paid for the tokens
     * @param beneficiary who got the tokens
     * @param sellAmount of tokens sold
     * @param saleReturn wei received in exchange for the tokens
     */
    event TokenSale(
        address indexed seller,
        address indexed beneficiary,
        uint256 sellAmount,
        uint256 saleReturn
    );

    /**
     * @param _token contract address for the ERC20 token which will be converted in this contract
     */
    constructor(address _token, uint256 _startPrice)
    public
    {
        require(_token != address(0));
        require(_startPrice > 0);

        token = ERC20(_token);
        startPrice = _startPrice;
        ownerCredit = OwnerCredit(0, 0);
    }

    /**
     * @notice The buyer will receive the amount of tokens equivalent to the ETH paid
     *
     * @param _beneficiary the address that will receive the tokens
     * @param _minReturn The minimum amount of tokens the buyer is expecting from the exchange
     */
    function buy(address _beneficiary, uint256 _minReturn)
    public
    payable
    conversionsAllowed
    returns (uint256)
    {
        uint256 depositAmount = msg.value;
        if (depositAmount == 0)
            return 0;

        _validateAddress(_beneficiary);

        uint256 purchaseReturn = getPurchaseReturn(depositAmount);

        _assureMinimumReturn(_minReturn, purchaseReturn);

        // Transfer tokens to the _address
        require(token.transfer(_beneficiary, purchaseReturn));

        emit TokenPurchase(msg.sender, _beneficiary, depositAmount, purchaseReturn);

        return purchaseReturn;
    }

    /**
     * @dev The sender needs to approve this transaction by calling the ERC20 token's approve method
     *      before calling this function
     *
     * @param _beneficiary the address that will receive the WEI
     * @param _amount of tokens the initiator wants to sell
     * @param _minReturn The minimum amount of WEI the buyer is expecting from the exchange
     */
    function sell(address _beneficiary, uint256 _amount, uint256 _minReturn)
    public
    conversionsAllowed
    returns (uint256)
    {
        if (_amount == 0)
            return 0;

        _validateAddress(_beneficiary);

        uint256 saleReturn = getSaleReturn(_amount);

        _assureEthBalance(saleReturn);
        _assureMinimumReturn(_minReturn, saleReturn);

        // Transfer tokens to this contract
        require(token.transferFrom(msg.sender, address(this), _amount));
        // Transfer WEI to the _beneficiary
        _beneficiary.transfer(saleReturn);

        emit TokenSale(msg.sender, _beneficiary, _amount, saleReturn);

        return saleReturn;
    }

    /**
     * @dev This method is used to query the current conversion rate from WEI to Tokens
     * @param _sellAmount The amount of WEI a trader wants to sell in exchange for the Token
     */
    function getPurchaseReturn(uint256 _sellAmount)
    public
    view
    returns (uint256)
    {
        if (_sellAmount == 0)
            return 0;

        uint256 tokenBalance = getTokenBalance();
        uint256 numerator = _sellAmount.mul(tokenBalance);
        uint256 contractValue = startPrice.mul(contractFunding) / 10 ** 18;
        uint256 denominator = contractValue.add(_sellAmount);
        return numerator / denominator;
    }

    /**
     * @dev This method is used to query the current conversion rate from Tokens to WEI
     *
     * @param _sellAmount The amount of Tokens a trader wants to sell in exchange for WEI
     */
    function getSaleReturn(uint256 _sellAmount)
    public
    view
    returns (uint256)
    {
        if (_sellAmount == 0)
            return 0;

        uint256 tokenBalance = getTokenBalance();
        uint256 contractValue = startPrice.mul(contractFunding) / 10 ** 18;
        uint256 numerator = _sellAmount.mul(contractValue);
        uint256 denominator = tokenBalance.add(_sellAmount);
        return numerator / denominator;
    }

    /**
     * @notice The owner is funding this contract so that conversions can be possible.
     *         Successfully funding the contract will also enable conversions.
     * @dev This function calls transferFrom on the ERC20 Token where the owner
     *      should have previously called the approve function.
     *
     * @param _from Address that holds the token balance.
     * @param _amount Of tokens to be transferred to this contract.
     */
    function creditTokens(address _from, uint256 _amount)
    public
    onlyOwner
    returns (bool)
    {
        // Check for previous credits
        require(conversionsEnabled == false);
        contractFunding = _amount;
        ownerCredit.tokens = ownerCredit.tokens.add(_amount);
        enableConversions(true);
        require(token.transferFrom(_from, address(this), _amount));
        return true;
    }

    /**
     * @notice Allows to credit this contract with ETH that you can withdraw later
     *         if there is enough balance in the contract.
     */
    function creditEth()
    public
    payable
    onlyOwner
    returns (bool)
    {
        ownerCredit.eth = ownerCredit.eth.add(msg.value);
        return true;
    }

    /**
     * @notice Allows the owner to withdraw his initial amount of tokens with which he funded the contract on deploy
     *
     * @param _beneficiary Address to receive the tokens that are being withdrawn.
     */
    function withdrawTokens(address _beneficiary, uint256 _amount)
    public
    onlyOwner
    {
        ownerCredit.tokens = ownerCredit.tokens.sub(_amount);
        require(token.transfer(_beneficiary, _amount));
    }

    /**
     * @notice Allows the owner to withdraw the ETH he credited the contract with.
     *
     * @param _beneficiary Address to receive the ETH.
     * @param _amount Expressed in WEI. How much you want to withdraw.
     */
    function withdrawEth(address _beneficiary, uint256 _amount)
    public
    onlyOwner
    {
        _assureEthBalance(_amount);
        ownerCredit.eth = ownerCredit.eth.sub(_amount);
        _beneficiary.transfer(_amount);
    }

    /**
    * @dev The conversionsAllowed modifier is dependent on this flag
    *
    * @param _flag should be true to enable the conversions or false to disable.
    */
    function enableConversions(bool _flag)
    public
    onlyOwner
    {
        conversionsEnabled = _flag;
    }

    /**
     * @dev Returns the WEI balance of this contract
     */
    function getBalance()
    public
    view
    returns (uint256)
    {
        return address(this).balance;
    }

    /**
     * @dev Returns the Token balance of this contract
     */
    function getTokenBalance()
    public view returns (uint256)
    {
        return token.balanceOf(address(this));
    }

    // -----------------------------------------
    // Internal interface
    // -----------------------------------------

    function _assureEthBalance(uint256 _amount)
    private view
    {
        require(address(this).balance >= _amount);
    }

    /**
     * @param _address Address performing the token purchase
     */
    function _validateAddress(address _address)
    private pure
    {
        require(_address != address(0));
    }

    /**
     * @param _minReturn        The minimum expected quantity of the sender
     * @param _actualReturn     What they would actually get from the transaction
     */
    function _assureMinimumReturn(uint256 _minReturn, uint256 _actualReturn)
    private pure
    {
        require(_minReturn <= _actualReturn);
    }

    modifier conversionsAllowed() {
        require(conversionsEnabled);
        _;
    }

}
