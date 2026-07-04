/** @type {import('tailwindcss').Config} */
// Keep color/radius/spacing values in sync with constants/tokens.ts
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#F8F7F4',
        surface: '#FFFFFF',
        primary: '#1C1917',
        secondary: '#78716C',
        border: '#E7E5E4',
        accent: '#6366F1',
        'accent-muted': '#EEF2FF',
        success: '#16A34A',
        'success-muted': '#DCFCE7',
        warning: '#D97706',
        'warning-muted': '#FEF3C7',
      },
      borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
    },
  },
  plugins: [],
};
