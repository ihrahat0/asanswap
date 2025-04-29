import React from 'react';
import { ChakraProvider, Box, Container, Center } from '@chakra-ui/react';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/react';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { mainnet, bsc, polygon, arbitrum } from 'wagmi/chains';
import SwapInterface from './components/SwapInterface';
import theme from './theme';
import './styles.css';

// Define Base chain manually since it's not included in wagmi/chains yet
const base = {
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { 
      http: [
        'https://mainnet.base.org',
        'https://base.llamarpc.com',
        'https://base.gateway.tenderly.co',
        'https://base-mainnet.public.blastapi.io'
      ] 
    },
    default: { 
      http: [
        'https://mainnet.base.org',
        'https://base.llamarpc.com',
        'https://base.gateway.tenderly.co',
        'https://base-mainnet.public.blastapi.io'
      ] 
    },
  },
  blockExplorers: {
    etherscan: { name: 'BaseScan', url: 'https://basescan.org' },
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
};

const projectId = '22f19550b598704607c805922ea947a1';

const chains = [mainnet, bsc, polygon, arbitrum, base];

// Configure chains with multiple providers for redundancy
const { provider, webSocketProvider } = configureChains(
  chains, 
  [
    w3mProvider({ projectId }),
  ],
  {
    pollingInterval: 5000,
    stallTimeout: 5000,
    retryCount: 3,
    retryDelay: 1500,
  }
);

const wagmiClient = createClient({
  autoConnect: true,
  connectors: w3mConnectors({ 
    chains,
    projectId,
    version: 2, // Use latest version
  }),
  provider,
  webSocketProvider,
});

const ethereumClient = new EthereumClient(wagmiClient, chains);

function App() {
  return (
    <WagmiConfig client={wagmiClient}>
      <ChakraProvider theme={theme}>
        <Box minH="100vh" bg="gray.900">
          <Container maxW="container.xl" py={8}>
            <Center mb={8}>
              <SwapInterface />
            </Center>
          </Container>
        </Box>
      </ChakraProvider>
      <Web3Modal 
        projectId={projectId} 
        ethereumClient={ethereumClient}
        themeMode="dark"
        chainImages={{
          8453: '/base-logo.png' // Add Base chain logo
        }}
        defaultChain={base}
        explorerRecommendedWalletIds={[
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Coinbase
          'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Trust
        ]}
      />
    </WagmiConfig>
  );
}

export default App;
