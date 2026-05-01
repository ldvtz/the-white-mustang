<script setup lang="ts">
import type { BookingStatus, BookingWithCustomer } from '@@/types/booking'

defineProps<{
  bookings: BookingWithCustomer[]
  inflightIds: Set<string>
}>()

const emit = defineEmits<{
  confirmReservation: [booking: BookingWithCustomer]
  declineReservation: [booking: BookingWithCustomer]
}>()

const { t, locale } = useI18n()

const statusClasses: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  awaiting_payment: 'bg-purple-100 text-purple-800',
  confirmed: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-steel-grey/20 text-steel-grey',
  declined: 'bg-zinc-100 text-zinc-700',
  cancelled: 'bg-red-100 text-red-800',
}

const dateFormatter = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'de' ? 'de-CH' : 'en-GB', { dateStyle: 'medium' }),
)

const datetimeFormatter = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'de' ? 'de-CH' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
)

const currencyFormatter = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' })

function canDecideReservation(booking: BookingWithCustomer) {
  return booking.status === 'pending' || booking.status === 'awaiting_payment'
}

function hasCustomerMessage(booking: BookingWithCustomer) {
  return (booking.booking_comments ?? []).some((comment) => comment.author_type === 'customer')
}

function formatDate(value: string) {
  return dateFormatter.value.format(new Date(value))
}

function formatDatetime(value: string) {
  return datetimeFormatter.value.format(new Date(value))
}
</script>

<template>
  <div class="overflow-hidden rounded-md border border-steel-grey/20 bg-alpine-white">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[960px] text-sm text-deep-charcoal">
        <thead class="border-b border-steel-grey/20 bg-pearl-white">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-steel-grey">
              {{ t('admin.dashboard.table.customer') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-steel-grey">
              {{ t('admin.dashboard.table.reservation') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-steel-grey">
              {{ t('admin.dashboard.table.status') }}
            </th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-steel-grey">
              {{ t('admin.dashboard.table.total') }}
            </th>
            <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-steel-grey">
              {{ t('admin.dashboard.table.signals') }}
            </th>
            <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-steel-grey">
              {{ t('admin.dashboard.table.actions') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="booking in bookings"
            :key="booking.id"
            class="border-b border-steel-grey/10 transition-colors last:border-0 hover:bg-pearl-white cursor-pointer"
            @click="navigateTo(`/admin/bookings/${booking.id}`)"
          >
            <td class="px-4 py-4 align-top">
              <span class="block font-medium">{{ booking.customers.name }}</span>
              <a
                :href="`mailto:${booking.customers.email}`"
                class="mt-0.5 block text-xs text-steel-grey transition-colors hover:text-taillight-ruby"
              >
                {{ booking.customers.email }}
              </a>
              <span v-if="booking.customers.phone" class="mt-0.5 block text-xs text-steel-grey">
                {{ booking.customers.phone }}
              </span>
            </td>
            <td class="px-4 py-4 align-top">
              <span class="block whitespace-nowrap font-medium">
                {{ formatDate(booking.start_date) }} - {{ formatDate(booking.end_date) }}
              </span>
              <span class="mt-0.5 block text-xs text-steel-grey">
                {{ t('admin.dashboard.table.requestedAt', { date: formatDatetime(booking.created_at) }) }}
              </span>
            </td>
            <td class="px-4 py-4 align-top">
              <span
                class="inline-block rounded px-2 py-1 text-xs font-medium"
                :class="statusClasses[booking.status]"
              >
                {{ t(`admin.dashboard.status.${booking.status}`) }}
              </span>
            </td>
            <td class="px-4 py-4 text-right align-top font-semibold tabular-nums">
              {{ currencyFormatter.format(booking.total_price) }}
            </td>
            <td class="px-4 py-4 align-top">
              <div class="flex flex-wrap gap-2">
                <span
                  v-if="hasCustomerMessage(booking)"
                  class="rounded bg-taillight-ruby/10 px-2 py-1 text-xs font-semibold text-taillight-ruby"
                >
                  {{ t('admin.dashboard.table.customerMessage') }}
                </span>
                <span
                  v-if="booking.refund_handling_required"
                  class="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800"
                >
                  {{ t('admin.dashboard.table.refundRequired') }}
                </span>
                <span v-if="!hasCustomerMessage(booking) && !booking.refund_handling_required" class="text-xs text-steel-grey">
                  {{ t('admin.dashboard.table.noSignals') }}
                </span>
              </div>
            </td>
            <td class="px-4 py-4 text-right align-top">
              <div class="flex items-center justify-end gap-2" @click.stop>
                <template v-if="canDecideReservation(booking)">
                  <button
                    type="button"
                    :disabled="inflightIds.has(booking.id)"
                    class="min-h-[36px] rounded bg-deep-charcoal px-3 py-1.5 text-xs font-semibold text-alpine-white transition-opacity disabled:opacity-50"
                    @click="emit('confirmReservation', booking)"
                  >
                    {{ t('admin.dashboard.actions.confirmReservation') }}
                  </button>
                  <button
                    type="button"
                    :disabled="inflightIds.has(booking.id)"
                    class="min-h-[36px] rounded border border-steel-grey/30 px-3 py-1.5 text-xs font-semibold text-deep-charcoal transition-colors hover:border-taillight-ruby hover:text-taillight-ruby disabled:opacity-50"
                    @click="emit('declineReservation', booking)"
                  >
                    {{ t('admin.dashboard.actions.declineReservation') }}
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
