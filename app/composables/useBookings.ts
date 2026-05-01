import { ref, computed } from 'vue'
import type { BookingWithCustomer } from '@@/types/booking'

export type FilterMode = 'all' | 'actionRequired'

export function useBookings() {
  const activeFilter = ref<FilterMode>('all')
  const inflightIds = ref<Set<string>>(new Set())
  const requestFetch = useRequestFetch()

  const { data: allBookings, status, error, refresh } = useAsyncData<BookingWithCustomer[]>(
    'admin-bookings',
    () => requestFetch('/api/admin/bookings'),
    { default: () => [], server: true },
  )

  const isActionRequired = (b: BookingWithCustomer): boolean =>
    b.status === 'pending'
    || b.status === 'awaiting_payment'
    || b.refund_handling_required
    || (b.booking_comments ?? []).some((comment) => comment.author_type === 'customer')

  const filteredBookings = computed<BookingWithCustomer[]>(() => {
    const all = allBookings.value ?? []
    if (activeFilter.value === 'actionRequired') return all.filter(isActionRequired)
    return all
  })

  const actionRequiredCount = computed(() =>
    (allBookings.value ?? []).filter(isActionRequired).length,
  )

  async function withInflightId(id: string, fn: () => Promise<void>, shouldRefresh = true): Promise<void> {
    inflightIds.value = new Set([...inflightIds.value, id])
    try {
      await fn()
      if (shouldRefresh) await refresh()
    } finally {
      const next = new Set(inflightIds.value)
      next.delete(id)
      inflightIds.value = next
    }
  }

  function postAdminComment(id: string, message: string, visibleToCustomer = false, shouldRefresh = true): Promise<void> {
    return withInflightId(id, () => $fetch(`/api/admin/bookings/${id}/comments`, {
      method: 'POST',
      body: { message, visible_to_customer: visibleToCustomer },
    }), shouldRefresh)
  }

  function confirmReservation(id: string, note?: string): Promise<void> {
    return withInflightId(id, () => $fetch(`/api/admin/bookings/${id}/confirm-reservation`, {
      method: 'POST',
      body: { note },
    }))
  }

  function declineReservation(id: string, note?: string): Promise<void> {
    return withInflightId(id, () => $fetch(`/api/admin/bookings/${id}/decline-reservation`, {
      method: 'POST',
      body: { note },
    }))
  }

  return {
    bookings: filteredBookings,
    activeFilter,
    actionRequiredCount,
    isActionRequired,
    inflightIds,
    status,
    error,
    refresh,
    postAdminComment,
    confirmReservation,
    declineReservation,
  }
}
