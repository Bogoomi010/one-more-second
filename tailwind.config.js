/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // Font Families
      fontFamily: {
        primary: ['Quicksand', 'sans-serif'],
        secondary: ['Fira Code', 'monospace'],
        tertiary: ['Inter', 'sans-serif'],
      },

      // Font Sizes
      fontSize: {
        'brand-title': ['23px', { lineHeight: '1' }],
        'brand-title-lg': ['31px', { lineHeight: '1' }],
        'brand-subtitle': ['9px', { lineHeight: '1.2' }],
        'brand-subtitle-lg': ['10px', { lineHeight: '1.2' }],
        'ui-label': ['9px', { lineHeight: '1.2', letterSpacing: '0.04em' }],
        'ui-meta': ['10px', { lineHeight: '1.2', letterSpacing: '0.04em' }],
        'ui-tab': ['12px', { lineHeight: '1.2' }],
        'ui-body': ['14px', { lineHeight: '1.3' }],
        'ui-value': ['18px', { lineHeight: '1.2' }],
        'ui-title': ['20px', { lineHeight: '1.2' }],
        'ui-value-hero': ['42px', { lineHeight: '1' }],
        'ui-icon': ['16px', { lineHeight: '1' }],
        'ui-icon-lg': ['18px', { lineHeight: '1' }],
        '[9px]': '9px',
        '[10px]': '10px',
        '[11px]': '11px',
        '[12px]': '12px',
        '[14px]': '14px',
        '[18px]': '18px',
        '[20px]': '20px',
        '[24px]': '24px',
        '[32px]': '32px',
        '[48px]': '48px',
      },

      // Spacing (4px = 1, 6px = 1.5, 8px = 2, etc.)
      spacing: {
        '[10px]': '10px',
        '[14px]': '14px',
        '[40px]': '40px',
        '[48px]': '48px',
      },

      // Border Radius
      borderRadius: {
        '[3px]': '3px',
        '[4px]': '4px',
        '[24px]': '24px',
        '[32px]': '32px',
      },

      // Letter Spacing
      letterSpacing: {
        '[2px]': '2px',
      },

      // Colors (using CSS variables)
      colors: {
        // Background
        'bg-primary': 'var(--color-bg-primary)',
        'bg-secondary': 'var(--color-bg-secondary)',
        'bg-card': 'var(--color-bg-card)',
        'bg-card-alt': 'var(--color-bg-card-alt)',

        // Text
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        'text-disabled': 'var(--color-text-disabled)',
        'text-placeholder': 'var(--color-text-placeholder)',

        // Accent
        'accent-green': 'var(--color-accent-green)',
        'accent-blue': 'var(--color-accent-blue)',
        'accent-green-alpha': 'var(--color-accent-green-alpha)',
        'accent-blue-alpha': 'var(--color-accent-blue-alpha)',

        // Border
        'border-primary': 'var(--color-border-primary)',
        'border-secondary': 'var(--color-border-secondary)',
        'border-accent': 'var(--color-border-accent)',
      },

      // Backdrop Blur
      backdropBlur: {
        '[10px]': '10px',
      },

      // Background Image (gradients)
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
      },

      // Animation
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
