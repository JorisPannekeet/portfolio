/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      colors: {
        stone: {
          950: 'rgb(var(--stone-950) / <alpha-value>)',
          900: 'rgb(var(--stone-900) / <alpha-value>)',
          850: 'rgb(var(--stone-850) / <alpha-value>)',
          800: 'rgb(var(--stone-800) / <alpha-value>)',
          700: 'rgb(var(--stone-700) / <alpha-value>)',
          600: 'rgb(var(--stone-600) / <alpha-value>)',
          500: 'rgb(var(--stone-500) / <alpha-value>)',
          400: 'rgb(var(--stone-400) / <alpha-value>)',
          300: 'rgb(var(--stone-300) / <alpha-value>)',
          200: 'rgb(var(--stone-200) / <alpha-value>)',
          100: 'rgb(var(--stone-100) / <alpha-value>)',
          50: 'rgb(var(--stone-50) / <alpha-value>)',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      maxWidth: {
        'prose': '65ch',
        'content': '72rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
