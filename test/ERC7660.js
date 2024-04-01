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


  //test contract
  let rewardContract = ""
  let setRewardContractExcluded = await ERCNewToken0.setExcludedTo(ethers.utils.getAddress(rewardContract),true);
  console.log("the setRewardContractExcluded is ",setRewardContractExcluded);
  let setRewardContractFromExcluded = await ERCNewToken0.setExcludedFrom(ethers.utils.getAddress(rewardContract),true);
  console.log("the setRewardContractFromExcluded is ",setRewardContractFromExcluded);

  ////Uniswap Pair and router exclude lock
  let pair = "0x4bd19CF5BC7D1277F8BdB93b89AcE41a7d30c401" //uniswap V3
  let setExcludedVest = await ERCNewToken0.setExcludedTo(ethers.utils.getAddress(pair),true);
   console.log("the setExcludedVest is ",setExcludedVest);

  let  router = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"  //NonfungiblePositionManager
  let setRouterExcludedVest = await ERCNewToken0.setExcludedTo(ethers.utils.getAddress(router),true);
  console.log("the router setExcludedVest is ",setRouterExcludedVest);
  return;



}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
