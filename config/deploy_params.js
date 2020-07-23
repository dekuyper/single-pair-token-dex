const ownerAddrTest = '0x29c5927350a70e3df7d1d07affebe33a3cfe5e04';
const traderAddrTest = '0x5703741518b7f5c92a7cc7ce66a00b74f6b494e8';

const ownerAddrInfura = '0xfdec09fd0b31c37a896e953ba1eeadd8e96d9183';
const walletAddrInfura = '0x656f5cdbca35c992c42b156b372e7d12fb7ccdc5';

const tokenName = 'IceCream Token';
const tokenSymbol = 'ICM';
const tokenTotalSupply = 10000000000000000000000000;
const converterStartPrice = 70580000000000;

module.exports = {
  'development': {
    converterStartPrice,
    tokenTotalSupply,
    tokenName,
    tokenSymbol,
    'ownerAddr': ownerAddrTest,
    'traderAddr': traderAddrTest,
    'gas': 1000000000,
  },
  'test': {
    converterStartPrice,
    tokenTotalSupply,
    tokenName,
    tokenSymbol,
    'ownerAddr': ownerAddrTest,
    'traderAddr': traderAddrTest,
    'gas': 1000000000,
  },
  'rinkeby': {
    converterStartPrice,
    tokenTotalSupply,
    tokenName,
    tokenSymbol,
    'ownerAddr': ownerAddrInfura,
    'traderAddr': walletAddrInfura,
    'gas': 4700000,
  },
  'kovan': {
    converterStartPrice,
    tokenTotalSupply,
    tokenName,
    tokenSymbol,
    'ownerAddr': ownerAddrInfura,
    'traderAddr': walletAddrInfura,
    'gas': 4700000,
  },
  'coverage': {
    converterStartPrice,
    tokenTotalSupply,
    tokenName,
    tokenSymbol,
    'ownerAddr': ownerAddrTest,
    'traderAddr': traderAddrTest,
    'gas': 1000000000,
  },
};
