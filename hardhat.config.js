require('@nomiclabs/hardhat-waffle');
require("@openzeppelin/hardhat-upgrades");
//require("@nomicfoundation/hardhat-toolbox")
require('@nomiclabs/hardhat-etherscan');
//require('@nomiclabs/hardhat-verify');
require('hardhat-contract-sizer');
require('@typechain/hardhat');

const {
  // BSC_URL,
  // BSC_DEPLOY_KEY,
  // BSCSCAN_API_KEY,
  // POLYGONSCAN_API_KEY,
  // SNOWTRACE_API_KEY,
  // ARBISCAN_API_KEY,
  // ETHERSCAN_API_KEY,
  BSC_TESTNET_URL,
  BSC_TESTNET_DEPLOY_KEY,
  BSC_TESTNET_USER0_KEY,
  BSC_MAINNET_URL,
  BSC_MAINNET_DEPLOY_KEY,
  BASE_MAINNET_URL,
  ARBITRUM_MAINNET_URL,
  opBNB_MAINNET_URL,
  opBNB_MAINNET_DEPLOY_KEY,
  BASE_MAINNET_DEPLOY_KEY,
  ARBITRUM_TESTNET_DEPLOY_KEY,
  ARBITRUM_MAINNET_DEPLOY_KEY,
  ARBITRUM_ONE_APIKEY,
  ETH_MAINNET_APIKEY,
  ARBITRUM_MAINNET_TEST_DEPLOY_KEY,
  ETH_MAINNET_URL,
  ETH_MAINNET_DEPLOY_KEY,
  ETH_MAINNET_PROXY_ADMIN_KEY,
  ETH_TESTNET_URL,
  ETH_TESTNET_DEPLOY_KEY,
  ETH_TESTNET_PROXY_ADMIN_KEY,
  BlastSepolia_TESTNET_URL,
  BlastSepolia_TESTNET_DEPLOY_KEY,
  BlastSepolia_TESTNET_PROXY_ADMIN_KEY,
  Blast_MAINNET_URL,
  Blast_MAINNET_DEPLOY_KEY,
  Blast_MAINNET_PROXY_ADMIN_KEY
  // ARBITRUM_TESTNET_URL,
  // ARBITRUM_DEPLOY_KEY,
  //ARBITRUM_URL,
  //AVAX_DEPLOY_KEY,
  //AVAX_URL,
  // POLYGON_DEPLOY_KEY,
  // POLYGON_URL,
  // MAINNET_URL,
  // MAINNET_DEPLOY_KEY
} = require("./env.json")
//} = require("/etc/encrypt/env_blastxdx.json")
 //} = require("/etc/encrypt/env_l7dex.json")


// console.log(ARBITRUM_TESTNET_URL)
// console.log(ARBITRUM_TESTNET_DEPLOY_KEY)
// console.log(ETH_MAINNET_URL);
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.info(account.address);
  }
});

