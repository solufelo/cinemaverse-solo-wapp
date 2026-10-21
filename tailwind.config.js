/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Self-hosted latin subsets in /public/fonts (see index.css). Orbitron is display only.
        display: ['Orbitron', '"Arial Black"', 'ui-sans-serif', 'sans-serif'],
        sans: ['Saira', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      colors: {
        void: '#07070d',
        panel: '#0d0d17',
        raised: '#14141f',
        neon: '#00f5ff',
        plasma: '#ff2d95',
        acid: '#b8ff00',
        ember: '#ff6b5b',
        ink: '#eef1f8',
        muted: '#8e95aa',
      },
      maxWidth: {
        frame: '1240px',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(.2,.7,.2,1)',
        snap: 'cubic-bezier(.3,1.4,.5,1)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'marquee-y': { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(-50%)' } },
        rise: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'none' } },
        blip: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.25' } },
        pop: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.35)' }, '100%': { transform: 'scale(1)' } },
        'sheet-in': { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
        fade: { from: { opacity: '0' }, to: { opacity: '1' } },
        scan: { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(300%)' } },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        marquee: 'marquee 60s linear infinite',
        'marquee-y': 'marquee-y 50s linear infinite',
        rise: 'rise .5s cubic-bezier(.2,.7,.2,1) both',
        blip: 'blip 1.6s ease-in-out infinite',
        pop: 'pop .35s cubic-bezier(.3,1.4,.5,1)',
        'sheet-in': 'sheet-in .42s cubic-bezier(.2,.8,.2,1) both',
        fade: 'fade .3s ease-out both',
        scan: 'scan 1.1s cubic-bezier(.6,0,.2,1) infinite',
      },
    },
  },
  plugins: [],
}
