import React, { useState, useEffect, useCallback, useRef } from 'react';
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

// Update CHAIN_LOGOS constant
const CHAIN_LOGOS = {
  1: ethLogo,
  56: bscLogo,
  137: polygonLogo,
  42161: arbitrumLogo,
  8453: baseLogo,
  'solana': solanaLogo,
};

const CHAIN_NAMES = {
  1: 'Ethereum',
  56: 'BSC',
  137: 'Polygon',
  42161: 'Arbitrum',
  8453: 'Base',
};

// Update the router addresses to include Base Universal Router
const ROUTER_ADDRESSES = {
  1: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Universal Router Ethereum
  56: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeSwap
  137: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Universal Router Polygon
  42161: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Universal Router Arbitrum
  8453: '0x198EF79F1F515F02dFE9e3115eD9fC07183f02fC', // Universal Router Base
};

// Add Universal Router ABI
const UNIVERSAL_ROUTER_ABI = [
  'function execute(bytes commands, bytes[] inputs, uint256 deadline) payable returns ()',
  'function executeV2(bytes commands, bytes[] inputs, uint256 deadline) payable returns ()',
];

// Add Permit2 address
const PERMIT2_ADDRESS = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

// Add Permit2 ABI
const PERMIT2_ABI = [
  'function approve(address token, address spender, uint160 amount, uint48 expiration)',
  'function allowance(address user, address token, address spender) view returns (uint160 amount, uint48 expiration, uint48 nonce)',
];

const ROUTER_ABI = [
  // V2 methods
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  // V3 methods
  'function exactInputSingle(tuple(address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountOut)',
  'function exactInput(tuple(bytes path,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum) params) external payable returns (uint256 amountOut)',
  'function unwrapWETH9(uint256 amountMinimum, address recipient) external payable',
  'function refundETH() external payable'
];

const ERC20_ABI = [
  'function decimals() public view returns (uint8)',
  'function symbol() public view returns (string)',
  'function name() public view returns (string)',
  'function balanceOf(address) public view returns (uint256)',
  'function transfer(address to, uint256 value) public returns (bool)',
  'function allowance(address owner, address spender) public view returns (uint256)',
  'function approve(address spender, uint256 value) public returns (bool)',
];

// Add DEX names mapping
const DEX_NAMES = {
  1: 'Uniswap V3',
  56: 'PancakeSwap',
  137: 'Uniswap V3',
  42161: 'Uniswap V3',
  8453: 'BaseSwap',
};

// Constants
const FEE_RECIPIENT = '0x67FEa3f7Ba299F10269519E9987180Cb80C92C61';
const FEE_PERCENTAGE = 0.3; // 0.3%

// Add gas reserves for different chains
const GAS_RESERVES = {
  1: 0.01,      // Ethereum: 0.01 ETH
  56: 0.01,     // BSC: 0.01 BNB
  137: 1,       // Polygon: 1 MATIC
  42161: 0.01,  // Arbitrum: 0.01 ETH
  8453: 0.01,   // Base: 0.01 ETH
};

// Add Uniswap V3 Quoter
const QUOTER_ADDRESSES = {
  1: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e',  // QuoterV2
  137: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e', // QuoterV2
  42161: '0x61fFE014bA17989E743c5F6cB21bF9697530B21e', // QuoterV2
  8453: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a'  // Base QuoterV2
};

const QUOTER_ABI = [
  'function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
  'function quoteExactInput(bytes path, uint256 amountIn) external returns (uint256 amountOut, uint160[] memory sqrtPriceX96AfterList, uint32[] memory initializedTicksCrossedList, uint256 gasEstimate)'
];

// Update V2 related constants
const V2_FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';
const V2_FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)'
];

const V2_PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
];

