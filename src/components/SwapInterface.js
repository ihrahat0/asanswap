import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Input,
  VStack,
  HStack,
  Text,
  Spinner,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Image,
  Link,
  Icon,
  Container,
  Center,
  Flex,
  Badge,
  InputGroup,
  InputRightElement,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
  Heading,
} from '@chakra-ui/react';
import { useAccount, useNetwork, useSwitchNetwork, useProvider, useSigner } from 'wagmi';
import { Web3Button } from '@web3modal/react';
import Moralis from 'moralis';
import { ethers } from 'ethers';
import { 
  getTokenAddress, 
  isNativeToken, 
  getWrappedToken,
  getTokenDecimals,
  TOKEN_INFO,
  importToken,
} from '../utils/tokens';
import { FaGlobe, FaTwitter, FaTelegram, FaArrowDown, FaTimes, FaExternalLinkAlt, FaInstagram, FaTiktok, FaCog, FaPlus, FaExchangeAlt, FaChevronDown, FaFire } from 'react-icons/fa';
import './SwapInterface.css';

// Add chain logo imports
import mainlogo from '../assets/logo.png';
import ethLogo from '../assets/ethereum.webp';
import bscLogo from '../assets/bnb.webp';
import baseLogo from '../assets/base.png';
import poweredby from '../assets/logo.gif';

// First define all ABIs
const V2_FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)'
];

const V3_FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
];

const ERC20_ABI = [
  'function decimals() public view returns (uint8)',
  'function symbol() public view returns (string)',
  'function name() public view returns (string)',
  'function balanceOf(address) public view returns (uint256)',
  'function transfer(address to, uint256 value) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function approve(address spender, uint256 value) public returns (bool)'
];

const V2_ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
  'function WETH() external pure returns (address)'
];

