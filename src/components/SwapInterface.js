import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import { FaGlobe, FaTwitter, FaTelegram, FaArrowDown, FaTimes, FaExternalLinkAlt, FaInstagram, FaTiktok, FaCog, FaPlus } from 'react-icons/fa';
import './SwapInterface.css';

// Add chain logo imports
import mainlogo from '../assets/logo.png';
import ethLogo from '../assets/ethereum.webp';
import bscLogo from '../assets/bnb.webp';
import polygonLogo from '../assets/polygon.webp';
import arbitrumLogo from '../assets/arbitrum.webp';
import solanaLogo from '../assets/solana.png';
import lineaLogo from '../assets/linea.png';
import baseLogo from '../assets/base.png';
import poweredby from '../assets/poweredby.png';

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
    v2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    v3Router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    v2Factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    v3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    v2RouterAbi: V2_ROUTER_ABI,
    v3RouterAbi: V3_ROUTER_ABI
  },
  BSC: {
    id: 56,
    name: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    v2Router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    v3Router: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
    v2Factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    v3Factory: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    weth: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    v2RouterAbi: V2_ROUTER_ABI,
    v3RouterAbi: V3_ROUTER_ABI,
    blockExplorer: 'https://bscscan.com'
  },
  BASE: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    v2Router: '0x8357227d4EDc78991db6FDB9Bd6ADE250536dE1d',
    v3Router: '0x2626664c2603336E57B271c5C0b26F421741e481',
    v2Factory: '0x8909Dc15E40173Ff4699343B6eb8132C65E18ec6',
    v3Factory: '0x33128a8FC17869897dcE68Ed026d694621f6FDfD',
    weth: '0x4200000000000000000000000000000000000006',
    v2RouterAbi: BASE_V2_ROUTER_ABI,
    v3RouterAbi: BASE_V3_ROUTER_ABI,
    blockExplorer: 'https://basescan.org'
  }
};

// Update CHAIN_LOGOS constant
const CHAIN_LOGOS = {
  1: ethLogo,
  56: bscLogo,
  8453: baseLogo,
};

const CHAIN_NAMES = {
  1: 'Ethereum',
  56: 'BSC',
  8453: 'Base',
};

// Constants
const FEE_RECIPIENT = '0xEBb9b2ea7710e87bB121d0610f5d2DD86f1Ba792';
const FEE_PERCENTAGE = 0.3; // 0.3%