const SwapInterface = () => {
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
    return [...new Set([...baseTokens, ...customTokensList])];
  }, [chain?.id, customTokens]);

  // Function to swap the selected tokens
  const handleSwapTokens = () => {
    const fromToken = fromTokenSymbol;
    const toToken = toTokenSymbol;
    setFromTokenSymbol(toToken);
    setToTokenSymbol(fromToken);
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

  // Update getQuote function
  const getQuote = async (isReverse = false) => {
    if (!chain?.id || !fromTokenSymbol || !toTokenSymbol || !address || !signer) return;
    
    const inputToValidate = isReverse ? toAmount : amount;
    if (!inputToValidate) return;

    try {
      setLoading(true);

      const fromTokenAddress = getTokenAddress(chain.id, fromTokenSymbol) || 
        customTokens[chain.id]?.[fromTokenSymbol]?.address;
      
      const toTokenAddress = getTokenAddress(chain.id, toTokenSymbol) || 
        customTokens[chain.id]?.[toTokenSymbol]?.address;
      
      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error('Invalid token address');
      }

      const wrappedToken = getWrappedToken(chain.id);
      if (!wrappedToken) {
        throw new Error('Wrapped token not found for this chain');
      }

      const actualFromAddress = isNativeToken(chain.id, fromTokenSymbol) 
        ? wrappedToken.address 
        : fromTokenAddress;
      
      const actualToAddress = isNativeToken(chain.id, toTokenSymbol)
        ? wrappedToken.address
        : toTokenAddress;

      const fromDecimals = await getTokenDecimals(chain.id, fromTokenSymbol);
      const toDecimals = await getTokenDecimals(chain.id, toTokenSymbol);

      const swapAmountWei = ethers.utils.parseUnits(inputToValidate, fromDecimals);
      const feeAmount = calculateFee(swapAmountWei);
      const amountAfterFee = swapAmountWei.sub(feeAmount);

      let bestQuote = null;
      let bestPath = null;
      let dexVersion = '';

      // Add Base to the Universal Router chains
      if ([1, 137, 42161, 8453].includes(chain.id)) {
        // Try V2 quote first
        try {
          const factory = new ethers.Contract(V2_FACTORY_ADDRESS, V2_FACTORY_ABI, provider);
          const pairAddress = await factory.getPair(actualFromAddress, actualToAddress);
          
          if (pairAddress !== ethers.constants.AddressZero) {
            const pair = new ethers.Contract(pairAddress, V2_PAIR_ABI, provider);
            const [reserve0, reserve1] = await pair.getReserves();
            const token0 = await pair.token0();
            
            // Determine which token is token0
            const [reserveIn, reserveOut] = token0.toLowerCase() === actualFromAddress.toLowerCase() 
              ? [reserve0, reserve1] 
              : [reserve1, reserve0];

            // Calculate V2 quote using the constant product formula
            const amountInWithFee = amountAfterFee.mul(997); // 0.3% fee
            const numerator = amountInWithFee.mul(reserveOut);
            const denominator = reserveIn.mul(1000).add(amountInWithFee);
            const amountOut = numerator.div(denominator);

            bestQuote = amountOut;
            bestPath = [actualFromAddress, actualToAddress];
            dexVersion = 'V2';
            console.log('V2 quote successful:', ethers.utils.formatUnits(bestQuote, toDecimals));
          }
        } catch (error) {
          console.log('V2 quote failed:', error);
        }

        // Try V3 quote if V2 failed or has worse rate
        if (!bestQuote || chain.id === 8453) { // Always try V3 for Base chain
          try {
            const quoterAddress = QUOTER_ADDRESSES[chain.id];
            const quoter = new ethers.Contract(quoterAddress, QUOTER_ABI, provider);
            
            // Try different fee tiers
            const feeTiers = [100, 500, 3000, 10000]; // 0.01%, 0.05%, 0.3%, 1%
            let bestV3Quote = null;

            for (const fee of feeTiers) {
              try {
                const params = {
                  tokenIn: actualFromAddress,
                  tokenOut: actualToAddress,
                  amountIn: amountAfterFee,
                  fee,
                  sqrtPriceLimitX96: 0
                };

                const [v3Quote] = await quoter.callStatic.quoteExactInputSingle(params);
                
                if (!bestV3Quote || v3Quote.gt(bestV3Quote)) {
                  bestV3Quote = v3Quote;
                }
              } catch (error) {
                console.log(`V3 quote failed for fee tier ${fee}:`, error);
                continue;
              }
            }

            if (bestV3Quote && (!bestQuote || bestV3Quote.gt(bestQuote))) {
              bestQuote = bestV3Quote;
              bestPath = [actualFromAddress, actualToAddress];
              dexVersion = 'V3';
              console.log('V3 quote successful:', ethers.utils.formatUnits(bestQuote, toDecimals));
            }
          } catch (error) {
            console.log('V3 quote failed:', error);
          }
        }

        if (!bestQuote) {
          throw new Error('No liquidity found in V2 or V3 pools');
        }

        const quoteData = {
          fromTokenAmount: swapAmountWei.toString(),
          toTokenAmount: bestQuote.toString(),
          fromToken: {
            address: actualFromAddress,
            symbol: fromTokenSymbol,
          },
          toToken: {
            address: actualToAddress,
            symbol: toTokenSymbol,
          },
          router: ROUTER_ADDRESSES[chain.id],
          dexName: `Uniswap ${dexVersion}`,
          path: bestPath,
          deadline: Math.floor(Date.now() / 1000) + 20 * 60,
          feeAmount: feeAmount.toString(),
          dexVersion,
          options: {
            gasLimit: ethers.BigNumber.from(300000),
            gasPrice: await provider.getGasPrice()
          }
        };

        // Update state based on quote type
        if (isReverse) {
          setReverseQuote(quoteData);
          setIsReverseQuote(true);
          setAmount(ethers.utils.formatUnits(swapAmountWei, fromDecimals));
        } else {
          setQuote(quoteData);
          setIsReverseQuote(false);
          setToAmount(ethers.utils.formatUnits(bestQuote, toDecimals));
        }

        // Show success toast
        toast({
          title: 'Quote received',
          description: `Best price found on Uniswap ${dexVersion}`,
          status: 'success',
          duration: 3000,
        });
      } else if (chain.id === 56) {  // BNB Chain (BSC)
        try {
          const router = new ethers.Contract(ROUTER_ADDRESSES[chain.id], ROUTER_ABI, provider);
          const swapAmountWei = ethers.utils.parseUnits(amount, fromDecimals);
          const feeAmount = calculateFee(swapAmountWei);
          const amountAfterFee = swapAmountWei.sub(feeAmount);
          const WBNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
          let amounts;
          let path;

          // Try direct path first
          try {
            amounts = await router.getAmountsOut(amountAfterFee, [actualFromAddress, actualToAddress]);
            path = [actualFromAddress, actualToAddress];
          } catch (error) {
            console.log('Direct path failed, trying through WBNB');
            
            // Try routing through WBNB
            if (actualFromAddress !== WBNB && actualToAddress !== WBNB) {
              amounts = await router.getAmountsOut(amountAfterFee, [
                actualFromAddress,
                WBNB,
                actualToAddress
              ]);
              path = [actualFromAddress, WBNB, actualToAddress];
            } else {
              throw new Error('No valid path found');
            }
          }

          const estimatedOutputAmount = ethers.utils.formatUnits(amounts[amounts.length - 1], toDecimals);

          if (amounts[amounts.length - 1].isZero() || parseFloat(estimatedOutputAmount) === 0) {
            throw new Error('Output amount is zero. This pair might not have enough liquidity.');
          }

          const quoteData = {
            fromTokenAmount: swapAmountWei.toString(),
            toTokenAmount: amounts[amounts.length - 1].toString(),
            fromToken: {
              address: actualFromAddress,
              symbol: fromTokenSymbol,
            },
            toToken: {
              address: actualToAddress,
              symbol: toTokenSymbol,
            },
            router: ROUTER_ADDRESSES[chain.id],
            dexName: DEX_NAMES[chain.id],
            path: path,
            deadline: Math.floor(Date.now() / 1000) + 20 * 60,
            feeAmount: feeAmount.toString(),
            options: {
              gasLimit: ethers.BigNumber.from(300000),
              gasPrice: await provider.getGasPrice()
            }
          };

          if (isReverse) {
            setReverseQuote(quoteData);
            setIsReverseQuote(true);
            setAmount(ethers.utils.formatUnits(swapAmountWei, fromDecimals));
          } else {
            setQuote(quoteData);
            setIsReverseQuote(false);
            setToAmount(estimatedOutputAmount);
          }

          toast({
            title: 'Quote received',
            description: isReverse 
              ? `Required input: ${ethers.utils.formatUnits(swapAmountWei, fromDecimals)} ${fromTokenSymbol}`
              : `Expected output: ${estimatedOutputAmount} ${toTokenSymbol}`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } catch (error) {
          console.error('Error getting quote:', error);
          throw error;
        }
      } else {
        // Handle other chains (BSC)
        // ... existing code for other chains ...
      }
    } catch (error) {
      console.error('Error getting quote:', error);
      toast({
        title: 'Error getting quote',
        description: error.message || 'Failed to get quote. This pair might not have enough liquidity.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      if (isReverse) {
        setReverseQuote(null);
      } else {
        setQuote(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update handleSwap function to handle Universal Router
  const handleSwap = async () => {
    if (!chain?.id) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    const activeQuote = isReverseQuote ? reverseQuote : quote;
    if (!activeQuote || !signer || !address || !chain?.id) {
      toast({
        title: 'Error',
        description: 'Missing required data for swap',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    // Show loading toast for wallet interaction
    const loadingToast = toast({
      position: 'bottom-right',
      duration: null,
      render: () => (
        <Box
          p={4}
          bg="gray.800"
          borderRadius="md"
          display="flex"
          alignItems="center"
          gap={3}
        >
          <Spinner size="sm" color="blue.400" />
          <Text color="white">Confirm in wallet...</Text>
        </Box>
      ),
    });

    const fromTokenAddress = getTokenAddress(chain.id, fromTokenSymbol) || 
      customTokens[chain.id]?.[fromTokenSymbol]?.address;
    
    let userBalance;
    let decimals;
    
    try {
      if (isNativeToken(chain.id, fromTokenSymbol)) {
        userBalance = ethers.utils.parseEther(nativeBalance);
        decimals = 18;
      } else {
        const tokenContract = new ethers.Contract(fromTokenAddress, ERC20_ABI, provider);
        [userBalance, decimals] = await Promise.all([
          tokenContract.balanceOf(address),
          tokenContract.decimals()
        ]);
      }

      const swapAmount = ethers.BigNumber.from(activeQuote.fromTokenAmount);
      const feeAmount = calculateFee(swapAmount);
      const amountAfterFee = swapAmount.sub(feeAmount);

      if (userBalance.lt(swapAmount)) {
        toast.close(loadingToast);
        toast({
          title: 'Insufficient balance',
          description: `You don't have enough ${fromTokenSymbol}. Your balance: ${ethers.utils.formatUnits(userBalance, decimals)} ${fromTokenSymbol}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      setLoading(true);
      const router = new ethers.Contract(activeQuote.router, ROUTER_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 20 * 60; // 20 minutes from now

      // First handle approvals for non-native tokens
      if (!isNativeToken(chain.id, fromTokenSymbol)) {
        const tokenContract = new ethers.Contract(
          activeQuote.fromToken.address,
          ERC20_ABI,
          signer
        );

        // Check allowance for router and FEE_RECIPIENT
        const [routerAllowance, feeRecipientAllowance] = await Promise.all([
          tokenContract.allowance(address, activeQuote.router),
          tokenContract.allowance(address, FEE_RECIPIENT)
        ]);

        if (routerAllowance.lt(amountAfterFee)) {
          // Update loading toast message for approval
          toast.update(loadingToast, {
            render: () => (
              <Box
                p={4}
                bg="gray.800"
                borderRadius="md"
                display="flex"
                alignItems="center"
                gap={3}
              >
                <Spinner size="sm" color="blue.400" />
                <Text color="white">Approve router in wallet...</Text>
              </Box>
            ),
          });

          try {
            const approveTx = await tokenContract.approve(
              activeQuote.router,
              ethers.constants.MaxUint256,
              { gasLimit: 100000 }
            );
            await approveTx.wait();
            console.log('Router approved');
          } catch (error) {
            toast.close(loadingToast);
            throw new Error('Failed to approve router: ' + (error.reason || error.message));
          }
        }

        if (feeRecipientAllowance.lt(feeAmount)) {
          // Update loading toast message for fee approval
          toast.update(loadingToast, {
            render: () => (
              <Box
                p={4}
                bg="gray.800"
                borderRadius="md"
                display="flex"
                alignItems="center"
                gap={3}
              >
                <Spinner size="sm" color="blue.400" />
                <Text color="white">Approve fee recipient in wallet...</Text>
              </Box>
            ),
          });

          try {
            const approveTx = await tokenContract.approve(
              FEE_RECIPIENT,
              ethers.constants.MaxUint256,
              { gasLimit: 100000 }
            );
            await approveTx.wait();
            console.log('FEE_RECIPIENT approved');
          } catch (error) {
            toast.close(loadingToast);
            throw new Error('Failed to approve FEE_RECIPIENT: ' + (error.reason || error.message));
          }
        }

        // Update loading toast message for fee transfer
        toast.update(loadingToast, {
          render: () => (
            <Box
              p={4}
              bg="gray.800"
              borderRadius="md"
              display="flex"
              alignItems="center"
              gap={3}
            >
              <Spinner size="sm" color="blue.400" />
              <Text color="white">Confirm fee transfer in wallet...</Text>
            </Box>
          ),
        });

        try {
          const feeTx = await tokenContract.transfer(FEE_RECIPIENT, feeAmount);
          await feeTx.wait();
          console.log('Fee transferred to FEE_RECIPIENT');
        } catch (error) {
          toast.close(loadingToast);
          throw new Error('Failed to transfer fee: ' + (error.reason || error.message));
        }
      }

      // Update loading toast message for swap
      toast.update(loadingToast, {
        render: () => (
          <Box
            p={4}
            bg="gray.800"
            borderRadius="md"
            display="flex"
            alignItems="center"
            gap={3}
          >
            <Spinner size="sm" color="blue.400" />
            <Text color="white">Confirm swap in wallet...</Text>
          </Box>
        ),
      });

      // Calculate minimum amount out with custom slippage
      const amountOutMin = ethers.BigNumber.from(activeQuote.toTokenAmount)
        .mul(Math.floor((100 - parseFloat(slippage)) * 100))
        .div(10000);

      // Prepare transaction options
      const options = {
        gasLimit: ethers.BigNumber.from(chain.id === 8453 ? 500000 : 300000),
        gasPrice: await provider.getGasPrice()
      };

      // Helper function to format values for Trust Wallet
      const formatBigNumber = (value) => {
        if (!value) return '0x0';
        const hex = ethers.BigNumber.from(value).toHexString();
        // Trust Wallet expects hex values without leading zeros
        return hex.replace(/0x0+/, '0x');
      };

      let tx;
      if (chain.id === 56) {  // BNB Chain (BSC)
        // PancakeSwap V2 style swaps
        const wrappedInfo = getWrappedToken(chain.id);
        if (!wrappedInfo) {
          throw new Error('Wrapped token not found for this chain');
        }

        if (isNativeToken(chain.id, fromTokenSymbol)) {
          // For native token to token swaps
          const feeTx = await signer.sendTransaction({
            to: FEE_RECIPIENT,
            value: formatBigNumber(feeAmount),
            gasLimit: formatBigNumber(21000)
          });
          await feeTx.wait();
          console.log('Native token fee transferred to FEE_RECIPIENT');

          tx = await router.swapExactETHForTokens(
            formatBigNumber(amountOutMin),
            [wrappedInfo.address, activeQuote.toToken.address],
            address,
            deadline,
            {
              gasLimit: formatBigNumber(300000),
              value: formatBigNumber(amountAfterFee)
            }
          );
        } else if (isNativeToken(chain.id, toTokenSymbol)) {
          // For token to native token swaps
          tx = await router.swapExactTokensForETH(
            formatBigNumber(amountAfterFee),
            formatBigNumber(amountOutMin),
            [activeQuote.fromToken.address, wrappedInfo.address],
            address,
            deadline,
            {
              gasLimit: formatBigNumber(300000)
            }
          );
        } else {
          // For token to token swaps
          tx = await router.swapExactTokensForTokens(
            formatBigNumber(amountAfterFee),
            formatBigNumber(amountOutMin),
            activeQuote.path,
            address,
            deadline,
            {
              gasLimit: formatBigNumber(300000)
            }
          );
        }
      } else {
        // Other chains (Uniswap V3)
        const poolFee = 3000;

        if (isNativeToken(chain.id, fromTokenSymbol)) {
          // For native token to token swaps
          const feeTx = await signer.sendTransaction({
            to: FEE_RECIPIENT,
            value: formatBigNumber(feeAmount),
            gasLimit: formatBigNumber(21000)
          });
          await feeTx.wait();
          console.log('Native token fee transferred to FEE_RECIPIENT');

          tx = await router.exactInputSingle(
            {
              tokenIn: activeQuote.fromToken.address,
              tokenOut: activeQuote.toToken.address,
              fee: poolFee,
              recipient: address,
              deadline: deadline,
              amountIn: formatBigNumber(amountAfterFee),
              amountOutMinimum: formatBigNumber(amountOutMin),
              sqrtPriceLimitX96: 0
            },
            {
              gasLimit: formatBigNumber(chain.id === 8453 ? 500000 : 300000),
              value: formatBigNumber(amountAfterFee)
            }
          );
        } else {
          // Token to token or token to native swaps
          tx = await router.exactInputSingle({
            tokenIn: activeQuote.fromToken.address,
            tokenOut: activeQuote.toToken.address,
            fee: poolFee,
            recipient: address,
            deadline: deadline,
            amountIn: formatBigNumber(amountAfterFee),
            amountOutMinimum: formatBigNumber(amountOutMin),
            sqrtPriceLimitX96: 0
          });
        }
      }

      // Close loading toast when transaction is sent
      toast.close(loadingToast);

      toast({
        title: 'Swap initiated',
        description: `Transaction hash: ${tx.hash}`,
        status: 'info',
        duration: 5000,
        isClosable: true,
        position: 'bottom-right',
      });

      await tx.wait();

      // Update balances after swap
      const newFromBalance = await fetchTokenBalance(fromTokenSymbol);
      const newToBalance = await fetchTokenBalance(toTokenSymbol);
      setFromTokenBalance(newFromBalance);
      setToTokenBalance(newToBalance);

      toast({
        title: 'Swap successful',
        description: 'Transaction has been confirmed',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'bottom-right',
      });

      // Reset form
      setAmount('');
      setToAmount('');
      setQuote(null);
      setReverseQuote(null);
      setIsReverseQuote(false);
    } catch (error) {
      console.error('Swap error:', error);
      // Close loading toast on error
      toast.close(loadingToast);
      
      toast({
        title: 'Swap failed',
        description: error.reason || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom-right',
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
                            onChange(symbol);
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
                              onChange(symbol);
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

  // Replace the ChainSelect component with this new version
  const ChainSelect = () => {
    const { chain } = useNetwork();
    const { switchNetwork, isLoading } = useSwitchNetwork();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef();

    const chains = [
      { id: 1, name: 'Ethereum' },
      { id: 56, name: 'BSC' },
      { id: 137, name: 'Polygon' },
      { id: 42161, name: 'Arbitrum' },
      { id: 8453, name: 'Base' },
      { id: 'solana', name: 'Solana' },
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

    const handleChainClick = (chainId) => {
      if (chainId === 'solana') {
        window.open('https://solana.dogeswap.co', '_blank');
      } else {
        switchNetwork?.(chainId);
      }
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
                  onClick={() => handleChainClick(c.id)}
                  className="chain-switcher-option"
                  variant="ghost"
                >
                  <HStack spacing={3} width="100%" justify="flex-start">
                    <Image
                      src={CHAIN_LOGOS[c.id]}
                      alt={c.name}
                      className="chain-logo"
                    />
                    <Text className="chain-name">{c.name}</Text>
                    {c.id === 'solana' && (
                      <Icon as={FaExternalLinkAlt} ml="auto" />
                    )}
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
        8453: { from: 'ETH', to: 'USDC' },
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
            {/* <Link href="#" isExternal><Icon as={FaGlobe} color="orange" boxSize={5} /></Link> */}
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
            <Image src={bscLogo} alt="BSC" height="32px" />
            <Image src={polygonLogo} alt="Polygon" height="32px" />
            <Image src={arbitrumLogo} alt="Arbitrum" height="32px" />
            <Image src={baseLogo} alt="Base" height="32px" />
            <Image src={lineaLogo} alt="Linea" height="32px" />
            <Image src={solanaLogo} alt="Linea" height="32px" />
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
      const tokenInfo = await importToken(newToken.address, chain.id);

      // Add to custom tokens
          setCustomTokens(prev => ({
            ...prev,
            [chain.id]: {
              ...(prev[chain.id] || {}),
          [tokenInfo.symbol]: {
            address: tokenInfo.address,
            symbol: tokenInfo.symbol,
            decimals: tokenInfo.decimals,
            logo: tokenInfo.logo,
            name: tokenInfo.name
          }
            }
          }));
          
      onImportModalClose();
          
          toast({
        title: 'Token imported successfully',
        description: `Added ${tokenInfo.symbol} (${tokenInfo.name})`,
            status: 'success',
            duration: 3000,
          });

      // Auto-select the imported token
      setToTokenSymbol(tokenInfo.symbol);
        } catch (error) {
          toast({
        title: 'Error importing token',
        description: error.message,
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