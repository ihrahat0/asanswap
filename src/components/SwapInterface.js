import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Select,
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
} from '@chakra-ui/react';
import { useAccount, useNetwork, useSwitchNetwork, useProvider, useSigner } from 'wagmi';
import { Web3Button } from '@web3modal/react';
import Moralis from 'moralis';
import { ethers } from 'ethers';
import { 
  TOKENS, 
  getTokenAddress, 
  isNativeToken, 
  getWrappedToken,
  getTokenDecimals,
  TOKEN_INFO,
} from '../utils/tokens';
import { FaGlobe, FaTwitter, FaTelegram } from 'react-icons/fa';

const CHAIN_NAMES = {
  1: 'Ethereum',
  56: 'BSC',
  137: 'Polygon',
  42161: 'Arbitrum',
  8453: 'Base',
};

const ROUTER_ADDRESSES = {
  1: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2
  56: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeSwap
  137: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // QuickSwap
  42161: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', // SushiSwap
  8453: '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86', // BaseSwap
};

const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
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
  1: 'Uniswap V2',
  56: 'PancakeSwap',
  137: 'QuickSwap',
  42161: 'SushiSwap',
  8453: 'BaseSwap',
};

// Constants
const FEE_RECIPIENT = '0x67FEa3f7Ba299F10269519E9987180Cb80C92C61';
const FEE_PERCENTAGE = 0.3; // 0.3%

