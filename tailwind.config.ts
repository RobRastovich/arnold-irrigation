import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f2f5',
          100: '#cce5ed',
          200: '#99c9db',
          300: '#66adc9',
          400: '#3391b7',
          500: '#0075a5',
          600: '#005e84',
          700: '#004763',
          800: '#003042',
          900: '#001921',
        },
        secondary: {
          50: '#f0f7f0',
          100: '#e0efe0',
          200: '#c1dfc1',
          300: '#a2cfa2',
          400: '#83bf83',
          500: '#64af64',
          600: '#508b50',
          700: '#3c6d3c',
          800: '#284f28',
          900: '#143114',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
