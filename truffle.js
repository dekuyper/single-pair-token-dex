// adds support for import statements (zeppelin-solidity helpers)
require('babel-register')({
  ignore: /node_modules\/(?!zeppelin-solidity)/,
});
require('babel-polyfill');

const HDWalletProvider = require('truffle-hdwallet-provider');
const mnemonic = 'indicate winter already purpose climb shadow raven belt bench trend spider romance';

const providerWithMnemonic = (mnemonic, rpcEndpoint) =>
  new HDWalletProvider(mnemonic, rpcEndpoint);

const infuraProvider = (mnemonic, network) => providerWithMnemonic(
  mnemonic || '',
  `https://${network}.infura.io/${process.env.INFURA_API_KEY}`
);

// NB it's critical not to instantiate HDWalletProvider
// during the solidity coverage tests since that will break the test
// @see https://github.com/OpenZeppelin/zeppelin-solidity/pull/218#issuecomment-302952402
const kovanProvider = process.env.SOLIDITY_COVERAGE
  ? undefined
  : infuraProvider(process.env.MNEMONIC || mnemonic, 'kovan');

const rinkebyProvider = process.env.SOLIDITY_COVERAGE
  ? undefined
  : infuraProvider(process.env.MNEMONIC || mnemonic, 'rinkeby');

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    testrpc: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    coverage: {
      host: 'localhost',
      network_id: '*',
      port: 8555,
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    kovan: {
      provider: kovanProvider,
      network_id: '*',
      gas: 3000000,
    },
    rinkeby: {
      provider: rinkebyProvider,
      network_id: '*',
      gas: 4000000,
    },
  },
};