const V3_ROUTER_ABI = [
  {
    "inputs": [{
      "components": [
        { "internalType": "bytes", "name": "path", "type": "bytes" },
        { "internalType": "address", "name": "recipient", "type": "address" },
        { "internalType": "uint256", "name": "deadline", "type": "uint256" },
        { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
        { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" }
      ],
      "internalType": "struct ISwapRouter.ExactInputParams",
      "name": "params",
      "type": "tuple"
    }],
    "name": "exactInput",
    "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  }
];

// Separate ABIs for Base chain
const BASE_V2_ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)'
];

const BASE_V3_ROUTER_ABI = [
  {
    "inputs": [{
      "components": [
        { "internalType": "bytes", "name": "path", "type": "bytes" },
        { "internalType": "address", "name": "recipient", "type": "address" },
        { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
        { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" }
      ],
      "internalType": "struct IV3SwapRouter.ExactInputParams",
      "name": "params",
      "type": "tuple"
    }],
    "name": "exactInput",
    "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  }
];

// Define network configurations
const NETWORKS = {
  MAINNET: {
    id: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/b933365d933f41ba9c566a622a2d40e3',
    v2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
    v3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router
    v2Factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    v3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    v2RouterAbi: V2_ROUTER_ABI,
    v3RouterAbi: V3_ROUTER_ABI,
    routerAbi: V2_ROUTER_ABI, // Added routerAbi for consistency
    blockExplorer: 'https://etherscan.io'
  },
  BSC: {
    id: 56,
    name: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    v2Router: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeSwap V2 Router
    v3Router: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4', // PancakeSwap V3 Router
    v2Factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    v3Factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    weth: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
    v2RouterAbi: V2_ROUTER_ABI,
    v3RouterAbi: V3_ROUTER_ABI,
    routerAbi: V2_ROUTER_ABI, // Added routerAbi for consistency
    blockExplorer: 'https://bscscan.com'
  },
  BASE: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    v2Router: '0x8357227d4EDc78991db6FDB9Bd6ADE250536dE1d', // Uniswap V2 on Base
    v3Router: '0x2626664c2603336E57B271c5C0b26F421741e481', // Uniswap V3 on Base
    v2Factory: '0x8909Dc15E40173Ff4699343B6eb8132C65E18ec6',
    v3Factory: '0x33128a8FC17869897dcE68Ed026d694621f6FDfD',
    weth: '0x4200000000000000000000000000000000000006', // WETH on Base
    v2RouterAbi: BASE_V2_ROUTER_ABI,
    v3RouterAbi: BASE_V3_ROUTER_ABI,
    routerAbi: BASE_V2_ROUTER_ABI, // Added routerAbi for consistency
    blockExplorer: 'https://basescan.org'
  }
};

// Update CHAIN_LOGOS constant
const CHAIN_LOGOS = {
  1: ethLogo,      // Ethereum
  56: bscLogo,     // BSC
  8453: baseLogo,  // Base
};

const CHAIN_NAMES = {
  1: 'Ethereum',
  56: 'BNB Chain',
  8453: 'Base',
};

// Constants
const FEE_RECIPIENT = '0x67FEa3f7Ba299F10269519E9987180Cb80C92C61';
const FEE_PERCENTAGE = 0.3; // 0.3%

// Add DEX names mappingx
const DEX_NAMES = {
  1: 'Uniswap',
  56: 'PancakeSwap',
  8453: 'Uniswap',
};

// Add PancakeSwap V3 Quoter ABI
const PANCAKE_V3_QUOTER_ABI = [
  'function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint256 fee, uint160 sqrtPriceLimitX96) params) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
  'function quoteExactInput(bytes path, uint256 amountIn) external returns (uint256 amountOut, uint160[] sqrtPriceX96AfterList, uint32[] initializedTicksCrossedList, uint256 gasEstimate)'
];

// Update fee constants
const FIXED_FEES = {
  1: ethers.utils.parseEther('0.00015'), // Ethereum
  8453: ethers.utils.parseEther('0.00015'), // Base
  56: ethers.utils.parseEther('0.001'), // BSC
};

// Add percentage fee constant
const PERCENTAGE_FEE = 0.003; // 0.3%

// Update the theme color
const brandColor = "#117e4e";

const SwapInterface = () => {
  // Add these hooks near the top of your component
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const prevAddressRef = useRef(null);

  const { address } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: isSwitchingChain } = useSwitchNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const toast = useToast();

  const [fromTokenSymbol, setFromTokenSymbol] = useState('');
  const [toTokenSymbol, setToTokenSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fromTokenBalance, setFromTokenBalance] = useState('0');
  const [toTokenBalance, setToTokenBalance] = useState('0');
  const [nativeBalance, setNativeBalance] = useState('0');
  const [slippage, setSlippage] = useState('0.5');
  const [customTokens, setCustomTokens] = useState({});
  const { 
    isOpen: isImportModalOpen, 
    onOpen: onImportModalOpen, 
    onClose: onImportModalClose 
  } = useDisclosure();
  const [newToken, setNewToken] = useState({
    address: '',
    symbol: '',
    decimals: '18',
  });
  const [importTokenInfo, setImportTokenInfo] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [reverseQuote, setReverseQuote] = useState(null);
  const [isReverseQuote, setIsReverseQuote] = useState(false);
  const [toAmount, setToAmount] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customSlippage, setCustomSlippage] = useState('');
  const quoteTimerRef = useRef(null);

  // Inside the SwapInterface component, after the existing state variables
  const [tokenSearchType, setTokenSearchType] = useState('');
  const [isTokenSearchOpen, setIsTokenSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [trendingCoins, setTrendingCoins] = useState([]);
  const [activeTab, setActiveTab] = useState('swap');
  const settingsModal = useDisclosure();
  
  const fetchTrendingCoins = useCallback(async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
      const data = await response.json();
      
      const formattedCoins = data.coins.map(coin => ({
        symbol: coin.item.symbol.toUpperCase(),
        logo: coin.item.thumb,
        price: coin.item.price_btc * 30000, // Approximate USD conversion
        priceChange24h: (Math.random() * 20) - 10, // Random change for demo
      }));
      
      setTrendingCoins(formattedCoins);
    } catch (error) {
      console.error('Error fetching trending coins:', error);
    }
  }, []);

  // Fetch trending coins every 30 seconds
  useEffect(() => {
    fetchTrendingCoins();
    const interval = setInterval(fetchTrendingCoins, 30000);
    return () => clearInterval(interval);
  }, [fetchTrendingCoins]);

  // Add formatTokenAmount function
  const formatTokenAmount = (amount, decimals, symbol) => {
    // For tokens like BABYDOGE or tokens with many zeros, ensure proper display
    try {
      // Get the actual decimals for accurate display
      const actualDecimals = parseInt(decimals);
      
      // Format differently based on token decimals
      if (actualDecimals > 18) {
        // For tokens with very large decimal places (unusual)
        return ethers.utils.formatUnits(amount, actualDecimals);
      } else if (actualDecimals > 8) {
        // For normal tokens (like ETH/BNB with 18 decimals)
        return parseFloat(ethers.utils.formatUnits(amount, actualDecimals)).toFixed(6);
      } else if (actualDecimals <= 8 && actualDecimals > 2) {
        // For tokens with fewer decimals like USDC (6 decimals)
        return parseFloat(ethers.utils.formatUnits(amount, actualDecimals)).toFixed(actualDecimals);
      } else {
        // For tokens with very few decimals
        return ethers.utils.formatUnits(amount, actualDecimals);
      }
    } catch (error) {
      console.error('Error formatting token amount:', error);
      // Default fallback with 18 decimals
      return parseFloat(ethers.utils.formatUnits(amount, 18)).toFixed(6);
    }
  };

  // Add calculateFee function
  const calculateFee = (amount) => {
    // Convert 0.3% to 30 basis points as an integer
    const feeMultiplier = 30; // FEE_PERCENTAGE (0.3) * 100 = 30 basis points
    return ethers.BigNumber.from(amount)
      .mul(feeMultiplier)
      .div(10000); // Divide by 100 * 100 to get the percentage
  };

  // Add getAvailableTokens function
  const getAvailableTokens = useCallback(() => {
    if (!chain?.id) return [];
    const baseTokens = Object.keys(TOKEN_INFO[chain.id] || {});
    const customTokensList = customTokens[chain.id] ? Object.keys(customTokens[chain.id]) : [];
    return [...customTokensList, ...baseTokens]; // Changed order to show custom tokens first
  }, [chain?.id, customTokens]);

  // Function to swap the selected tokens
  const handleSwapTokens = () => {
    const fromToken = fromTokenSymbol;
    const toToken = toTokenSymbol;
    setFromTokenSymbol(toToken);
    setToTokenSymbol(fromToken);
    updateUrlWithTokens(toToken, fromToken);
    setQuote(null);
  };

  // Initialize Moralis
  useEffect(() => {
    const initMoralis = async () => {
      try {
        if (!Moralis.Core.isStarted) {
          await Moralis.start({
            apiKey: '',
          });
        }
      } catch (error) {
        console.error('Failed to initialize Moralis:', error);
      }
    };
    initMoralis();
  }, []);

  // Function to fetch token balance
  const fetchTokenBalance = useCallback(async (tokenSymbol) => {
    if (!address || !chain || !provider || !tokenSymbol) return '0';

    try {
      if (isNativeToken(chain.id, tokenSymbol)) {
        const balance = await provider.getBalance(address);
        return formatTokenAmount(balance, 18, tokenSymbol);
      } else {
        const tokenAddress = getTokenAddress(chain.id, tokenSymbol) || 
          customTokens[chain.id]?.[tokenSymbol]?.address;
        
        if (!tokenAddress) return '0';
        
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI,
          provider
        );

        try {
          const [decimals, balance] = await Promise.all([
            tokenContract.decimals(),
            tokenContract.balanceOf(address)
          ]);
          return formatTokenAmount(balance, decimals, tokenSymbol);
        } catch (error) {
          console.error('Error calling token contract:', error);
          return '0';
        }
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }, [address, chain, provider, customTokens]);

  // Function to fetch native balance
  const fetchNativeBalance = useCallback(async () => {
    if (!address || !chain || !provider) return '0';
    try {
      const balance = await provider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error fetching native balance:', error);
      return '0';
    }
  }, [address, chain, provider]);

  // Update native balance
  useEffect(() => {
    const updateNativeBalance = async () => {
      const balance = await fetchNativeBalance();
      setNativeBalance(balance);
    };

    updateNativeBalance();
    const interval = setInterval(updateNativeBalance, 10000);
    return () => clearInterval(interval);
  }, [fetchNativeBalance]);

  // Update balances when tokens change
  useEffect(() => {
    const updateBalances = async () => {
      if (fromTokenSymbol) {
        const fromBalance = await fetchTokenBalance(fromTokenSymbol);
        setFromTokenBalance(fromBalance);
      }
      if (toTokenSymbol) {
        const toBalance = await fetchTokenBalance(toTokenSymbol);
        setToTokenBalance(toBalance);
      }
    };

    updateBalances();
    const interval = setInterval(updateBalances, 10000);
    return () => clearInterval(interval);
  }, [fromTokenSymbol, toTokenSymbol, fetchTokenBalance]);

  // Function to detect token chain
  const detectTokenChain = async (tokenAddress) => {
    const chains = [1, 56, 137, 42161, 8453];
    
    for (const chainId of chains) {
      try {
        const rpcUrl = getChainRpcUrl(chainId);
        if (!rpcUrl) continue;

        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ['function symbol() view returns (string)'],
          provider
        );
        
        await tokenContract.symbol();
        return chainId;
      } catch (error) {
        continue;
      }
    }
    return null;
  };

  // Function to get chain RPC URL
  const getChainRpcUrl = (chainId) => {
    const rpcUrls = {
      1: [
        'https://eth.llamarpc.com',
        'https://rpc.ankr.com/eth',
        'https://ethereum.publicnode.com',
      ],
      56: [
        'https://bsc-dataseed.binance.org',
        'https://bsc-dataseed1.defibit.io',
        'https://bsc-dataseed1.ninicoin.io',
      ],
      8453: [
        'https://mainnet.base.org',
        'https://base.llamarpc.com',
        'https://base.gateway.tenderly.co',
        'https://base-mainnet.public.blastapi.io',
      ],
    };

    const urls = rpcUrls[chainId];
    if (!urls) return null;

    // Return the first URL, but in a production environment,
    // you might want to implement a round-robin or random selection
    return urls[0];
  };

  // Function to validate and add custom token
  const addCustomToken = async () => {
    try {
      if (!ethers.utils.isAddress(newToken.address)) {
        throw new Error('Invalid token address');
      }

      // Detect which chain the token is on
      const tokenChainId = await detectTokenChain(newToken.address);
      if (!tokenChainId) {
        throw new Error('Could not detect token chain');
      }

      // If on different chain, prompt to switch
      if (tokenChainId !== chain?.id) {
        const chainName = CHAIN_NAMES[tokenChainId];
        const shouldSwitch = window.confirm(
          `This token is on ${chainName}. Would you like to switch networks?`
        );
        if (shouldSwitch) {
          await handleChainSwitch(tokenChainId.toString());
          // Store token info to be added after chain switch
          sessionStorage.setItem('pendingTokenImport', JSON.stringify({
            address: newToken.address,
            chainId: tokenChainId
          }));
          return;
        } else {
          throw new Error(`Please switch to ${chainName} to import this token`);
        }
      }

      const tokenContract = new ethers.Contract(newToken.address, ERC20_ABI, provider);
      const [symbol, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.decimals()
      ]);

      const tokenInfo = {
        address: newToken.address,
        symbol: symbol,
        decimals: decimals.toString(),
      };

      setCustomTokens(prev => ({
        ...prev,
        [chain.id]: {
          ...(prev[chain.id] || {}),
          [symbol]: tokenInfo,
        },
      }));

      // Auto-select the imported token
      setToTokenSymbol(symbol);

      onImportModalClose();
      toast({
        title: 'Token added successfully',
        description: `Added ${symbol} to ${CHAIN_NAMES[chain.id]}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error adding token',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Check for pending token import after chain switch
  useEffect(() => {
    const checkPendingImport = async () => {
      const pendingImport = sessionStorage.getItem('pendingTokenImport');
      if (pendingImport) {
        const { address } = JSON.parse(pendingImport);
        sessionStorage.removeItem('pendingTokenImport');
        // Set the new token address and trigger import
        setNewToken(prev => ({ ...prev, address }));
        await addCustomToken();
      }
    };

    if (chain?.id) {
      checkPendingImport();
    }
  }, [chain?.id]);

  const handleChainSwitch = async (chainId) => {
    try {
      if (!switchNetwork) {
        throw new Error('Chain switching not supported by wallet');
      }
      await switchNetwork(parseInt(chainId));
      // Reset form when chain is switched
      setFromTokenSymbol('');
      setToTokenSymbol('');
      setAmount('');
      setQuote(null);
    } catch (error) {
      console.error('Error switching chain:', error);
      toast({
        title: 'Error switching chain',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Update checkLiquidity function
  const checkLiquidity = async (fromToken, toToken) => {
    try {
      let network;
      switch (chain.id) {
        case 1:
          network = NETWORKS.MAINNET;
          break;
        case 56:
          network = NETWORKS.BSC;
          break;
        case 8453:
          network = NETWORKS.BASE;
          break;
        default:
          throw new Error('Unsupported network');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      const getTokenAddressWithCustom = (symbol) => {
        if (isNativeToken(chain.id, symbol)) {
          return network.weth;
        }
        const customToken = customTokens[chain.id]?.[symbol];
        if (customToken) {
          return customToken.address;
        }
        return getTokenAddress(chain.id, symbol);
      };

      const fromTokenAddress = getTokenAddressWithCustom(fromToken);
      const toTokenAddress = getTokenAddressWithCustom(toToken);
      
      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error('Invalid token address');
      }

      // For BSC, only check V2 liquidity
      if (chain.id === 56) {
        const checksummedFromToken = ethers.utils.getAddress(fromTokenAddress.toLowerCase());
        const checksummedToToken = ethers.utils.getAddress(toTokenAddress.toLowerCase());
        const checksummedV2Factory = ethers.utils.getAddress(network.v2Factory.toLowerCase());
        
        const v2Factory = new ethers.Contract(checksummedV2Factory, V2_FACTORY_ABI, provider);
        const v2Pool = await v2Factory.getPair(checksummedFromToken, checksummedToToken);
        
        if (v2Pool && v2Pool !== ethers.constants.AddressZero) {
          try {
            const checksummedV2Router = ethers.utils.getAddress(network.v2Router.toLowerCase());
            const router = new ethers.Contract(checksummedV2Router, network.v2RouterAbi, provider);
            const testAmount = ethers.utils.parseEther('0.1');
            await router.getAmountsOut(testAmount, [checksummedFromToken, checksummedToToken]);
            return 'v2';
          } catch (error) {
            console.log('V2 pool exists but might not have liquidity');
          }
        }
        throw new Error('The pair is not supported, Please check on dogeswap.co');
      }

      // For other chains, continue with existing V2 and V3 checks
      const checksummedFromToken = ethers.utils.getAddress(fromTokenAddress.toLowerCase());
      const checksummedToToken = ethers.utils.getAddress(toTokenAddress.toLowerCase());
      const checksummedV2Factory = ethers.utils.getAddress(network.v2Factory.toLowerCase());
      
      const v2Factory = new ethers.Contract(checksummedV2Factory, V2_FACTORY_ABI, provider);
      const v2Pool = await v2Factory.getPair(checksummedFromToken, checksummedToToken);
      
      if (v2Pool && v2Pool !== ethers.constants.AddressZero) {
        try {
          const checksummedV2Router = ethers.utils.getAddress(network.v2Router.toLowerCase());
          const router = new ethers.Contract(checksummedV2Router, network.v2RouterAbi, provider);
          const testAmount = ethers.utils.parseEther('0.1');
          await router.getAmountsOut(testAmount, [checksummedFromToken, checksummedToToken]);
          return 'v2';
        } catch (error) {
          console.log('V2 pool exists but might not have liquidity');
        }
      }

      // Check V3 for non-BSC chains
      const checksummedV3Factory = ethers.utils.getAddress(network.v3Factory.toLowerCase());
      const v3Factory = new ethers.Contract(checksummedV3Factory, V3_FACTORY_ABI, provider);
      
      let feeTiers;
      if (chain.id === 8453) {
        feeTiers = [10000];
      } else {
        feeTiers = [3000, 500, 10000, 100];
      }

      for (const feeTier of feeTiers) {
        try {
          const v3Pool = await v3Factory.getPool(checksummedFromToken, checksummedToToken, feeTier);
          if (v3Pool && v3Pool !== ethers.constants.AddressZero) {
            return { version: 'v3', feeTier };
          }
        } catch (error) {
          continue;
        }
      }
      
      if (v2Pool && v2Pool !== ethers.constants.AddressZero) {
        return 'v2';
      }
      
      throw new Error('No active liquidity pool found');
    } catch (error) {
      console.error('Error checking liquidity:', error);
      throw error;
    }
  };

  // Wrap getQuote in useCallback to prevent dependency issues
  const getQuote = useCallback(async (isReverse = false) => {
    if (!chain?.id) {
      toast({
        title: 'Network Error',
        description: 'Please select a supported network',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!provider) {
      toast({
        title: 'Provider Error',
        description: 'Web3 provider not found',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const inputToValidate = isReverse ? toAmount : amount;
    if (!inputToValidate || !fromTokenSymbol || !toTokenSymbol) return;

    // Validate minimum input amount with better error handling
    const numAmount = parseFloat(inputToValidate);
    if (isNaN(numAmount)) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid number',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    // Check minimum amount based on the chain
    const minimumAmount = chain?.id === 56 ? 0.005 : 0.001;
    if (numAmount < minimumAmount) {
      toast({
        title: 'Amount too small',
        description: `Minimum amount required is ${minimumAmount} ${fromTokenSymbol}`,
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      let network;
      switch (chain.id) {
        case 1:
          network = NETWORKS.MAINNET;
          break;
        case 56:
          network = NETWORKS.BSC;
          break;
        case 8453:
          network = NETWORKS.BASE;
          break;
        default:
          throw new Error('Unsupported network');
      }

      // Get token addresses with custom token support
      const getTokenAddressWithCustom = (symbol) => {
        if (isNativeToken(chain.id, symbol)) {
          return network.weth;
        }
        // Check custom tokens first
        const customToken = customTokens[chain.id]?.[symbol];
        if (customToken) {
          return customToken.address;
        }
        // Then check predefined tokens
        return getTokenAddress(chain.id, symbol);
      };

      const fromTokenAddress = getTokenAddressWithCustom(fromTokenSymbol);
      const toTokenAddress = getTokenAddressWithCustom(toTokenSymbol);

      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error('Invalid token address');
      }

      console.log('Using addresses:', {
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        fromSymbol: fromTokenSymbol,
        toSymbol: toTokenSymbol
      });

      // Detect which version to use
      const version = await checkLiquidity(fromTokenSymbol, toTokenSymbol);
      console.log('Using version:', version);

      const amountIn = ethers.utils.parseEther(inputToValidate);
      let amountOut;

      if (version === 'v2') {
        const router = new ethers.Contract(network.v2Router, network.v2RouterAbi, provider);
        const amounts = await router.getAmountsOut(amountIn, [fromTokenAddress, toTokenAddress]);
        amountOut = amounts[amounts.length - 1];
      } else {
        // V3 quote using the correct quoter contract based on chain
        let quoterAddress;
        let quoterAbi;
        
        if (chain.id === 56) {
          // PancakeSwap V3 Quoter
          quoterAddress = '0xB048Bbc1Ee6b733FFfCFb9e9CeF7375518e25997';
          quoterAbi = PANCAKE_V3_QUOTER_ABI;
        } else if (chain.id === 1) {
          // Uniswap V3 Quoter
          quoterAddress = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
          quoterAbi = [
            'function quoteExactInput(bytes path, uint256 amountIn) external returns (uint256 amountOut)'
          ];
        } else {
          // Base V3 Quoter
          quoterAddress = '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a';
          quoterAbi = [
            'function quoteExactInput(bytes path, uint256 amountIn) external returns (uint256 amountOut)'
          ];
        }

        const quoter = new ethers.Contract(quoterAddress, quoterAbi, provider);

        try {
          if (chain.id === 56) {
            // PancakeSwap V3 specific quoting
            const params = {
              tokenIn: fromTokenAddress,
              tokenOut: toTokenAddress,
              amountIn: amountIn,
              fee: version.feeTier || 2500,
              sqrtPriceLimitX96: 0
            };

            const quote = await quoter.callStatic.quoteExactInputSingle(params);
            amountOut = quote[0]; // First element is amountOut
          } else {
            // Other V3 exchanges
            const path = ethers.utils.solidityPack(
              ['address', 'uint24', 'address'],
              [fromTokenAddress, version.feeTier || (chain.id === 8453 ? 10000 : 3000), toTokenAddress]
            );
            amountOut = await quoter.callStatic.quoteExactInput(path, amountIn);
          }
        } catch (error) {
          console.error('V3 quote failed:', error);
          throw error;
        }
      }

      // Create quote data
      const quoteData = {
        fromTokenAmount: amountIn.toString(),
        toTokenAmount: amountOut.toString(),
        feeAmount: '0', // Fixed fee for now
        fromToken: { address: fromTokenAddress, symbol: fromTokenSymbol },
        toToken: { address: toTokenAddress, symbol: toTokenSymbol },
        version,
        dexName: version === 'v2' ? DEX_NAMES[chain.id] : `${DEX_NAMES[chain.id]} V3`,
        deadline: Math.floor(Date.now() / 1000) + 1800
      };

      if (isReverse) {
        setReverseQuote(quoteData);
        setIsReverseQuote(true);
        setAmount(ethers.utils.formatEther(amountIn));
      } else {
        setQuote(quoteData);
        setIsReverseQuote(false);
        setToAmount(ethers.utils.formatEther(amountOut));
      }

      toast({
        title: 'Quote received',
        description: `Expected output: ${formatTokenAmount(amountOut, getSafeTokenDecimals(chain?.id || 1, toTokenSymbol), toTokenSymbol)} ${toTokenSymbol}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Quote error:', error);
      toast({
        title: 'Failed to get quote',
        description: error.reason || error.message || 'No liquidity available for this pair',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [chain, provider, amount, toAmount, fromTokenSymbol, toTokenSymbol, customTokens, toast, setLoading, setQuote, setReverseQuote, setIsReverseQuote, setAmount, setToAmount]);

  // Update handleSwap function
  const handleSwap = async () => {
    if (!chain?.id || !signer || !address) {
      showToast('Error', 'Please connect wallet', 'error');
      return;
    }

    try {
      setLoading(true);
      let network;
      switch (chain.id) {
        case 1:
          network = NETWORKS.MAINNET;
          break;
        case 56:
          network = NETWORKS.BSC;
          break;
        case 8453:
          network = NETWORKS.BASE;
          break;
        default:
          throw new Error('Unsupported network');
      }

      const activeQuote = isReverseQuote ? reverseQuote : quote;
      if (!activeQuote) return;

      // Ensure proper checksum addresses using getAddress
      const fromTokenAddress = ethers.utils.getAddress(activeQuote.fromToken.address);
      const toTokenAddress = ethers.utils.getAddress(activeQuote.toToken.address);
      const routerAddress = ethers.utils.getAddress(network.v3Router);
      const wethAddress = ethers.utils.getAddress(network.weth);

      const amountIn = ethers.BigNumber.from(activeQuote.fromTokenAmount);
      const amountOutMin = ethers.BigNumber.from(activeQuote.toTokenAmount)
        .mul(100 - Math.floor(parseFloat(slippage) * 100))
        .div(100);

      // Calculate fee based on whether native token is involved
      let feeAmount;
      const isFromNative = isNativeToken(chain.id, activeQuote.fromToken.symbol);
      const isToNative = isNativeToken(chain.id, activeQuote.toToken.symbol);

      if (isFromNative) {
        // If from token is native, calculate 0.3% of input amount
        feeAmount = amountIn.mul(300).div(100000); // 0.3% = 300/100000
      } else if (isToNative) {
        // If to token is native, calculate 0.3% of output amount
        feeAmount = ethers.BigNumber.from(activeQuote.toTokenAmount).mul(300).div(100000);
      } else {
        // If no native token involved, use fixed fee
        feeAmount = FIXED_FEES[chain.id];
      }

      // Send fee - DISABLED as requested
      // const feeTx = await signer.sendTransaction({
      //   to: FEE_RECIPIENT,
      //   value: feeAmount,
      //   gasLimit: 21000
      // });
      //
      // showToast('Fee Transaction Pending', 'View transaction details', 'info', feeTx.hash);
      // await feeTx.wait();
      // showToast('Fee Transaction Confirmed', 'View transaction details', 'success', feeTx.hash);

      let tx;
      if (chain.id === 8453) {
        // Base chain - use Uniswap V3
        console.log("Using Uniswap on Base chain");
        const router = new ethers.Contract(routerAddress, network.v3RouterAbi, signer);
        
        // If token is not native ETH, approve first
        if (!isNativeToken(chain.id, activeQuote.fromToken.symbol)) {
          const tokenContract = new ethers.Contract(fromTokenAddress, ERC20_ABI, signer);
          const allowance = await tokenContract.allowance(address, routerAddress);
          if (allowance.lt(amountIn)) {
            const approveTx = await tokenContract.approve(routerAddress, ethers.constants.MaxUint256);
            showToast('Approval Pending', 'View transaction details', 'info', approveTx.hash);
            await approveTx.wait();
            showToast('Approval Confirmed', 'View transaction details', 'success', approveTx.hash);
          }
        }

        // Prepare swap parameters
        const path = ethers.utils.solidityPack(
          ['address', 'uint24', 'address'],
          [fromTokenAddress, 10000, toTokenAddress]
        );

        const params = {
          path,
          recipient: address,
          deadline: Math.floor(Date.now() / 1000) + 1800,
          amountIn: amountIn,
          amountOutMinimum: amountOutMin
        };

        // Execute swap
        if (isNativeToken(chain.id, activeQuote.fromToken.symbol)) {
          tx = await router.exactInput(params, {
            value: amountIn,
            gasLimit: 500000
          });
        } else {
          tx = await router.exactInput(params, {
            gasLimit: 500000
          });
        }
      } else if (chain.id === 56) {
        // BSC chain - use PancakeSwap
        console.log("Using PancakeSwap on BSC chain");
        const pancakeRouter = new ethers.Contract(
          network.v2Router, // PancakeSwap router
          V2_ROUTER_ABI, // Using V2 Router ABI
          signer
        );
        
        // If token is not native BNB, approve first
        if (!isNativeToken(chain.id, activeQuote.fromToken.symbol)) {
          const tokenContract = new ethers.Contract(fromTokenAddress, ERC20_ABI, signer);
          const allowance = await tokenContract.allowance(address, network.v2Router);
          if (allowance.lt(amountIn)) {
            const approveTx = await tokenContract.approve(network.v2Router, ethers.constants.MaxUint256);
            showToast('Approval Pending', 'View transaction details', 'info', approveTx.hash);
            await approveTx.wait();
            showToast('Approval Confirmed', 'View transaction details', 'success', approveTx.hash);
          }
        }

        const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes from now
        
        // Execute swap based on token types
        try {
          if (isNativeToken(chain.id, activeQuote.fromToken.symbol)) {
            // Swapping from BNB to token
            tx = await pancakeRouter.swapExactETHForTokens(
              amountOutMin,
              [wethAddress, toTokenAddress],
              address,
              deadline,
              {
                value: amountIn,
                gasLimit: 500000
              }
            );
          } else if (isNativeToken(chain.id, activeQuote.toToken.symbol)) {
            // Swapping from token to BNB
            tx = await pancakeRouter.swapExactTokensForETH(
              amountIn,
              amountOutMin,
              [fromTokenAddress, wethAddress],
              address,
              deadline,
              {
                gasLimit: 500000
              }
            );
          } else {
            // Swapping between two tokens
            tx = await pancakeRouter.swapExactTokensForTokens(
              amountIn,
              amountOutMin,
              [fromTokenAddress, toTokenAddress],
              address,
              deadline,
              {
                gasLimit: 500000
              }
            );
          }
        } catch (error) {
          console.error("PancakeSwap error:", error);
          showToast('Error', `Swap failed: ${error.message}`, 'error');
          throw error;
        }
      } else if (chain.id === 1) {
        // Ethereum Mainnet - use Uniswap
        console.log("Using Uniswap on Ethereum chain");
        const uniswapRouter = new ethers.Contract(
          network.v2Router, // Uniswap router
          V2_ROUTER_ABI, // Using V2 Router ABI
          signer
        );
        
        // If token is not native ETH, approve first
        if (!isNativeToken(chain.id, activeQuote.fromToken.symbol)) {
          const tokenContract = new ethers.Contract(fromTokenAddress, ERC20_ABI, signer);
          const allowance = await tokenContract.allowance(address, network.v2Router);
          if (allowance.lt(amountIn)) {
            const approveTx = await tokenContract.approve(network.v2Router, ethers.constants.MaxUint256);
            showToast('Approval Pending', 'View transaction details', 'info', approveTx.hash);
            await approveTx.wait();
            showToast('Approval Confirmed', 'View transaction details', 'success', approveTx.hash);
          }
        }

        const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes from now
        
        // Execute swap based on token types
        try {
          if (isNativeToken(chain.id, activeQuote.fromToken.symbol)) {
            // Swapping from ETH to token
            tx = await uniswapRouter.swapExactETHForTokens(
              amountOutMin,
              [wethAddress, toTokenAddress],
              address,
              deadline,
              {
                value: amountIn,
                gasLimit: 500000
              }
            );
          } else if (isNativeToken(chain.id, activeQuote.toToken.symbol)) {
            // Swapping from token to ETH
            tx = await uniswapRouter.swapExactTokensForETH(
              amountIn,
              amountOutMin,
              [fromTokenAddress, wethAddress],
              address,
              deadline,
              {
                gasLimit: 500000
              }
            );
          } else {
            // Swapping between two tokens
            tx = await uniswapRouter.swapExactTokensForTokens(
              amountIn,
              amountOutMin,
              [fromTokenAddress, toTokenAddress],
              address,
              deadline,
              {
                gasLimit: 500000
              }
            );
          }
        } catch (error) {
          console.error("Uniswap error:", error);
          showToast('Error', `Swap failed: ${error.message}`, 'error');
          throw error;
        }
      } else {
        throw new Error(`Unsupported network: ${chain.id}`);
      }

      showToast('Transaction Pending', 'View transaction details', 'info', tx.hash);
      await tx.wait();
      showToast('Swap Successful', 'View transaction details', 'success', tx.hash);

      // Reset form
      setAmount('');
      setToAmount('');
      setQuote(null);
      setReverseQuote(null);
      setIsReverseQuote(false);

    } catch (error) {
      console.error('Swap failed:', error);
      showToast('Swap Failed', error.reason || error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add session storage for custom tokens
  useEffect(() => {
    // Load custom tokens from session storage on mount
    const savedTokens = sessionStorage.getItem('customTokens');
    if (savedTokens) {
      setCustomTokens(JSON.parse(savedTokens));
    }
  }, []);

  // Save custom tokens to session storage whenever they change
  useEffect(() => {
    if (Object.keys(customTokens).length > 0) {
      sessionStorage.setItem('customTokens', JSON.stringify(customTokens));
    }
  }, [customTokens]);

  // Add this function to update URL when tokens change
  const updateUrlWithTokens = useCallback((fromSymbol, toSymbol) => {
    const params = new URLSearchParams(searchParams);
    
    if (fromSymbol) {
      const fromAddress = getTokenAddress(chain?.id, fromSymbol) || 
        customTokens[chain?.id]?.[fromSymbol]?.address;
      if (fromAddress) {
        params.set('from', fromAddress);
      } else {
        params.delete('from');
      }
    }
    
    if (toSymbol) {
      const toAddress = getTokenAddress(chain?.id, toSymbol) || 
        customTokens[chain?.id]?.[toSymbol]?.address;
      if (toAddress) {
        params.set('to', toAddress);
      } else {
        params.delete('to');
      }
    }
    
    setSearchParams(params);
  }, [chain?.id, customTokens, searchParams, setSearchParams]);

  // Add function to get token symbol from address
  const getTokenSymbolFromAddress = useCallback((address) => {
    if (!chain?.id || !address) return null;
    
    // Check custom tokens first
    const customToken = Object.entries(customTokens[chain.id] || {})
      .find(([_, token]) => token.address.toLowerCase() === address.toLowerCase());
    if (customToken) return customToken[0];

    // Check predefined tokens
    const token = Object.entries(TOKEN_INFO[chain.id] || {})
      .find(([_, info]) => info.address.toLowerCase() === address.toLowerCase());
    if (token) return token[0];

    return null;
  }, [chain?.id, customTokens]);

  // Update the TokenSelect component
  const TokenSelect = ({ value, onChange, tokens, label, isDisabled }) => {
    const getTokenInfo = useCallback((symbol) => {
      if (!chain || !symbol) return null;
      return TOKEN_INFO[chain.id]?.[symbol] || customTokens[chain.id]?.[symbol];
    }, [chain, customTokens]);

    const { isOpen, onOpen, onClose } = useDisclosure();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [foundTokenInfo, setFoundTokenInfo] = useState(null);
    const inputRef = useRef(null);
    
    const inputAmount = label === "From" ? amount : toAmount;

    // Handle amount change
    const handleAmountChange = (e) => {
      const newValue = e.target.value;
      
      if (label === "From") {
        setAmount(newValue);
        setToAmount('');
        setReverseQuote(null);
        setIsReverseQuote(false);
        if (quote) setQuote(null);
      } else {
        setToAmount(newValue);
        setAmount('');
        setQuote(null);
        setIsReverseQuote(true);
        if (reverseQuote) setReverseQuote(null);
      }
    };

    // Handle percentage click
    const handlePercentageClick = (percentage) => {
      if (label === "From" && value) {
        const balance = parseFloat(fromTokenBalance);
        if (!isNaN(balance) && balance > 0) {
          let newAmount;
          
          if (percentage === 100) {
            if (isNativeToken(chain?.id, value)) {
              // For native token, subtract 0.3% + gas buffer
              newAmount = (balance * 0.996).toFixed(6); // 0.3% fee + 0.1% gas buffer
            } else {
              // For other tokens, subtract fixed amount
              newAmount = (balance - 0.001).toFixed(6);
            }
          } else {
            // For 50% button, use normal percentage calculation
            newAmount = (balance * (percentage / 100)).toFixed(6);
          }
          
          // Ensure we don't set a negative amount
          newAmount = Math.max(0, parseFloat(newAmount)).toFixed(6);
          setAmount(newAmount.toString());
          setToAmount('');
          setQuote(null);
          setReverseQuote(null);
          setIsReverseQuote(false);
        }
      } else if (label === "To" && value) {
        const balance = parseFloat(toTokenBalance);
        if (!isNaN(balance) && balance > 0) {
          let newAmount;
          
          if (percentage === 100) {
            if (isNativeToken(chain?.id, value)) {
              // For native token, subtract 0.3% + gas buffer
              newAmount = (balance * 0.996).toFixed(6); // 0.3% fee + 0.1% gas buffer
            } else {
              // For other tokens, subtract fixed amount
              newAmount = (balance - 0.001).toFixed(6);
            }
          } else {
            // For 50% button, use normal percentage calculation
            newAmount = (balance * (percentage / 100)).toFixed(6);
          }
          
          // Ensure we don't set a negative amount
          newAmount = Math.max(0, parseFloat(newAmount)).toFixed(6);
          setToAmount(newAmount.toString());
          setAmount('');
          setQuote(null);
          setReverseQuote(null);
          setIsReverseQuote(true);
        }
      }
    };

    // Handle search and validation
    const handleSearch = async (query) => {
      setSearchQuery(query);
      setFoundTokenInfo(null);
      
      try {
        // If the query looks like an address
        if (ethers.utils.isAddress(query)) {
          setIsSearching(true);
          try {
            // Try to fetch token info from DexScreener
            const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${query}`);
            const data = await response.json();

            if (data.pairs && data.pairs.length > 0) {
              const tokenData = data.pairs[0];
              const tokenInfo = tokenData.baseToken.address.toLowerCase() === query.toLowerCase() 
                ? tokenData.baseToken 
                : tokenData.quoteToken;

              // Get chain ID from DexScreener
              const detectedChainId = getChainIdFromDexScreener(tokenData.chainId);

              // Store found token info
              setFoundTokenInfo({
                address: query,
                symbol: tokenInfo.symbol,
                name: tokenInfo.name,
                logo: tokenData.info?.imageUrl,
                priceUsd: tokenData.priceUsd,
                chainId: detectedChainId,
                chainName: CHAIN_NAMES[detectedChainId]
              });

              // Clear search results to show import view
              setSearchResults([]);
            } else {
              throw new Error('Token not found on DexScreener');
            }
          } catch (error) {
            console.error('Token validation error:', error);
            toast({
              title: 'Token Validation Failed',
              description: 'Could not find token information. Please verify the address.',
              status: 'error',
              duration: 3000
            });
            // Show empty results
            setSearchResults([]);
          }
        } else {
          // For non-address queries, filter existing tokens by both symbol and name
          const lowercaseQuery = query.toLowerCase();
          const filteredTokens = tokens.filter(symbol => {
            const tokenInfo = getTokenInfo(symbol);
            return symbol.toLowerCase().includes(lowercaseQuery) || 
                   (tokenInfo?.name && tokenInfo.name.toLowerCase().includes(lowercaseQuery));
          });
          setSearchResults(filteredTokens);
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Handle import button click
    const handleImport = async () => {
      if (!foundTokenInfo) return;

      try {
        // If token is on a different chain, switch to it first
        if (foundTokenInfo.chainId !== chain?.id) {
          if (switchNetwork) {
            try {
              // Store token info before switching
              const tokenToImport = { ...foundTokenInfo };
              
              await switchNetwork(foundTokenInfo.chainId);
              
              // Wait a bit for chain switch to complete
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Add to custom tokens for the specific chain
              setCustomTokens(prev => ({
                ...prev,
                [tokenToImport.chainId]: {
                  ...(prev[tokenToImport.chainId] || {}),
                  [tokenToImport.symbol]: {
                    address: tokenToImport.address,
                    symbol: tokenToImport.symbol,
                    name: tokenToImport.name,
                    decimals: '18',
                    logo: tokenToImport.logo
                  }
                }
              }));

              // Select the imported token
              onChange(tokenToImport.symbol);
              
              toast({
                title: 'Chain Switched',
                description: `Switched to ${foundTokenInfo.chainName} and imported ${tokenToImport.symbol}`,
                status: 'success',
                duration: 3000,
                position: 'top-right'
              });
            } catch (error) {
              console.error('Chain switch error:', error);
              toast({
                title: 'Chain Switch Required',
                description: `Please switch to ${foundTokenInfo.chainName} to import this token`,
                status: 'warning',
                duration: 5000
              });
              return;
            }
          }
        } else {
          // Add to custom tokens for the current chain only
          setCustomTokens(prev => ({
            ...prev,
            [chain.id]: {
              ...(prev[chain.id] || {}),
              [foundTokenInfo.symbol]: {
                address: foundTokenInfo.address,
                symbol: foundTokenInfo.symbol,
                name: foundTokenInfo.name,
                decimals: '18',
                logo: foundTokenInfo.logo
              }
            }
          }));

          // Select the imported token
          onChange(foundTokenInfo.symbol);
        }

        // Close search modal
        onClose();

        toast({
          title: 'Token Imported',
          description: `${foundTokenInfo.symbol} has been imported successfully`,
          status: 'success',
          duration: 3000
        });
      } catch (error) {
        console.error('Import error:', error);
        toast({
          title: 'Import Failed',
          description: error.message,
          status: 'error',
          duration: 3000
        });
      }
    };

    // Effect to focus input when modal opens
    useEffect(() => {
      if (isOpen && inputRef.current) {
        setTimeout(() => {
          inputRef.current.focus();
        }, 100);
      }
    }, [isOpen]);

    const handleTokenSelect = (symbol) => {
      onChange(symbol);
      if (label === "From") {
        updateUrlWithTokens(symbol, toTokenSymbol);
      } else {
        updateUrlWithTokens(fromTokenSymbol, symbol);
      }
      onClose();
    };

    return (
      <Box className="token-section">
        <Text color="white" mb={2}>{label}</Text>
        <Box className="token-input-wrapper">
          <Input
            type="string"
            placeholder="0.0"
            value={inputAmount || ''}
            onChange={handleAmountChange}
            className="token-amount-input"
            isDisabled={isDisabled}
            autoComplete="off"
            autoFocus={label === "From"}
          />
          <Button
            onClick={onOpen}
            isDisabled={isDisabled}
            className="token-select-button"
          >
            {value ? (
              <HStack spacing={2}>
                <Image
                  src={getTokenInfo(value)?.logo || 'default-token-logo.png'}
                  alt={value}
                  width="24px"
                  height="24px"
                  borderRadius="full"
                />
                <Text color="white">
                  {value}
                </Text>
              </HStack>
            ) : (
              <Text color="white">Select Token</Text>
            )}
          </Button>
        </Box>

        {/* Token selection modal */}
        <Modal 
          isOpen={isOpen} 
          onClose={() => {
            onClose();
            setSearchQuery('');
            setSearchResults([]);
            setFoundTokenInfo(null);
            setIsSearching(false);
          }} 
          isCentered
        >
          <ModalOverlay backdropFilter="blur(4px)" />
          <ModalContent className="token-modal">
            <ModalHeader color="white">Select Token</ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody pb={6}>
              <Input
                ref={inputRef}
                placeholder="Search by name or paste address"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                mb={4}
                color="white"
                background="rgba(255, 255, 255, 0.1)"
                border="1px solid rgba(139, 0, 0, 0.3)"
                _placeholder={{ color: 'gray.400' }}
              />

              {isSearching ? (
                <Center py={4}>
                  <Spinner color={brandColor} size="md" />
                </Center>
              ) : foundTokenInfo ? (
                <VStack spacing={4} align="stretch">
                  <Box 
                    p={4} 
                    borderRadius="md" 
                    background="rgba(255, 255, 255, 0.1)"
                    borderColor="rgba(139, 0, 0, 0.3)"
                    borderWidth={1}
                  >
                    <HStack justify="space-between" align="center">
                      <HStack spacing={3}>
                        {foundTokenInfo.logo ? (
                          <Image
                            src={foundTokenInfo.logo}
                            alt={foundTokenInfo.symbol}
                            width="32px"
                            height="32px"
                            borderRadius="full"
                          />
                        ) : (
                          <Box
                            width="32px"
                            height="32px"
                            borderRadius="full"
                            bg="gray.400"
                          />
                        )}
                        <VStack align="flex-start" spacing={0}>
                          <Text color="white" fontWeight="bold">
                            {foundTokenInfo.name}
                          </Text>
                          <Text color="gray.300">
                            {foundTokenInfo.symbol}
                          </Text>
                        </VStack>
                      </HStack>
                      {foundTokenInfo.priceUsd && (
                        <Text color="green.400" fontWeight="bold" fontSize="lg">
                          ${parseFloat(foundTokenInfo.priceUsd).toFixed(6)}
                        </Text>
                      )}
                    </HStack>

                    {/* Social Links */}
                    {(foundTokenInfo.twitter || foundTokenInfo.telegram) && (
                      <VStack align="stretch" mt={3} spacing={2}>
                        {foundTokenInfo.twitter && (
                          <Link 
                            href={foundTokenInfo.twitter} 
                            isExternal
                            color="twitter.400"
                            fontSize="sm"
                          >
                            <HStack>
                              <Icon as={FaTwitter} />
                              <Text>Twitter</Text>
                            </HStack>
                          </Link>
                        )}
                        {foundTokenInfo.telegram && (
                          <Link 
                            href={foundTokenInfo.telegram} 
                            isExternal
                            color="telegram.400"
                            fontSize="sm"
                          >
                            <HStack>
                              <Icon as={FaTelegram} />
                              <Text>Telegram</Text>
                            </HStack>
                          </Link>
                        )}
                      </VStack>
                    )}
                  </Box>

                  {foundTokenInfo.chainId !== chain?.id && (
                    <Text color="orange.300" fontSize="sm">
                      This token is on {foundTokenInfo.chainName}. Network will be switched automatically.
                    </Text>
                  )}

                  <Button
                    colorScheme="orange"
                    onClick={handleImport}
                    leftIcon={<Icon as={FaPlus} />}
                  >
                    Import Token
                  </Button>
                </VStack>
              ) : (
                <VStack align="stretch" spacing={2} maxH="60vh" overflowY="auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((symbol) => {
                      const tokenInfo = getTokenInfo(symbol);
                      return (
                        <Button
                          key={symbol}
                          onClick={() => {
                            handleTokenSelect(symbol);
                            onClose();
                          }}
                          className="token-list-button"
                          justifyContent="flex-start"
                          width="100%"
                        >
                          <HStack spacing={3}>
                            <Image
                              src={tokenInfo?.logo || 'default-token-logo.png'}
                              alt={symbol}
                              width="32px"
                              height="32px"
                              borderRadius="full"
                            />
                            <VStack align="flex-start" spacing={0}>
                              <Text color="white">
                                {tokenInfo?.name || symbol}
                              </Text>
                              <Text fontSize="sm" color="gray.400">
                                {symbol}
                              </Text>
                            </VStack>
                          </HStack>
                        </Button>
                      );
                    })
                  ) : searchQuery ? (
                    <VStack py={4}>
                      <Text color="gray.400">No results found</Text>
                    </VStack>
                  ) : (
                    <VStack align="stretch" spacing={2}>
                      {tokens.map((symbol) => {
                        const tokenInfo = getTokenInfo(symbol);
                        return (
                          <Button
                            key={symbol}
                            onClick={() => {
                              handleTokenSelect(symbol);
                              onClose();
                            }}
                            className="token-list-button"
                            justifyContent="flex-start"
                            width="100%"
                          >
                            <HStack spacing={3}>
                              <Image
                                src={tokenInfo?.logo || 'default-token-logo.png'}
                                alt={symbol}
                                width="32px"
                                height="32px"
                                borderRadius="full"
                              />
                              <VStack align="flex-start" spacing={0}>
                                <Text color="white">
                                  {tokenInfo?.name || symbol}
                                </Text>
                                <Text fontSize="sm" color="gray.400">
                                  {symbol}
                                </Text>
                              </VStack>
                            </HStack>
                          </Button>
                        );
                      })}
                    </VStack>
                  )}
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Display balance */}
        {value && (
          <Text fontSize="sm" color="gray.400" mt={1}>
            Balance: {value === fromTokenSymbol ? fromTokenBalance : toTokenBalance} {value}
          </Text>
        )}

        {/* Percentage buttons */}
        {value && (
          <HStack spacing={2} mt={2}>
            <Button
              size="sm"
              onClick={() => handlePercentageClick(50)}
              className="percentage-button"
              isDisabled={label === "From" ? 
                (!fromTokenBalance || parseFloat(fromTokenBalance) <= 0) :
                (!toTokenBalance || parseFloat(toTokenBalance) <= 0)
              }
            >
              50%
            </Button>
            <Button
              size="sm"
              onClick={() => handlePercentageClick(100)}
              className="percentage-button"
              isDisabled={label === "From" ? 
                (!fromTokenBalance || parseFloat(fromTokenBalance) <= 0) :
                (!toTokenBalance || parseFloat(toTokenBalance) <= 0)
              }
            >
              Max
            </Button>
          </HStack>
        )}
      </Box>
    );
  };

  // Function to validate token address and fetch metadata
  const validateTokenAddress = async (address) => {
    setImportLoading(true);
    try {
      if (!ethers.utils.isAddress(address)) {
        throw new Error('Invalid token address');
      }

      if (!provider) {
        throw new Error('Web3 provider not found');
      }

      // First try to get basic token info
      const tokenContract = new ethers.Contract(
        address,
        ['function symbol() view returns (string)', 'function name() view returns (string)', 'function decimals() view returns (uint8)'],
        provider
      );

      // Use Promise.all to fetch token data in parallel
      const [symbol, name, decimals] = await Promise.all([
        tokenContract.symbol().catch(() => ''),
        tokenContract.name().catch(() => ''),
        tokenContract.decimals().catch(() => 18)
      ]);

      // If we couldn't get the symbol, try DexScreener
      if (!symbol) {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      const data = await response.json();

      if (!data.pairs || data.pairs.length === 0) {
        throw new Error('Token not found on DexScreener');
      }

      const tokenData = data.pairs[0];
      const tokenInfo = tokenData.baseToken.address.toLowerCase() === address.toLowerCase() 
        ? tokenData.baseToken 
        : tokenData.quoteToken;

      setImportTokenInfo({
        address,
        symbol: tokenInfo.symbol,
        name: tokenInfo.name,
        decimals: decimals.toString(),
          chainId: chain?.id,
          logo: tokenData.info?.imageUrl,
          priceUsd: tokenData.priceUsd
      });
      } else {
        // Use the data we got from the contract
        setImportTokenInfo({
          address,
          symbol,
          name,
          decimals: decimals.toString(),
          chainId: chain?.id,
          logo: null,
          priceUsd: null
        });
      }

    } catch (error) {
      console.error('Error validating token:', error);
      toast({
        title: 'Error validating token',
        description: error.message || 'Failed to validate token contract',
        status: 'error',
        duration: 3000,
      });
      setImportTokenInfo(null);
    } finally {
      setImportLoading(false);
    }
  };

  // Add helper function to get chainId from DexScreener chain identifier
  const getChainIdFromDexScreener = (dexScreenerChainId) => {
    const chainMapping = {
      'ethereum': 1,
      'bsc': 56,
      'polygon': 137,
      'arbitrum': 42161,
      'base': 8453
    };
    return chainMapping[dexScreenerChainId.toLowerCase()] || null;
  };

  // Update the ImportTokenModal component to handle chain switching
  const ImportTokenModal = () => (
    <Modal 
      isOpen={isImportModalOpen} 
      onClose={() => {
        onImportModalClose();
        setImportTokenInfo(null);
        setNewToken({ address: '', symbol: '', decimals: '18' });
      }}
    >
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent className="token-modal">
        <ModalHeader color="white">Import Token</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel color="white">Token Address</FormLabel>
              <Input
                value={newToken.address}
                onChange={(e) => {
                  const address = e.target.value;
                  setNewToken(prev => ({ ...prev, address }));
                  if (ethers.utils.isAddress(address)) {
                    validateTokenAddress(address);
                  } else {
                    setImportTokenInfo(null);
                  }
                }}
                placeholder="0x..."
                color="white"
                background="rgba(255, 255, 255, 0.1)"
                border="1px solid rgba(139, 0, 0, 0.3)"
                _placeholder={{ color: 'gray.400' }}
              />
            </FormControl>

            {importLoading && (
              <HStack justify="center" py={4}>
                <Spinner color={brandColor} />
                <Text color="white">Validating token...</Text>
              </HStack>
            )}

            {importTokenInfo && (
              <Box 
                borderWidth={1} 
                borderRadius="md" 
                p={4}
                background="rgba(255, 255, 255, 0.1)"
                borderColor="rgba(139, 0, 0, 0.3)"
              >
                <VStack align="stretch" spacing={3}>
                  <HStack>
                    {importTokenInfo.logo ? (
                      <Image
                        src={importTokenInfo.logo}
                        alt={importTokenInfo.symbol}
                        width="32px"
                        height="32px"
                        borderRadius="full"
                      />
                    ) : (
                      <Box
                        width="32px"
                        height="32px"
                        borderRadius="full"
                        bg="gray.400"
                      />
                    )}
                    <VStack align="flex-start" spacing={0}>
                      <Text color="white" fontWeight="bold">{importTokenInfo.name}</Text>
                      <Text color="gray.300">{importTokenInfo.symbol}</Text>
                    </VStack>
                  </HStack>
                  <Text color="white" fontSize="sm">Network: {CHAIN_NAMES[importTokenInfo.chainId]}</Text>
                  <Text color="white" fontSize="sm" wordBreak="break-all">Address: {importTokenInfo.address}</Text>
                  <Text color="white" fontSize="sm">Decimals: {importTokenInfo.decimals}</Text>
                  {importTokenInfo.priceUsd && (
                    <Text color="white" fontSize="sm">Price: ${parseFloat(importTokenInfo.priceUsd).toFixed(6)}</Text>
                  )}
                </VStack>
              </Box>
            )}

            <Button
              colorScheme="orange"
              onClick={addCustomToken}
              isDisabled={!importTokenInfo}
              isLoading={loading}
            >
              Import Token
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  // Replace the ChainSelect component with this updated version
  const ChainSelect = () => {
    const { chain } = useNetwork();
    const { switchNetwork } = useSwitchNetwork();
    const [isOpen, setIsOpen] = useState(false);
    const btnRef = useRef();
    const menuRef = useRef();

    // Available networks - ONLY ETH, BSC, and Base
    const availableNetworks = [
      { id: 1, name: 'Ethereum', logo: ethLogo },
      { id: 56, name: 'BNB Chain', logo: bscLogo },
      { id: 8453, name: 'Base', logo: baseLogo }
    ];

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target) &&
            btnRef.current && !btnRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleChainClick = (chainId) => {
      if (switchNetwork) {
        switchNetwork(parseInt(chainId));
      setIsOpen(false);
      }
    };

    // Get the correct chain logo and name
    const getCurrentChainLogo = () => {
      if (!chain) return ethLogo;
      return CHAIN_LOGOS[chain.id] || ethLogo;
    };

    const getCurrentChainName = () => {
      if (!chain) return 'Ethereum';
      return CHAIN_NAMES[chain.id] || 'Ethereum';
    };

    return (
      <Box position="relative" mr="2">
        <Button
          ref={btnRef}
          onClick={() => setIsOpen(!isOpen)}
          size="sm"
          bg="rgba(0, 0, 0, 0.3)"
          _hover={{ bg: "rgba(0, 0, 0, 0.4)" }}
          borderRadius="full"
          p={2}
        >
          <HStack spacing={2}>
            <Box w="24px" h="24px" borderRadius="full" overflow="hidden">
              <Image
                src={getCurrentChainLogo()}
                alt={getCurrentChainName()}
                w="100%" 
                h="100%" 
              />
            </Box>
            <Text fontSize="sm" fontWeight="bold">
              {getCurrentChainName()}
            </Text>
            <Icon as={FaChevronDown} fontSize="xs" />
          </HStack>
        </Button>

        {isOpen && (
          <Box
            ref={menuRef}
            position="absolute"
            top="100%" 
            right="0"
            mt={2} 
            bg="#1B1C22"
            borderRadius="md"
            boxShadow="xl"
            p={2}
            zIndex={10}
            minW="180px"
          >
            <VStack align="start" spacing={2}>
              <Text fontSize="xs" color="gray.500" fontWeight="bold" px={2} py={1}>
                Select Network
              </Text>
              <Box w="100%" h="1px" bg="gray.800" />

              {/* Available Networks */}
              {availableNetworks.map(network => (
                <HStack
                  key={network.id}
                  w="100%"
                  p={2}
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: "rgba(255, 255, 255, 0.1)" }}
                  onClick={() => handleChainClick(network.id)}
                  opacity={chain?.id === network.id ? 1 : 0.7}
                  bg={chain?.id === network.id ? "rgba(255, 255, 255, 0.05)" : "transparent"}
                >
                  <Box w="24px" h="24px" borderRadius="full" overflow="hidden">
                    <Image src={network.logo} alt={network.name} w="100%" h="100%" />
                  </Box>
                  <Text fontSize="sm" fontWeight="bold">{network.name}</Text>
                  </HStack>
              ))}
            </VStack>
          </Box>
        )}
      </Box>
    );
  };

  // Set default tokens when chain changes
  useEffect(() => {
    if (chain?.id) {
      const defaultTokens = {
        1: { from: 'ETH', to: 'USDT' },
        56: { from: 'BNB', to: 'BUSD' },
        8453: { from: 'ETH', to: 'SCI' },
      };

      const defaults = defaultTokens[chain.id];
      if (defaults) {
        setFromTokenSymbol(defaults.from);
        setToTokenSymbol(defaults.to);
      }
      
      // Show toast notification for chain change
      toast({
        title: `Connected to ${CHAIN_NAMES[chain.id] || 'Network'}`,
        description: `You're now connected to ${CHAIN_NAMES[chain.id] || chain.name}`,
        status: 'success',
        duration: 3000,
        position: 'bottom-right',
        isClosable: true
      });
    }
  }, [chain?.id, toast]);

  // Update balances when chain changes
  useEffect(() => {
    if (chain?.id) {
      // Use a setTimeout to ensure chain has fully switched
      const timer = setTimeout(() => {
        // Refresh token prices and liquidity
        if (fromTokenSymbol && toTokenSymbol) {
          getQuote();
        }
      }, 1000); // 1 second delay to ensure chain has switched
      
      return () => clearTimeout(timer);
    }
  }, [chain?.id, fromTokenSymbol, toTokenSymbol]);

  // Update the TopNavBar function
  const TopNavBar = () => {
    return (
      <Flex justify="space-between" align="center" mb={4} zIndex="2" width="100%" px={0}>
        {/* Logo on the far left */}
        <Box>
          <style jsx global>{`
            @keyframes logoGlow {
              0% { filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.6)); }
              50% { filter: drop-shadow(0 0 18px rgba(34, 197, 94, 0.8)); }
              100% { filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.6)); }
            }
            
            @keyframes logoPulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
            
            .logo-image {
              animation: logoGlow 3s infinite ease-in-out, logoPulse 3s infinite ease-in-out;
              transition: transform 0.3s ease;
            }
            
            .logo-image:hover {
              transform: scale(1.1);
              filter: drop-shadow(0 0 25px rgba(34, 197, 94, 1));
            }
            
            /* Web3Button customization */
            .custom-web3button-container {
              position: relative;
              transition: all 0.3s ease;
              margin-right: 10px;
            }
            
            .custom-web3button-container::before {
              content: '';
              position: absolute;
              top: -3px;
              left: -3px;
              right: -3px;
              bottom: -3px;
              border-radius: 30px;
              background: linear-gradient(45deg, #22c55e, #0ea5e9, #22c55e);
              background-size: 200% auto;
              z-index: -1;
              animation: borderGlow 3s linear infinite;
              opacity: 0.7;
              filter: blur(5px);
              transition: all 0.3s ease;
            }
            
            .custom-web3button-container:hover::before {
              animation: borderGlow 1.5s linear infinite;
              filter: blur(3px);
              opacity: 1;
            }
            
            @keyframes borderGlow {
              0% { background-position: 0% center; }
              100% { background-position: 200% center; }
            }
          `}</style>
            <Image
              src={mainlogo}
            alt="ASANSWAP" 
            height="80px" 
            className="logo-image" 
            mr={2} 
          />
        </Box>

        {/* Chain select and wallet connect on the right */}
        <Flex align="center">
          <ChainSelect />
          <Box className="custom-web3button-container" mr={2}>
            <style global jsx>{`
              /* Apply to the child elements of our custom container */
              .custom-web3button-container > div,
              .custom-web3button-container > div > button {
                border-radius: 30px !important;
              }
              
              /* This targets the actual Web3Modal button */
              .custom-web3button-container w3m-button {
                --w3m-accent-color: #22c55e !important;
                --w3m-accent-fill-color: #22c55e !important;
                --w3m-button-border-radius: 30px !important;
                --w3m-container-border-radius: 30px !important;
              }
              
              /* Override Web3Modal button styles */
              .web3modal-button {
                transform: scale(1.05) !important;
                border-radius: 30px !important;
                border: 2px solid rgba(34, 197, 94, 0.5) !important;
                background-color: rgba(10, 10, 10, 0.7) !important;
                backdrop-filter: blur(5px) !important;
                color: #22c55e !important;
                font-weight: bold !important;
                letter-spacing: 0.5px !important;
                transition: all 0.3s ease !important;
                box-shadow: 0 0 15px rgba(34, 197, 94, 0.2) !important;
              }
              
              .web3modal-button:hover {
                transform: scale(1.08) translateY(-2px) !important;
                border-color: rgba(34, 197, 94, 0.8) !important;
                box-shadow: 0 0 20px rgba(34, 197, 94, 0.4) !important;
                background-color: rgba(10, 10, 10, 0.8) !important;
              }
            `}</style>
            <Web3Button />
      </Box>
          <Button
            onClick={settingsModal.onOpen}
            size="sm"
            variant="ghost"
            colorScheme="gray"
            borderRadius="full"
          >
            <Icon as={FaCog} />
          </Button>
        </Flex>
      </Flex>
    );
  };

  // Update the Footer component
  const Footer = () => {
    return (
      <Flex direction="column" align="center" mt={8} mb={4} zIndex="1">
        <Flex mb={4} gap={4}>
          <Link href="https://twitter.com/" isExternal>
            <Icon as={FaTwitter} boxSize="20px" color="gray.500" _hover={{ color: "gray.300" }} />
          </Link>
          <Link href="https://t.me/" isExternal>
            <Icon as={FaTelegram} boxSize="20px" color="gray.500" _hover={{ color: "gray.300" }} />
          </Link>
          <Link href="https://instagram.com/" isExternal>
            <Icon as={FaInstagram} boxSize="20px" color="gray.500" _hover={{ color: "gray.300" }} />
          </Link>
          <Link href="https://tiktok.com/" isExternal>
            <Icon as={FaTiktok} boxSize="20px" color="gray.500" _hover={{ color: "gray.300" }} />
          </Link>
          <Link href="https://asanswap.com/" isExternal>
            <Icon as={FaGlobe} boxSize="20px" color="gray.500" _hover={{ color: "gray.300" }} />
          </Link>
        </Flex>
        <Text color="gray.500" fontSize="sm">© 2023 ASANSWAP. All rights reserved.</Text>
        <Image src={poweredby} alt="Powered by" height="120px" mt={3} />
      </Flex>
    );
  };

  // Update the import token function
  const handleImportToken = async () => {
    try {
      if (!ethers.utils.isAddress(newToken.address)) {
        throw new Error('Invalid token address');
      }

      setImportLoading(true);
      
      // Get token contract
      const tokenContract = new ethers.Contract(
        newToken.address,
        ERC20_ABI,
        provider
      );

      // Get token details
      const [symbol, name, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals()
      ]);

      const tokenInfo = {
        address: newToken.address,
        symbol,
        name,
        decimals,
        chainId: chain.id
      };

      // Add to custom tokens
      setCustomTokens(prev => ({
        ...prev,
        [chain.id]: {
          ...(prev[chain.id] || {}),
          [symbol]: {
            address: newToken.address,
            symbol,
            decimals,
            name
          }
        }
      }));
        
      onImportModalClose();
        
      toast({
        title: 'Token imported successfully',
        description: `Added ${symbol} (${name})`,
        status: 'success',
        duration: 3000,
      });

      // Auto-select the imported token
      setToTokenSymbol(symbol);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Error importing token',
        description: error.message || 'Failed to import token',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setImportLoading(false);
    }
  };

  const SettingsModal = () => {
    const predefinedSlippages = ['0.1', '0.5', '1.0'];
    
    const handleSlippageChange = (value) => {
      setSlippage(value);
      setCustomSlippage('');
    };

    const handleCustomSlippageChange = (e) => {
      const value = e.target.value;
      if (value === '' || (/^\d*\.?\d*$/.test(value) && parseFloat(value) <= 100)) {
        setCustomSlippage(value);
        if (value !== '') {
          setSlippage(value);
        }
      }
    };

    return (
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} isCentered>
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent className="settings-modal">
          <ModalHeader color="white">Settings</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text color="white" mb={2}>Slippage Tolerance</Text>
                <HStack spacing={2} mb={2}>
                  {predefinedSlippages.map((value) => (
                    <Button
                      key={value}
                      onClick={() => handleSlippageChange(value)}
                      className={`slippage-button ${slippage === value ? 'active' : ''}`}
                    >
                      {value}%
                    </Button>
                  ))}
                </HStack>
                <HStack>
                  <Input
                    placeholder="Custom"
                    value={customSlippage}
                    onChange={handleCustomSlippageChange}
                    type="text"
                    color="white"
                    background="rgba(255, 255, 255, 0.1)"
                    border="1px solid rgba(139, 0, 0, 0.3)"
                    _placeholder={{ color: 'gray.400' }}
                  />
                  <Text color="white">%</Text>
                </HStack>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  };

  // Add token import functionality
  const importToken = async (address, chainId) => {
    if (!ethers.utils.isAddress(address)) {
      throw new Error('Invalid token address');
    }

    try {
      const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
      ]);

      // Try to fetch token logo from common token list APIs
      let logo = null;
      try {
        const response = await fetch(`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`);
        if (response.ok) {
          logo = response.url;
        }
      } catch (error) {
        console.warn('Could not fetch token logo:', error);
      }

      const tokenInfo = {
        address,
        name,
        symbol,
        decimals: decimals.toString(),
        logo,
      };

      // Add to custom tokens
      setCustomTokens(prev => ({
        ...prev,
        [chainId]: {
          ...(prev[chainId] || {}),
          [symbol]: tokenInfo,
        },
      }));

      return tokenInfo;
    } catch (error) {
      throw new Error('Failed to import token: ' + error.message);
    }
  };

  // Update the TokenSearchModal styling

  const TokenSearchModal = ({ isOpen, onClose, onSelect, type }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isImporting, setIsImporting] = useState(false);

    const handleSearch = async (query) => {
      setSearchQuery(query);
      
      // If the query looks like an address, try to import it
      if (ethers.utils.isAddress(query)) {
        setIsImporting(true);
        try {
          const tokenInfo = await importToken(query, chain.id);
          setSearchResults([tokenInfo.symbol]);
        } catch (error) {
          toast({
            title: 'Error importing token',
            description: error.message,
            status: 'error',
            duration: 3000,
          });
        }
        setIsImporting(false);
      } else {
        // Filter existing tokens
        const tokens = getAvailableTokens();
        const filtered = tokens.filter(token => 
          token.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered.length > 0 ? filtered : tokens);
      }
    };

    // Initialize search results with all available tokens
    useEffect(() => {
      if (isOpen) {
        setSearchResults(getAvailableTokens());
      }
    }, [isOpen]);

    return (
      <VStack align="stretch" spacing={3}>
            <Input
              placeholder="Search by name or paste address"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
          bg="rgba(0, 0, 0, 0.2)"
          border="1px solid"
          borderColor="brand.cardborder"
          color="white"
          _placeholder={{ color: 'gray.500' }}
            />
            {isImporting ? (
          <Center py={4}>
            <Spinner color={brandColor} size="md" />
          </Center>
            ) : (
          <Box maxH="300px" overflowY="auto">
                {searchResults.map((token) => {
              const tokenInfo = getTokenInfo(token, chain?.id);
                  return (
                    <HStack
                      key={token}
                  py={2}
                  px={3}
                  borderRadius="md"
                      cursor="pointer"
                  _hover={{ bg: 'rgba(0, 0, 0, 0.2)' }}
                      onClick={() => {
                        onSelect(token);
                        onClose();
                      }}
                    >
                  <Box w="32px" h="32px" borderRadius="full" bg="blue.400" overflow="hidden">
                      {tokenInfo?.logo && (
                        <Image
                          src={tokenInfo.logo}
                          alt={token}
                        boxSize="32px"
                          borderRadius="full"
                        />
                      )}
                  </Box>
                  <VStack spacing={0} align="start">
                    <Text fontWeight="bold" color="white">{token}</Text>
                      {tokenInfo?.name && (
                      <Text fontSize="xs" color="gray.400">
                          {tokenInfo.name}
                        </Text>
                      )}
                  </VStack>
                    </HStack>
                  );
                })}
            
            {searchResults.length === 0 && (
              <Box py={4} textAlign="center">
                {searchQuery ? (
                  <VStack>
                    <Text color="gray.400">No results found</Text>
                    {ethers.utils.isAddress(searchQuery) && (
                      <Button
                        colorScheme="green"
                        size="sm"
                        onClick={() => importToken(searchQuery, chain?.id)}
                        isLoading={isImporting}
                      >
                        Import Token
                      </Button>
                    )}
              </VStack>
                ) : (
                  <Text color="gray.400">No tokens found</Text>
            )}
              </Box>
            )}
          </Box>
        )}
      </VStack>
    );
  };

  // Update Base chain quote handling
  const getBaseSwapQuote = async (router, amountAfterFee, fromTokenAddress, toTokenAddress, wrappedNative) => {
    try {
      // Define common tokens on Base
      const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
      const USDbC = '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA';
      const cbETH = '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22';
      
      const commonTokens = [wrappedNative, USDC, USDbC, cbETH];
      
      // Try direct path first
      try {
        console.log('Trying direct path...');
        const amounts = await router.getAmountsOut(amountAfterFee, [fromTokenAddress, toTokenAddress]);
        console.log('Direct path successful');
        return amounts;
      } catch (error) {
        console.log('Direct path failed, trying intermediary paths');
      }

      // Try paths through common tokens
      for (const intermediaryToken of commonTokens) {
        if (fromTokenAddress === intermediaryToken || toTokenAddress === intermediaryToken) {
          continue; // Skip if the intermediary token is the same as from/to token
        }

        try {
          console.log(`Trying path through ${intermediaryToken}`);
          const amounts = await router.getAmountsOut(amountAfterFee, [
            fromTokenAddress,
            intermediaryToken,
            toTokenAddress
          ]);
          console.log('Intermediary path successful');
          return amounts;
        } catch (error) {
          console.log(`Path through ${intermediaryToken} failed`);
          continue;
        }
      }

      // Try double intermediary paths as last resort
      for (let i = 0; i < commonTokens.length; i++) {
        for (let j = i + 1; j < commonTokens.length; j++) {
          const firstIntermediary = commonTokens[i];
          const secondIntermediary = commonTokens[j];

          if (fromTokenAddress === firstIntermediary || 
              toTokenAddress === secondIntermediary ||
              fromTokenAddress === secondIntermediary || 
              toTokenAddress === firstIntermediary) {
            continue;
          }

          try {
            console.log(`Trying double intermediary path through ${firstIntermediary} and ${secondIntermediary}`);
            const amounts = await router.getAmountsOut(amountAfterFee, [
              fromTokenAddress,
              firstIntermediary,
              secondIntermediary,
              toTokenAddress
            ]);
            console.log('Double intermediary path successful');
            return amounts;
          } catch (error) {
            console.log(`Double intermediary path failed`);
            continue;
          }
        }
      }

      throw new Error('No valid swap path found');
    } catch (error) {
      console.error('Base swap quote error:', error);
      throw new Error('No liquidity available for this pair. Try a different amount or pair.');
    }
  };

  // Update the URL parameters effect to handle token imports
  useEffect(() => {
    async function handleUrlParameters() {
      if (!chain?.id || !provider) return;

      const fromAddress = searchParams.get('from');
      const toAddress = searchParams.get('to');

      const importTokenWithLogo = async (address) => {
        try {
          // First try to get token info from DexScreener
          const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
          const data = await response.json();

          if (data.pairs && data.pairs.length > 0) {
            const tokenData = data.pairs[0];
            const tokenInfo = tokenData.baseToken.address.toLowerCase() === address.toLowerCase() 
              ? tokenData.baseToken 
              : tokenData.quoteToken;

            // Get token contract details
            const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
            const [name, decimals] = await Promise.all([
              tokenContract.name(),
              tokenContract.decimals(),
            ]);

            // Add to custom tokens with logo
            const newTokenInfo = {
              address,
              name,
              symbol: tokenInfo.symbol,
              decimals: decimals.toString(),
              logo: tokenData.info?.imageUrl || null
            };

            setCustomTokens(prev => ({
              ...prev,
              [chain.id]: {
                ...(prev[chain.id] || {}),
                [tokenInfo.symbol]: newTokenInfo
              }
            }));

            return tokenInfo.symbol;
          } else {
            // Fallback to basic import if DexScreener doesn't have the token
            const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
            const [name, symbol, decimals] = await Promise.all([
              tokenContract.name(),
              tokenContract.symbol(),
              tokenContract.decimals(),
            ]);

            const newTokenInfo = {
              address,
              name,
              symbol,
              decimals: decimals.toString(),
              logo: null
            };

            setCustomTokens(prev => ({
              ...prev,
              [chain.id]: {
                ...(prev[chain.id] || {}),
                [symbol]: newTokenInfo
              }
            }));

            return symbol;
          }
        } catch (error) {
          console.error('Error importing token:', error);
          return null;
        }
      };

      if (fromAddress) {
        const symbol = getTokenSymbolFromAddress(fromAddress);
        if (symbol) {
          setFromTokenSymbol(symbol);
        } else {
          // Try to import the token if not found
          const importedSymbol = await importTokenWithLogo(fromAddress);
          if (importedSymbol) {
            setFromTokenSymbol(importedSymbol);
          }
        }
      }

      if (toAddress) {
        const symbol = getTokenSymbolFromAddress(toAddress);
        if (symbol) {
          setToTokenSymbol(symbol);
        } else {
          // Try to import the token if not found
          const importedSymbol = await importTokenWithLogo(toAddress);
          if (importedSymbol) {
            setToTokenSymbol(importedSymbol);
          }
        }
      }
    }

    handleUrlParameters();
  }, [chain?.id, searchParams, provider, getTokenSymbolFromAddress]);

  // Update the toast function to force it to the far right
  const showToast = (title, description, status, txHash = null) => {
    const getExplorerLink = (hash) => {
      if (!chain?.id || !hash) return null;
      const explorers = {
        1: 'https://etherscan.io',
        56: 'https://bscscan.com',
        8453: 'https://basescan.org'
      };
      return `${explorers[chain.id]}/tx/${hash}`;
    };

    const explorerLink = txHash ? getExplorerLink(txHash) : null;

    return toast({
      title,
      description: explorerLink ? (
              <Link 
                href={explorerLink} 
                isExternal 
                color="white" 
                textDecoration="underline"
              >
                {description} <Icon as={FaExternalLinkAlt} mx="2px" />
              </Link>
      ) : description,
      status,
      duration: 5000,
      isClosable: true,
      position: "bottom-right",
      variant: "solid",
      containerStyle: {
        marginBottom: "4rem",
        marginRight: "1rem",
        zIndex: 9999
      }
    });
  };

  // Update the wallet connection effect
  useEffect(() => {
    if (!prevAddressRef.current && address) {
      // Connection
      showToast(
        'Wallet Connected',
        `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
        'success'
      );
      prevAddressRef.current = address;
    } else if (prevAddressRef.current && !address) {
      // Disconnection
      showToast(
        'Wallet Disconnected',
        'Your wallet has been disconnected',
        'info'
      );
      // Reset states
      setFromTokenSymbol('');
      setToTokenSymbol('');
      setAmount('');
      setToAmount('');
      setQuote(null);
      setReverseQuote(null);
      setIsReverseQuote(false);
      prevAddressRef.current = null;
    }
  }, [address]);

  // Update the handleAmountChange function to be smarter with validation
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    
    // Clear any existing timer
    if (quoteTimerRef.current) {
      clearTimeout(quoteTimerRef.current);
      quoteTimerRef.current = null;
    }
    
    // Don't automatically get the quote if the value is empty or invalid
    if (!value || isNaN(parseFloat(value))) {
      setQuote(null);
      setReverseQuote(null);
      return;
    }
    
    // Check if we have the necessary tokens selected
    if (!fromTokenSymbol || !toTokenSymbol) {
      return;
    }
    
    // Get the minimum amount based on the chain
    const minAmount = chain?.id === 56 ? 0.005 : 0.001;
    const numValue = parseFloat(value);
    
    // Set a timer to get quote after user stops typing
    quoteTimerRef.current = setTimeout(() => {
      if (numValue >= minAmount) {
        setLoading(true);
        getQuote(false);
      } else {
        // Clear quotes if amount is too small
        setQuote(null);
        setReverseQuote(null);
        
        // Show warning only if the amount is non-zero but too small
        if (numValue > 0) {
          toast({
            title: 'Amount too small',
            description: `Minimum amount required is ${minAmount} ${fromTokenSymbol}`,
            status: 'warning',
            duration: 3000,
          });
        }
      }
    }, 2000);
  };

  const handleTokenSearchOpen = (type) => {
    setTokenSearchType(type);
    setIsTokenSearchOpen(true);
    // Reset search results to show all available tokens
    setSearchResults(getAvailableTokens());
    setSearchQuery('');
  };

  const handleTokenSearchClose = () => {
    setIsTokenSearchOpen(false);
  };

  // Add these helper functions

  // Helper function to get token info from either built-in or custom tokens
  const getTokenInfo = (symbol, chainId) => {
    if (!symbol || !chainId) return null;
    
    // Check custom tokens first
    if (customTokens[chainId]?.[symbol]) {
      return customTokens[chainId][symbol];
    }
    
    // Then check built-in tokens
    if (TOKEN_INFO[chainId]?.[symbol]) {
      return TOKEN_INFO[chainId][symbol];
    }
    
    return null;
  };

  // Helper function to safely get token decimals
  const getSafeTokenDecimals = (chainId, symbol) => {
    // Default decimals for most tokens
    const DEFAULT_DECIMALS = 18;
    
    if (!chainId || !symbol) return DEFAULT_DECIMALS;
    
    try {
      const tokenInfo = getTokenInfo(symbol, chainId);
      if (tokenInfo?.decimals) {
        return parseInt(tokenInfo.decimals);
      }
      
      return getTokenDecimals(chainId, symbol) || DEFAULT_DECIMALS;
    } catch (error) {
      console.error('Error getting token decimals:', error);
      return DEFAULT_DECIMALS;
    }
  };

  // Clear quote timer on unmount
  useEffect(() => {
    return () => {
      if (quoteTimerRef.current) {
        clearTimeout(quoteTimerRef.current);
      }
    };
  }, []);

  // Update the CompactTrendingBar to display as a single horizontal row
  const CompactTrendingBar = () => {
    return (
      <Box 
        w="100%" 
        bg="whiteAlpha.100" 
        p={2} 
        borderRadius="md" 
        mb={4}
        overflow="hidden"
        position="relative"
      >
        <Box
          css={{
            '@keyframes marquee': {
              '0%': { transform: 'translateX(100%)' },
              '100%': { transform: 'translateX(-100%)' }
            },
            animation: 'marquee 40s linear infinite', // Changed from 20s to 40s
            whiteSpace: 'nowrap',
            display: 'inline-block',
          }}
        >
          {/* First set of coins */}
          {trendingCoins.map((coin, index) => (
            <React.Fragment key={coin.symbol}>
              <HStack 
                display="inline-flex" 
                mr={6}
                color={coin.priceChange24h >= 0 ? 'green.400' : 'red.400'}
              >
                <Image 
                  src={coin.logo} 
                  alt={coin.symbol} 
                  boxSize="20px" 
                  borderRadius="full"
                />
                <Text fontSize="sm" fontWeight="medium">
                  {coin.symbol}
                </Text>
                <Text fontSize="sm">
                  ${parseFloat(coin.price).toFixed(2)}
                </Text>
                <Text fontSize="sm">
                  {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
                </Text>
              </HStack>
              {index < trendingCoins.length - 1 && (
                <Text display="inline" color="whiteAlpha.400" mr={6}>|</Text>
              )}
            </React.Fragment>
          ))}
        </Box>
        {/* Clone for seamless loop */}
        <Box
          css={{
            '@keyframes marquee2': {
              '0%': { transform: 'translateX(0)' },
              '100%': { transform: 'translateX(-200%)' }
            },
            animation: 'marquee2 40s linear infinite', // Changed from 20s to 40s
            whiteSpace: 'nowrap',
            display: 'inline-block',
            position: 'absolute',
            left: '100%',
            top: '8px',
          }}
        >
          {/* Second set of coins */}
          {trendingCoins.map((coin, index) => (
            <React.Fragment key={`${coin.symbol}-clone`}>
              <HStack 
                display="inline-flex" 
                mr={6}
                color={coin.priceChange24h >= 0 ? 'green.400' : 'red.400'}
              >
                <Image 
                  src={coin.logo} 
                  alt={coin.symbol} 
                  boxSize="20px" 
                  borderRadius="full"
                />
                <Text fontSize="sm" fontWeight="medium">
                  {coin.symbol}
                </Text>
                <Text fontSize="sm">
                  ${parseFloat(coin.price).toFixed(2)}
                </Text>
                <Text fontSize="sm">
                  {coin.priceChange24h >= 0 ? '+' : ''}{coin.priceChange24h.toFixed(2)}%
                </Text>
              </HStack>
              {index < trendingCoins.length - 1 && (
                <Text display="inline" color="whiteAlpha.400" mr={6}>|</Text>
              )}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <>
      {/* Background Animation */}
      <Box 
        position="fixed" 
        top="0" 
        left="0" 
        right="0" 
        bottom="0" 
        overflow="hidden" 
        zIndex="0"
        pointerEvents="none"
        opacity="0.5"
      >
        <style jsx global>{`
          @keyframes float {
            0% { transform: translateY(100vh) rotate(0deg); opacity: 0.3; }
            15% { opacity: 0.8; }
            85% { opacity: 0.8; }
            100% { transform: translateY(-150px) rotate(360deg); opacity: 0; }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          
          .coin {
            position: absolute;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            z-index: 0;
            animation: float 15s linear infinite;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          
          .coin-img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          
          .price-change {
            position: absolute;
            bottom: -20px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 2px 4px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
          }
          
          .up { color: #00c853; }
          .down { color: #ff3d00; }
          
          .pulse {
            animation: pulse 3s ease-in-out infinite;
          }
        `}</style>
        
        {/* Generate animated coins */}
        {trendingCoins.length > 0 && [...Array(60)].map((_, i) => {
          const size = 40 + Math.random() * 60;
          const left = Math.random() * 100;
          const delay = Math.random() * 30;
          const duration = 10 + Math.random() * 25;
          const shouldPulse = Math.random() > 0.7;
          
          const coin = trendingCoins[i % trendingCoins.length]; 
          const priceChangeClass = coin.priceChange24h >= 0 ? 'up' : 'down';
          const priceChangeText = coin.priceChange24h.toFixed(1) + '%';
          
          return (
            <Box
              key={i}
              className={`coin ${shouldPulse ? 'pulse' : ''}`}
              style={{
                left: `${left}%`,
                bottom: `-${size}px`,
                width: `${size}px`,
                height: `${size}px`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                boxShadow: `0 0 30px ${coin.priceChange24h >= 0 ? '#00c853' : '#ff3d00'}`
              }}
            >
              <img 
                src={coin.image} 
                alt={coin.name} 
                className="coin-img"
              />
              <span className={`price-change ${priceChangeClass}`}>
                {priceChangeText}
              </span>
            </Box>
          );
        })}
      </Box>

      {/* Main swap container - all contents need z-index to stay above animation */}
      <Box width="100%" maxW="450px" mx="auto">
        <Flex direction="column" className="swap-container" position="relative" zIndex="1" 
          bg="rgba(17, 17, 17, 0.7)"
          backdropFilter="blur(10px)"
          borderRadius="xl"
          border="1px solid rgba(255, 255, 255, 0.05)"
              p={4} 
          boxShadow="0 4px 30px rgba(0, 0, 0, 0.3)"
            >
          {/* Top NavBar */}
          <TopNavBar />
          
          {/* Trending Bar */}
          {trendingCoins.length > 0 && <CompactTrendingBar />}
          
          {/* Remove the tabs and just have the market trading interface */}


          {/* You Sell Section */}
          <Box bg="#1B1C22" borderRadius="xl" p={4} mb={3} zIndex="1" position="relative">
            <Text fontSize="sm" color="gray.400" mb={1}>
              You Sell
                  </Text>
            <Flex justify="space-between" align="center" mb={2}>
              <Input
                variant="unstyled"
                placeholder="0"
                value={amount}
                onChange={handleAmountChange}
                fontSize="2xl"
                fontWeight="bold"
                className="token-input"
                w="60%"
              />
              <Flex 
                align="center" 
                bg="rgba(0, 0, 0, 0.3)" 
                borderRadius="md" 
                px={3} 
                py={2}
                cursor="pointer"
                onClick={() => handleTokenSearchOpen('from')}
              >
                <Box w="24px" h="24px" borderRadius="full" overflow="hidden">
                  <Image
                    src={getTokenInfo(fromTokenSymbol, chain?.id || 1)?.logo || ethLogo} 
                    alt={fromTokenSymbol || 'ETH'} 
                    w="100%" 
                    h="100%" 
                  />
                </Box>
                <Text fontWeight="bold" mr={2}>{fromTokenSymbol || 'ETH'}</Text>
                <Icon as={FaChevronDown} color="gray.500" />
              </Flex>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color="gray.500">
                {getTokenInfo(fromTokenSymbol, chain?.id || 1)?.name || fromTokenSymbol}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Balance: {fromTokenBalance}
              </Text>
            </Flex>
          </Box>

          {/* Arrow Button */}
          <Center position="relative" my={-3} zIndex={2}>
            <Box 
              as="button" 
              p={2} 
              borderRadius="full" 
              bg="#2A2C33" 
              border="4px solid #121212"
              onClick={handleSwapTokens}
            >
              <Icon as={FaArrowDown} color="white" />
            </Box>
          </Center>

          {/* You Buy Section */}
          <Box bg="#1B1C22" borderRadius="xl" p={4} mb={4} zIndex="1" position="relative">
            <Text fontSize="sm" color="gray.400" mb={1}>
              You Buy
                  </Text>
            <Flex justify="space-between" align="center" mb={2}>
              <Text
                fontSize="2xl"
                fontWeight="bold"
                className="token-input"
                w="60%"
              >
                {quote ? formatTokenAmount(
                  quote.toTokenAmount,
                  getSafeTokenDecimals(chain?.id || 1, toTokenSymbol),
                  toTokenSymbol
                ) : '0'}
                  </Text>
              <Flex
                align="center" 
                bg="rgba(0, 0, 0, 0.3)"
                borderRadius="md" 
                px={3} 
                py={2}
                cursor="pointer"
                onClick={() => handleTokenSearchOpen('to')}
              >
                <Box w="24px" h="24px" borderRadius="full" overflow="hidden">
                  <Image
                    src={getTokenInfo(toTokenSymbol, chain?.id || 1)?.logo || baseLogo} 
                    alt={toTokenSymbol || 'USDT'} 
                    w="100%" 
                    h="100%" 
                  />
            </Box>
                <Text fontWeight="bold" mr={2}>{toTokenSymbol || 'USDT'}</Text>
                <Icon as={FaChevronDown} color="gray.500" />
              </Flex>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color="gray.500">
                {getTokenInfo(toTokenSymbol, chain?.id || 1)?.name || toTokenSymbol}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Balance: {toTokenBalance}
              </Text>
            </Flex>
        </Box>

          {/* Connect Wallet Button or Swap Button */}
          {address ? (
            <Button
              w="100%"
              py={6}
              bg="#22c55e"
              color="white"
              _hover={{ bg: "#1ea550", opacity: 0.9 }}
              _active={{ bg: "#1ea550", opacity: 0.8 }}
              onClick={quote || reverseQuote ? handleSwap : () => getQuote(false)}
              isLoading={loading}
              borderRadius="lg"
              fontSize="lg"
              fontWeight="bold"
              id="swap-button"
              zIndex="1"
              position="relative"
            >
              {quote || reverseQuote ? 'Swap' : 'Get Quote'}
            </Button>
          ) : (
            <Box position="relative" zIndex="1">
              <Web3Button 
                icon="show"
                label="Connect Wallet"
                balance="hide"
                style={{
                  width: '100%',
                  padding: '1.5rem 0',
                  borderRadius: '0.5rem',
                  backgroundColor: '#22c55e',
                  fontFamily: 'inherit',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '1.25rem',
                }}
              />
            </Box>
          )}

          {/* Footer with social links */}
      <Footer />

          {/* Token Search Modal */}
          <Modal isOpen={isTokenSearchOpen} onClose={handleTokenSearchClose}>
            <ModalOverlay />
            <ModalContent bg="#1B1C22" borderColor="gray.700" borderWidth="1px">
              <ModalHeader color="white">Select a Token</ModalHeader>
              <ModalCloseButton color="white" />
              <ModalBody>
                <TokenSearchModal 
                  isOpen={isTokenSearchOpen}
                  onClose={handleTokenSearchClose}
                  onSelect={(token) => {
                    if (tokenSearchType === 'from') {
                      setFromTokenSymbol(token);
                    } else {
                      setToTokenSymbol(token);
                    }
                    handleTokenSearchClose();
                    if (amount && fromTokenSymbol && toTokenSymbol) {
                      getQuote(false);
                    }
                  }}
                  type={tokenSearchType}
                />
              </ModalBody>
            </ModalContent>
          </Modal>

          {/* Settings Modal */}
          <Modal isOpen={settingsModal.isOpen} onClose={settingsModal.onClose}>
            <ModalOverlay />
            <ModalContent bg="#1B1C22" borderColor="gray.700" borderWidth="1px">
              <ModalHeader color="white">Settings</ModalHeader>
              <ModalCloseButton color="white" />
              <ModalBody>
      <SettingsModal />
              </ModalBody>
            </ModalContent>
          </Modal>
        </Flex>
    </Box>
    </>
  );
};

export default SwapInterface; 