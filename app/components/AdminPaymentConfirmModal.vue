<script setup lang="ts">
import type { BookingWithCustomer } from '@@/types/supabase'
import type { PaymentMethod } from '@@/shared/booking'

const props = defineProps<{
  booking: BookingWithCustomer
  inflightIds: Set<string>
  error: string | null
}>()

const emit = defineEmits<{
  confirm: [comment: string, paymentMethod: PaymentMethod]
  cancel: []
}>()

const { t, locale } = useI18n()

const adminComment = ref('')
const selectedMethod = ref<PaymentMethod | ''>('')

const methods: PaymentMethod[] = ['bank_transfer', 'twint', 'cash']

const isConfirming = computed(() => props.inflightIds.has(props.booking.id))
const canConfirm = computed(() => selectedMethod.value !== '')

const formattedPeriod = computed(() => {
  const fmt = new Intl.DateTimeFormat(locale.value === 'en' ? 'en-CH' : 'de-CH', { dateStyle: 'medium' })
  return `${fmt.format(new Date(props.booking.start_date))} – ${fmt.format(new Date(props.booking.end_date))}`
})

const formattedTotal = computed(() =>
  new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(props.booking.total_price),
)

function handleConfirm() {
  if (!selectedMethod.value) return
  emit('confirm', adminComment.value.trim(), selectedMethod.value)
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-deep-charcoal/40"
    @click.self="emit('cancel')"
  >
    <div class="bg-alpine-white rounded-md shadow-xl p-6 w-full max-w-sm mx-4">
      <h2 class="text-deep-charcoal font-bold uppercase tracking-wide text-sm mb-4">
        {{ $t('admin.dashboard.paymentModal.title') }}
      </h2>

      <div class="bg-pearl-white rounded-md p-3 mb-4 space-y-1">
        <p class="text-deep-charcoal font-medium text-sm">{{ booking.customers.name }}</p>
        <p class="text-steel-grey text-xs">{{ formattedPeriod }}</p>
        <p class="text-deep-charcoal text-sm font-semibold">{{ formattedTotal }}</p>
      </div>

      <p class="text-steel-grey text-xs mb-4">{{ $t('admin.dashboard.paymentModal.description') }}</p>

      <!-- Payment method selector -->
      <div class="mb-5">
        <p class="text-steel-grey text-xs uppercase tracking-wide mb-2">
          {{ $t('admin.dashboard.paymentModal.paymentMethodLabel') }}
        </p>
        <div class="grid grid-cols-3 gap-2">
          <label
            v-for="method in methods"
            :key="method"
            class="flex min-h-[40px] cursor-pointer items-center justify-center rounded-md border px-2 py-2 text-xs font-semibold transition-colors"
            :class="selectedMethod === method
              ? 'border-deep-charcoal bg-deep-charcoal text-alpine-white'
              : 'border-steel-grey/30 bg-alpine-white text-deep-charcoal hover:border-deep-charcoal'"
          >
            <input
              v-model="selectedMethod"
              :value="method"
              type="radio"
              class="sr-only"
            />
            {{ $t(`storefront.booking.payment.methods.${method}`) }}
          </label>
        </div>
      </div>

      <!-- Admin comment -->
      <div class="mb-5">
        <label class="block text-steel-grey text-xs uppercase tracking-wide mb-1">
          {{ $t('admin.dashboard.paymentModal.adminNoteLabel') }}
        </label>
        <textarea
          v-model="adminComment"
          :placeholder="$t('admin.dashboard.paymentModal.adminNotePlaceholder')"
          rows="3"
          class="w-full border border-steel-grey/30 rounded-md px-3 py-2 text-sm text-deep-charcoal bg-alpine-white focus:outline-none focus:border-deep-charcoal resize-none"
        />
      </div>

      <p v-if="error" class="mb-3 text-xs text-taillight-ruby">{{ error }}</p>
      <div class="flex items-center justify-end gap-3">
        <button
          type="button"
          class="text-steel-grey text-sm hover:text-deep-charcoal transition-colors"
          :disabled="isConfirming"
          @click="emit('cancel')"
        >
          {{ $t('admin.dashboard.paymentModal.cancelButton') }}
        </button>
        <button
          type="button"
          class="bg-deep-charcoal text-alpine-white text-sm font-semibold uppercase tracking-wide px-4 py-2 rounded-md hover:opacity-80 transition-opacity disabled:opacity-40"
          :disabled="isConfirming || !canConfirm"
          @click="handleConfirm"
        >
          {{ isConfirming ? $t('admin.dashboard.paymentModal.confirming') : $t('admin.dashboard.paymentModal.confirmButton') }}
        </button>
      </div>
    </div>
  </div>
</template>
