/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        script: ['"Great Vibes"', '"Brush Script MT"', 'cursive'],
      },
      colors: {
        // UI tokens — defined as CSS variables in index.css. The :root values
        // are the dark theme (default). `.theme-light` (public guest-facing
        // pages) and `.invitation-canvas` (the user's invitation) re-declare
        // them with the original light values. Semantics: ink-900 = max
        // contrast text, ink-50 = subtle surface tint.
        ink: {
          50: 'var(--ui-ink-50)',
          100: 'var(--ui-ink-100)',
          200: 'var(--ui-ink-200)',
          300: 'var(--ui-ink-300)',
          400: 'var(--ui-ink-400)',
          500: 'var(--ui-ink-500)',
          600: 'var(--ui-ink-600)',
          700: 'var(--ui-ink-700)',
          800: 'var(--ui-ink-800)',
          900: 'var(--ui-ink-900)',
        },
        surface: 'var(--ui-surface)',
        'on-accent': 'var(--ui-on-accent)',
        'ui-bg': 'var(--ui-bg)',
        'ui-accent': 'var(--ui-accent)',
      },
    },
  },
  plugins: [],
}
