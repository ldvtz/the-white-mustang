import { serverSupabaseServiceRole } from '#supabase/server'
import type { BookingStatus, Database } from '@@/types/supabase'

const VALID_STATUSES = ['pending', 'awaiting_payment', 'confirmed', 'active', 'completed', 'cancelled'] as const

const ALLOWED_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  awaiting_payment: ['confirmed', 'cancelled'],
  confirmed: ['active', 'cancelled'],
  active: ['completed'],
  completed: [],
  cancelled: [],
}

const BOOKING_WITH_CUSTOMER_SELECT = 'id, customer_id, start_date, end_date, status, payment_method, total_price, deposit_paid, created_at, customers(name, email)'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing booking id' })

  const body = await readBody<{ status: BookingStatus }>(event)
  if (!body?.status || !VALID_STATUSES.includes(body.status)) {
    throw createError({ statusCode: 400, message: 'Invalid status value' })
  }

  const supabase = serverSupabaseServiceRole<Database>(event)

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('id', id)
    .single()

  if (fetchError || !booking) {
    throw createError({ statusCode: 404, message: 'Booking not found' })
  }

  if (!ALLOWED_TRANSITIONS[booking.status].includes(body.status)) {
    throw createError({
      statusCode: 409,
      message: `Cannot change booking status from ${booking.status} to ${body.status}`,
    })
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: body.status })
    .eq('id', id)
    .select(BOOKING_WITH_CUSTOMER_SELECT)
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
