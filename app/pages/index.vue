<script setup lang="ts">
import { listIsoDateRange } from '@@/shared/booking'

definePageMeta({ layout: 'default' })

const { t } = useI18n()
const route = useRoute()

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  history.replaceState(null, '', `#${id}`)
}
const siteUrl = 'https://thewhitemustang.ch'
const heroImage = '/images/mustang-frontleft.webp'
const absoluteHeroImage = `${siteUrl}${heroImage}`
const canonicalUrl = computed(() => `${siteUrl}${route.path}`)

type PublicAvailabilityResponse = {
  unavailableDates: string[]
}

const bookingSelection = reactive({
  startDate: '',
  endDate: '',
})

const { data: availability, error: availabilityError, refresh: refreshAvailability } = await useFetch<PublicAvailabilityResponse>(
  '/api/availability',
  { default: () => ({ unavailableDates: [] }) },
)

const unavailableDates = computed(() => availability.value?.unavailableDates ?? [])

function selectBookingDate(date: string) {
  if (!bookingSelection.startDate || bookingSelection.endDate || date < bookingSelection.startDate) {
    bookingSelection.startDate = date
    bookingSelection.endDate = ''
    return
  }

  const range = listIsoDateRange(bookingSelection.startDate, date)
  const blocked = new Set(unavailableDates.value)
  if (range.some(d => blocked.has(d))) {
    bookingSelection.startDate = date
    bookingSelection.endDate = ''
    return
  }

  bookingSelection.endDate = date
}

useSeoMeta({
  title: () => t('storefront.seoTitle'),
  description: () => t('storefront.seoDescription'),
  ogTitle: () => t('storefront.seoTitle'),
  ogDescription: () => t('storefront.seoDescription'),
  ogUrl: () => canonicalUrl.value,
  ogImage: absoluteHeroImage,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('storefront.seoTitle'),
  twitterDescription: () => t('storefront.seoDescription'),
  twitterImage: absoluteHeroImage,
})

useHead(() => ({
  link: [
    {
      rel: 'preload',
      as: 'image',
      href: heroImage,
      fetchpriority: 'high',
    },
  ],
  script: [
    {
      key: 'storefront-json-ld',
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: 'The White Mustang',
        url: canonicalUrl.value,
        image: absoluteHeroImage,
        email: 'info@thewhitemustang.ch',
        slogan: 'American Emotion. Swiss Perfection.',
        areaServed: [
          {
            '@type': 'Country',
            name: 'Switzerland',
          },
          {
            '@type': 'Place',
            name: 'Swiss Alps',
          },
        ],
        makesOffer: {
          '@type': 'Offer',
          priceCurrency: 'CHF',
          availability: 'https://schema.org/InStock',
          itemOffered: {
            '@type': 'Product',
            name: t('storefront.gallery.alt'),
            description: t('storefront.seoDescription'),
            image: absoluteHeroImage,
          },
        },
      }),
    },
  ],
}))

</script>

