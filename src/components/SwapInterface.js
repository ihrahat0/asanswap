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
} from '../utils/tokens';

const CHAIN_NAMES = {
  1: 'Ethereum',
  56: 'BSC',
  137: 'Polygon',
  42161: 'Arbitrum',
  84531: 'Base Goerli',
};

const ROUTER_ADDRESSES = {
  1: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2
  56: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeSwap
  137: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // QuickSwap
  42161: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', // SushiSwap
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
  const [slippage, setSlippage] = useState('1.0');
  const [customTokens, setCustomTokens] = useState({});
  const [tokenLogos, setTokenLogos] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newToken, setNewToken] = useState({
    address: '',
    symbol: '',
    decimals: '18',
  });

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
      const response = await Moralis.EvmApi.token.getTokenMetadata({
        addresses: [tokenAddress],
        chain: chainId,
      });
      
      if (response?.raw?.[0]?.token_uri) {
        return response.raw[0].token_uri;
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

  // Function to validate and add custom token
  const addCustomToken = async () => {
    try {
      if (!ethers.utils.isAddress(newToken.address)) {
        throw new Error('Invalid token address');
      }

      const tokenContract = new ethers.Contract(newToken.address, ERC20_ABI, provider);
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      const logo = await fetchTokenMetadata(chain.id, newToken.address);

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

      if (logo) {
        setTokenLogos(prev => ({
          ...prev,
          [newToken.address.toLowerCase()]: logo,
        }));
      }

      onClose();
      toast({
        title: 'Token added successfully',
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

    setLoading(true);
    try {
      const fromTokenAddress = getTokenAddress(chain.id, fromTokenSymbol);
      const toTokenAddress = getTokenAddress(chain.id, toTokenSymbol);
      const wrappedToken = getWrappedToken(chain.id);
      const routerAddress = ROUTER_ADDRESSES[chain.id];
      const dexName = DEX_NAMES[chain.id];

      if (!routerAddress) {
        throw new Error('DEX not supported on this chain');
      }

      // Get token decimals
      const fromDecimals = getTokenDecimals(chain.id, fromTokenSymbol);
      const toDecimals = getTokenDecimals(chain.id, toTokenSymbol);

      // Use wrapped token address for native tokens
      const actualFromAddress = isNativeToken(chain.id, fromTokenSymbol) 
        ? wrappedToken.address 
        : fromTokenAddress;
      const actualToAddress = isNativeToken(chain.id, toTokenSymbol)
        ? wrappedToken.address
        : toTokenAddress;

      // Convert amount to proper decimals
      const amountWei = ethers.utils.parseUnits(amount, fromDecimals).toString();

      // Calculate fee first
      const feeAmount = calculateFee(amountWei);
      const amountAfterFee = ethers.BigNumber.from(amountWei).sub(feeAmount);

      // Check token balances first
      if (!isNativeToken(chain.id, fromTokenSymbol)) {
        const tokenContract = new ethers.Contract(actualFromAddress, ERC20_ABI, provider);
        const balance = await tokenContract.balanceOf(address);
        if (balance.lt(amountWei)) {
          throw new Error(`Insufficient ${fromTokenSymbol} balance. You have ${ethers.utils.formatUnits(balance, fromDecimals)} ${fromTokenSymbol}`);
        }

        // Check and set approval
        const currentAllowance = await tokenContract.allowance(address, routerAddress);
        if (currentAllowance.lt(amountWei)) {
          console.log('Setting token approval...');
          try {
            const tokenContractWithSigner = tokenContract.connect(signer);
            // First set allowance to 0 to handle some tokens that require it
            if (currentAllowance.gt(0)) {
              const resetTx = await tokenContractWithSigner.approve(routerAddress, 0);
              await resetTx.wait();
            }
            const approveTx = await tokenContractWithSigner.approve(routerAddress, ethers.constants.MaxUint256);
            await approveTx.wait();
            console.log('Token approval confirmed');
          } catch (approvalError) {
            console.error('Approval error:', approvalError);
            throw new Error('Failed to approve token. Please try again.');
          }
        }
      }

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
          gasLimit: ethers.BigNumber.from(chain.id === 56 ? 500000 : 300000),
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

  // Get available tokens including custom ones
  const getAvailableTokens = () => {
    if (!chain) return [];
    const defaultTokens = Object.keys(TOKENS[chain.id] || {});
    const customChainTokens = Object.keys(customTokens[chain.id] || {});
    return [...defaultTokens, ...customChainTokens];
  };

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

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="2xl" fontWeight="bold" mb={4}>
        Multi-Chain DEX Aggregator
      </Text>

      {!isConnected && (
        <Box textAlign="center" py={4}>
          <Web3Button />
        </Box>
      )}

      {isConnected && (
        <>
          <Select
            placeholder="Select chain"
            value={chain?.id}
            onChange={(e) => handleChainSwitch(e.target.value)}
            isDisabled={isSwitchingChain}
          >
            {Object.entries(CHAIN_NAMES).map(([id, name]) => (
              <option key={id} value={id}>
                {name} {isSwitchingChain && pendingChainId === parseInt(id) && '(switching...)'}
              </option>
            ))}
          </Select>

          {chain && (
            <Box p={2} borderWidth="1px" borderRadius="md" bg="gray.50">
              <Text fontSize="sm">
                Network: {chain.name} {chain.testnet && ' (Testnet)'}
              </Text>
              <Text fontSize="sm" fontWeight="bold">
                Balance: {fromTokenBalance} {chain.nativeCurrency?.symbol || 'ETH'}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Chain ID: {chain.id}
              </Text>
            </Box>
          )}

          <Box p={4} borderWidth="1px" borderRadius="md">
            <VStack spacing={4}>
              <HStack width="100%" justify="space-between">
                <Box>
                  <Select
                    placeholder="Select token to swap from"
                    value={fromTokenSymbol}
                    onChange={(e) => setFromTokenSymbol(e.target.value)}
                    isDisabled={!chain || isSwitchingChain}
                  >
                    {getAvailableTokens().map((symbol) => (
                      <option key={symbol} value={symbol}>
                        {symbol}
                      </option>
                    ))}
                  </Select>
                  {fromTokenSymbol && (
                    <Text fontSize="sm" color="gray.600">
                      Balance: {fromTokenBalance} {fromTokenSymbol}
                    </Text>
                  )}
                </Box>
                <Input
                  placeholder="Amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  isDisabled={!fromTokenSymbol || isSwitchingChain}
                  width="60%"
                />
              </HStack>

              <HStack width="100%" justify="space-between">
                <Box>
                  <Select
                    placeholder="Select token to swap to"
                    value={toTokenSymbol}
                    onChange={(e) => setToTokenSymbol(e.target.value)}
                    isDisabled={!chain || isSwitchingChain}
                  >
                    {getAvailableTokens()
                      .filter((symbol) => symbol !== fromTokenSymbol)
                      .map((symbol) => (
                        <option key={symbol} value={symbol}>
                          {symbol}
                        </option>
                      ))}
                  </Select>
                  {toTokenSymbol && (
                    <Text fontSize="sm" color="gray.600">
                      Balance: {toTokenBalance} {toTokenSymbol}
                    </Text>
                  )}
                </Box>
              </HStack>

              <Box width="100%">
                <Text fontSize="sm" mb={2}>Slippage Tolerance (%)</Text>
                <Select
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                >
                  <option value="0.1">0.1%</option>
                  <option value="0.5">0.5%</option>
                  <option value="1.0">1.0%</option>
                  <option value="2.0">2.0%</option>
                  <option value="5.0">5.0%</option>
                  <option value="10.0">10.0%</option>
                </Select>
              </Box>

              <HStack width="100%" justify="space-between">
                <Button
                  colorScheme="blue"
                  onClick={getQuote}
                  isLoading={loading}
                  loadingText="Getting quote"
                  disabled={!fromTokenSymbol || !toTokenSymbol || !amount || isSwitchingChain}
                >
                  Get Quote
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleSwap}
                  isLoading={loading}
                  loadingText="Swapping"
                  disabled={!quote || loading || isSwitchingChain}
                >
                  Swap
                </Button>
              </HStack>

              {loading && <Spinner />}
              {quote && (
                <Box p={4} borderWidth="1px" borderRadius="md">
                  <Text fontWeight="bold">DEX: {quote.dexName}</Text>
                  <Text>Estimated Output: {formatTokenAmount(quote.toTokenAmount, getTokenDecimals(chain.id, toTokenSymbol), toTokenSymbol)} {toTokenSymbol}</Text>
                  <Text fontSize="sm" color="gray.500">
                    Commission Fee ({FEE_PERCENTAGE}%): {formatTokenAmount(quote.feeAmount, getTokenDecimals(chain.id, fromTokenSymbol), fromTokenSymbol)} {fromTokenSymbol}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Amount After Fee: {formatTokenAmount(quote.amountAfterFee, getTokenDecimals(chain.id, fromTokenSymbol), fromTokenSymbol)} {fromTokenSymbol}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Slippage Tolerance: {slippage}%
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Minimum Received: {formatTokenAmount(
                      ethers.BigNumber.from(quote.toTokenAmount).mul(Math.floor((100 - parseFloat(slippage)) * 100)).div(10000),
                      getTokenDecimals(chain.id, toTokenSymbol),
                      toTokenSymbol
                    )} {toTokenSymbol}
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>
        </>
      )}

      {/* Add Import Token button */}
      <Button size="sm" onClick={onOpen}>
        Import Token
      </Button>

      {/* Import Token Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Import Token</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel>Token Address</FormLabel>
              <Input
                value={newToken.address}
                onChange={(e) => setNewToken(prev => ({ ...prev, address: e.target.value }))}
                placeholder="0x..."
              />
            </FormControl>
            <Button mt={4} colorScheme="blue" onClick={addCustomToken}>
              Import Token
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default SwapInterface; 