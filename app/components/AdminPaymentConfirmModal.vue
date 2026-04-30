<script setup lang="ts">
import type { BookingWithCustomer } from '@@/types/supabase'

const props = defineProps<{
  booking: BookingWithCustomer
  actionType: 'twint' | 'bank' | 'cash_deposit'
  inflightIds: Set<string>
  error: string | null
}>()

const emit = defineEmits<{
  confirm: [comment: string]
  cancel: []
}>()

const { t, locale } = useI18n()

const adminComment = ref('')

const ACTION_LABELS: Record<'twint' | 'bank' | 'cash_deposit', { title: string; description: string }> = {
  twint:        { title: 'admin.dashboard.paymentModal.titleTwint',       description: 'admin.dashboard.paymentModal.actionTwint' },
  bank:         { title: 'admin.dashboard.paymentModal.titleBank',        description: 'admin.dashboard.paymentModal.actionBank' },
  cash_deposit: { title: 'admin.dashboard.paymentModal.titleCashDeposit', description: 'admin.dashboard.paymentModal.actionCashDeposit' },
}

const title = computed(() => t(ACTION_LABELS[props.actionType].title))
const actionDescription = computed(() => t(ACTION_LABELS[props.actionType].description))

const isConfirming = computed(() => props.inflightIds.has(props.booking.id))

const formattedPeriod = computed(() => {
  const fmt = new Intl.DateTimeFormat(locale.value === 'en' ? 'en-CH' : 'de-CH', { dateStyle: 'medium' })
  return `${fmt.format(new Date(props.booking.start_date))} – ${fmt.format(new Date(props.booking.end_date))}`
})

const formattedTotal = computed(() =>
  new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(props.booking.total_price),
)

function handleConfirm() {
  emit('confirm', adminComment.value.trim())
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-deep-charcoal/40"
    @click.self="emit('cancel')"
  >
    <div class="bg-alpine-white rounded-md shadow-xl p-6 w-full max-w-sm mx-4">
      <h2 class="text-deep-charcoal font-bold uppercase tracking-wide text-sm mb-4">
        {{ title }}
      </h2>

      <div class="bg-pearl-white rounded-md p-3 mb-4 space-y-1">
        <p class="text-deep-charcoal font-medium text-sm">{{ booking.customers.name }}</p>
        <p class="text-steel-grey text-xs">{{ formattedPeriod }}</p>
        <p class="text-deep-charcoal text-sm font-semibold">{{ formattedTotal }}</p>
      </div>

      <p class="text-steel-grey text-xs mb-4">{{ actionDescription }}</p>

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
          :disabled="isConfirming"
          @click="handleConfirm"
        >
          {{ isConfirming ? $t('admin.dashboard.paymentModal.confirming') : $t('admin.dashboard.paymentModal.confirmButton') }}
        </button>
      </div>
    </div>
  </div>
</template>