<template>
  <div class="font-sans text-deep-charcoal bg-alpine-white">
    <!-- Navbar -->
    <StorefrontNav />

    <main>
      <!-- ─── HERO ─────────────────────────────────────────────────────────── -->
      <section
        id="hero"
        data-testid="section-hero"
        class="relative min-h-screen flex items-end"
      >
        <!-- Background image -->
        <div class="absolute inset-0 overflow-hidden">
          <img
            :src="heroImage"
            :alt="t('storefront.gallery.alt')"
            data-testid="hero-image"
            width="1920"
            height="1440"
            loading="eager"
            decoding="async"
            fetchpriority="high"
            class="w-full h-full object-cover object-center"
          />
          <!-- Gradient overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        <!-- Content -->
        <div class="relative z-10 max-w-7xl mx-auto px-6 pb-24 pt-32 w-full">
          <p class="text-taillight-ruby text-sm font-bold uppercase tracking-[0.2em] mb-4">
            {{ t('storefront.hero.tagline') }}
          </p>
          <h1 class="text-white font-bold uppercase text-5xl md:text-7xl lg:text-8xl leading-none mb-6 max-w-3xl">
            {{ t('storefront.hero.headline') }}
          </h1>
          <p class="text-white/70 text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
            {{ t('storefront.hero.subheadline') }}
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <a
              href="#calendar"
              data-testid="hero-cta-primary"
              class="bg-taillight-ruby text-white font-bold uppercase tracking-wider px-8 py-4 rounded-md hover:bg-red-700 transition-colors text-center min-h-[44px] flex items-center justify-center"
              @click.prevent="scrollTo('calendar')"
            >
              {{ t('storefront.hero.ctaPrimary') }}
            </a>
            <a
              href="#gallery"
              data-testid="hero-cta-secondary"
              class="border border-white/40 text-white font-bold uppercase tracking-wider px-8 py-4 rounded-md hover:border-white hover:bg-white/10 transition-colors text-center min-h-[44px] flex items-center justify-center"
              @click.prevent="scrollTo('gallery')"
            >
              {{ t('storefront.hero.ctaSecondary') }}
            </a>
          </div>
        </div>
      </section>

      <!-- ─── CAR SHOWCASE (slideshow + specs) ────────────────────────────── -->
      <CarShowcase />

      <!-- ─── PRICING & CALENDAR ────────────────────────────────────────────── -->
      <section
        id="calendar"
        data-testid="section-calendar"
        class="bg-pearl-white py-24"
      >
        <div class="max-w-5xl mx-auto px-6">
          <h2 class="text-deep-charcoal font-bold uppercase text-3xl md:text-4xl mb-4 tracking-tight">
            {{ t('storefront.pricing.heading') }}
          </h2>
          <p class="text-steel-grey mb-12">{{ t('storefront.pricing.subheading') }}</p>
          <LazyPricingCalendar
            :selected-start-date="bookingSelection.startDate"
            :selected-end-date="bookingSelection.endDate"
            :unavailable-dates="unavailableDates"
            @select-date="selectBookingDate"
          />
          <div
            v-if="availabilityError"
            data-testid="booking-availability-error"
            class="mt-4 flex items-center gap-3 text-sm text-steel-grey"
          >
            <span>{{ t('storefront.booking.availabilityError') }}</span>
            <button
              class="underline underline-offset-2 hover:text-deep-charcoal transition-colors"
              @click="refreshAvailability()"
            >
              {{ t('storefront.booking.availabilityRetry') }}
            </button>
          </div>
          <BookingRequestForm
            :selected-start-date="bookingSelection.startDate"
            :selected-end-date="bookingSelection.endDate"
            :unavailable-dates="unavailableDates"
          />
        </div>
      </section>
    </main>

    <!-- ─── FOOTER ────────────────────────────────────────────────────────── -->
    <footer
      data-testid="storefront-footer"
      class="bg-deep-charcoal text-white py-16"
    >
      <div class="max-w-7xl mx-auto px-6 flex flex-col items-center text-center gap-6">
        <img
          src="/logos/the-white-mustang-white.svg"
          alt="The White Mustang"
          class="h-8 w-auto opacity-90"
        />
        <p class="text-taillight-ruby font-bold uppercase tracking-[0.2em] text-sm">
          {{ t('storefront.footer.motif') }}
        </p>
        <p class="text-white/60 text-sm tracking-wider uppercase">
          {{ t('storefront.footer.tagline') }}
        </p>
        <p class="text-white/60 text-sm">
          {{ t('storefront.footer.contact') }}
          <a href="mailto:info@thewhitemustang.ch" class="text-taillight-ruby underline">info@thewhitemustang.ch</a>
        </p>
        <p class="text-white/30 text-xs mt-4 border-t border-white/10 pt-6 w-full">
          {{ t('storefront.footer.legal') }}
        </p>
      </div>
    </footer>
  </div>
</template>
