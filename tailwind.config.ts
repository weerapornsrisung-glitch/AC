import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(249,249,247)',
        ink: '#1A1A1A',
        muted: '#888780',
        accent: '#F1EFE8',
      },
      borderColor: {
        DEFAULT: 'rgba(0,0,0,0.12)',
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
      },
    },
  },
  plugins: [],
}

export default config
