const Migrations = artifacts.require('../contracts/migrations/Migrations.sol');
const deployParams = require('../config/deploy_params');

module.exports = function (deployer, network, accounts) {
  console.log('[Network: ]', network);
  console.log('[Accounts:]', accounts);

  if (typeof deployParams[network] === 'undefined') {
    console.error(`Unknown network ${network}`);
    process.exit(1);
  }

  const ownerAddr = deployParams[network].ownerAddr;
  const traderAddr = deployParams[network].traderAddr;

  console.log(
    '-----------------------------------------------------------------------'
  );
  console.log('   Will deploy using these values:');
  console.log(
    '-----------------------------------------------------------------------'
  );
  console.log('           OWNER ADDRESS:', ownerAddr);
  console.log('           TRADER1 ADDRESS:', traderAddr);
  console.log(
    '-----------------------------------------------------------------------'
  );
  const deployOpts = {
    from: ownerAddr,
  };
  if (typeof deployParams[network].gas !== 'undefined') {
    deployOpts.gas = deployParams[network].gas;
  }

  deployer.deploy(Migrations, deployOpts);
};
