import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-900': '#1948b3',
        'primary-800': '#1d52c4',
        'primary-700': '#366be3',
        'primary-600': '#4a7de8',
        'primary-500': '#799cec',
        'primary-400': '#93aef0',
        'primary-300': '#a6bdf2',
        'primary-200': '#c4d2f6',
        'primary-100': '#d2def9',
        'primary-50': '#e9eefb',
        'accent': '#ecc979',
        'accent-dark': '#d4a84a',
        'background': '#f8fafc',
        'foreground': '#0f172a',
        'card': 'rgba(255, 255, 255, 0.8)',
        'muted': '#64748b',
        'muted-foreground': '#94a3b8',
        'success': '#22c55e',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'info': '#3b82f6',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

