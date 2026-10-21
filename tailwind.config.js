/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Orbitron', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Rajdhani', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        void: '#07070d',
        panel: '#0f0f1a',
        raised: '#151524',
        neon: '#00f5ff',
        plasma: '#ff2d95',
        acid: '#b8ff00',
        ember: '#ff6b5b',
        ink: '#eef1f8',
        muted: '#8e95aa',
      },
      boxShadow: {
        neon: '0 0 20px rgba(0, 245, 255, 0.35)',
        plasma: '0 0 20px rgba(255, 45, 149, 0.35)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 20px 40px -24px rgba(0,0,0,0.8)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        drift: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        rise: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        blip: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.25' } },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        drift: 'drift 90s linear infinite',
        rise: 'rise .4s ease-out both',
        blip: 'blip 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
