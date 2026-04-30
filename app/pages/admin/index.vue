<script setup lang="ts">
import { type ComputedRef } from 'vue'
import type { BookingStatus, BookingWithCustomer } from '@@/types/supabase'
import type { FilterMode } from '~/composables/useBookings'

definePageMeta({ layout: 'admin' })

const { t, locale } = useI18n()

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
  updateStatus,
  markPaymentReceived,
  postAdminComment,
  confirmDeposit,
} = useBookings()

const filters: { key: FilterMode; labelKey: string; count?: ComputedRef<number> }[] = [
  { key: 'all', labelKey: 'admin.dashboard.filter.all' },
  { key: 'actionRequired', labelKey: 'admin.dashboard.filter.actionRequired', count: actionRequiredCount },
]

const statusClasses: Record<BookingStatus, string> = {
  pending:          'bg-amber-100 text-amber-800',
  awaiting_payment: 'bg-purple-100 text-purple-800',
  confirmed:        'bg-blue-100 text-blue-800',
  active:           'bg-green-100 text-green-800',
  completed:        'bg-steel-grey/20 text-steel-grey',
  cancelled:        'bg-red-100 text-red-800',
}

const formatDate = (d: string) =>
  new Intl.DateTimeFormat(locale.value === 'de' ? 'de-CH' : 'en-GB', { dateStyle: 'medium' }).format(new Date(d))

const formatCHF = (n: number) =>
  new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(n)

function isTwintPending(b: BookingWithCustomer) {
  return b.payment_method === 'twint' && b.status === 'pending'
}
function isBankTransferAwaiting(b: BookingWithCustomer) {
  return b.payment_method === 'bank_transfer' && b.status === 'awaiting_payment'
}
function isCashDepositRequired(b: BookingWithCustomer) {
  return b.payment_method === 'cash' && !b.deposit_paid
}

function paymentLabel(method: string) {
  return t(`storefront.booking.payment.methods.${method}`)
}

// ── Detail modal ─────────────────────────────────────────────────────────────
const detailBooking = ref<BookingWithCustomer | null>(null)

function openDetailModal(booking: BookingWithCustomer) {
  detailBooking.value = booking
}
function closeDetailModal() {
  detailBooking.value = null
}

// ── Payment confirm modal ────────────────────────────────────────────────────
type ActionType = 'twint' | 'bank' | 'cash_deposit'
type PendingPayment = { booking: BookingWithCustomer; actionType: ActionType }
const pendingPayment = ref<PendingPayment | null>(null)

function openPaymentModal(booking: BookingWithCustomer, actionType: ActionType) {
  pendingPayment.value = { booking, actionType }
}
function closePaymentModal() {
  pendingPayment.value = null
}

async function handlePaymentConfirm(comment: string) {
  if (!pendingPayment.value) return
  const { booking, actionType } = pendingPayment.value
  const id = booking.id

  const ACTION_HANDLER: Record<ActionType, () => Promise<void>> = {
    twint: () => updateStatus(id, 'confirmed'),
    bank: () => markPaymentReceived(id),
    cash_deposit: () => confirmDeposit(id),
  }

  await ACTION_HANDLER[actionType]()
  if (comment) await postAdminComment(id, comment, false, false)
  closePaymentModal()
}
</script>

