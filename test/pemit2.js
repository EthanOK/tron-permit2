const wait = require("./helpers/wait");
const pc = require("picocolors");
const ChainID = artifacts.require("./ChainIdExample.sol");
const MockTokens = artifacts.require("./MockTokens.sol");
const MockToken = artifacts.require("./MockToken.sol");
const Permit2Tron = artifacts.require("./Permit2Tron.sol");
// The following tests require TronBox >= 4.1.x
// and TronBox Runtime Environment (https://hub.docker.com/r/tronbox/tre)

contract("Permit2 Tron", function (accounts) {
  let mockTokensInstance;
  let mockToken1Instance;
  let mockToken2Instance;
  let permit2Instance;
  let chainIdInstance;
  let tokens;

  const owner = tronWeb.address.fromHex(accounts[0]);
  const spender = tronWeb.address.fromHex(accounts[1]);
  const receiver = tronWeb.address.fromHex(accounts[2]);

  before(async function () {
    mockTokensInstance = await MockTokens.deployed();
    tokens = await mockTokensInstance.getDeployedTokens();
    mockToken1Instance = await MockToken.at(tokens[0]);
    mockToken2Instance = await MockToken.at(tokens[1]);
    permit2Instance = await Permit2Tron.deployed();
    chainIdInstance = await ChainID.deployed();
  });

  it("should tokens approve to permit2", async function () {
    await mockToken1Instance.approve(permit2Instance.address, BigInt(1e18), {
      from: owner,
    });
    await mockToken2Instance.approve(permit2Instance.address, BigInt(1e18), {
      from: owner,
    });
  });

  let value_permit;
  let signature;

  it("should signTypedData and verify it", async function () {
    const permitAmount = 1000 * 1e6;

    // get chain id from chainIdExample contract
    const [chainIdBytes32, chainId] = await chainIdInstance.getChainId();

    const permit2Address = tronWeb.address.fromHex(permit2Instance.address);
    const token1Address = tronWeb.address.fromHex(mockToken1Instance.address);
    const token2Address = tronWeb.address.fromHex(mockToken2Instance.address);

    const domain = {
      name: "Permit2",
      chainId: tronWeb.fromDecimal(chainId),
      verifyingContract: permit2Address,
    };

    // The named list of all type definitions
    const types = {
      PermitBatch: [
        { name: "details", type: "PermitDetails[]" },
        { name: "spender", type: "address" },
        { name: "sigDeadline", type: "uint256" },
      ],
      PermitDetails: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint160" },
        { name: "expiration", type: "uint48" },
        { name: "nonce", type: "uint48" },
      ],
    };

    const timestamp = Math.floor(Date.now() / 1000);

    const allowance = await permit2Instance.allowance(
      owner,
      token1Address,
      spender
    );
    const allowance2 = await permit2Instance.allowance(
      owner,
      token2Address,
      spender
    );
    value_permit = {
      details: [
        {
          token: token1Address,
          amount: permitAmount,
          expiration: timestamp + 30 * 24 * 60 * 60,
          nonce: allowance.nonce,
        },
        {
          token: token2Address,
          amount: permitAmount,
          expiration: timestamp + 30 * 24 * 60 * 60,
          nonce: BigInt(allowance2.nonce),
        },
      ],
      spender: spender,
      sigDeadline: timestamp + 600,
    };

    signature = await tronWeb.trx.signTypedData(domain, types, value_permit);

    const verified = await tronWeb.trx.verifyTypedData(
      domain,
      types,
      value_permit,
      signature,
      owner
    );
    assert.isTrue(verified, "Invalid Signature.");
  });

  it("should permit a single token and transfer it", async function () {
    const permitAmount = 1000 * 1e6;
    const token1Address = tronWeb.address.fromHex(mockToken1Instance.address);
    const token2Address = tronWeb.address.fromHex(mockToken2Instance.address);

    const permitBatch = [
      value_permit.details.map((d) => [
        d.token,
        d.amount,
        d.expiration,
        d.nonce,
      ]),
      value_permit.spender,
      value_permit.sigDeadline,
    ];

    const permitTx = await permit2Instance[
      "permit(address,((address,uint160,uint48,uint48)[],address,uint256),bytes)"
    ](owner, permitBatch, signature);
    await waitForTransactionReceipt(permitTx);
    const permitTxInfo = await tronWeb.trx.getTransactionInfo(permitTx);
    assert.equal(
      permitTxInfo.receipt.result,
      "SUCCESS",
      "Permit transaction was not successful."
    );

    const newAllowance = await permit2Instance.allowance(
      owner,
      token1Address,
      spender
    );

    assert.equal(
      newAllowance.amount,
      permitAmount,
      "Allowance is not the expected amount."
    );

    const transferDetails = [
      [owner, receiver, permitAmount / 100, token1Address],
      [owner, receiver, permitAmount / 100, token2Address],
    ];

    // send the tokens to the spende
    const transferTx = await permit2Instance[
      "transferFrom((address,address,uint160,address)[])"
    ](transferDetails, { from: spender });
    await waitForTransactionReceipt(transferTx);
    const transferTxInfo = await tronWeb.trx.getTransactionInfo(transferTx);
    assert.equal(
      transferTxInfo.receipt.result,
      "SUCCESS",
      "Transfer transaction was not successful."
    );
    const balance = await mockToken1Instance.balanceOf(receiver);
    assert.equal(
      balance,
      permitAmount / 100,
      "Balance is not the expected amount."
    );
  });
});
