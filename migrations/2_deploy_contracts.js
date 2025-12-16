const ConvertLib = artifacts.require("./ConvertLib.sol");
const MetaCoin = artifacts.require("./MetaCoin.sol");
const RMBToken = artifacts.require("./RMBToken.sol");
const MockTokens = artifacts.require("./MockTokens.sol");

module.exports = async function (deployer, network) {
  if (network == "nile") {
    console.log("Deploying RMBToken on Nile network");

    await deployer.deploy(RMBToken);
    const rmbTokenInstance = await RMBToken.deployed();

    const owner = await rmbTokenInstance.owner();
    const balance = await rmbTokenInstance.balanceOf(owner);
    const symbol = await rmbTokenInstance.symbol();

    console.log(
      `${tronWeb.address.fromHex(owner)} has ${tronWeb.fromSun(
        balance
      )} ${symbol}`
    );

    return;
  }
  await deployer.deploy(ConvertLib);
  await deployer.link(ConvertLib, MetaCoin);
  await deployer.deploy(MetaCoin, 10000);
  await deployer.deploy(RMBToken);
  await deployer.deploy(MockTokens);

  if (network === "development" && typeof web3 === "undefined") {
    // This code block is executed only when the network is 'development' as defined in tronbox-config.js
    const metaCoinInstance = await MetaCoin.deployed();
    const rmbTokenInstance = await RMBToken.deployed();

    const {
      block_header: {
        raw_data: { timestamp },
      },
    } = await tronWeb.trx.getCurrentBlock();
    const unlockTime = Math.round(timestamp / 1000) + 6;
    await metaCoinInstance.lock(unlockTime, {
      callValue: 1,
      feeLimit: 5000000,
    });
    const owner = await rmbTokenInstance.owner();
    const balance = await rmbTokenInstance.balanceOf(owner);
    const symbol = await rmbTokenInstance.symbol();

    console.log(
      `${tronWeb.address.fromHex(owner)} has ${tronWeb.fromSun(
        balance
      )} ${symbol}`
    );

    const mockTokensInstance = await MockTokens.deployed();
    await mockTokensInstance.deployMockToken(5, owner);
  }
};