const SwapInterface = () => {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: isSwitchingChain, pendingChainId } = useSwitchNetwork();
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
  const [tokenMetadata, setTokenMetadata] = useState({});
  const { isOpen: isImportModalOpen, onOpen: onImportModalOpen, onClose: onImportModalClose } = useDisclosure();
  const [newToken, setNewToken] = useState({
    address: '',
    symbol: '',
    decimals: '18',
  });
  const [importTokenInfo, setImportTokenInfo] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

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
            apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImVhNWU1MjY2LTAzZTQtNDM1NC1hZWI2LTc4YzNkNThhZjZkZiIsIm9yZ0lkIjoiMzQwNDMzIiwidXNlcklkIjoiMzQ5OTc2IiwidHlwZSI6IlBST0pFQ1QiLCJ0eXBlSWQiOiI0YTI5YmU4OC0zNzQzLTQ1Y2QtYWVkNS0xN2Q1ZmUxNDE2MDAiLCJpYXQiOjE3MzE4MzkzNTksImV4cCI6NDg4NzU5OTM1OX0.6lPHQrJxrS6Rm8PsV44h1s4HsB4B_62tLXkcoPZfD9U',
          });
        }
      } catch (error) {
        console.error('Failed to initialize Moralis:', error);
      }
    };
    initMoralis();
  }, []);

  // Function to fetch token metadata from Moralis
  const fetchTokenMetadata = useCallback(async (chainId, tokenAddress) => {
    try {
      // Handle native token metadata
      if (tokenAddress === 'NATIVE') {
        const nativeSymbol = {
          1: 'ETH',
          56: 'BNB',
          137: 'MATIC',
          42161: 'ETH',
          8453: 'ETH'
        }[chainId] || 'ETH';
        
        return {
          address: 'NATIVE',
          symbol: nativeSymbol,
          name: nativeSymbol,
          decimals: 18,
          logo: `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${
            chainId === 1 ? 'ethereum' :
            chainId === 56 ? 'binance' :
            chainId === 137 ? 'polygon' :
            'ethereum'
          }/info/logo.png`,
          thumbnail: null,
          links: null
        };
      }

      // Fetch token metadata from Moralis
      const response = await Moralis.EvmApi.token.getTokenMetadata({
        chain: '0x' + chainId.toString(16),
        addresses: [tokenAddress],
      });

      if (response?.raw?.[0]) {
        const metadata = response.raw[0];
        return {
          address: metadata.address,
          symbol: metadata.symbol,
          name: metadata.name,
          decimals: parseInt(metadata.decimals),
          logo: metadata.logo || metadata.thumbnail || `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${metadata.address}/logo.png`,
          thumbnail: metadata.thumbnail,
          links: metadata.links ? {
            website: metadata.links.website,
            twitter: metadata.links.twitter,
            telegram: metadata.links.telegram
          } : null
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return null;
    }
  }, []);

  // Function to fetch token balance
  const fetchTokenBalance = useCallback(async (tokenSymbol) => {
    if (!address || !chain?.id || !provider || !tokenSymbol) return '0';

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
  }, [address, chain?.id, provider, customTokens]);

  // Function to fetch native balance
  const fetchNativeBalance = useCallback(async () => {
    if (!address || !chain?.id || !provider) return '0';
    try {
      const balance = await provider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('Error fetching native balance:', error);
      return '0';
    }
  }, [address, chain?.id, provider]);

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

  const getQuote = async () => {
    if (!fromTokenSymbol || !toTokenSymbol || !amount || !chain?.id || !address || !signer) return;

    try {
      // Check if we have a router for this chain
      const routerAddress = ROUTER_ADDRESSES[chain.id];
      if (!routerAddress) {
        throw new Error('Swapping not supported on this chain yet');
      }

      // Check balance before proceeding
      const fromTokenAddress = getTokenAddress(chain.id, fromTokenSymbol) || 
        customTokens[chain.id]?.[fromTokenSymbol]?.address;
      
      let userBalance;
      let decimals;
      
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

      const amountWei = ethers.utils.parseUnits(amount, decimals);
      
      if (userBalance.lt(amountWei)) {
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

      const toTokenAddress = getTokenAddress(chain.id, toTokenSymbol) || 
        customTokens[chain.id]?.[toTokenSymbol]?.address;
      
      if (!fromTokenAddress || !toTokenAddress) {
        throw new Error('Invalid token address');
      }

      const wrappedToken = getWrappedToken(chain.id);
      if (!wrappedToken) {
        throw new Error('Wrapped token not found for this chain');
      }

      // Get router address and DEX name for the current chain
      const dexName = DEX_NAMES[chain.id];

      // Use wrapped token address for native tokens
      const actualFromAddress = isNativeToken(chain.id, fromTokenSymbol) 
        ? wrappedToken.address 
        : fromTokenAddress;
      const actualToAddress = isNativeToken(chain.id, toTokenSymbol)
        ? wrappedToken.address
        : toTokenAddress;

      // Get token decimals
      const toDecimals = await (isNativeToken(chain.id, toTokenSymbol) 
        ? Promise.resolve(18) 
        : new ethers.Contract(actualToAddress, ERC20_ABI, provider).decimals());

      // Convert amount to proper decimals
      const swapAmountWei = ethers.utils.parseUnits(amount, decimals).toString();

      // Calculate fee first
      const feeAmount = calculateFee(swapAmountWei);
      const amountAfterFee = ethers.BigNumber.from(swapAmountWei).sub(feeAmount);

      // Create router contract instance
      const router = new ethers.Contract(routerAddress, ROUTER_ABI, provider);

      // Get quote with amount after fee
      const amountsAfterFee = await router.getAmountsOut(
        amountAfterFee,
        [actualFromAddress, actualToAddress]
      );

      const estimatedOutputAmount = ethers.utils.formatUnits(amountsAfterFee[1], toDecimals);

      // Validate output amount
      if (amountsAfterFee[1].isZero() || parseFloat(estimatedOutputAmount) === 0) {
        throw new Error('Output amount is zero. This pair might not have enough liquidity on ' + dexName);
      }

      const quoteData = {
        fromTokenAmount: amountWei,
        toTokenAmount: amountsAfterFee[1].toString(),
        fromToken: {
          address: actualFromAddress,
          symbol: fromTokenSymbol,
        },
        toToken: {
          address: actualToAddress,
          symbol: toTokenSymbol,
        },
        router: routerAddress,
        dexName: dexName,
        path: [actualFromAddress, actualToAddress],
        deadline: Math.floor(Date.now() / 1000) + 20 * 60,
        feeAmount: feeAmount.toString(),
        amountAfterFee: amountAfterFee.toString(),
        options: {
          gasLimit: ethers.BigNumber.from(chain.id === 8453 ? 400000 : chain.id === 56 ? 500000 : 300000),
          gasPrice: await provider.getGasPrice()
        }
      };

      setQuote(quoteData);

      toast({
        title: 'Quote received from ' + dexName,
        description: `Estimated: ${estimatedOutputAmount} ${toTokenSymbol}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error getting quote:', error);
      toast({
        title: 'Error getting quote',
        description: error.reason || error.message || 'Failed to get quote',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!quote || !signer || !address || !chain?.id) return;

    setLoading(true);
    try {
      const router = new ethers.Contract(quote.router, ROUTER_ABI, signer);
      const deadline = Math.floor(Date.now() / 1000) + 20 * 60; // 20 minutes from now

      // Send fee first
      if (isNativeToken(chain.id, fromTokenSymbol)) {
        // For native token swaps, send fee directly
        const feeTx = await signer.sendTransaction({
          to: FEE_RECIPIENT,
          value: quote.feeAmount,
          gasLimit: 21000
        });
        await feeTx.wait();
        console.log('Fee sent:', ethers.utils.formatEther(quote.feeAmount), 'ETH');
      } else {
        // For token swaps, transfer fee tokens
        const tokenContract = new ethers.Contract(
          quote.fromToken.address,
          ERC20_ABI,
          signer
        );

        // Approve router if needed
        const currentAllowance = await tokenContract.allowance(address, quote.router);
        if (currentAllowance.lt(quote.fromTokenAmount)) {
          const approveTx = await tokenContract.approve(quote.router, ethers.constants.MaxUint256);
          await approveTx.wait();
        }

        // Send fee
        const feeTx = await tokenContract.transfer(FEE_RECIPIENT, quote.feeAmount, {
          gasLimit: 100000
        });
        await feeTx.wait();
        console.log('Fee sent:', ethers.utils.formatUnits(quote.feeAmount, getTokenDecimals(chain.id, fromTokenSymbol)), fromTokenSymbol);
      }

      // Calculate minimum amount out with custom slippage
      const amountOutMin = ethers.BigNumber.from(quote.toTokenAmount)
        .mul(Math.floor((100 - parseFloat(slippage)) * 100))
        .div(10000);

      const options = {
        gasLimit: quote.options.gasLimit,
        gasPrice: quote.options.gasPrice,
      };

      let tx;
      if (isNativeToken(chain.id, fromTokenSymbol)) {
        options.value = quote.amountAfterFee;
        tx = await router.swapExactETHForTokens(
          amountOutMin,
          quote.path,
          address,
          deadline,
          options
        );
      } else if (isNativeToken(chain.id, toTokenSymbol)) {
        tx = await router.swapExactTokensForETH(
          quote.amountAfterFee,
          amountOutMin,
          quote.path,
          address,
          deadline,
          options
        );
      } else {
        tx = await router.swapExactTokensForTokens(
          quote.amountAfterFee,
          amountOutMin,
          quote.path,
          address,
          deadline,
          options
        );
      }

      toast({
        title: 'Swap initiated',
        description: `Transaction hash: ${tx.hash}`,
        status: 'info',
        duration: 5000,
        isClosable: true,
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
      });

      // Reset form
      setFromTokenSymbol('');
      setToTokenSymbol('');
      setAmount('');
      setQuote(null);
    } catch (error) {
      console.error('Error during swap:', error);
      toast({
        title: 'Error',
        description: error.reason || error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Add token metadata fetching
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!chain?.id) return;
      
      const tokens = { ...TOKEN_INFO[chain.id], ...customTokens[chain.id] };
      const newMetadata = {};

      for (const [symbol, info] of Object.entries(tokens)) {
        const metadata = await fetchTokenMetadata(chain.id, info.address);
        if (metadata) {
          newMetadata[symbol] = metadata;
        }
      }

      setTokenMetadata(newMetadata);
    };
    
    fetchMetadata();
  }, [chain?.id, customTokens, fetchTokenMetadata]);

  const getAvailableTokens = useCallback(() => {
    if (!chain?.id) return [];
    const baseTokens = Object.keys(TOKEN_INFO[chain.id] || {});
    const customTokensList = customTokens[chain.id] ? Object.keys(customTokens[chain.id]) : [];
    return [...new Set([...baseTokens, ...customTokensList])];
  }, [chain?.id, customTokens]);

  const formatTokenAmount = (amount, decimals, symbol) => {
    // For tokens like BABYDOGE, show without decimal places
    if (symbol === 'BABYDOGE') {
      return ethers.utils.formatUnits(amount, decimals).split('.')[0];
    }
    // For other tokens, limit to 6 decimal places
    return parseFloat(ethers.utils.formatUnits(amount, decimals)).toFixed(6);
  };

  // Calculate fee amount
  const calculateFee = (amount, decimals) => {
    const feeMultiplier = FEE_PERCENTAGE * 100; // Convert 0.3% to 30 basis points
    return ethers.BigNumber.from(amount)
      .mul(feeMultiplier)
      .div(10000); // Divide by 100 * 100 to get the percentage
  };

  // Update the SocialLinks component to align left
  const SocialLinks = ({ links }) => {
    if (!links) return null;
    
    const { website, twitter, telegram } = links;
    if (!website && !twitter && !telegram) return null;

    return (
      <HStack justify="flex-start" spacing={4} py={1}>
        {website && (
          <Link href={website} isExternal>
            <Icon as={FaGlobe} boxSize={4} color="gray.500" _hover={{ color: "blue.500" }} />
          </Link>
        )}
        {twitter && (
          <Link href={twitter} isExternal>
            <Icon as={FaTwitter} boxSize={4} color="gray.500" _hover={{ color: "blue.500" }} />
          </Link>
        )}
        {telegram && (
          <Link href={telegram} isExternal>
            <Icon as={FaTelegram} boxSize={4} color="gray.500" _hover={{ color: "blue.500" }} />
          </Link>
        )}
      </HStack>
    );
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
  const TokenSelect = ({ value, onChange, tokens, label, chainId, isDisabled }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [searchQuery, setSearchQuery] = useState('');
    const [importLoading, setImportLoading] = useState(false);
    const [importTokenInfo, setImportTokenInfo] = useState(null);
    const toast = useToast();

    // Filter tokens or check if the search query is a valid address
    const isValidAddress = ethers.utils.isAddress(searchQuery);
    const filteredTokens = tokens.filter(symbol => 
      symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tokenMetadata[symbol]?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle search/import input change
    const handleSearchChange = async (value) => {
      setSearchQuery(value);
      if (ethers.utils.isAddress(value)) {
        setImportLoading(true);
        try {
          // First try to detect the chain
          const tokenChainId = await detectTokenChain(value);
          if (!tokenChainId) {
            throw new Error('Could not detect token chain');
          }

          // Get the RPC URL for the chain
          const rpcUrl = getChainRpcUrl(tokenChainId);
          if (!rpcUrl) {
            throw new Error('Unsupported chain');
          }

          // Create a provider for the specific chain
          const tokenProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
          const tokenContract = new ethers.Contract(value, ERC20_ABI, tokenProvider);

          // Fetch token details
          const [symbol, name, decimals] = await Promise.all([
            tokenContract.symbol(),
            tokenContract.name(),
            tokenContract.decimals()
          ]);

          // Fetch token metadata from Moralis
          const metadata = await fetchTokenMetadata(tokenChainId, value);

          setImportTokenInfo({
            address: value,
            symbol,
            name,
            decimals: decimals.toString(),
            chainId: tokenChainId,
            logo: metadata?.logo || null,
            links: metadata?.links || null
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
      } else {
        setImportTokenInfo(null);
      }
    };

    // Handle token import
    const handleImportToken = async () => {
      if (!importTokenInfo) return;

      try {
        // If on different chain, prompt to switch
        if (importTokenInfo.chainId !== chain?.id) {
          const chainName = CHAIN_NAMES[importTokenInfo.chainId];
          const shouldSwitch = window.confirm(
            `This token is on ${chainName}. Would you like to switch networks?`
          );
          if (shouldSwitch) {
            await handleChainSwitch(importTokenInfo.chainId);
            // Store token info to be added after chain switch
            sessionStorage.setItem('pendingTokenImport', JSON.stringify({
              address: importTokenInfo.address,
              chainId: importTokenInfo.chainId,
              symbol: importTokenInfo.symbol,
              name: importTokenInfo.name,
              decimals: importTokenInfo.decimals,
              logo: importTokenInfo.logo,
              links: importTokenInfo.links
            }));
            onClose();
            return;
          } else {
            throw new Error(`Please switch to ${chainName} to import this token`);
          }
        }

        // Add custom token
        setCustomTokens(prev => ({
          ...prev,
          [chain.id]: {
            ...(prev[chain.id] || {}),
            [importTokenInfo.symbol]: {
              address: importTokenInfo.address,
              symbol: importTokenInfo.symbol,
              decimals: importTokenInfo.decimals,
              name: importTokenInfo.name,
              logo: importTokenInfo.logo,
              links: importTokenInfo.links
            },
          },
        }));

        // Auto-select the imported token
        onChange(importTokenInfo.symbol);
        onClose();
        setSearchQuery('');
        setImportTokenInfo(null);

        toast({
          title: 'Token added successfully',
          description: `Added ${importTokenInfo.symbol} to ${CHAIN_NAMES[chain.id]}`,
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

    return (
      <FormControl>
        <FormLabel>{label}</FormLabel>
        <Box position="relative">
          <Button
            onClick={onOpen}
            width="100%"
            height="40px"
            isDisabled={isDisabled}
            bg="white"
            color="black"
            _hover={{ bg: 'gray.100' }}
            display="flex"
            justifyContent="flex-start"
            alignItems="center"
            px={4}
          >
            {value ? (
              <HStack spacing={2}>
                {tokenMetadata[value]?.logo && (
                  <Image
                    src={tokenMetadata[value].logo}
                    alt={value}
                    width="24px"
                    height="24px"
                    borderRadius="full"
                  />
                )}
                <Text>
                  {tokenMetadata[value]?.name || value} ({tokenMetadata[value]?.symbol || value})
                </Text>
              </HStack>
            ) : (
              'Select Token'
            )}
          </Button>

          <Modal isOpen={isOpen} onClose={() => {
            onClose();
            setSearchQuery('');
            setImportTokenInfo(null);
          }} isCentered>
            <ModalOverlay />
            <ModalContent maxH="80vh">
              <ModalHeader>Select Token</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Input
                  placeholder="Search by name or paste address"
                  mb={4}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />

                <VStack spacing={2} align="stretch" maxH="60vh" overflowY="auto">
                  {importLoading ? (
                    <HStack justify="center" py={4}>
                      <Spinner />
                      <Text>Loading token info...</Text>
                    </HStack>
                  ) : importTokenInfo ? (
                    <Box borderWidth={1} borderRadius="md" p={4}>
                      <HStack justify="space-between" align="center">
                        <HStack spacing={3}>
                          {importTokenInfo.logo && (
                            <Image
                              src={importTokenInfo.logo}
                              alt={importTokenInfo.symbol}
                              width="32px"
                              height="32px"
                              borderRadius="full"
                            />
                          )}
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="bold">{importTokenInfo.name}</Text>
                            <Text color="gray.500">{importTokenInfo.symbol}</Text>
                          </VStack>
                        </HStack>
                        <Button size="sm" colorScheme="blue" onClick={handleImportToken}>
                          Import
                        </Button>
                      </HStack>
                    </Box>
                  ) : (
                    filteredTokens.map((symbol) => (
                      <Button
                        key={symbol}
                        onClick={() => {
                          onChange(symbol);
                          onClose();
                          setSearchQuery('');
                        }}
                        variant="ghost"
                        justifyContent="flex-start"
                        width="100%"
                        height="50px"
                        _hover={{ bg: 'gray.100' }}
                      >
                        <HStack spacing={3}>
                          {tokenMetadata[symbol]?.logo && (
                            <Image
                              src={tokenMetadata[symbol].logo}
                              alt={symbol}
                              width="32px"
                              height="32px"
                              borderRadius="full"
                            />
                          )}
                          <VStack align="flex-start" spacing={0}>
                            <Text fontWeight="bold">
                              {tokenMetadata[symbol]?.name || symbol}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {tokenMetadata[symbol]?.symbol || symbol}
                            </Text>
                          </VStack>
                        </HStack>
                      </Button>
                    ))
                  )}
                </VStack>
              </ModalBody>
            </ModalContent>
          </Modal>
        </Box>
        {value && (
          <VStack align="flex-start" spacing={1} mt={1}>
            <Text fontSize="sm" color="gray.600">
              Balance: {value === fromTokenSymbol ? fromTokenBalance : toTokenBalance} {value}
            </Text>
            <SocialLinks links={tokenMetadata[value]?.links} />
          </VStack>
        )}
      </FormControl>
    );
  };

  // Function to validate token address and fetch metadata
  const validateTokenAddress = async (address) => {
    setImportLoading(true);
    try {
      if (!ethers.utils.isAddress(address)) {
        throw new Error('Invalid token address');
      }

      // Detect which chain the token is on
      const tokenChainId = await detectTokenChain(address);
      if (!tokenChainId) {
        throw new Error('Could not detect token chain');
      }

      const tokenContract = new ethers.Contract(address, ERC20_ABI, provider);
      const [symbol, name, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals()
      ]);

      // Fetch token metadata from Moralis
      const metadata = await fetchTokenMetadata(tokenChainId, address);

      setImportTokenInfo({
        address,
        symbol,
        name,
        decimals: decimals.toString(),
        chainId: tokenChainId,
        logo: metadata?.logo || null
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

  // Update the import modal section in the return statement
  const ImportTokenModal = () => (
    <Modal isOpen={isImportModalOpen} onClose={() => {
      onImportModalClose();
      setImportTokenInfo(null);
      setNewToken({ address: '', symbol: '', decimals: '18' });
    }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Import Token</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Token Address</FormLabel>
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
              />
            </FormControl>

            {importLoading && (
              <HStack justify="center" py={4}>
                <Spinner />
                <Text>Validating token...</Text>
              </HStack>
            )}

            {importTokenInfo && (
              <Box borderWidth={1} borderRadius="md" p={4}>
                <VStack align="stretch" spacing={3}>
                  <HStack>
                    {importTokenInfo.logo && (
                      <Image
                        src={importTokenInfo.logo}
                        alt={importTokenInfo.symbol}
                        width="32px"
                        height="32px"
                        borderRadius="full"
                      />
                    )}
                    <VStack align="flex-start" spacing={0}>
                      <Text fontWeight="bold">{importTokenInfo.name}</Text>
                      <Text color="gray.500">{importTokenInfo.symbol}</Text>
                    </VStack>
                  </HStack>
                  <Text fontSize="sm">Network: {CHAIN_NAMES[importTokenInfo.chainId]}</Text>
                  <Text fontSize="sm" wordBreak="break-all">Address: {importTokenInfo.address}</Text>
                  <Text fontSize="sm">Decimals: {importTokenInfo.decimals}</Text>
                </VStack>
              </Box>
            )}

            <Button
              mt={4}
              colorScheme="blue"
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

  // Add a ChainSelect component
  const ChainSelect = () => {
    const { chain } = useNetwork();
    const { switchNetwork, isLoading } = useSwitchNetwork();

    const chains = [
      { id: 1, name: 'Ethereum' },
      { id: 56, name: 'BSC' },
      { id: 137, name: 'Polygon' },
      { id: 42161, name: 'Arbitrum' }
      // { id: 8453, name: 'Base' }
    ];

    return (
      <Select
        value={chain?.id || ''}
        onChange={(e) => switchNetwork?.(Number(e.target.value))}
        isDisabled={isLoading}
        width="150px"
        size="sm"
      >
        {chains.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>
    );
  };

  return (
    <Box p={4}>
      <VStack spacing={4} align="stretch" width="100%" maxW="400px" mx="auto">
        {!address ? (
          <Web3Button />
        ) : (
          <>
            <HStack justify="space-between" align="center">
              <Text fontSize="sm">Connected to:</Text>
              <ChainSelect />
            </HStack>

            <VStack spacing={4} align="stretch">
              <Box>
                <TokenSelect
                  value={fromTokenSymbol}
                  onChange={setFromTokenSymbol}
                  tokens={getAvailableTokens()}
                  label="From Token"
                  chainId={chain?.id}
                  isDisabled={!chain || isSwitchingChain}
                />
              </Box>

              <Button onClick={handleSwapTokens} size="sm">
                ↕️ Swap
              </Button>

              <Box>
                <TokenSelect
                  value={toTokenSymbol}
                  onChange={setToTokenSymbol}
                  tokens={getAvailableTokens().filter(t => t !== fromTokenSymbol)}
                  label="To Token"
                  chainId={chain?.id}
                  isDisabled={!chain || isSwitchingChain}
                />
              </Box>

              <Box>
                <FormControl>
                  <FormLabel>Amount</FormLabel>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    isDisabled={!fromTokenSymbol || !toTokenSymbol || isSwitchingChain}
                  />
                </FormControl>
              </Box>

              <Box>
                <FormControl>
                  <FormLabel>Slippage Tolerance</FormLabel>
                  <Select
                    value={slippage}
                    onChange={(e) => setSlippage(e.target.value)}
                  >
                    <option value="0.1">0.1%</option>
                    <option value="0.5">0.5%</option>
                    <option value="1.0">1.0%</option>
                    <option value="2.0">2.0%</option>
                    <option value="5.0">5.0%</option>
                  </Select>
                </FormControl>
              </Box>

              <HStack spacing={4}>
                <Button
                  colorScheme="blue"
                  onClick={getQuote}
                  isLoading={loading}
                  loadingText="Getting Quote"
                  isDisabled={!fromTokenSymbol || !toTokenSymbol || !amount || isSwitchingChain}
                  flex={1}
                >
                  Get Quote
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleSwap}
                  isLoading={loading}
                  loadingText="Swapping"
                  isDisabled={!quote || loading || isSwitchingChain}
                  flex={1}
                >
                  Swap
                </Button>
              </HStack>

              {quote && (
                <Box p={4} borderWidth={1} borderRadius="md" bg="gray.50">
                  <VStack align="stretch" spacing={2}>
                    <Text fontWeight="bold">Quote Details</Text>
                    <Text>DEX: {quote.dexName}</Text>
                    <Text>Output: {formatTokenAmount(quote.toTokenAmount, getTokenDecimals(chain.id, toTokenSymbol), toTokenSymbol)} {toTokenSymbol}</Text>
                    <Text fontSize="sm" color="gray.600">
                      Fee ({FEE_PERCENTAGE}%): {formatTokenAmount(quote.feeAmount, getTokenDecimals(chain.id, fromTokenSymbol), fromTokenSymbol)} {fromTokenSymbol}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Slippage: {slippage}%
                    </Text>
                  </VStack>
                </Box>
              )}
            </VStack>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default SwapInterface; 