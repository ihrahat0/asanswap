import React from 'react';
import { ChakraProvider, Box, Container } from '@chakra-ui/react';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/react';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { mainnet, bsc, polygon, arbitrum } from 'wagmi/chains';
import SwapInterface from './components/SwapInterface';
import theme from './theme';

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
    public: { http: ['https://mainnet.base.org'] },
    default: { http: ['https://mainnet.base.org'] },
  },
  blockExplorers: {
    etherscan: { name: 'BaseScan', url: 'https://basescan.org' },
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
};

const projectId = '89eba0126ab9d24e9fc4e2971e27f83a';

const chains = [mainnet, bsc, polygon, arbitrum, base];

const { provider } = configureChains(chains, [
  w3mProvider({ projectId })
]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors: w3mConnectors({ chains, projectId }),
  provider,
});

const ethereumClient = new EthereumClient(wagmiClient, chains);

function App() {
  return (
    <>
      <WagmiConfig client={wagmiClient}>
        <ChakraProvider theme={theme}>
          <Container maxW="container.md" py={8} className="main-container">
            <Box className="swap-container">
              <SwapInterface />
            </Box>
          </Container>
        </ChakraProvider>
      </WagmiConfig>
      <Web3Modal
        projectId={projectId}
        ethereumClient={ethereumClient}
        themeMode="dark"
      />
    </>
  );
}

export default App;
