import { ethers } from 'ethers';
// import Moralis from 'moralis';

// Create a default provider
const provider = new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com');

// WETH ABI for wrapping/unwrapping native tokens
export const WRAPPED_TOKEN_ABI = [
  'function deposit() external payable',
  'function withdraw(uint256) external',
  'function approve(address spender, uint256 amount) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function balanceOf(address owner) public view returns (uint256)',
  'function decimals() public view returns (uint8)',
];

// Token configuration with decimals
export const TOKEN_INFO = {
  // Ethereum Mainnet
  1: {
    ETH: { 
      address: 'NATIVE', 
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
      logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png'
    },
    WETH: { 
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 
      decimals: 18,
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
    },
    USDT: { 
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', 
      decimals: 6,
      name: 'Tether USD',
      symbol: 'USDT',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png'
    },
    USDC: { 
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 
      decimals: 6,
      name: 'USD Coin',
      symbol: 'USDC',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png'
    },
    DAI: { 
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', 
      decimals: 18,
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png'
    },
    WBTC: {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      decimals: 8,
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png'
    },
    SHIB: { 
      address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE', 
      decimals: 18,
      name: 'Shiba Inu',
      symbol: 'SHIB',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE/logo.png'
    },
    UNI: { 
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', 
      decimals: 18,
      name: 'Uniswap',
      symbol: 'UNI',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png'
    },
    LINK: { 
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', 
      decimals: 18,
      name: 'Chainlink',
      symbol: 'LINK',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png'
    },
    MATIC: { 
      address: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', 
      decimals: 18,
      name: 'Polygon',
      symbol: 'MATIC',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0/logo.png'
    },
    AAVE: { 
      address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', 
      decimals: 18,
      name: 'Aave',
      symbol: 'AAVE',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png'
    },
    MKR: {
      address: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      decimals: 18,
      name: 'Maker',
      symbol: 'MKR',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2/logo.png'
    },
    SUSHI: {
      address: '0x6B3595068778DD592e39A122f4f5a5cF09C90fE2',
      decimals: 18,
      name: 'SushiSwap',
      symbol: 'SUSHI',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x6B3595068778DD592e39A122f4f5a5cF09C90fE2/logo.png'
    },
    CRV: {
      address: '0xD533a949740bb3306d119CC777fa900bA034cd52',
      decimals: 18,
      name: 'Curve DAO Token',
      symbol: 'CRV',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png'
    },
    YFI: {
      address: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e',
      decimals: 18,
      name: 'yearn.finance',
      symbol: 'YFI',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e/logo.png'
    },
    SNX: {
      address: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
      decimals: 18,
      name: 'Synthetix Network Token',
      symbol: 'SNX',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F/logo.png'
    },
    COMP: {
      address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
      decimals: 18,
      name: 'Compound',
      symbol: 'COMP',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xc00e94Cb662C3520282E6f5717214004A7f26888/logo.png'
    },
    BAT: {
      address: '0x0D8775F648430679A709E98d2b0Cb6250d2887EF',
      decimals: 18,
      name: 'Basic Attention Token',
      symbol: 'BAT',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x0D8775F648430679A709E98d2b0Cb6250d2887EF/logo.png'
    },
    MANA: {
      address: '0x0F5D2fB29fb7d3CFeE444a200298f468908cC942',
      decimals: 18,
      name: 'Decentraland',
      symbol: 'MANA',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x0F5D2fB29fb7d3CFeE444a200298f468908cC942/logo.png'
    },
    GRT: {
      address: '0xc944E90C64B2c07662A292be6244BDf05Cda44a7',
      decimals: 18,
      name: 'The Graph',
      symbol: 'GRT',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xc944E90C64B2c07662A292be6244BDf05Cda44a7/logo.png'
    },
    FTM: {
      address: '0x4E15361FD6b4BB609Fa63C81A2be19d873717870',
      decimals: 18,
      name: 'Fantom',
      symbol: 'FTM',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0x4E15361FD6b4BB609Fa63C81A2be19d873717870/logo.png'
    },
    CRO: { 
      address: '0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b', 
      decimals: 8,
      name: 'Cronos',
      symbol: 'CRO',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/ethereum/assets/0xA0b73E1Ff0B80914AB6fe0444E65848C4C34450b/logo.png'
    }
  },

  // BSC
  56: {
    BNB: { 
      address: 'NATIVE', 
      decimals: 18,
      name: 'Binance Coin',
      symbol: 'BNB',
      logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png'
    },
    WBNB: { 
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', 
      decimals: 18,
      name: 'Wrapped BNB',
      symbol: 'WBNB',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c/logo.png'
    },
    BUSD: { 
      address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', 
      decimals: 18,
      name: 'BNB pegged BUSD',
      symbol: 'BUSD',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56/logo.png'
    },
    USDT: { 
      address: '0x55d398326f99059fF775485246999027B3197955', 
      decimals: 18,
      name: 'Tether USD',
      symbol: 'USDT',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x55d398326f99059fF775485246999027B3197955/logo.png'
    },
    CAKE: {
      address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
      decimals: 18,
      name: 'PancakeSwap Token',
      symbol: 'CAKE',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82/logo.png'
    },
    BTCB: {
      address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
      decimals: 18,
      name: 'BNB pegged BTCB Token',
      symbol: 'BTCB',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c/logo.png'
    },
    ETH: {
      address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
      decimals: 18,
      name: 'BNB pegged Ethereum',
      symbol: 'ETH',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x2170Ed0880ac9A755fd29B2688956BD959F933F8/logo.png'
    },
    XRP: {
      address: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE',
      decimals: 18,
      name: 'BNB pegged XRP Token',
      symbol: 'XRP',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE/logo.png'
    },
    ADA: {
      address: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47',
      decimals: 18,
      name: 'BNB pegged Cardano Token',
      symbol: 'ADA',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47/logo.png'
    },
    DOT: {
      address: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402',
      decimals: 18,
      name: 'BNB pegged Polkadot Token',
      symbol: 'DOT',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402/logo.png'
    },
    LINK: {
      address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD',
      decimals: 18,
      name: 'BNB pegged ChainLink',
      symbol: 'LINK',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD/logo.png'
    },
    LTC: {
      address: '0x4338665CBB7B2485A8855A139b75D5e34AB0DB94',
      decimals: 18,
      name: 'BNB pegged Litecoin Token',
      symbol: 'LTC',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x4338665CBB7B2485A8855A139b75D5e34AB0DB94/logo.png'
    },
    BCH: {
      address: '0x8fF795a6F4D97E7887C79beA79aba5cc76444aDf',
      decimals: 18,
      name: 'BNB pegged Bitcoin Cash Token',
      symbol: 'BCH',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x8fF795a6F4D97E7887C79beA79aba5cc76444aDf/logo.png'
    },
    UNI: {
      address: '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1',
      decimals: 18,
      name: 'BNB pegged Uniswap',
      symbol: 'UNI',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0xBf5140A22578168FD562DCcF235E5D43A02ce9B1/logo.png'
    },
    DAI: {
      address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
      decimals: 18,
      name: 'BNB pegged Dai Token',
      symbol: 'DAI',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3/logo.png'
    },
    ATOM: {
      address: '0x0Eb3a705fc54725037CC9e008bDede697f62F335',
      decimals: 18,
      name: 'BNB pegged Cosmos Token',
      symbol: 'ATOM',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x0Eb3a705fc54725037CC9e008bDede697f62F335/logo.png'
    },
    XVS: {
      address: '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63',
      decimals: 18,
      name: 'Venus',
      symbol: 'XVS',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63/logo.png'
    },
    ALPHA: {
      address: '0xa1faa113cbE53436Df28FF0aEe54275c13B40975',
      decimals: 18,
      name: 'Alpha Finance',
      symbol: 'ALPHA',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0xa1faa113cbE53436Df28FF0aEe54275c13B40975/logo.png'
    },
    INJ: {
      address: '0xa2B726B1145A4773F68593CF171187d8EBe4d495',
      decimals: 18,
      name: 'Injective',
      symbol: 'INJ',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0xa2B726B1145A4773F68593CF171187d8EBe4d495/logo.png'
    },
    TWT: {
      address: '0x4B0F1812e5Df2A09796481Ff14017e6005508003',
      decimals: 18,
      name: 'Trust Wallet',
      symbol: 'TWT',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x4B0F1812e5Df2A09796481Ff14017e6005508003/logo.png'
    },
    EOS: {
      address: '0x56b6fB708fC5732DEC1Afc8D8556423A2EDcCbD6',
      decimals: 18,
      name: 'BNB pegged EOS Token',
      symbol: 'EOS',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x56b6fB708fC5732DEC1Afc8D8556423A2EDcCbD6/logo.png'
    },
    BAND: {
      address: '0xAD6cAEb32CD2c308980a548bD0Bc5AA4306c6c18',
      decimals: 18,
      name: 'BNB pegged Band Protocol Token',
      symbol: 'BAND',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0xAD6cAEb32CD2c308980a548bD0Bc5AA4306c6c18/logo.png'
    },
    REEF: {
      address: '0xF21768cCBC73Ea5B6fd3C687208a7c2def2d966e',
      decimals: 18,
      name: 'Reef.finance',
      symbol: 'REEF',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0xF21768cCBC73Ea5B6fd3C687208a7c2def2d966e/logo.png'
    },
    DOGE: {
      address: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43',
      decimals: 8,
      name: 'Dogecoin',
      symbol: 'DOGE',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0xbA2aE424d960c26247Dd6c32edC70B295c744C43/logo.png'
    },
    FIL: {
      address: '0x0D8Ce2A99Bb6e3B7Db580eD848240e4a0F9aE153',
      decimals: 18,
      name: 'BNB pegged Filecoin',
      symbol: 'FIL',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0x0D8Ce2A99Bb6e3B7Db580eD848240e4a0F9aE153/logo.png'
    },
    HARD: {
      address: '0xf79037F6f6bE66832DE4E7516be52826BC3cBcc4',
      decimals: 6,
      name: 'Hard Protocol',
      symbol: 'HARD',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0xf79037F6f6bE66832DE4E7516be52826BC3cBcc4/logo.png'
    },
    CTK: {
      address: '0xA8c2B8eec3d368C0253ad3dae65a5F2BBB89c929',
      decimals: 6,
      name: 'CertiK Token',
      symbol: 'CTK',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0xA8c2B8eec3d368C0253ad3dae65a5F2BBB89c929/logo.png'
    },
    SFP: {
      address: '0xD41FDb03Ba84762dD66a0af1a6C8540FF1ba5dfb',
      decimals: 18,
      name: 'SafePal Token',
      symbol: 'SFP',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0xD41FDb03Ba84762dD66a0af1a6C8540FF1ba5dfb/logo.png'
    },
    BabyDoge: {
      address: '0xc748673057861a797275CD8A068AbB95A902e8de',
      decimals: 9,
      name: 'Baby Doge Coin',
      symbol: 'BabyDoge',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/smartchain/assets/0xc748673057861a797275CD8A068AbB95A902e8de/logo.png'
    }
  },

  // Polygon
  137: {
    MATIC: { 
      address: 'NATIVE', 
      decimals: 18,
      name: 'Polygon',
      symbol: 'MATIC',
      logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/info/logo.png'
    },
    WMATIC: { 
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', 
      decimals: 18,
      name: 'Wrapped MATIC',
      symbol: 'WMATIC',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270/logo.png'
    },
    WETH: { 
      address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', 
      decimals: 18,
      name: 'Wrapped Ether',
      symbol: 'WETH',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619/logo.png'
    },
    'USDC.e': { 
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', 
      decimals: 6,
      name: 'Bridged USD Coin (PoS)',
      symbol: 'USDC.e',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174/logo.png'
    },
    USDT: { 
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', 
      decimals: 6,
      name: '(PoS) Tether USD',
      symbol: 'USDT',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0xc2132D05D31c914a87C6611C10748AEb04B58e8F/logo.png'
    },
    DAI: { 
      address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', 
      decimals: 18,
      name: '(PoS) Dai Stablecoin',
      symbol: 'DAI',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063/logo.png'
    },
    LINK: { 
      address: '0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39', 
      decimals: 18,
      name: 'ChainLink Token',
      symbol: 'LINK',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39/logo.png'
    },
    AAVE: { 
      address: '0xD6DF932A45C0f255f85145f286eA0b292B21C90B', 
      decimals: 18,
      name: 'Aave (PoS)',
      symbol: 'AAVE',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/polygon/assets/0xD6DF932A45C0f255f85145f286eA0b292B21C90B/logo.png'
    }
  },

  // Arbitrum
  42161: {
    ETH: { 
      address: 'NATIVE', 
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
      logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/info/logo.png'
    },
    WETH: { 
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', 
      decimals: 18,
      name: 'Wrapped Ether',
      symbol: 'WETH',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/arbitrum/assets/0x82aF49447D8a07e3bd95BD0d56f35241523fBab1/logo.png'
    },
    'USDC.e': { 
      address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', 
      decimals: 6,
      name: 'Bridged USDC',
      symbol: 'USDC.e',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/arbitrum/assets/0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8/logo.png'
    },
    DAI: { 
      address: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', 
      decimals: 18,
      name: 'Dai Stablecoin',
      symbol: 'DAI',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/arbitrum/assets/0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1/logo.png'
    },
    USDT: { 
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', 
      decimals: 6,
      name: 'Tether USD',
      symbol: 'USDT',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/arbitrum/assets/0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9/logo.png'
    },
    GMX: { 
      address: '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a', 
      decimals: 18,
      name: 'GMX',
      symbol: 'GMX',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/arbitrum/assets/0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a/logo.png'
    },
    GRT: { 
      address: '0x9623063377AD1B27544C965cCd7342f7EA7e88C7', 
      decimals: 18,
      name: 'The Graph',
      symbol: 'GRT',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/arbitrum/assets/0x9623063377AD1B27544C965cCd7342f7EA7e88C7/logo.png'
    },
    ARB: {
      address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
      decimals: 18,
      name: 'Arbitrum',
      symbol: 'ARB',
      logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0x912CE59144191C1204E64559FE8253a0e49E6548/logo.png'
    }
  },
  MAGIC: {
    address: '0x539bdE0d7Dbd336b79148AA742883198BBF60342',
    decimals: 18,
    name: 'MAGIC',
    symbol: 'MAGIC',
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0x539bdE0d7Dbd336b79148AA742883198BBF60342/logo.png'
  },

  // Base Chain
  8453: {
    ETH: { 
      address: 'NATIVE', 
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
      logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/info/logo.png'
    },
    WETH: { 
      address: '0x4200000000000000000000000000000000000006', 
      decimals: 18,
      name: 'Wrapped Ethereum',
      symbol: 'WETH',
      logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x4200000000000000000000000000000000000006/logo.png'
    },
    USDbC: { 
      address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA', 
      decimals: 6,
      name: 'USD Base Coin',
      symbol: 'USDbC',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/base/assets/0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA/logo.png'
    },
    BSWAP: {
      address: '0x78a087d713Be963Bf307b18F2Ff8122EF9A63ae9',
      decimals: 18,
      name: 'Baseswap',
      symbol: 'BSWAP',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/base/assets/0x78a087d713Be963Bf307b18F2Ff8122EF9A63ae9/logo.png'
    },
    axlUSDC: {
      address: '0xEB466342C4d449BC9f53A865D5Cb90586f405215',
      decimals: 6,
      name: 'Axelar Wrapped USDC',
      symbol: 'axlUSDC',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/base/assets/0xEB466342C4d449BC9f53A865D5Cb90586f405215/logo.png'
    },
    DAI: {
      address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      decimals: 18,
      name: 'Dai',
      symbol: 'DAI',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/base/assets/0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb/logo.png'
    },
    YFI: {
      address: '0x9EaF8C1E34F05a589EDa6BAfdF391Cf6Ad3CB239',
      decimals: 18,
      name: 'yearn.finance',
      symbol: 'YFI',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/base/assets/0x9EaF8C1E34F05a589EDa6BAfdF391Cf6Ad3CB239/logo.png'
    },
    rETH: {
      address: '0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c',
      decimals: 18,
      name: 'Rocket Pool ETH',
      symbol: 'rETH',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/base/assets/0xB6fe221Fe9EeF5aBa221c348bA20A1Bf5e73624c/logo.png'
    },
    FOMO: {
      address: '0x9A86980D3625b4A6E69D8a4606D51cbc019e2002',
      decimals: 18,
      name: 'FOMO BULL CLUB',
      symbol: 'FOMO',
      logo: 'https://assets-cdn.trustwallet.com/blockchains/base/assets/0x9A86980D3625b4A6E69D8a4606D51cbc019e2002/logo.png'
    }
  }
};

