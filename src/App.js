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
    public: { http: ['https://mainnet.base.org'] },
    default: { http: ['https://mainnet.base.org'] },
  },
  blockExplorers: {
    etherscan: { name: 'BaseScan', url: 'https://basescan.org' },
    default: { name: 'BaseScan', url: 'https://basescan.org' },
  },
};

const projectId = '22f19550b598704607c805922ea947a1';

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
          <Box bg="brand.background" minH="100vh" display="flex" alignItems="center">
            <Container py={8} px={4} width="100%">
              <Center>
                <Box width="100%" maxW="450px">
                  <SwapInterface />
                </Box>
              </Center>
            </Container>
          </Box>
          <style jsx global>{`
            @import url('https://fonts.googleapis.com/css2?family=Lilita+One&display=swap');
            
            body {
              font-family: "Lilita One", sans-serif;
              font-weight: 400;
              font-style: normal;
            }
          `}</style>
        </ChakraProvider>
      </WagmiConfig>
      <Web3Modal
        projectId={projectId}
        ethereumClient={ethereumClient}
        themeMode="dark"
        themeColor="green"
      />
    </>
  );
}

export default App;