<template>
  <div class="p-8">
    <header class="mb-8">
      <h1 class="text-2xl font-bold uppercase tracking-wide text-deep-charcoal">
        {{ t('admin.dashboard.title') }}
      </h1>
    </header>

    <!-- Filter tabs -->
    <div class="flex gap-2 mb-6">
      <button
        v-for="f in filters"
        :key="f.key"
        class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-colors min-h-[44px]"
        :class="activeFilter === f.key
          ? 'bg-deep-charcoal text-alpine-white'
          : 'bg-alpine-white text-steel-grey border border-steel-grey/30 hover:border-deep-charcoal hover:text-deep-charcoal'"
        @click="activeFilter = f.key"
      >
        {{ t(f.labelKey) }}
        <span
          v-if="f.count && f.count.value > 0"
          class="bg-taillight-ruby text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
        >
          {{ f.count.value }}
        </span>
      </button>
    </div>

    <!-- Error state -->
    <p v-if="error" class="text-taillight-ruby text-sm py-8">
      {{ t('admin.dashboard.error') }}
    </p>

    <!-- Loading state -->
    <div v-else-if="status === 'pending'" class="py-8 text-steel-grey text-sm">
      <div class="flex gap-2 items-center">
        <span class="inline-block w-4 h-4 border-2 border-steel-grey border-t-transparent rounded-full animate-spin" />
        <span>{{ t('admin.common.loading') }}</span>
      </div>
    </div>

    <!-- Empty state -->
    <p v-else-if="bookings.length === 0" class="text-steel-grey text-sm py-8">
      {{ t('admin.dashboard.empty') }}
    </p>

    <!-- Booking table -->
    <div v-else class="bg-alpine-white rounded-md border border-steel-grey/20 overflow-hidden">
      <table class="w-full text-sm text-deep-charcoal">
        <thead class="bg-pearl-white border-b border-steel-grey/20">
          <tr>
            <th class="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider text-steel-grey">
              {{ t('admin.dashboard.table.customer') }}
            </th>
            <th class="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider text-steel-grey">
              {{ t('admin.dashboard.table.dates') }}
            </th>
            <th class="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider text-steel-grey">
              {{ t('admin.dashboard.table.status') }}
            </th>
            <th class="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider text-steel-grey">
              {{ t('admin.dashboard.table.payment') }}
            </th>
            <th class="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wider text-steel-grey">
              {{ t('admin.dashboard.table.deposit') }}
            </th>
            <th class="text-right px-4 py-3 font-semibold uppercase text-xs tracking-wider text-steel-grey">
              {{ t('admin.dashboard.table.total') }}
            </th>
            <th class="text-right px-4 py-3 font-semibold uppercase text-xs tracking-wider text-steel-grey">
              {{ t('admin.dashboard.table.actions') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="booking in bookings"
            :key="booking.id"
            class="border-b border-steel-grey/10 transition-colors hover:bg-pearl-white"
          >
            <td class="px-4 py-3">
              <span class="font-medium">{{ booking.customers.name }}</span>
              <span class="block text-xs text-steel-grey">{{ booking.customers.email }}</span>
              <span v-if="booking.refund_handling_required" class="mt-1 block text-xs font-semibold text-amber-700">
                {{ t('admin.dashboard.table.refundRequired') }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-steel-grey whitespace-nowrap">
              {{ formatDate(booking.start_date) }} – {{ formatDate(booking.end_date) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-block px-2 py-1 rounded text-xs font-medium"
                :class="statusClasses[booking.status]"
              >
                {{ t(`admin.dashboard.status.${booking.status}`) }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs uppercase tracking-wide">{{ paymentLabel(booking.payment_method) }}</td>
            <td class="px-4 py-3 text-xs font-medium">
              <span :class="booking.deposit_paid ? 'text-green-700' : 'text-amber-700'">
                {{ booking.deposit_paid ? t('admin.dashboard.table.depositPaid') : t('admin.dashboard.table.depositPending') }}
              </span>
            </td>
            <td class="px-4 py-3 text-right font-semibold tabular-nums">
              {{ formatCHF(booking.total_price) }}
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <!-- TWINT: manual confirm -->
                <button
                  v-if="isTwintPending(booking)"
                  :disabled="inflightIds.has(booking.id)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-deep-charcoal text-alpine-white text-xs font-medium rounded transition-opacity disabled:opacity-50 min-h-[36px]"
                  @click="openPaymentModal(booking, 'twint')"
                >
                  {{ t('admin.dashboard.actions.confirmPayment') }}
                </button>

                <!-- Bank transfer: payment received -->
                <button
                  v-else-if="isBankTransferAwaiting(booking)"
                  :disabled="inflightIds.has(booking.id)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-taillight-ruby text-alpine-white text-xs font-medium rounded transition-opacity disabled:opacity-50 min-h-[36px]"
                  @click="openPaymentModal(booking, 'bank')"
                >
                  {{ t('admin.dashboard.actions.paymentReceived') }}
                </button>

                <!-- Cash: confirm deposit -->
                <button
                  v-else-if="isCashDepositRequired(booking)"
                  :disabled="inflightIds.has(booking.id)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-medium rounded hover:bg-amber-200 transition-colors disabled:opacity-50 min-h-[36px]"
                  @click="openPaymentModal(booking, 'cash_deposit')"
                >
                  {{ t('admin.dashboard.actions.confirmDeposit') }}
                </button>

                <!-- View details -->
                <button
                  class="text-steel-grey hover:text-deep-charcoal text-xs underline underline-offset-2 transition-colors min-h-[36px]"
                  @click="openDetailModal(booking)"
                >
                  {{ t('admin.dashboard.actions.viewDetails') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Payment confirmation modal -->
    <AdminPaymentConfirmModal
      v-if="pendingPayment"
      :booking="pendingPayment.booking"
      :action-type="pendingPayment.actionType"
      :inflight-ids="inflightIds"
      @confirm="handlePaymentConfirm"
      @cancel="closePaymentModal"
    />

    <!-- Booking detail modal -->
    <AdminBookingDetailModal
      v-if="detailBooking"
      :booking="detailBooking"
      :inflight-ids="inflightIds"
      @close="closeDetailModal"
      @comment-posted="refresh()"
    />
  </div>
</template>
