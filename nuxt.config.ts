// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    bookingCancellationCutoffDays: 3,
    twintPaymentRecipient: '',
    twintPaymentNote: '',
    twintQrImageUrl: '',
    bankTransferAccountName: '',
    bankTransferIban: '',
    bankTransferNote: '',
  },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/i18n',
  ],

  supabase: {
    redirect: false,
    types: '@@/types/supabase.ts',
  },

  i18n: {
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

  app: {
    head: {
      link: [
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
