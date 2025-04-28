import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  fonts: {
    heading: '"Lilita One", sans-serif',
    body: '"Lilita One", sans-serif',
  },
  colors: {
    brand: {
      primary: '#117e4e',
      secondary: '#1E2127',
      background: '#121212',
      card: '#1B1C22',
      cardborder: '#2A2C33',
      text: '#FFFFFF',
      subtext: '#9E9E9E',
    },
  },
  styles: {
    global: {
      body: {
        bg: '#121212',
        color: 'white',
        fontFamily: '"Lilita One", sans-serif',
      },
      '.lilita-one-regular': {
        fontFamily: '"Lilita One", sans-serif',
        fontWeight: 400,
        fontStyle: 'normal',
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'green',
      },
      variants: {
        solid: {
          bg: '#117e4e',
          color: 'white',
          fontWeight: 'bold',
          _hover: {
            bg: '#0e6940',
          },
        },
        ghost: {
          color: 'white',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
    Box: {
      baseStyle: {
        borderRadius: 'md',
      },
    },
    Container: {
      baseStyle: {
        maxW: '1200px',
      },
    },
  },
});

export default theme; 