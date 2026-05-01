import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '@@/types/supabase'
import type { BookingWithCustomer } from '@@/types/booking'

export default defineEventHandler(async (event): Promise<BookingWithCustomer> => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing booking id' })

  const supabase = serverSupabaseServiceRole<Database>(event)

  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_WITH_CUSTOMER_SELECT)
    .eq('id', id)
    .single()

  if (error || !data) throw createError({ statusCode: 404, message: 'Booking not found' })

  return data as unknown as BookingWithCustomer
})
