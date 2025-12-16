const MockTokens = artifacts.require("./MockTokens.sol");

module.exports = async function (deployer, network) {
  const owner = deployer.options.options.from;
  console.log("Deployer:", owner);

  if (network === "development" && typeof web3 === "undefined") {
    // This code block is executed only when the network is 'development' as defined in tronbox-config.js
    await deployer.deploy(MockTokens, owner);
    const mockTokensInstance = await MockTokens.deployed();
    await mockTokensInstance.deployMockToken(5, owner);
    const tokens = await mockTokensInstance.getDeployedTokens();
    console.log("Deployed Mock Tokens:", tokens);
  }
};
