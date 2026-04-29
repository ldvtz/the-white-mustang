<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { t } = useI18n()

type PublicAvailabilityResponse = {
  unavailableDates: string[]
}

const bookingSelection = reactive({
  startDate: '',
  endDate: '',
})

const { data: availability, error: availabilityError } = await useFetch<PublicAvailabilityResponse>(
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

  bookingSelection.endDate = date
}

useSeoMeta({
  title: () => t('storefront.seoTitle'),
  description: () => t('storefront.seoDescription'),
  ogTitle: () => t('storefront.seoTitle'),
  ogDescription: () => t('storefront.seoDescription'),
  ogImage: '/images/temp_mustang_1.webp',
  ogType: 'website',
})

</script>

<template>
  <div class="font-sans text-deep-charcoal bg-alpine-white">
    <!-- Navbar -->
    <StorefrontNav />

    <!-- ─── HERO ─────────────────────────────────────────────────────────── -->
    <section
      id="hero"
      data-testid="section-hero"
      class="relative min-h-screen flex items-end"
    >
      <!-- Background image -->
      <div class="absolute inset-0 overflow-hidden">
        <img
          src="/images/temp_mustang_1.webp"
          :alt="t('storefront.gallery.alt')"
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
          >
            {{ t('storefront.hero.ctaPrimary') }}
          </a>
          <a
            href="#gallery"
            data-testid="hero-cta-secondary"
            class="border border-white/40 text-white font-bold uppercase tracking-wider px-8 py-4 rounded-md hover:border-white hover:bg-white/10 transition-colors text-center min-h-[44px] flex items-center justify-center"
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
        <PricingCalendar
          :selected-start-date="bookingSelection.startDate"
          :selected-end-date="bookingSelection.endDate"
          :unavailable-dates="unavailableDates"
          @select-date="selectBookingDate"
        />
        <p
          v-if="availabilityError"
          data-testid="booking-availability-error"
          class="mt-4 text-sm text-steel-grey"
        >
          {{ t('storefront.booking.availabilityError') }}
        </p>
        <BookingRequestForm
          :selected-start-date="bookingSelection.startDate"
          :selected-end-date="bookingSelection.endDate"
          :unavailable-dates="unavailableDates"
        />
      </div>
    </section>

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
        <p class="text-white/30 text-xs mt-4 border-t border-white/10 pt-6 w-full">
          {{ t('storefront.footer.legal') }}
        </p>
      </div>
    </footer>
  </div>
</template>
