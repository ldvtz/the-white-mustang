// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  runtimeConfig: {
    bookingCancellationCutoffDays: 3,
    twintPaymentRecipient: '',
    twintPaymentNote: '',
    twintQrImageUrl: '',
    bankTransferAccountName: '',
    bankTransferIban: '',
    bankTransferNote: '',
    mailTransport: 'smtp',
    mailFrom: 'info@thewhitemustang.ch',
    smtpHost: '127.0.0.1',
    smtpPort: 54325,
    resendApiKey: '',
    emailDeliveryTimeoutMs: 5000,
  },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
    '@nuxt/image',
    '@nuxtjs/sitemap',
  ],

  site: {
    url: 'https://thewhitemustang.ch',
    name: 'The White Mustang',
  },

  supabase: {
    redirect: false,
    types: '@@/types/supabase.ts',
  },

  i18n: {
    baseUrl: 'https://thewhitemustang.ch',
    locales: [
      { code: 'de', language: 'de-CH', name: 'Deutsch', file: 'de.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'de',
    langDir: 'locales/',
    lazy: true,
    strategy: 'prefix_except_default',
    restructureDir: 'i18n',
  },

  tailwindcss: {
    configPath: '@@/tailwind.config.ts',
  },

  image: {
    format: ['webp'],
    quality: 78,
    screens: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  sitemap: {
    exclude: [
      '/admin/**',
      '/en/admin/**',
      '/booking/manage/**',
      '/en/booking/manage/**',
      '/api/**',
    ],
  },

  routeRules: {
    '/': { sitemap: { changefreq: 'weekly', priority: 1 } },
    '/en': { sitemap: { changefreq: 'weekly', priority: 1 } },
    '/admin/**': { robots: false },
    '/en/admin/**': { robots: false },
    '/booking/manage/**': { robots: false },
    '/en/booking/manage/**': { robots: false },
    '/api/**': { robots: false },
  },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },
})