// For backward compatibility
export const TOKENS = Object.fromEntries(
  Object.entries(TOKEN_INFO).map(([chainId, tokens]) => [
    chainId,
    Object.fromEntries(
      Object.entries(tokens).map(([symbol, info]) => [symbol, info.address])
    ),
  ])
);

// Mapping of native tokens to their wrapped versions
export const WRAPPED_TOKENS = {
  1: { symbol: 'WETH', nativeSymbol: 'ETH' },
  56: { symbol: 'WBNB', nativeSymbol: 'BNB' },
  137: { symbol: 'WMATIC', nativeSymbol: 'MATIC' },
  42161: { symbol: 'WETH', nativeSymbol: 'ETH' },
  8453: { symbol: 'WETH', nativeSymbol: 'ETH' },
};

export const getTokenInfo = (chainId, symbol) => {
  return TOKEN_INFO[chainId]?.[symbol];
};

export const getTokenSymbol = (chainId, address) => {
  const chainTokens = TOKEN_INFO[chainId];
  if (!chainTokens) return null;

  for (const [symbol, info] of Object.entries(chainTokens)) {
    if (info.address.toLowerCase() === address.toLowerCase()) {
      return symbol;
    }
  }
  return null;
};

export const getTokenAddress = (chainId, symbol) => {
  return TOKEN_INFO[chainId]?.[symbol]?.address || null;
};

