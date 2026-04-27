import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,ts}',
    './server/**/*.ts',
  ],
  theme: {
    extend: {
      colors: {
        'alpine-white':   '#FFFFFF',
        'pearl-white':    '#F7F7F7',
        'deep-charcoal':  '#1C1C1E',
        'steel-grey':     '#8E8E93',
        'taillight-ruby': '#C8102E',
      },
      fontFamily: {
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
} satisfies Config
