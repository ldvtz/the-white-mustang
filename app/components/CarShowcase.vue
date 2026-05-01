<script setup lang="ts">
const { t } = useI18n()

const images = [
  { src: '/images/mustang-frontleft.webp', index: 1 },
  { src: '/images/mustang-frontright-cab.webp', index: 2 },
  { src: '/images/mustang-backleft-cab.webp', index: 3 },
  { src: '/images/mustang-backright.webp', index: 4 },
  { src: '/images/mustang-interior-side.webp', index: 5 },
  { src: '/images/mustang-interior.webp', index: 6 },
]

const current = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

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
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    current.value = (current.value + 1) % images.length
  }, 5000)
}

onMounted(resetTimer)
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

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
  <section id="gallery" data-testid="section-gallery" class="bg-alpine-white py-20 lg:py-24">
    <div class="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)] lg:items-center">
      <div class="relative aspect-[4/3] overflow-hidden rounded-md bg-pearl-white shadow-[0_24px_70px_rgba(28,28,30,0.14)]">
        <NuxtImg
          v-for="(img, i) in images"
          :key="img.src"
          :src="img.src"
          :alt="`${t('storefront.gallery.alt')} ${img.index}`"
          :data-testid="`gallery-image-${img.index}`"
          width="1200"
          height="900"
          sizes="100vw lg:58vw"
          loading="lazy"
          decoding="async"
          :class="[
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
            i === current ? 'opacity-100' : 'opacity-0'
          ]"
        />

        <button
          class="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-deep-charcoal/55 text-2xl leading-none text-white transition-colors hover:bg-deep-charcoal/75"
          :aria-label="t('storefront.gallery.previous')"
          @click="prev"
        >
          ‹
        </button>
        <button
          class="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-deep-charcoal/55 text-2xl leading-none text-white transition-colors hover:bg-deep-charcoal/75"
          :aria-label="t('storefront.gallery.next')"
          @click="next"
        >
          ›
        </button>

        <div class="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
          <button
            v-for="(_, i) in images"
            :key="i"
            :class="[
              'h-2 w-2 rounded-full transition-all duration-300',
              i === current ? 'w-7 bg-taillight-ruby' : 'bg-white/70 hover:bg-white'
            ]"
            :aria-label="t('storefront.gallery.imageButton', { number: i + 1 })"
            :aria-pressed="i === current"
            @click="goTo(i)"
          />
        </div>
      </div>

      <div class="border-t border-steel-grey/20 pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
        <p class="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-taillight-ruby">
          {{ t('storefront.gallery.heading') }}
        </p>
        <h2
          data-testid="specs-engine-title"
          class="text-4xl font-bold uppercase leading-none tracking-tight text-deep-charcoal lg:text-5xl"
        >
          5.0 V8 <span class="block">Coyote</span>
        </h2>
        <p class="mt-4 text-xs uppercase tracking-widest text-steel-grey">
          {{ t('storefront.specs.subtitle') }}
        </p>

        <dl class="my-10 grid grid-cols-2 border-y border-steel-grey/20">
          <div
            v-for="stat in stats"
            :key="stat.labelKey"
            class="border-steel-grey/20 py-6 odd:border-r even:pl-6 sm:odd:pr-6"
          >
            <dt class="text-xs font-semibold uppercase tracking-widest text-steel-grey">
              {{ t(stat.labelKey) }}
            </dt>
            <dd class="mt-2 flex items-baseline gap-2 text-deep-charcoal">
              <span class="text-4xl font-bold leading-none">{{ stat.value }}</span>
              <span class="text-sm text-steel-grey">{{ stat.unit }}</span>
            </dd>
          </div>
        </dl>

        <ul class="space-y-3">
          <li
            v-for="key in features"
            :key="key"
            class="flex items-start gap-3 text-sm leading-6 text-deep-charcoal/70"
          >
            <span class="mt-2 h-px w-5 shrink-0 bg-taillight-ruby" />
            <span>{{ t(key) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
