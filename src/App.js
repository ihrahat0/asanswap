import React from 'react';
import { ChakraProvider, Box, Container } from '@chakra-ui/react';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/react';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { mainnet, bsc, polygon, arbitrum, baseGoerli } from 'wagmi/chains';
import SwapInterface from './components/SwapInterface';
import theme from './theme';

const projectId = '89eba0126ab9d24e9fc4e2971e27f83a'; // Get this from https://cloud.walletconnect.com

const chains = [mainnet, bsc, polygon, arbitrum, baseGoerli];

const { provider } = configureChains(chains, [
  w3mProvider({ projectId }),
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
          <Container maxW="container.md" py={8}>
            <Box
              borderWidth="1px"
              borderRadius="lg"
              p={6}
              boxShadow="lg"
              bg="white"
            >
              <SwapInterface />
            </Box>
          </Container>
        </ChakraProvider>
      </WagmiConfig>
      <Web3Modal
        projectId={projectId}
        ethereumClient={ethereumClient}
        themeMode="light"
      />
    </>
  );
}

export default App;
