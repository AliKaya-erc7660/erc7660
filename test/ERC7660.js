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
const {ethers} = require("hardhat");
async function main() {
  const provider = new ethers.providers.JsonRpcProvider(arbitrumTestnet);
  const signer = new ethers.Wallet(ARBITRUM_TESTNET_DEPLOY_KEY).connect(
    provider
  );



  let addresses = readTmpAddresses();


  let ERC7660 = await contractAt(
      "ERC7660",
      ethers.utils.getAddress(addresses.ERC7660),
      signer
  );



  ////Transfer to user
  let user1 = "0x702Be18040aA2a9b1af9219941469f1a435854fC"
  let transferTx = await  ERC7660.transfer(ethers.utils.getAddress(user1),expandDecimals(100_000,18));
  console.log("the transfer tx is",transferTx);


  //pair  && router contract
  let pairContract = "0x4bd19CF5BC7D1277F8BdB93b89AcE41a7d30c401"//uniswap V3
  let addPairTx = await ERC7660.addPair(ethers.utils.getAddress(pairContract),true);
  console.log("the addPairTx is ",addPairTx);
  let routerContract = ""
  let addRouterTx = await ERC7660.addRouter(ethers.utils.getAddress(routerContract),true);
  console.log("the addRouter is ",addRouterTx);

  return;



}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
