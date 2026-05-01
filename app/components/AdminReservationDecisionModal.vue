<script setup lang="ts">
import type { BookingWithCustomer } from '@@/types/booking'

const props = defineProps<{
  booking: BookingWithCustomer
  action: 'confirm' | 'decline'
  inflightIds: Set<string>
  error: string | null
}>()

const emit = defineEmits<{
  submit: [note: string]
  cancel: []
}>()

const { t, locale } = useI18n()
const note = ref('')

const isSubmitting = computed(() => props.inflightIds.has(props.booking.id))

const formattedPeriod = computed(() => {
  const fmt = new Intl.DateTimeFormat(locale.value === 'en' ? 'en-CH' : 'de-CH', { dateStyle: 'medium' })
  return `${fmt.format(new Date(props.booking.start_date))} - ${fmt.format(new Date(props.booking.end_date))}`
})

const formattedTotal = computed(() =>
  new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(props.booking.total_price),
)

const copyPrefix = computed(() =>
  props.action === 'confirm' ? 'admin.dashboard.decisionModal.confirm' : 'admin.dashboard.decisionModal.decline',
)

function handleSubmit() {
  emit('submit', note.value.trim())
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-deep-charcoal/40"
    @click.self="emit('cancel')"
  >
    <div class="mx-4 w-full max-w-sm rounded-md bg-alpine-white p-6 shadow-xl">
      <h2 class="mb-4 text-sm font-bold uppercase tracking-wide text-deep-charcoal">
        {{ t(`${copyPrefix}.title`) }}
      </h2>

      <div class="mb-4 space-y-1 rounded-md bg-pearl-white p-3">
        <p class="text-sm font-medium text-deep-charcoal">{{ booking.customers.name }}</p>
        <p class="text-xs text-steel-grey">{{ formattedPeriod }}</p>
        <p class="text-sm font-semibold text-deep-charcoal">{{ formattedTotal }}</p>
      </div>

      <p class="mb-5 text-xs leading-relaxed text-steel-grey">
        {{ t(`${copyPrefix}.description`) }}
      </p>

      <div class="mb-5">
        <label class="mb-1 block text-xs uppercase tracking-wide text-steel-grey">
          {{ t(`${copyPrefix}.noteLabel`) }}
        </label>
        <textarea
          v-model="note"
          :placeholder="t(`${copyPrefix}.notePlaceholder`)"
          rows="3"
          maxlength="1200"
          class="w-full resize-none rounded-md border border-steel-grey/30 bg-alpine-white px-3 py-2 text-sm text-deep-charcoal focus:border-deep-charcoal focus:outline-none"
        />
      </div>

      <p v-if="error" class="mb-3 text-xs text-taillight-ruby">{{ error }}</p>
      <div class="flex items-center justify-end gap-3">
        <button
          type="button"
          class="min-h-[44px] px-2 text-sm text-steel-grey transition-colors hover:text-deep-charcoal"
          :disabled="isSubmitting"
          @click="emit('cancel')"
        >
          {{ t('admin.dashboard.decisionModal.cancelButton') }}
        </button>
        <button
          type="button"
          class="min-h-[44px] rounded-md px-4 py-2 text-sm font-semibold uppercase tracking-wide text-alpine-white transition-opacity disabled:opacity-40"
          :class="action === 'confirm' ? 'bg-deep-charcoal' : 'bg-taillight-ruby'"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          {{ isSubmitting ? t(`${copyPrefix}.submitting`) : t(`${copyPrefix}.submitButton`) }}
        </button>
      </div>
    </div>
  </div>
</template>
