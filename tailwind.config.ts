import scrollbarHide from 'tailwind-scrollbar-hide'

const config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [scrollbarHide],
}

export default config
