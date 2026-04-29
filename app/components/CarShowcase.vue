<script setup lang="ts">
const { t } = useI18n()

const images = [
  { src: '/images/temp_mustang_1.webp', index: 1 },
  { src: '/images/temp_mustang_2.webp', index: 2 },
  { src: '/images/temp_mustang_3.webp', index: 3 },
  { src: '/images/temp_mustang_4.webp', index: 4 },
]

const current = ref(0)
let timer: ReturnType<typeof setInterval>

function goTo(i: number) {
  current.value = i
  resetTimer()
}

function prev() {
  current.value = (current.value - 1 + images.length) % images.length
  resetTimer()
}

function next() {
  current.value = (current.value + 1) % images.length
  resetTimer()
}

function resetTimer() {
  clearInterval(timer)
  timer = setInterval(() => {
    current.value = (current.value + 1) % images.length
  }, 5000)
}

onMounted(() => {
  timer = setInterval(() => {
    current.value = (current.value + 1) % images.length
  }, 5000)
})

onUnmounted(() => clearInterval(timer))

const stats = computed(() => [
  { value: '500',   unit: 'PS',   labelKey: 'storefront.specs.stats.power' },
  { value: '570',   unit: 'Nm',   labelKey: 'storefront.specs.stats.torque' },
  { value: '7.500', unit: '/min', labelKey: 'storefront.specs.stats.redline' },
  { value: '5.038', unit: 'cm³',  labelKey: 'storefront.specs.stats.displacement' },
])

const features = computed(() => [
  'storefront.specs.features.noTurbo',
  'storefront.specs.features.injection',
  'storefront.specs.features.sound',
  'storefront.specs.features.linear',
])
</script>

<template>
  <div
    data-testid="section-gallery"
    class="bg-deep-charcoal lg:grid lg:grid-cols-[55%_45%] lg:min-h-[640px]"
  >
    <!-- ── LEFT: Slideshow ──────────────────────────────────────────────── -->
    <div class="relative aspect-[4/3] lg:aspect-auto overflow-hidden">
      <!-- Images (crossfade) -->
      <img
        v-for="(img, i) in images"
        :key="img.src"
        :src="img.src"
        :alt="`${t('storefront.gallery.alt')} ${img.index}`"
        :data-testid="`gallery-image-${img.index}`"
        :class="[
          'absolute inset-0 w-full h-full object-cover transition-opacity duration-700',
          i === current ? 'opacity-100' : 'opacity-0'
        ]"
      />

      <!-- Gradient edge fade into specs panel (desktop only) -->
      <div class="hidden lg:block absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-deep-charcoal" />

      <!-- Prev / Next arrows -->
      <button
        class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
        aria-label="Previous image"
        @click="prev"
      >
        ‹
      </button>
      <button
        class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
        aria-label="Next image"
        @click="next"
      >
        ›
      </button>

      <!-- Dots -->
      <div class="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
        <button
          v-for="(_, i) in images"
          :key="i"
          :class="[
            'w-2 h-2 rounded-full transition-all duration-300',
            i === current ? 'bg-taillight-ruby w-6' : 'bg-white/40 hover:bg-white/70'
          ]"
          :aria-label="`Image ${i + 1}`"
          @click="goTo(i)"
        />
      </div>
    </div>

    <!-- ── RIGHT: Specs ─────────────────────────────────────────────────── -->
    <div class="flex flex-col justify-center px-8 py-12 lg:px-12 lg:py-16">
      <!-- Section label -->
      <p class="text-taillight-ruby text-xs font-bold uppercase tracking-[0.25em] mb-3">
        {{ t('storefront.gallery.heading') }}
      </p>

      <!-- Engine name -->
      <h2
        data-testid="specs-engine-title"
        class="text-white font-bold uppercase text-3xl lg:text-4xl tracking-tight leading-none mb-1"
      >
        5.0 V8
      </h2>
      <h3 class="text-white font-bold uppercase text-3xl lg:text-4xl tracking-tight leading-none mb-2">
        COYOTE
      </h3>
      <p class="text-steel-grey text-xs uppercase tracking-widest mb-10">
        {{ t('storefront.specs.subtitle') }}
      </p>

      <!-- Stats grid -->
      <div class="grid grid-cols-2 gap-px bg-white/10 mb-10">
        <div
          v-for="stat in stats"
          :key="stat.labelKey"
          class="bg-deep-charcoal py-5 pr-4"
        >
          <div class="flex items-baseline gap-1.5">
            <span class="text-white font-bold text-3xl leading-none">{{ stat.value }}</span>
            <span class="text-steel-grey text-sm">{{ stat.unit }}</span>
          </div>
          <p class="text-steel-grey text-xs uppercase tracking-widest mt-1">{{ t(stat.labelKey) }}</p>
        </div>
      </div>

      <!-- Feature list -->
      <ul class="space-y-2.5">
        <li
          v-for="key in features"
          :key="key"
          class="flex items-start gap-3 text-white/60 text-sm"
        >
          <span class="text-taillight-ruby font-bold shrink-0 mt-0.5">—</span>
          <span>{{ t(key) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