// Add DEX names mapping
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

  // Add formatTokenAmount function
  const formatTokenAmount = (amount, decimals, symbol) => {
    // For tokens like BABYDOGE, show without decimal places
    if (symbol === 'BABYDOGE') {
      return ethers.utils.formatUnits(amount, decimals).split('.')[0];
    }
    // For other tokens, limit to 6 decimal places
    return parseFloat(ethers.utils.formatUnits(amount, decimals)).toFixed(6);
  };

  // Add calculateFee function
  const calculateFee = (amount) => {
    const feeMultiplier = FEE_PERCENTAGE * 100; // Convert 0.3% to 30 basis points
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
    switch (chainId) {
      case 1:
        return 'https://eth.llamarpc.com';
      case 56:
        return 'https://bsc-dataseed.binance.org';
      case 137:
        return 'https://polygon-rpc.com';
      case 42161:
        return 'https://arb1.arbitrum.io/rpc';
      case 8453:
        return 'https://mainnet.base.org';
      default:
        return null;
    }
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

  // Update getQuote function
  const getQuote = async (isReverse = false) => {
    if (!chain?.id || !signer || !address) {
      toast({
        title: 'Error',
        description: 'Please connect wallet',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const inputToValidate = isReverse ? toAmount : amount;
    if (!inputToValidate || !fromTokenSymbol || !toTokenSymbol) return;

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

      // Calculate fee
      const feeAmount = calculateFee(amountIn);
      const amountInAfterFee = amountIn.sub(feeAmount);

      // Create quote data
      const quoteData = {
        fromTokenAmount: amountIn.toString(),
        toTokenAmount: amountOut.toString(),
        feeAmount: feeAmount.toString(),
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
        description: `Expected output: ${ethers.utils.formatEther(amountOut)} ${toTokenSymbol}`,
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
  };

  // Update handleSwap function
  const handleSwap = async () => {
    if (!chain?.id || !signer || !address) {
      toast({
        title: 'Error',
        description: 'Please connect wallet',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setLoading(true);
      const network = chain.id === 1 ? NETWORKS.MAINNET : NETWORKS.BASE;
      const activeQuote = isReverseQuote ? reverseQuote : quote;
      
      if (!activeQuote) return;

      const fromTokenAddress = activeQuote.fromToken.address;
      const toTokenAddress = activeQuote.toToken.address;
      const amountIn = ethers.BigNumber.from(activeQuote.fromTokenAmount);
      const amountOutMin = ethers.BigNumber.from(activeQuote.toTokenAmount)
        .mul(90).div(100); // 10% slippage
      const deadline = Math.floor(Date.now() / 1000) + 1800;

      // Calculate and send fee first for both Base and Ethereum chains
      let nativeTokenValue;
      if (isNativeToken(chain.id, activeQuote.fromToken.symbol)) {
        nativeTokenValue = amountIn;
      } else if (isNativeToken(chain.id, activeQuote.toToken.symbol)) {
        nativeTokenValue = amountOutMin;
      } else {
        // Get native token value through router
        const router = new ethers.Contract(network.v2Router, network.v2RouterAbi, provider);
        try {
          const nativeAmounts = await router.getAmountsOut(
            amountIn,
            [fromTokenAddress, network.weth]
          );
          nativeTokenValue = nativeAmounts[1];
        } catch (error) {
          console.error('Error getting native token value:', error);
          nativeTokenValue = ethers.utils.parseEther('0.01'); // Fallback value
        }
      }

      // Calculate fee amount (0.3%)
      const nativeFeeAmount = nativeTokenValue.mul(30).div(10000);

      // Send fee transaction
      const feeTx = await signer.sendTransaction({
        to: FEE_RECIPIENT,
        value: nativeFeeAmount,
        gasLimit: 21000
      });

      showToast(
        'Fee Transaction Pending',
        'View transaction details',
        'info',
        feeTx.hash
      );

      await feeTx.wait();

      showToast(
        'Fee Transaction Confirmed',
        'View transaction details',
        'success',
        feeTx.hash
      );

      let tx;
      if (chain.id === 8453) {
        // Base chain V3 swap
        const router = new ethers.Contract(
          network.v3Router,
          network.v3RouterAbi,
          signer
        );

        // First approve if needed
        if (!isNativeToken(chain.id, activeQuote.fromToken.symbol)) {
          const tokenContract = new ethers.Contract(fromTokenAddress, ERC20_ABI, signer);
          const allowance = await tokenContract.allowance(address, network.v3Router);
          if (allowance.lt(amountIn)) {
            const approveTx = await tokenContract.approve(network.v3Router, amountIn);
            await approveTx.wait();
          }
        }

        const path = ethers.utils.solidityPack(
          ['address', 'uint24', 'address'],
          [fromTokenAddress, 10000, toTokenAddress]
        );

        const params = {
          path,
          recipient: address,
          amountIn: amountIn.toString(),
          amountOutMinimum: amountOutMin.toString()
        };

        const feeData = await provider.getFeeData();
        tx = await router.exactInput(
          params,
          {
            value: isNativeToken(chain.id, activeQuote.fromToken.symbol) ? amountIn : 0,
            gasLimit: 500000,
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            type: 2
          }
        );
      } else {
        // Ethereum V2 swap
        const router = new ethers.Contract(network.v2Router, network.v2RouterAbi, signer);
        
        if (isNativeToken(chain.id, activeQuote.fromToken.symbol)) {
          // ETH -> Token
          tx = await router.swapExactETHForTokens(
            amountOutMin,
            [network.weth, toTokenAddress],
            address,
            deadline,
            {
              value: amountIn,
              gasLimit: 500000
            }
          );
        } else if (isNativeToken(chain.id, activeQuote.toToken.symbol)) {
          // Token -> ETH
          // First approve router
          const tokenContract = new ethers.Contract(fromTokenAddress, ERC20_ABI, signer);
          const allowance = await tokenContract.allowance(address, network.v2Router);
          if (allowance.lt(amountIn)) {
            const approveTx = await tokenContract.approve(network.v2Router, amountIn);
            await approveTx.wait();
          }

          tx = await router.swapExactTokensForETH(
            amountIn,
            amountOutMin,
            [fromTokenAddress, network.weth],
            address,
            deadline,
            { gasLimit: 500000 }
          );
        } else {
          // Token -> Token
          // First approve router
          const tokenContract = new ethers.Contract(fromTokenAddress, ERC20_ABI, signer);
          const allowance = await tokenContract.allowance(address, network.v2Router);
          if (allowance.lt(amountIn)) {
            const approveTx = await tokenContract.approve(network.v2Router, amountIn);
            await approveTx.wait();
          }

          tx = await router.swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            [fromTokenAddress, toTokenAddress],
            address,
            deadline,
            { gasLimit: 500000 }
          );
        }
      }

      showToast(
        'Transaction Pending',
        'View transaction details',
        'info',
        tx.hash
      );

      await tx.wait();

      showToast(
        'Swap Successful',
        'View transaction details',
        'success',
        tx.hash
      );

      // Reset form
      setAmount('');
      setToAmount('');
      setQuote(null);
      setReverseQuote(null);
      setIsReverseQuote(false);

    } catch (error) {
      console.error('Swap failed:', error);
      toast({
        title: 'Swap Failed',
        description: error.reason || error.message,
        status: 'error',
        duration: 5000,
      });
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
              // Subtract exact gas reserves based on chain
              if (chain?.id === 56 || chain?.id === 137) {
                // BSC and Polygon: subtract 0.001
                newAmount = (balance - 0.001).toFixed(6);
              } else if (chain?.id === 1 || chain?.id === 42161) {
                // ETH and Arbitrum: subtract 0.0001
                newAmount = (balance - 0.0001).toFixed(6);
              } else {
                // For other chains, use default percentage
                newAmount = (balance * (percentage / 100)).toFixed(6);
              }
            } else {
              // For non-native tokens, use full balance
              newAmount = balance.toFixed(6);
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
              // Subtract exact gas reserves based on chain
              if (chain?.id === 56 || chain?.id === 137) {
                // BSC and Polygon: subtract 0.001
                newAmount = (balance - 0.001).toFixed(6);
              } else if (chain?.id === 1 || chain?.id === 42161) {
                // ETH and Arbitrum: subtract 0.0001
                newAmount = (balance - 0.0001).toFixed(6);
              } else {
                // For other chains, use default percentage
                newAmount = (balance * (percentage / 100)).toFixed(6);
              }
            } else {
              // For non-native tokens, use full balance
              newAmount = balance.toFixed(6);
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
          // For non-address queries, filter existing tokens
          const filteredTokens = tokens.filter(symbol => 
            symbol.toLowerCase().includes(query.toLowerCase())
          );
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
                  <Spinner color="white" />
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

      // Fetch token data from DexScreener first
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, {
        method: 'GET',
        headers: {},
      });
      const data = await response.json();

      if (!data.pairs || data.pairs.length === 0) {
        throw new Error('Token not found on DexScreener');
      }

      const tokenData = data.pairs[0];
      const tokenInfo = tokenData.baseToken.address.toLowerCase() === address.toLowerCase() 
        ? tokenData.baseToken 
        : tokenData.quoteToken;

      const imageUrl = tokenData.info?.imageUrl || null;
      const priceUsd = tokenData.priceUsd;
      const detectedChainId = getChainIdFromDexScreener(tokenData.chainId);

      // If token is on a different chain, switch to it
      if (detectedChainId !== chain?.id) {
        if (switchNetwork) {
          try {
            await switchNetwork(detectedChainId);
            toast({
              title: 'Chain Switched',
              description: `Switched to ${CHAIN_NAMES[detectedChainId]} for this token`,
              status: 'success',
              duration: 3000,
              position: 'top-right'
            });
          } catch (error) {
            console.error('Chain switch error:', error);
            toast({
              title: 'Chain Switch Failed',
              description: `Please switch to ${CHAIN_NAMES[detectedChainId]} manually`,
              status: 'warning',
              duration: 5000,
              position: 'top-right'
            });
          }
        }
      }

      // Get decimals using the correct chain's provider
      const rpcUrl = getChainRpcUrl(detectedChainId);
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
      const decimals = await tokenContract.decimals();

      setImportTokenInfo({
        address,
        symbol: tokenInfo.symbol,
        name: tokenInfo.name,
        decimals: decimals.toString(),
        chainId: detectedChainId,
        logo: imageUrl,
        priceUsd: priceUsd
      });

    } catch (error) {
      console.error('Error validating token:', error);
      toast({
        title: 'Error validating token',
        description: error.message,
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
                <Spinner color="white" />
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
    const { switchNetwork, isLoading } = useSwitchNetwork();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef();

    const chains = [
      { id: 1, name: 'Ethereum' },
      { id: 56, name: 'BSC' },
      { id: 8453, name: 'Base' },
      { id: 'solana', name: 'Solana', externalLink: 'https://solana.dogeswap.co' },
    ];

    // Handle click outside to close menu
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChainClick = (chainId, externalLink) => {
      if (externalLink) {
        window.location.href = externalLink;
        return;
      }
      switchNetwork?.(parseInt(chainId));
      setIsOpen(false);
    };

    return (
      <Box position="relative" ref={menuRef}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          isDisabled={isLoading}
          className="chain-switcher-button"
          rightIcon={<Icon as={isOpen ? FaTimes : FaArrowDown} />}
        >
          <HStack spacing={2}>
            {chain && (
              <Image
                src={CHAIN_LOGOS[chain.id]}
                alt={CHAIN_NAMES[chain.id]}
                width="24px"
                height="24px"
              />
            )}
            <Text>{chain ? CHAIN_NAMES[chain.id] : 'Select Chain'}</Text>
          </HStack>
        </Button>

        {isOpen && (
          <Box className="chain-switcher-menu">
            <VStack align="stretch" spacing={1}>
              {chains.map((c) => (
                <Button
                  key={c.id}
                  onClick={() => handleChainClick(c.id, c.externalLink)}
                  className="chain-switcher-option"
                  variant="ghost"
                >
                  <HStack spacing={3} width="100%" justify="flex-start">
                    <Image
                      src={c.id === 'solana' ? solanaLogo : CHAIN_LOGOS[c.id]}
                      alt={c.name}
                      className="chain-logo"
                    />
                    <Text className="chain-name">{c.name}</Text>
                    {c.externalLink && <Icon as={FaExternalLinkAlt} ml="auto" />}
                  </HStack>
                </Button>
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
        137: { from: 'MATIC', to: 'USDC' },
        42161: { from: 'ETH', to: 'USDC' },
        8453: { from: 'ETH', to: 'SCI' },
      };

      const defaults = defaultTokens[chain.id];
      if (defaults) {
        setFromTokenSymbol(defaults.from);
        setToTokenSymbol(defaults.to);
      }
    }
  }, [chain?.id]);

  // Update the top navigation bar section
  const TopNavBar = () => {
    return (
      <Box 
        position="fixed" 
        top={0} 
        left={0} 
        right={0} 
        p={4} 
        zIndex={10}
        // background="rgba(0, 0, 0, 0.5)"
        backdropFilter="blur(10px)"
        borderBottom="1px solid rgba(139, 0, 0, 0.2)"
      >
        <Container maxW="container.lg">
          <HStack justify="space-between" align="center">
            {/* Logo */}
            <Image
              src={mainlogo}
              alt="Logo"
              height="40px"
              objectFit="contain"
            />

            {/* Right side button */}
            <Web3Button />
          </HStack>
        </Container>
      </Box>
    );
  };

  // Update the Footer component
  const Footer = () => {
    return (
      <VStack spacing={4} mt={8} mb={4} align="center">
        {/* Social Links and Powered By in one row */}
        <HStack 
          spacing={4} 
          justify="center" 
          align="center"
          py={2}
          px={4}
          background="rgba(0, 0, 0, 0.3)"
          borderRadius="full"
          backdropFilter="blur(10px)"
        >
          {/* Social Icons */}
          <HStack spacing={3} className="social-icons">
            <Link href="https://twitter.com/dogeswap_" isExternal><Icon as={FaTwitter} color="orange" boxSize={5} /></Link>
            <Link href="https://t.me/DogeSwap_Ann" isExternal><Icon as={FaTelegram} color="orange" boxSize={5} /></Link>
            <Link href="https://t.me/DogeSwap_Chat" isExternal><Icon as={FaTelegram} color="orange" boxSize={5} /></Link>
            <Link href="https://instagram.com/dogeswap_" isExternal><Icon as={FaInstagram} color="orange" boxSize={5} /></Link>
            <Link href="https://tiktok.com/@dogeswap_" isExternal><Icon as={FaTiktok} color="orange" boxSize={5} /></Link>
          </HStack>

          {/* Vertical Divider */}
          <Box height="20px" width="1px" bg="rgba(255, 255, 255, 0.2)" mx={2} />

          {/* Powered By Image */}
          <Image 
            src={poweredby}
            alt="Powered by Dogecoin"
            height="30px"
            objectFit="contain"
            className="powered-by-logo"
          />
        </HStack>

        {/* Supported By Section */}
        <Box textAlign="center">
          <Text color="white" mb={3}>SUPPORTED BY</Text>
          <HStack spacing={6} justify="center" flexWrap="wrap" className="supported-chains">
            <Image src={ethLogo} alt="Ethereum" height="32px" />
            <Image src={bscLogo} alt="Base" height="32px" />
            <Image src={baseLogo} alt="Base" height="32px" />
            <Image src={arbitrumLogo} alt="Base" height="32px" />
            <Image src={lineaLogo} alt="Base" height="32px" />
            <Image src={polygonLogo} alt="Base" height="32px" />
            <Image src={solanaLogo} alt="Base" height="32px" />
          </HStack>
        </Box>
      </VStack>
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

  // Add token search and import modal component
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
          setSearchResults([tokenInfo]);
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
        setSearchResults(filtered);
      }
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Token</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Search by name or paste address"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              mb={4}
            />
            {isImporting ? (
              <Spinner />
            ) : (
              <VStack align="stretch" spacing={2}>
                {searchResults.map((token) => {
                  const tokenInfo = TOKEN_INFO[chain.id]?.[token] || customTokens[chain.id]?.[token];
                  return (
                    <HStack
                      key={token}
                      p={2}
                      cursor="pointer"
                      _hover={{ bg: 'gray.100' }}
                      onClick={() => {
                        onSelect(token);
                        onClose();
                      }}
                    >
                      {tokenInfo?.logo && (
                        <Image
                          src={tokenInfo.logo}
                          alt={token}
                          boxSize="24px"
                          borderRadius="full"
                        />
                      )}
                      <Text>{token}</Text>
                      {tokenInfo?.name && (
                        <Text color="gray.500" fontSize="sm">
                          {tokenInfo.name}
                        </Text>
                      )}
                    </HStack>
                  );
                })}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
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

  // Update the showToast function
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
      render: ({ onClose }) => (
        <Box
          p={4}
          bg={
            status === 'error' ? 'linear-gradient(135deg, #FF4B4B 0%, #9B0000 100%)' :
            status === 'success' ? 'linear-gradient(135deg, #48BB78 0%, #2F855A 100%)' :
            status === 'info' ? 'linear-gradient(135deg, #4299E1 0%, #2B6CB0 100%)' :
            'linear-gradient(135deg, #ED8936 0%, #C05621 100%)'
          }
          borderRadius="xl"
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
          color="white"
          onClick={onClose}
          cursor="pointer"
          position="relative"
          _hover={{ opacity: 0.9 }}
          transition="all 0.2s"
        >
          <VStack align="flex-start" spacing={1}>
            <Text fontWeight="bold" fontSize="md">
              {title}
            </Text>
            {explorerLink ? (
              <Link 
                href={explorerLink} 
                isExternal 
                color="white" 
                textDecoration="underline"
                onClick={(e) => e.stopPropagation()}
              >
                {description} <Icon as={FaExternalLinkAlt} mx="2px" />
              </Link>
            ) : (
              <Text fontSize="sm">{description}</Text>
            )}
          </VStack>
        </Box>
      ),
      duration: 5000,
      isClosable: true,
      position: 'bottom-right',
      containerStyle: {
        marginBottom: '20px',
        marginRight: '20px',
        maxWidth: '380px'
      },
      onCloseComplete: () => {
        // Clean up any resources if needed
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

  return (
    <Box className="min-h-screen relative">
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="video-background"
      >
        <source src="https://dogecoin.com/assets/images/Header_Video.mp4" type="video/mp4" />
      </video>

      {/* Sun Shine Effect */}
      <div className="sun-shine" />

      {/* Top Navigation Bar */}
      <TopNavBar />

      {/* Main Swap Interface */}
      <VStack spacing={8} align="stretch" width="100%" maxW="480px" mx="auto" p={4} mt="100px">
        <Box 
          className="token-modal"
          p={6}
        >
          <HStack justify="space-between" align="center" mb={6}>
            <Text fontSize="xl" fontWeight="bold" color="white">Swap</Text>
            <HStack spacing={4}>
              <Button
                onClick={() => setIsSettingsOpen(true)}
                className="chain-switcher-button"
                width="auto"
                px={3}
              >
                <Icon as={FaCog} color="white" />
              </Button>
              <ChainSelect />
            </HStack>
          </HStack>
          
          {/* From Token Section */}
          <TokenSelect
            value={fromTokenSymbol}
            onChange={setFromTokenSymbol}
            tokens={getAvailableTokens()}
            label="From"
            isDisabled={!chain || isSwitchingChain}
          />

          {/* Swap Arrow Button */}
          <Box className="swap-arrow-container" onClick={handleSwapTokens}>
            <FaArrowDown />
          </Box>

          {/* To Token Section */}
          <TokenSelect
            value={toTokenSymbol}
            onChange={setToTokenSymbol}
            tokens={getAvailableTokens().filter(t => t !== fromTokenSymbol)}
            label="To"
            isDisabled={!chain || isSwitchingChain}
          />

          {/* Action Button */}
          <Button
            className="swap-button"
            onClick={(quote || reverseQuote) ? handleSwap : isReverseQuote ? () => getQuote(true) : () => getQuote(false)}
            isLoading={loading}
            loadingText={quote || reverseQuote ? "Swapping" : "Getting Quote"}
            isDisabled={
              !fromTokenSymbol || 
              !toTokenSymbol || 
              (!amount && !toAmount) || 
              isSwitchingChain || 
              loading
            }
            width="100%"
          >
            {quote || reverseQuote ? 'Swap' : 'Get Quote'}
          </Button>

          {/* Quote Details */}
          {(quote || reverseQuote) && (
            <Box 
              mt={4} 
              p={4} 
              className="token-modal"
            >
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between">
                  <Text color="white">{isReverseQuote ? 'Required Input:' : 'Expected Output:'}</Text>
                  <Text color="white" fontWeight="bold">
                    {isReverseQuote 
                      ? `${formatTokenAmount(reverseQuote.fromTokenAmount, getTokenDecimals(chain.id, fromTokenSymbol), fromTokenSymbol)} ${fromTokenSymbol}`
                      : `${formatTokenAmount(quote.toTokenAmount, getTokenDecimals(chain.id, toTokenSymbol), toTokenSymbol)} ${toTokenSymbol}`
                    }
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="gray.400" fontSize="sm">Fee ({FEE_PERCENTAGE}%):</Text>
                  <Text color="gray.400" fontSize="sm">
                    {formatTokenAmount(
                      isReverseQuote ? reverseQuote.feeAmount : quote.feeAmount,
                      getTokenDecimals(chain.id, fromTokenSymbol),
                      fromTokenSymbol
                    )} {fromTokenSymbol}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="gray.400" fontSize="sm">DEX:</Text>
                  <Text color="gray.400" fontSize="sm">
                    {isReverseQuote ? reverseQuote.dexName : quote.dexName}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          )}
        </Box>
      </VStack>

      {/* Footer with social links and supported by section */}
      <Footer />

      <SettingsModal />
    </Box>
  );
};

export default SwapInterface; 