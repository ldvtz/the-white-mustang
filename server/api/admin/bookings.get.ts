import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '@@/types/supabase'
import type { BookingWithCustomer } from '@@/types/booking'

export default defineEventHandler(async (event): Promise<BookingWithCustomer[]> => {
  await requireAdminUser(event)

  const supabase = serverSupabaseServiceRole<Database>(event)

  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_WITH_CUSTOMER_SELECT)
    .order('start_date', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return (data ?? []) as BookingWithCustomer[]
})
