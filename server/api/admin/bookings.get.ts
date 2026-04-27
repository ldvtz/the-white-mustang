import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database, BookingWithCustomer } from '@@/types/supabase'

export default defineEventHandler(async (event): Promise<BookingWithCustomer[]> => {
  await requireAdminUser(event)

  const supabase = serverSupabaseServiceRole<Database>(event)

  const { data, error } = await supabase
    .from('bookings')
    .select('id, customer_id, start_date, end_date, status, payment_method, total_price, deposit_paid, created_at, customers(name, email)')
    .order('start_date', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return (data ?? []) as BookingWithCustomer[]
})