export const getTokenDecimals = (chainId, symbol) => {
  return TOKEN_INFO[chainId]?.[symbol]?.decimals || 18;
};

export const isNativeToken = (chainId, symbol) => {
  return TOKEN_INFO[chainId]?.[symbol]?.address === 'NATIVE';
};

export const getWrappedToken = (chainId) => {
  const wrapped = WRAPPED_TOKENS[chainId];
  if (!wrapped) return null;

  return {
    symbol: wrapped.symbol,
    nativeSymbol: wrapped.nativeSymbol,
    address: TOKEN_INFO[chainId]?.[wrapped.symbol]?.address,
  };
};

export const getNativeToken = (chainId) => {
  const wrapped = WRAPPED_TOKENS[chainId];
  if (!wrapped) return null;

  return {
    symbol: wrapped.nativeSymbol,
    wrappedSymbol: wrapped.symbol,
    wrappedAddress: TOKEN_INFO[chainId]?.[wrapped.symbol]?.address,
  };
};

export const parseTokenImport = async (address, customProvider = provider) => {
  try {
    // Validate address format
    if (!ethers.utils.isAddress(address)) {
      throw new Error('Invalid address format');
    }

    // Get the current chain ID
    const chainId = await customProvider.getNetwork().then(network => network.chainId);
    
    // Map chain IDs to Coingecko platform IDs
    const chainToCoingecko = {
      1: 'ethereum',
      56: 'binance-smart-chain',
      137: 'polygon-pos',
      42161: 'arbitrum-one',
      8453: 'base',
    };

    let tokenInfo = null;

    // Try to get token info from chain-specific APIs first
    try {
      let apiUrl;
      switch (chainId) {
        case 56: // BSC
          apiUrl = `https://api.pancakeswap.info/api/v2/tokens/${address}`;
          const pancakeResponse = await fetch(apiUrl);
          if (pancakeResponse.ok) {
            const data = await pancakeResponse.json();
            tokenInfo = {
              name: data.name,
              symbol: data.symbol?.toUpperCase(),
              logo: data.image || data.logo,
              decimals: 18, // Will get actual decimals from contract
              verified: true
            };
          }
          break;

        default:
          // Try Coingecko
          const platform = chainToCoingecko[chainId] || 'ethereum';
          const coingeckoResponse = await fetch(
            `https://api.coingecko.com/api/v3/coins/${platform}/contract/${address}`
          );
          
          if (coingeckoResponse.ok) {
            const data = await coingeckoResponse.json();
            tokenInfo = {
              name: data.name,
              symbol: data.symbol?.toUpperCase(),
              logo: data.image?.small || data.image?.thumb,
              decimals: 18,
              verified: true,
              description: data.description?.en,
              marketCap: data.market_data?.market_cap?.usd,
              website: data.links?.homepage?.[0],
              twitter: data.links?.twitter_screen_name ? 
                `https://twitter.com/${data.links.twitter_screen_name}` : null,
              telegram: data.links?.telegram_channel_identifier ? 
                `https://t.me/${data.links.telegram_channel_identifier}` : null,
            };
          }
          break;
      }
    } catch (error) {
      console.warn('Failed to fetch token info from primary sources:', error);
    }

    // If primary sources fail, try contract directly
    if (!tokenInfo) {
      const contract = new ethers.Contract(
        address,
        [
          'function name() view returns (string)',
          'function symbol() view returns (string)',
          'function decimals() view returns (uint8)',
          // Bytes32 variations
          'function name() view returns (bytes32)',
          'function symbol() view returns (bytes32)',
          // Non-view variations
          'function name() returns (string)',
          'function symbol() returns (string)',
          'function decimals() returns (uint8)',
        ],
        customProvider
      );

      // Helper function to convert bytes32 to string
      const bytes32ToString = (bytes32) => {
        if (typeof bytes32 === 'string') return bytes32;
        try {
          const hex = ethers.utils.hexStripZeros(bytes32);
          return hex.length === 0 ? '' : ethers.utils.toUtf8String(hex);
        } catch {
          return '';
        }
      };

      try {
        let [name, symbol, decimals] = await Promise.all([
          contract.name().catch(() => 'Unknown Token'),
          contract.symbol().catch(() => 'UNKNOWN'),
          contract.decimals().catch(() => 18),
        ]);

        name = bytes32ToString(name);
        symbol = bytes32ToString(symbol);
        decimals = Number(decimals);

        tokenInfo = {
          name,
          symbol: symbol.toUpperCase(),
          decimals,
          verified: false
        };
      } catch (error) {
        console.warn('Failed to get token info from contract:', error);
      }
    }

    // If still no logo, try 1inch API as last resort
    if (tokenInfo && !tokenInfo.logo) {
      try {
        const response = await fetch(
          `https://api.1inch.io/v5.0/${chainId}/token/${address}`
        );
        if (response.ok) {
          const data = await response.json();
          tokenInfo.logo = data.logoURI;
        }
      } catch (error) {
        console.warn('Failed to fetch logo from 1inch:', error);
      }
    }

    // If we still don't have token info, throw error
    if (!tokenInfo?.name || !tokenInfo?.symbol) {
      throw new Error('Could not fetch token information');
    }

    return {
      address,
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      decimals: tokenInfo.decimals || 18,
      logo: tokenInfo.logo || null,
      verified: tokenInfo.verified || false,
      description: tokenInfo.description,
      marketCap: tokenInfo.marketCap,
      website: tokenInfo.website,
      twitter: tokenInfo.twitter,
      telegram: tokenInfo.telegram,
      isImported: true,
    };
  } catch (error) {
    console.error('Error importing token:', error);
    throw new Error(error.message || 'Invalid token address');
  }
};

