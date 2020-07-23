const Exchange = artifacts.require('../contracts/converter/Exchange.sol');
const Token = artifacts.require('../contracts/token/mock/ICMToken.sol');
const deployParams = require('../config/deploy_params');
const {getPurchaseReturn, getSaleReturn, toWei, toBigNumber} = require('../helper/helper')();
const truffleAssert = require('truffle-assertions');
require('should');

const tokensFunding = toWei(100000).toNumber(); //* 10^-18 (It's in 'WEI')
const ethFunding = toWei(10).toNumber();

let exchange, token = null;

before(async () => {
    exchange = await Exchange.deployed();
    token = await Token.deployed();
});

contract('Token', () => {
    describe('Basic contract functionality', () => {
        it('should have the right total supply', async function () {
            let totalSupply = await token.totalSupply();

            assert.equal(totalSupply, deployParams.test.tokenTotalSupply);
        });
    })
});

contract('Exchange', (accounts) => {
    const ownerAccount = accounts[0];
    const traderAccount = accounts[1];
    let transactedTokens, transactedEther = null;

    /*
    * CONVERTER DEPLOYMENT
    */
    describe('Contract deployment', () => {
        let marketMakerOwner = null;

        it('should have the right owner', async () => {
            marketMakerOwner = await exchange.owner();

            assert.equal(marketMakerOwner, ownerAccount);
        });
    });

    /*
    * CONVERTER FUNDING
    *
    * => WITH TOKENS
    */
    describe('Owner funds the contract with tokens', () => {
        it('should receive approval from owner', async () => {
            await token.approve(exchange.address, tokensFunding, {from: ownerAccount});
            let allowed = await token.allowance(ownerAccount, exchange.address);

            assert.equal(allowed, tokensFunding, 'Funds were approved in the ERC20 token by the owner');
        });

        it('should receive token funding from owner', async () => {
            await exchange.creditTokens(ownerAccount, tokensFunding, {from: ownerAccount});
            let actualReceivedTokens = await token.balanceOf(exchange.address);

            assert.equal(actualReceivedTokens, tokensFunding, 'The Exchange contract received the funds');
        });

        it('should update the owner\'s tokens credit accordingly', async () => {
            let tokensCredit = (await exchange.ownerCredit())[0];

            assert.equal(tokensCredit, tokensFunding);
        });

        it('should reject second token funding', async () => {
            await token.approve(exchange.address, tokensFunding, {from: ownerAccount});
            await exchange.creditTokens(ownerAccount, tokensFunding, {from: ownerAccount}).should.be.rejected();
        });
    });

    /*
    * => WITH ETH
    */
    describe('Owner funds the contract with eth', async () => {
        let initialEthBalance;

        before(async () => {
            initialEthBalance = await web3.eth.getBalance(exchange.address);
        });

        it('should receive eth funding from owner', async () => {
            // Call the Credit function on the Exchange
            await exchange.creditEth({from: ownerAccount, value: ethFunding});

            let currentEthBalance = await web3.eth.getBalance(exchange.address);
            let actualReceivedEth = currentEthBalance.minus(initialEthBalance);

            assert.equal(actualReceivedEth, ethFunding);
        });

        it('should update the eth credit accordingly', async () => {
            let ethCredit = (await exchange.ownerCredit())[1];

            assert.equal(ethCredit, ethFunding);
        });
    });

    describe('Anonymous funds the contract', () => {
        it('should throw when calling creditTokens', async () => {
            let anonTknFunding = toWei(1000);
            await token.approve(exchange.address, anonTknFunding, {from: traderAccount});
            return exchange.creditTokens(traderAccount, anonTknFunding, {from: traderAccount})
                .should.be.rejected();
        });

        it('should throw when calling creditEth', () => {
            return exchange.creditEth({from: traderAccount, value: ethFunding})
                .should.be.rejected();
        });
    });

    /*
    * TRADER BUYS TOKENS
    */
    describe('Trader buys tokens', async () => {
        let txOptions, initialTraderTokenBalance, tokenSupply, ethBalance, buyTx, expectedPurchaseReturn = null;

        before(async () => {
            transactedEther = toWei(1);
            txOptions = {from: traderAccount, value: transactedEther.toNumber()};
            initialTraderTokenBalance = await token.balanceOf(traderAccount);
            tokenSupply = await token.balanceOf(exchange.address);
            ethBalance = await web3.eth.getBalance(exchange.address);
            expectedPurchaseReturn = await exchange.getPurchaseReturn(transactedEther);
        });

        it('should return the pre-calculated purchase exchange rate', async () => {
            let contractTokenBalance = await exchange.getTokenBalance();
            let startPrice = toBigNumber(deployParams.test.converterStartPrice);
            let initialFunding = toBigNumber(tokensFunding);
            let calculatedPurchaseReturn = getPurchaseReturn(
                transactedEther,
                contractTokenBalance,
                startPrice,
                initialFunding
            );
            assert.equal(expectedPurchaseReturn.toNumber(), calculatedPurchaseReturn.toNumber());
        });

        it('should have conversions enabled', async () => {
            let conversionsEnabled = await exchange.conversionsEnabled();
            assert.isTrue(conversionsEnabled);
        });

        // Calling the BUY method on the contract
        it('should make the buy transaction', async () => {
            buyTx = await exchange.buy(traderAccount, expectedPurchaseReturn, txOptions);
            assert.isOk(buyTx);
        });

        it('should emit TokenPurchase event with the right amount of paid ETH', () => {
            truffleAssert.eventEmitted(buyTx, 'TokenPurchase', (ev) => {
                transactedTokens = ev.purchaseReturn;
                return ev.purchaseReturn && ev.sellAmount.toNumber() === transactedEther.toNumber();
            });
        });

        it('should transfer tokens to the buyer', async () => {
            let resultedTraderTokenBalance = await token.balanceOf(traderAccount);
            assert.isAbove(resultedTraderTokenBalance.toNumber(), initialTraderTokenBalance.toNumber());
        });

        it('should increase the price in ETH after the buy transaction', () => {
            return exchange.getPurchaseReturn(transactedEther).should.eventually.be.below(transactedTokens);
        });
    });


    /*
    * TRADER SELLS TOKENS
    */
    describe('Trader sells tokens', () => {
        let txOptions = {from: traderAccount};
        let saleTx, expectedSaleReturn, tokenSupply, ethBalance, initialTraderEthBalance = null;

        // Get the parameters for testing
        before(async () => {
            tokenSupply = await token.balanceOf(exchange.address);
            ethBalance = await web3.eth.getBalance(exchange.address);
            initialTraderEthBalance = await web3.eth.getBalance(traderAccount);
            expectedSaleReturn = await exchange.getSaleReturn(transactedTokens);
        });

        it('should have correct eth balance', async () => {
            let actualContractBalance = (await web3.eth.getBalance(exchange.address)).toNumber();
            let expectedContractBalance = (await exchange.getBalance()).toNumber();
            assert.equal(actualContractBalance, expectedContractBalance);
        });

        it('should return the pre-calculated sale exchange rate', async () => {
            let contractTokenBalance = await exchange.getTokenBalance();
            let startPrice = toBigNumber(deployParams.test.converterStartPrice);
            let initialFunding = toBigNumber(tokensFunding);
            let calculatedSaleReturn = getSaleReturn(
                transactedTokens,
                contractTokenBalance,
                startPrice,
                initialFunding
            );
            assert.equal(expectedSaleReturn.toNumber(), calculatedSaleReturn.toNumber());
        });

        // Calling the SELL method on the contract
        it('should make the sell transaction', async () => {
            await token.approve(exchange.address, transactedTokens, txOptions);
            saleTx = await exchange.sell(traderAccount, transactedTokens, expectedSaleReturn, txOptions);
            assert.isOk(saleTx);
        });

        it('should emit TokenSale event with the right amount of tokens', async () => {
            truffleAssert.eventEmitted(saleTx, 'TokenSale', (ev) => {
                return ev.sellAmount.toNumber() === transactedTokens.toNumber();
            });
        });

        it('should transfer eth to the seller', async () => {
            let actualTraderEthBalance = await web3.eth.getBalance(traderAccount);
            assert.isAbove(actualTraderEthBalance.toNumber(), initialTraderEthBalance.toNumber());
        });

        it('should decrease the price in ETH after the sell transaction', () => {
            return exchange.getSaleReturn(transactedTokens).should.eventually.be.below(expectedSaleReturn);
        });
    });

    /*
    * OWNER WITHDRAWS FUNDS
    */
    describe('Owner withdraws funds from Exchange', () => {
        it('should let the owner withdraw part of his tokens credit', async () => {
            let tokensCredit = (await exchange.ownerCredit())[0];
            return exchange.withdrawTokens(ownerAccount, tokensCredit.minus(toBigNumber(1))).should.be.resolved();
        });

        it('should let the owner withdraw the rest of his tokens credit', async () => {
            return exchange.withdrawTokens(ownerAccount, toBigNumber(1)).should.be.resolved();
        });

        it('should not let the owner withdraw more than his tokens credit', async () => {
            return exchange.withdrawTokens(ownerAccount, toBigNumber(1)).should.be.rejected();
        });

        it('should let the owner withdraw part of his eth credit', async () => {
            let ethCredit = (await exchange.ownerCredit())[1];
            return exchange.withdrawEth(ownerAccount, ethCredit.minus(toBigNumber(1))).should.be.resolved();
        });

        it('should let the owner withdraw the rest of his eth credit', async () => {
            return exchange.withdrawEth(ownerAccount, toBigNumber(1)).should.be.resolved();
        });

        it('should not let the owner withdraw more than his eth credit', async () => {
            return exchange.withdrawEth(ownerAccount, toBigNumber(1)).should.be.rejected();
        });
    });
});
