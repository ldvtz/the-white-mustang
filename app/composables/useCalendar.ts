import { computed, ref } from 'vue'
import type { BookingWithCustomer, BlockedDate } from '@@/types/supabase'

export function useCalendar() {
  const requestFetch = useRequestFetch()

  const { data: bookings, refresh: refreshBookings } = useAsyncData<BookingWithCustomer[]>(
    'calendar-bookings',
    () => requestFetch('/api/admin/bookings'),
    { default: () => [] },
  )

  const { data: blockedDates, refresh: refreshBlocked } = useAsyncData<BlockedDate[]>(
    'blocked-dates',
    () => requestFetch('/api/admin/blocked-dates'),
    { default: () => [] },
  )

  const blockedDateSet = computed(() =>
    new Set((blockedDates.value ?? []).map((b) => b.date)),
  )

  const events = computed(() => {
    const bookingEvents = (bookings.value ?? []).map((b) => ({
      id: `booking-${b.id}`,
      title: b.customers.name,
      start: b.start_date,
      // FullCalendar end dates are exclusive, so add 1 day for proper rendering
      end: addDays(b.end_date, 1),
      allDay: true,
      color: statusColor(b.status),
      extendedProps: { type: 'booking', booking: b },
    }))

    const blockEvents = (blockedDates.value ?? []).map((bd) => ({
      id: `blocked-${bd.id}`,
      title: bd.reason ?? '—',
      start: bd.date,
      allDay: true,
      color: '#8E8E93',
      extendedProps: { type: 'blocked', blockedId: bd.id },
    }))

    return [...bookingEvents, ...blockEvents]
  })

  async function blockDate(date: string, reason?: string): Promise<void> {
    await $fetch('/api/admin/blocked-dates', {
      method: 'POST',
      body: { date, reason },
    })
    await refreshBlocked()
  }

  async function unblockDate(id: string): Promise<void> {
    await $fetch(`/api/admin/blocked-dates/${id}`, { method: 'DELETE' })
    await refreshBlocked()
  }

  async function refresh(): Promise<void> {
    await Promise.all([refreshBookings(), refreshBlocked()])
  }

  return {
    events,
    blockedDateSet,
    blockDate,
    unblockDate,
    refresh,
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function statusColor(status: string): string {
  switch (status) {
    case 'confirmed': return '#C8102E'
    case 'active':    return '#16a34a'
    case 'pending':   return '#d97706'
    case 'awaiting_payment': return '#7c3aed'
    default:          return '#8E8E93'
  }
}
