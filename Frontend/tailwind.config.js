/** @type {import('tailwindcss').Config} */

// Palette taken from the GharSathi mockups.
// `brand` = deep teal (nav, hero bands, message sidebar, own chat bubbles).
// `sun` = amber, used for every primary action. `coral` / `mint` = rotating card colours.
// `slate` is overridden with a green-tinted grey so every un-mocked page harmonises too.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5f2',
          100: '#d6e9e3',
          200: '#afd4cb',
          300: '#7db8ac',
          400: '#3f8f83',
          500: '#1f6f66',
          600: '#14524f',
          700: '#0f4441',
          800: '#0c3634',
          900: '#0a2a29',
        },
        sun: { 100: '#ffe7b3', 300: '#ffc95c', 400: '#ffb627', 500: '#f2a20f', 600: '#d98b00' },
        coral: { 400: '#ff8a6b', 500: '#f2704d' },
        mint: { 400: '#7fd1c3', 500: '#5dbdad' },
        mist: '#dce8e2',
        slate: {
          50: '#f3f7f5',
          100: '#e7efec',
          200: '#d3dfda',
          300: '#b4c6bf',
          400: '#8ca39b',
          500: '#66807a',
          600: '#4a635d',
          700: '#324a45',
          800: '#1b3431',
          900: '#0b2b2a',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Bricolage Grotesque"', '"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(10,42,41,.06), 0 8px 24px -8px rgba(10,42,41,.18)',
      },
    },
  },
  plugins: [],
}