const accounts = [
  'e0e22b09a04f1bf5c036f91d7c1e054a84a34f6e6506ee1079f52aa5b661e0ab',
  'cfb5aaa649aa05aa7be907072fb71cd9f38477231cfc825ba9e4c815e103dd83',
  'db239390c1350ed9da45ae213afb9a4bca039c750394354d56290bb83c97944b',
  '9b93ee2b88ceb20a18fecee8487d13690c4b56058c69c60cf045aa718b05b2de',
  '1c44e9f848dc61f384ca8f4d226e43076c5440b8795fae07afda8b95d16d5d2b',
  '89b2dd5a914657864dcf9d26b0c5558bf0c82f57f90f603ed2735ccc0e6f4697',
  '65fbbbb9504fb98bb45ad4970f0f2f4e71490cf8406b35a9926308aa9942b041',
  '0dbadd36e9a382a94c85e6ada7d9d05a51ad8339861d36d14b57fb8d0d484119',
  '8167ea53e2fc2f202dee3e3a1745819bbce1a1b25187b16837e597c3715a81f0',
  '306c527948fabe114b3f84bc9fc88e74ae3b740b844395a841d5130503175acc',
];

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: 'https://rpc.ankr.com/arbitrum',
        accounts: accounts,
        blockNumber: 45976671,
      },
      allowUnlimitedContractSize: true,
    },
    BSCMainNetPre: {
      url: BSC_MAINNET_URL,
      chainId: 56,
      accounts: [BSC_MAINNET_DEPLOY_KEY]
    },
    BSCMainNet: {
      url: BSC_MAINNET_URL,
      chainId: 56,
      accounts: [BSC_MAINNET_DEPLOY_KEY]
    },
    // BSCTestnet: {
    //   url: BSC_TESTNET_URL,
    //   chainId: 97,
    //   accounts: [BSC_TESTNET_DEPLOY_KEY,BSC_TESTNET_USER0_KEY]
    // },
    arbitrumTestnet: {
      url: 'https://goerli-rollup.arbitrum.io/rpc',
      chainId: 421613,
      accounts: [ARBITRUM_TESTNET_DEPLOY_KEY],
    }, //
    arbitrumTestnet1: {
      url: 'https://endpoints.omniatech.io/v1/arbitrum/goerli/public',
      chainId: 421613,
      accounts: [ARBITRUM_TESTNET_DEPLOY_KEY],
    },
    arbitrumMainNet: {
      url: ARBITRUM_MAINNET_URL,
      chainId: 42161,
      accounts: [ARBITRUM_MAINNET_DEPLOY_KEY],
    },
    arbitrumMainNetTest: {
      url: ARBITRUM_MAINNET_URL,
      chainId: 42161,
      accounts: [ARBITRUM_MAINNET_TEST_DEPLOY_KEY],
    },
    // BaseMainNet: {
    //   url: BASE_MAINNET_URL,
    //   chainId: 8453,
    //   accounts: [BASE_MAINNET_DEPLOY_KEY],
    // },
    // opBNBMainNet: {
    //   url: opBNB_MAINNET_URL,
    //   chainId: 204,
    //   accounts: [opBNB_MAINNET_DEPLOY_KEY],
    // },
    ETHMainNet: {
      url: ETH_MAINNET_URL,
      chainId: 1,
      accounts: [ETH_MAINNET_DEPLOY_KEY,ETH_MAINNET_PROXY_ADMIN_KEY],
    },
    ETHTestNet: {
      url: ETH_TESTNET_URL,
      chainId: 5,
      accounts: [ETH_TESTNET_DEPLOY_KEY,ETH_TESTNET_PROXY_ADMIN_KEY],
    },
    // BlastMainPre: {
    //   url: Blast_MAINNET_URL,
    //   chainId: 81457,
    //   accounts: [Blast_MAINNET_DEPLOY_KEY,Blast_MAINNET_PROXY_ADMIN_KEY],
    // },
    // BlastMain: {
    //   url: Blast_MAINNET_URL,
    //   chainId: 81457,
    //   accounts: [Blast_MAINNET_DEPLOY_KEY,Blast_MAINNET_PROXY_ADMIN_KEY],
    // },
    BlastSepolia: {
      url: BlastSepolia_TESTNET_URL,
      chainId: 168587773,
      accounts: [BlastSepolia_TESTNET_DEPLOY_KEY,BlastSepolia_TESTNET_PROXY_ADMIN_KEY],
    },
    // avax: {
    //   url: AVAX_URL,
    //   gasPrice: 200000000000,
    //   chainId: 43114,
    //   accounts: [AVAX_DEPLOY_KEY],
    // },
    //   polygon: {
    //     url: POLYGON_URL,
    //     gasPrice: 100000000000,
    //     chainId: 137,
    //     accounts: [POLYGON_DEPLOY_KEY]
    //   },
    //   mainnet: {
    //     url: MAINNET_URL,
    //     gasPrice: 50000000000,
    //     accounts: [MAINNET_DEPLOY_KEY]
    //   }
    // },
    //   etherscan: {
    //     apiKey: {
    //       mainnet: MAINNET_DEPLOY_KEY,
    //       arbitrumOne: ARBISCAN_API_KEY,
    //       avalanche: SNOWTRACE_API_KEY,
    //       bsc: BSCSCAN_API_KEY,
    //       polygon: POLYGONSCAN_API_KEY,
    //     }
  },
  etherscan: {
    apiKey: {
      mainnet: "R79SP8719P8CCD5PSR7HS19K2DF163E5J5",
    },
  },
  //version: '0.8.17',
  solidity: {
    compilers: [    //可指定多个sol版本
      {version: "0.8.17"},
      {version: "0.8.20"}
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
};
