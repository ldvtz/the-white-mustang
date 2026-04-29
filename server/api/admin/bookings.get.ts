import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database, BookingWithCustomer } from '@@/types/supabase'

export default defineEventHandler(async (event): Promise<BookingWithCustomer[]> => {
  await requireAdminUser(event)

  const supabase = serverSupabaseServiceRole<Database>(event)

  const { data, error } = await supabase
    .from('bookings')
    .select('id, customer_id, start_date, end_date, status, payment_method, total_price, deposit_paid, payment_received_at, cancelled_at, cancelled_by, cancellation_note, refund_handling_required, created_at, customers(name, email), booking_comments(id, author_type, message, visible_to_customer, created_at)')
    .order('start_date', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return (data ?? []) as BookingWithCustomer[]
})
