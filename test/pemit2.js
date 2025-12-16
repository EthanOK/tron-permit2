const wait = require("./helpers/wait");
const pc = require("picocolors");
const ChainID = artifacts.require("./ChainIdExample.sol");
const RMBToken = artifacts.require("./RMBToken.sol");
const Permit2Tron = artifacts.require("./Permit2Tron.sol");
// The following tests require TronBox >= 4.1.x
// and TronBox Runtime Environment (https://hub.docker.com/r/tronbox/tre)

contract("Permit2 Tron", function (accounts) {
  let rmbTokenInstance;
  let permit2Instance;
  let chainIdInstance;

  before(async function () {
    rmbTokenInstance = await RMBToken.deployed();
    permit2Instance = await Permit2Tron.deployed();
    chainIdInstance = await ChainID.deployed();
    console.log(
      "RMBToken Address:",
      tronWeb.address.fromHex(rmbTokenInstance.address)
    );
    console.log(
      "Permit2Tron Address:",
      tronWeb.address.fromHex(permit2Instance.address)
    );
  });

  it("should verify that the allowance is 1e18", async function () {
    const owner = accounts[0];
    const spender = permit2Instance.address;

    await rmbTokenInstance.approve(spender, BigInt(1e18), {
      from: owner,
    });

    const allowance = await rmbTokenInstance.allowance(owner, spender);
    assert.equal(allowance, 1e18, "Allowance is not 1e18.");
  });

  it("should permit a single token and transfer it", async function () {
    const owner = tronWeb.address.fromHex(accounts[0]);
    const spender = tronWeb.address.fromHex(accounts[1]);
    const receiver = tronWeb.address.fromHex(accounts[2]);

    const permitAmount = 1000 * 1e6;

    // get chain id from chainIdExample contract
    const [chainIdBytes32, chainId] = await chainIdInstance.getChainId();

    const permit2Address = tronWeb.address.fromHex(permit2Instance.address);
    const tokenAddress = tronWeb.address.fromHex(rmbTokenInstance.address);

    const domain = {
      name: "Permit2",
      chainId: tronWeb.fromDecimal(chainId),
      verifyingContract: permit2Address,
    };

    // The named list of all type definitions
    const types = {
      PermitSingle: [
        { name: "details", type: "PermitDetails" },
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
      tokenAddress,
      spender
    );

    const value_permit = {
      details: {
        token: tokenAddress,
        amount: permitAmount,
        expiration: timestamp + 30 * 24 * 60 * 60,
        nonce: allowance.nonce,
      },
      spender: spender,
      sigDeadline: timestamp + 600,
    };

    const signature = await tronWeb.trx.signTypedData(
      domain,
      types,
      value_permit
    );

    const permitSingle = [
      [
        value_permit.details.token,
        value_permit.details.amount,
        value_permit.details.expiration,
        value_permit.details.nonce,
      ],
      value_permit.spender,
      value_permit.sigDeadline,
    ];

    const permitTx = await permit2Instance.permitSingle(
      owner,
      permitSingle,
      signature
    );
    await waitForTransactionReceipt(permitTx);
    const permitTxInfo = await tronWeb.trx.getTransactionInfo(permitTx);
    assert.equal(
      permitTxInfo.receipt.result,
      "SUCCESS",
      "Permit transaction was not successful."
    );

    const newAllowance = await permit2Instance.allowance(
      owner,
      tokenAddress,
      spender
    );

    assert.equal(
      newAllowance.amount,
      permitAmount,
      "Allowance is not the expected amount."
    );

    // send the tokens to the spender

    const transferTx = await permit2Instance.transferFrom(
      owner,
      receiver,
      permitAmount,
      tokenAddress,
      { from: spender }
    );
    await waitForTransactionReceipt(transferTx);
    const transferTxInfo = await tronWeb.trx.getTransactionInfo(transferTx);
    console.log("Transfer Tx Info:", transferTxInfo);
    assert.equal(
      transferTxInfo.receipt.result,
      "SUCCESS",
      "Transfer transaction was not successful."
    );
  });
});
