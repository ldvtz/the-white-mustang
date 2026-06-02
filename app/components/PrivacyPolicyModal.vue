<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { t, tm, rt } = useI18n()

const sections = computed(
  () => tm('storefront.booking.privacyModal.sections') as Array<{ heading: string; body: string }>,
)

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

if (import.meta.client) {
  watch(
    () => props.open,
    (isOpen) => {
      if (isOpen) {
        document.body.style.overflow = 'hidden'
        document.addEventListener('keydown', onKeyDown)
      } else {
        document.body.style.overflow = ''
        document.removeEventListener('keydown', onKeyDown)
      }
    },
  )

  onUnmounted(() => {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKeyDown)
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-deep-charcoal/40 backdrop-blur-sm p-4"
        @click.self="emit('close')"
      >
        <div
          class="w-full max-w-2xl rounded-md bg-alpine-white p-6 shadow-xl border border-steel-grey/10"
          role="dialog"
          aria-modal="true"
        >
          <h2 class="mb-4 text-sm font-bold uppercase tracking-wider text-deep-charcoal">
            <span class="text-taillight-ruby">///</span> {{ t('storefront.booking.privacyModal.title') }}
          </h2>

          <div class="mb-6 max-h-60 space-y-4 overflow-y-auto text-sm leading-relaxed text-steel-grey pr-2">
            <p>{{ t('storefront.booking.privacyModal.intro') }}</p>
            <section v-for="(section, i) in sections" :key="i">
              <h3 class="mb-1 font-semibold text-deep-charcoal">{{ rt(section.heading) }}</h3>
              <p>{{ rt(section.body) }}</p>
            </section>
            <p class="text-xs text-steel-grey/70">{{ t('storefront.booking.privacyModal.lastUpdated') }}</p>
          </div>

          <div class="flex justify-end">
            <button
              type="button"
              class="min-h-[44px] rounded-md bg-deep-charcoal text-alpine-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-deep-charcoal/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-deep-charcoal"
              data-testid="privacy-modal-close"
              @click="emit('close')"
            >
              {{ t('storefront.booking.privacyModal.close') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
