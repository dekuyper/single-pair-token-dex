const Token = artifacts.require('../contracts/token/mock/ICMToken.sol');
const Exchange = artifacts.require('../contracts/converter/Exchange.sol');
const deployParams = require('../config/deploy_params');

module.exports = (deployer, network) => {
  const ownerAddr = deployParams[network].ownerAddr;

  const deployOptions = {
    from: ownerAddr
  };

  if (typeof deployParams[network].gas !== 'undefined') {
    deployOptions.gas = deployParams[network].gas;
  }

  deployer.deploy(
    Token,
    ownerAddr,
    deployParams[network].tokenTotalSupply,
    deployParams[network].tokenName,
    deployParams[network].tokenSymbol
  )
    .then(() => {
    return deployer.deploy(
      Exchange,
      Token.address,
      deployParams[network].converterStartPrice,
      deployOptions
    );
  });
};
