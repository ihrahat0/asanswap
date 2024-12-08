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
    ETH: { address: 'NATIVE', decimals: 18 },
    WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
    USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    DAI: { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
  },
  // BSC
  56: {
    BNB: { address: 'NATIVE', decimals: 18 },
    WBNB: { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18 },
    BUSD: { address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', decimals: 18 },
    USDT: { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    BABYDOGE: { address: '0xc748673057861a797275CD8A068AbB95A902e8de', decimals: 9 },
  },
  // Polygon
  137: {
    MATIC: { address: 'NATIVE', decimals: 18 },
    WMATIC: { address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', decimals: 18 },
    USDC: { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
    USDT: { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
  },
  // Arbitrum
  42161: {
    ETH: { address: 'NATIVE', decimals: 18 },
    WETH: { address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
    USDC: { address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', decimals: 6 },
    USDT: { address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
  },
  // Base Goerli
  84531: {
    ETH: { address: 'NATIVE', decimals: 18 },
    WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
    USDbC: { address: '0x853154e2A5604E5C74a2546E2871Ad44932eB92C', decimals: 6 },
  },
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
  84531: { symbol: 'WETH', nativeSymbol: 'ETH' },
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