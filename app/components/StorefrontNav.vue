<script setup lang="ts">
const { t, locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const isScrolled = ref(false)

onMounted(() => {
  const handler = () => { isScrolled.value = window.scrollY > 60 }
  window.addEventListener('scroll', handler, { passive: true })
  onUnmounted(() => window.removeEventListener('scroll', handler))
})
</script>

<template>
  <header
    data-testid="storefront-nav"
    :class="[
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isScrolled
        ? 'bg-alpine-white shadow-sm border-b border-gray-100'
        : 'bg-transparent'
    ]"
  >
    <nav class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <!-- Logo -->
      <a href="#hero" class="flex items-center" :aria-label="t('storefront.nav.logoLabel')">
        <img
          :src="isScrolled ? '/logos/the-white-mustang.svg' : '/logos/the-white-mustang-white.svg'"
          alt="The White Mustang"
          class="h-8 w-auto"
        />
      </a>

      <!-- Right side -->
      <div class="flex items-center gap-6">
        <!-- Language switcher -->
        <div data-testid="lang-switcher" class="flex items-center gap-1 text-sm font-medium">
          <NuxtLink
            data-testid="lang-de"
            :to="switchLocalePath('de')"
            hreflang="de-CH"
            :aria-current="locale === 'de' ? 'page' : undefined"
            :class="[
              'px-2 py-1 rounded transition-colors',
              locale === 'de'
                ? (isScrolled ? 'text-deep-charcoal' : 'text-white')
                : (isScrolled ? 'text-steel-grey hover:text-deep-charcoal' : 'text-white/60 hover:text-white')
            ]"
          >
            {{ t('storefront.nav.languageDe') }}
          </NuxtLink>
          <span :class="isScrolled ? 'text-steel-grey' : 'text-white/40'">|</span>
          <NuxtLink
            data-testid="lang-en"
            :to="switchLocalePath('en')"
            hreflang="en-US"
            :aria-current="locale === 'en' ? 'page' : undefined"
            :class="[
              'px-2 py-1 rounded transition-colors',
              locale === 'en'
                ? (isScrolled ? 'text-deep-charcoal' : 'text-white')
                : (isScrolled ? 'text-steel-grey hover:text-deep-charcoal' : 'text-white/60 hover:text-white')
            ]"
          >
            {{ t('storefront.nav.languageEn') }}
          </NuxtLink>
        </div>

        <!-- CTA -->
        <a
          href="#calendar"
          data-testid="nav-cta"
          class="bg-taillight-ruby text-white text-sm font-bold uppercase tracking-wider px-5 py-2.5 rounded-md hover:bg-red-700 transition-colors min-h-[44px] flex items-center"
        >
          {{ t('storefront.nav.book') }}
        </a>
      </div>
    </nav>
  </header>
</template>
