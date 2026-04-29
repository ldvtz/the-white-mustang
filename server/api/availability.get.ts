import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '@@/types/supabase'
import { addDaysIso, listIsoDateRange, todayIso } from '@@/shared/booking'

type PublicAvailabilityResponse = {
  unavailableDates: string[]
}

export default defineEventHandler(async (event): Promise<PublicAvailabilityResponse> => {
  const supabase = serverSupabaseServiceRole<Database>(event)
  const start = todayIso()
  const end = addDaysIso(start, 370)

  const [{ data: bookings, error: bookingsError }, { data: blockedDates, error: blockedError }] = await Promise.all([
    supabase
      .from('bookings')
      .select('start_date, end_date')
      .neq('status', 'cancelled')
      .lte('start_date', end)
      .gte('end_date', start),
    supabase
      .from('blocked_dates')
      .select('date')
      .gte('date', start)
      .lte('date', end),
  ])

  if (bookingsError) throw createError({ statusCode: 500, message: bookingsError.message })
  if (blockedError) throw createError({ statusCode: 500, message: blockedError.message })

  const unavailableDates = new Set<string>()

  for (const booking of bookings ?? []) {
    for (const date of listIsoDateRange(booking.start_date, booking.end_date)) {
      unavailableDates.add(date)
    }
  }

  for (const blockedDate of blockedDates ?? []) {
    unavailableDates.add(blockedDate.date)
  }

  return {
    unavailableDates: [...unavailableDates].sort(),
  }
})
