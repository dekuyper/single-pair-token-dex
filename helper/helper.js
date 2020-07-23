const BigNumber = require('bignumber.js');

module.exports = () => {

  let scale = toBigNumber(10).pow(18);

  function toBigNumber(value) {
    if (value instanceof BigNumber) {
      return value;
    }

    return new BigNumber(value);
  }

  function getPurchaseReturn(sellAmount, tokenBalance, startPrice, initialFunding) {
    if (sellAmount.equals(0)) {
      return sellAmount;
    }

    let numerator = sellAmount.mul(tokenBalance);
    let contractValue = startPrice.mul(initialFunding).div(scale);
    let denominator = contractValue.plus(sellAmount);

    return numerator.div(denominator);
  }

  function getSaleReturn(sellAmount, tokenBalance, startPrice, initialFunding) {
      if (sellAmount.equals(0)) {
          return sellAmount;
      }

      let contractValue = startPrice.mul(initialFunding).div(scale);
      let numerator = sellAmount.mul(contractValue);
      let denominator = tokenBalance.plus(sellAmount);

      return numerator.div(denominator);
  }

  function toWei(etherQty) {
    return toBigNumber(web3.toWei(etherQty, 'ether'));
  }

  return {
    toBigNumber,
    toWei,
    getSaleReturn,
    getPurchaseReturn
  }

};