export const validateTokenImport = (tokenData) => {
  return (
    tokenData &&
    tokenData.name &&
    tokenData.symbol &&
    typeof tokenData.decimals === 'number' &&
    tokenData.decimals >= 0 &&
    tokenData.decimals <= 18
  );
};

// Add predefined token logos from GitHub
export const DEFAULT_TOKENS = {
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png'
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logo: 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png'
  },
  // Add more predefined tokens as needed
};

// Add function to fetch token info for imported tokens
export const fetchTokenInfo = async (address) => {
  try {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`);
    const data = await response.json();
    
    return {
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      decimals: data.detail_platforms?.ethereum?.decimal_place || 18,
      logo: data.image?.small || '',
      address: address
    };
  } catch (error) {
    console.error('Error fetching token info:', error);
    return null;
  }
};

// Session storage keys
const SESSION_KEYS = {
  TOKEN_CACHE: 'dogeswap_token_cache',
};

// Function to get cached token data
const getCachedToken = (address, chainId) => {
  try {
    const cache = JSON.parse(sessionStorage.getItem(SESSION_KEYS.TOKEN_CACHE) || '{}');
    return cache[`${chainId}_${address.toLowerCase()}`];
  } catch {
    return null;
  }
};

// Function to cache token data
const cacheToken = (tokenInfo, chainId) => {
  try {
    const cache = JSON.parse(sessionStorage.getItem(SESSION_KEYS.TOKEN_CACHE) || '{}');
    cache[`${chainId}_${tokenInfo.address.toLowerCase()}`] = {
      ...tokenInfo,
      timestamp: Date.now()
    };
    sessionStorage.setItem(SESSION_KEYS.TOKEN_CACHE, JSON.stringify(cache));
  } catch (error) {
    console.error('Error caching token:', error);
  }
};

// Function to check if token is predefined
const isPredefinedToken = (address, chainId) => {
  const chainTokens = TOKEN_INFO[chainId];
  if (!chainTokens) return false;

  return Object.values(chainTokens).some(
    token => token.address.toLowerCase() === address.toLowerCase()
  );
};

// Function to get predefined token info
const getPredefinedToken = (address, chainId) => {
  const chainTokens = TOKEN_INFO[chainId];
  if (!chainTokens) return null;

  const token = Object.entries(chainTokens).find(
    ([_, info]) => info.address.toLowerCase() === address.toLowerCase()
  );

  return token ? { ...token[1], symbol: token[0] } : null;
};

// Initialize cache with predefined tokens
export const initializeTokenCache = () => {
  try {
    const cache = JSON.parse(sessionStorage.getItem(SESSION_KEYS.TOKEN_CACHE) || '{}');
    
    Object.entries(TOKEN_INFO).forEach(([chainId, tokens]) => {
      Object.entries(tokens).forEach(([symbol, tokenInfo]) => {
        if (tokenInfo && tokenInfo.address) {
          const key = `${chainId}_${tokenInfo.address.toLowerCase()}`;
          if (!cache[key]) {
            cache[key] = {
              ...tokenInfo,
              symbol,
              isImported: false,
              timestamp: Date.now()
            };
          }
        }
      });
    });

    sessionStorage.setItem(SESSION_KEYS.TOKEN_CACHE, JSON.stringify(cache));
  } catch (error) {
    console.error('Error initializing token cache:', error);
  }
};

// Initialize cache when module loads
initializeTokenCache();

// Update importToken function to handle both predefined and new tokens
export const importToken = async (address, chainId) => {
  try {
    // Check if it's a predefined token
    if (isPredefinedToken(address, chainId)) {
      const tokenInfo = getPredefinedToken(address, chainId);
      return tokenInfo;
    }

    // Check cache for imported tokens
    const cachedToken = getCachedToken(address, chainId);
    if (cachedToken && Date.now() - cachedToken.timestamp < 3600000) { // 1 hour cache
      console.log('Using cached token data');
      return cachedToken;
    }

    // Try DexScreener API first
    try {
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      const data = await response.json();
      
      if (data.pairs && data.pairs.length > 0) {
        const tokenData = data.pairs[0];
        const tokenInfo = tokenData.baseToken.address.toLowerCase() === address.toLowerCase() 
          ? tokenData.baseToken 
          : tokenData.quoteToken;

        const result = {
          address: address,
          symbol: tokenInfo.symbol,
          name: tokenInfo.name,
          decimals: 18, // Will be updated from contract
          logo: tokenData.info?.imageUrl || null,
          priceUsd: tokenData.priceUsd,
          isImported: true
        };

        // Get decimals from contract
        const provider = new ethers.providers.JsonRpcProvider(getChainRpcUrl(chainId));
        const contract = new ethers.Contract(address, ['function decimals() view returns (uint8)'], provider);
        try {
          result.decimals = await contract.decimals();
        } catch (error) {
          console.warn('Failed to get decimals from contract:', error);
        }

        // Cache the result
        cacheToken(result, chainId);
        return result;
      }
    } catch (error) {
      console.warn('DexScreener API failed:', error);
    }

    // Fallback to CoinGecko if DexScreener fails
    const platformId = {
      1: 'ethereum',
      56: 'binance-smart-chain',
      137: 'polygon-pos',
      42161: 'arbitrum-one',
      8453: 'base'
    }[chainId] || 'ethereum';

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${platformId}/contract/${address}`
    );

    if (!response.ok) {
      throw new Error('Token not found');
    }

    const data = await response.json();
    const tokenInfo = {
      address: address,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      decimals: data.detail_platforms?.[platformId]?.decimal_place || 18,
      logo: data.image?.small || null,
      priceUsd: data.market_data?.current_price?.usd,
      isImported: true
    };

    // Cache the imported token data
    cacheToken(tokenInfo, chainId);
    return tokenInfo;
  } catch (error) {
    console.error('Error importing token:', error);
    throw error;
  }
};

// Add helper function for RPC URLs
const getChainRpcUrl = (chainId) => {
  const RPC_URLS = {
    1: 'https://eth.llamarpc.com',
    56: 'https://bsc-dataseed.binance.org',
    137: 'https://polygon-rpc.com',
    42161: 'https://arb1.arbitrum.io/rpc',
    8453: 'https://mainnet.base.org'
  };
  return RPC_URLS[chainId];
}; 