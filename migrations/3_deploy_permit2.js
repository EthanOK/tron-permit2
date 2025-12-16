const ChainID = artifacts.require("./ChainIdExample.sol");
const Permit2Tron = artifacts.require("./Permit2Tron.sol");

module.exports = async function (deployer, network) {
  if (network === "development" && typeof web3 === "undefined") {
    await deployer.deploy(ChainID);
    await deployer.deploy(Permit2Tron);

    const chainIdInstance = await ChainID.deployed();
    const permit2Instance = await Permit2Tron.deployed();
    console.log("Permit2 Address:", permit2Instance.address);

    const [chainIdBytes32, chainId] = await chainIdInstance.getChainId();
    console.log("Chain ID:", chainId);
    const [blockNumber, timestamp] = await chainIdInstance.getBlockNumber();
    console.log("Block Number:", blockNumber, "Timestamp:", timestamp);
  }
};
