import React, { useState } from 'react';
import { ethers } from 'ethers';

// First define all ABIs
const V2_FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)'
];

const V3_FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)'
];

const V2_ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
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

// Then define network configurations
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
  BASE: {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://base-mainnet.infura.io/v3/b933365d933f41ba9c566a622a2d40e3',
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

// Then define helper functions
const switchNetwork = async (networkConfig) => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${networkConfig.id.toString(16)}` }],
    });
  } catch (error) {
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${networkConfig.id.toString(16)}`,
            chainName: networkConfig.name,
            nativeCurrency: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: [networkConfig.rpcUrl],
            blockExplorerUrls: [networkConfig.blockExplorer]
          }]
        });
      } catch (addError) {
        throw new Error(`Failed to add ${networkConfig.name} network`);
      }
    }
    throw error;
  }
};

const SwapInterface = () => {
  const [account, setAccount] = useState('');
  const [tokenOut, setTokenOut] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const feeTier = 10000; // Fixed fee tier since we're not using the setter
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS.MAINNET);

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet');
    }
  };

  const checkNetwork = async () => {
    if (window.ethereum) {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (parseInt(chainId, 16) !== selectedNetwork.id) {
        try {
          await switchNetwork(selectedNetwork);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return true;
        } catch (error) {
          setError(`Failed to switch to ${selectedNetwork.name}: ${error.message}`);
          return false;
        }
      }
      return true;
    }
    return false;
  };

  const checkLiquidity = async (tokenAddress) => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // Convert addresses to lowercase before getting checksum
      const checksummedTokenAddress = ethers.utils.getAddress(tokenAddress.toLowerCase());
      const checksummedWeth = ethers.utils.getAddress(selectedNetwork.weth.toLowerCase());
      const checksummedV2Factory = ethers.utils.getAddress(selectedNetwork.v2Factory.toLowerCase());
      const checksummedV3Factory = ethers.utils.getAddress(selectedNetwork.v3Factory.toLowerCase());
      
      // Check V2 first
      const v2Factory = new ethers.Contract(checksummedV2Factory, V2_FACTORY_ABI, provider);
      const v2Pool = await v2Factory.getPair(checksummedWeth, checksummedTokenAddress);
      
      if (v2Pool && v2Pool !== ethers.constants.AddressZero) {
        try {
          const checksummedV2Router = ethers.utils.getAddress(selectedNetwork.v2Router.toLowerCase());
          const router = new ethers.Contract(checksummedV2Router, V2_ROUTER_ABI, provider);
          const testAmount = ethers.utils.parseEther('0.1');
          await router.getAmountsOut(testAmount, [checksummedWeth, checksummedTokenAddress]);
          return 'v2';
        } catch (error) {
          console.log('V2 pool exists but might not have liquidity');
        }
      }
      
      // Then check V3
      const v3Factory = new ethers.Contract(checksummedV3Factory, V3_FACTORY_ABI, provider);
      const v3Pool = await v3Factory.getPool(checksummedWeth, checksummedTokenAddress, feeTier);
      
      if (v3Pool && v3Pool !== ethers.constants.AddressZero) {
        return 'v3';
      }
      
      throw new Error('No active liquidity pool found');
    } catch (error) {
      console.error('Error checking liquidity:', error);
      throw error;
    }
  };

  const handleSwap = async () => {
    setError('');
    if (!tokenOut || !amount || !account) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) return;

      const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const amountIn = ethers.utils.parseEther(amount);
      
      // Get checksummed addresses
      const checksummedTokenOut = ethers.utils.getAddress(tokenOut);
      
      setLoading(true);
      try {
        const deadline = Math.floor(Date.now() / 1000) + 1800;

        // Detect which version to use
        const version = await checkLiquidity(checksummedTokenOut);
        console.log('Using version:', version);

        let tx;
        if (version === 'v2') {
          const router = new ethers.Contract(selectedNetwork.v2Router, selectedNetwork.v2RouterAbi, signer);
          
          try {
            // Get expected output amount
            const amounts = await router.getAmountsOut(amountIn, [selectedNetwork.weth, checksummedTokenOut]);
            const amountOutMin = amounts[1].mul(90).div(100); // 10% slippage tolerance
            
            console.log('V2 Swap Parameters:', {
              amountIn: amountIn.toString(),
              amountOutMin: amountOutMin.toString(),
              path: [selectedNetwork.weth, checksummedTokenOut],
              deadline
            });

            const gasPrice = await provider.getGasPrice();
            const gasSettings = {
              value: amountIn,
              gasLimit: 500000,
              gasPrice: gasPrice
            };

            tx = await router.swapExactETHForTokens(
              amountOutMin,
              [selectedNetwork.weth, checksummedTokenOut],
              account,
              deadline,
              gasSettings
            );
          } catch (error) {
            console.error('V2 swap preparation failed:', error);
            throw new Error(`V2 swap preparation failed: ${error.message}`);
          }
        } else {
          if (selectedNetwork.id === 8453) {  // Base Chain
            const router = new ethers.Contract(selectedNetwork.v3Router, BASE_V3_ROUTER_ABI, signer);
            
            const path = ethers.utils.solidityPack(
              ['address', 'uint24', 'address'],
              [selectedNetwork.weth, feeTier, checksummedTokenOut]
            );

            const params = {
              path: path,
              recipient: account,
              amountIn: amountIn,
              amountOutMinimum: 0
            };

            console.log('V3 Swap Parameters:', {
              path: ethers.utils.hexlify(params.path),
              recipient: params.recipient,
              amountIn: ethers.utils.formatEther(amountIn),
              amountOutMinimum: '0'
            });

            // Base chain specific gas settings
            const feeData = await provider.getFeeData();
            const gasSettings = {
              value: amountIn,
              gasLimit: 400000,
              maxFeePerGas: feeData.maxFeePerGas,
              maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
              type: 2
            };

            console.log('Gas Settings:', {
              gasLimit: gasSettings.gasLimit.toString(),
              maxFeePerGas: ethers.utils.formatUnits(gasSettings.maxFeePerGas, 'gwei'),
              maxPriorityFeePerGas: ethers.utils.formatUnits(gasSettings.maxPriorityFeePerGas, 'gwei')
            });

            tx = await router.exactInput(
              params,
              {
                value: amountIn,
                gasLimit: 500000
              }
            );
          } else {  // Ethereum Mainnet
            const router = new ethers.Contract(selectedNetwork.v3Router, V3_ROUTER_ABI, signer);
            
            const path = ethers.utils.solidityPack(
              ['address', 'uint24', 'address'],
              [selectedNetwork.weth, feeTier, checksummedTokenOut]
            );

            const params = {
              path: path,
              recipient: account,
              deadline: deadline,
              amountIn: amountIn,
              amountOutMinimum: 0
            };

            tx = await router.exactInput(
              params,
              {
                value: amountIn,
                gasLimit: 500000
              }
            );
          }
        }

        console.log('Transaction hash:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction receipt:', receipt);
        
        setError(`Swap successful using Uniswap ${version.toUpperCase()}!`);
      } catch (error) {
        console.error('Swap failed:', error);
        if (error.reason) {
          setError(`Swap failed: ${error.reason}`);
        } else if (error.message.includes('insufficient')) {
          setError('Swap failed: Insufficient liquidity or price impact too high');
        } else if (error.message.includes('TRANSFER_FROM_FAILED')) {
          setError('Swap failed: Token transfer failed. The token might have transfer restrictions.');
        } else {
          setError('Swap failed: ' + error.message);
        }
      } finally {
        setLoading(false);
      }
    } catch (error) {
      setError('Invalid token address format');
    }
  };

  return (
    <div className="swap-container">
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <div>Connected: {account.slice(0, 6)}...{account.slice(-4)}</div>
          <div className="network-selector">
            <select 
              value={selectedNetwork.id}
              onChange={(e) => {
                const network = Object.values(NETWORKS).find(n => n.id === parseInt(e.target.value));
                setSelectedNetwork(network);
              }}
            >
              <option value={NETWORKS.MAINNET.id}>Ethereum Mainnet</option>
              <option value={NETWORKS.BASE.id}>Base</option>
            </select>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="token-input">
            <span className="token-label">From: ETH</span>
            <input
              type="number"
              placeholder="Amount in ETH"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="token-input">
            <span className="token-label">To:</span>
            <input
              placeholder="Token Address (e.g. USDC)"
              value={tokenOut}
              onChange={(e) => setTokenOut(e.target.value)}
            />
          </div>
          <button 
            onClick={handleSwap}
            disabled={loading}
          >
            {loading ? 'Swapping...' : 'Swap'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SwapInterface; 
