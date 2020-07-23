# **MARKET MAKER**

# Introduction:

    The MarketMaker is a converter contract that allows arbitrage bots and traders to convert the token to ETH and viceversa.

## Token Price

    It's expressed in wei, for example if the price is 0.1 ETH it's expressed as `100000000000000000` wei.
    The token's price is set on deployment and it will increase with every token buy and decrease when the token is sold.
    The formula on which the price is set will adapt the price according to the size of the transaction (order).
    For example one buy order of 1000 Tokens will cost the same ETH as 1000 orders of 1 token. 

# Functional flows:
## Owner
1. Deploys the Token
2. Deploys the MarketMaker contract passing it the token's address
    - By default the `buyTokens` and `sellTokens` methods are disabled unless the contract is funded

3. Funding the MarketMaker contract
    - Calls the `approve` method on the Token
    - Calls the `fund` method on the MarketMaker

## Trader
1. Buying tokens by calling `buyTokens` on MarketMaker
2. Selling tokens
- Calls `approve` on the Token
- Calls the `sellTokens` method on MarketMaker

## Whitepaper
[Market Maker Whitepaper.pdf](https://drive.google.com/open?id=1Cwslg9FqS1ei5_DzKn89UPUYQ67cPL9e)

## Development workflow

In order to run the tests automatically on file changes run the following npm task:

```
npm run watch test
```
