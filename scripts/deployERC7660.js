const {
  deployContract,
  sendTxn,
  writeTmpAddresses,
  readTmpAddresses,
  callWithRetries,
  contractAt,
} = require("../../shared/helpers");
const {
  expandDecimals,
  print,
  getBlockTime,
  reportGasUsed,
} = require("../../../test/shared/utilities");
const {
  arbitrumTestnet,
  ARBITRUM_TESTNET_DEPLOY_KEY,
} = require("../../../env.json");
const { BigNumber } = require("ethers");
async function main() {
  const provider = new ethers.providers.JsonRpcProvider(arbitrumTestnet);
  const signer = new ethers.Wallet(ARBITRUM_TESTNET_DEPLOY_KEY).connect(
    provider
  );

  let addresses = readTmpAddresses();

  let name = "Test7660";
  let symbol = "T7660";

  let ERC7660 = await deployContract("ERC7660", [name,symbol]);
  console.log("ERC7660", ERC7660.address);
  addresses.ERC7660 = ERC7660.address;

  writeTmpAddresses(addresses);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
