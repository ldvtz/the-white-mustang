<script setup lang="ts">
import { type ComputedRef } from 'vue'
import type { BookingWithCustomer } from '@@/types/booking'
import type { FilterMode } from '~/composables/useBookings'

definePageMeta({ layout: 'admin' })

const { t } = useI18n()

useSeoMeta({
  title: () => t('admin.dashboard.title'),
  robots: 'noindex, nofollow',
})

const {
  bookings,
  activeFilter,
  actionRequiredCount,
  inflightIds,
  status,
  error,
  refresh,
  confirmReservation,
  declineReservation,
} = useBookings()

const filters: { key: FilterMode; labelKey: string; count?: ComputedRef<number> }[] = [
  { key: 'all', labelKey: 'admin.dashboard.filter.all' },
  { key: 'actionRequired', labelKey: 'admin.dashboard.filter.actionRequired', count: actionRequiredCount },
]

const detailBooking = ref<BookingWithCustomer | null>(null)
const decisionBooking = ref<BookingWithCustomer | null>(null)
const decisionAction = ref<'confirm' | 'decline'>('confirm')
const decisionError = ref<string | null>(null)

function openDetailModal(booking: BookingWithCustomer) {
  detailBooking.value = booking
}

function closeDetailModal() {
  detailBooking.value = null
}

function openDecisionModal(booking: BookingWithCustomer, action: 'confirm' | 'decline') {
  decisionBooking.value = booking
  decisionAction.value = action
  decisionError.value = null
}

function closeDecisionModal() {
  decisionBooking.value = null
  decisionError.value = null
}

async function submitReservationDecision(note: string) {
  if (!decisionBooking.value) return

  try {
    if (decisionAction.value === 'confirm') {
      await confirmReservation(decisionBooking.value.id, note || undefined)
    } else {
      await declineReservation(decisionBooking.value.id, note || undefined)
    }
    closeDecisionModal()
  } catch {
    decisionError.value = t('admin.dashboard.decisionModal.error')
  }
}
</script>

<template>
  <div class="p-8">
    <header class="mb-8">
      <h1 class="text-2xl font-bold uppercase tracking-wide text-deep-charcoal">
        {{ t('admin.dashboard.title') }}
      </h1>
    </header>

    <div class="mb-6 flex gap-2">
      <button
        v-for="filter in filters"
        :key="filter.key"
        type="button"
        class="flex min-h-[44px] items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors"
        :class="activeFilter === filter.key
          ? 'bg-deep-charcoal text-alpine-white'
          : 'border border-steel-grey/30 bg-alpine-white text-steel-grey hover:border-deep-charcoal hover:text-deep-charcoal'"
        @click="activeFilter = filter.key"
      >
        {{ t(filter.labelKey) }}
        <span
          v-if="filter.count && filter.count.value > 0"
          class="rounded-full bg-taillight-ruby px-1.5 py-0.5 text-xs font-bold leading-none text-white"
        >
          {{ filter.count.value }}
        </span>
      </button>
    </div>

    <p v-if="error" class="py-8 text-sm text-taillight-ruby">
      {{ t('admin.dashboard.error') }}
    </p>

    <div v-else-if="status === 'pending'" class="py-8 text-sm text-steel-grey">
      <div class="flex items-center gap-2">
        <span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-steel-grey border-t-transparent" />
        <span>{{ t('admin.common.loading') }}</span>
      </div>
    </div>

    <p v-else-if="bookings.length === 0" class="py-8 text-sm text-steel-grey">
      {{ t('admin.dashboard.empty') }}
    </p>

    <AdminBookingOverviewTable
      v-else
      :bookings="bookings"
      :inflight-ids="inflightIds"
      @view-details="openDetailModal"
      @confirm-reservation="openDecisionModal($event, 'confirm')"
      @decline-reservation="openDecisionModal($event, 'decline')"
    />

    <AdminReservationDecisionModal
      v-if="decisionBooking"
      :booking="decisionBooking"
      :action="decisionAction"
      :inflight-ids="inflightIds"
      :error="decisionError"
      @submit="submitReservationDecision"
      @cancel="closeDecisionModal"
    />

    <AdminBookingDetailModal
      v-if="detailBooking"
      :booking="detailBooking"
      :inflight-ids="inflightIds"
      @close="closeDetailModal"
      @comment-posted="refresh()"
    />
  </div>
</template>
