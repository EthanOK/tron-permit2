const ChainID = artifacts.require("./ChainIdExample.sol");
const Permit2Tron = artifacts.require("./Permit2Tron.sol");

module.exports = async function (deployer, network) {
  await deployer.deploy(ChainID);
  await deployer.deploy(Permit2Tron);

  if (network === "development" && typeof web3 === "undefined") {
    // This code block is executed only when the network is 'development' as defined in tronbox-config.js

    const chainIdInstance = await ChainID.deployed();
    const permit2Instance = await Permit2Tron.deployed();

    const DOMAIN_SEPARATOR = await permit2Instance.DOMAIN_SEPARATOR();

    console.log("Peemit2 DOMAIN_SEPARATOR:", DOMAIN_SEPARATOR);

    const [chainIdBytes32, chainId] = await chainIdInstance.getChainId();
    console.log("Chain ID:", chainId, "Chain ID Bytes32:", chainIdBytes32);
    const [blockNumber, timestamp] = await chainIdInstance.getBlockNumber();
    console.log("Block Number:", blockNumber, "Timestamp:", timestamp);
  }
};
