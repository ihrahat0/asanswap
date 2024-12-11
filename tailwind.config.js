/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#8B0000',
        'primary-hover': '#A00000',
        'accent': '#ba9f32',
      },
      animation: {
        'gradient': 'gradient 15s ease infinite',
        'pulse': 'pulse 8s ease-in-out infinite',
        'slide': 'slide 20s linear infinite',
        'typing': 'typing 2s steps(12, end)',
        'blink-caret': 'blink-caret 0.75s step-end infinite',
      },
      keyframes: {
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        pulse: {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '50%': { transform: 'scale(1.2)', opacity: '0.3' },
          '100%': { transform: 'scale(1)', opacity: '0.5' },
        },
        slide: {
          '0%': { transform: 'translateX(-50%) translateY(-50%) rotate(0deg)' },
          '100%': { transform: 'translateX(-50%) translateY(-50%) rotate(360deg)' },
        },
        typing: {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        'blink-caret': {
          'from, to': { borderColor: 'transparent' },
          '50%': { borderColor: '#8B0000' },
        },
      },
    },
  },
  plugins: [],
} 