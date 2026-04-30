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
    .select('id, status, payment_method, deposit_paid')
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
    .update({
      status: body.status,
      ...(booking.payment_method === 'twint' && body.status === 'confirmed'
        ? { deposit_paid: true, payment_received_at: new Date().toISOString() }
        : {}),
      ...(body.status === 'cancelled'
        ? {
            cancelled_at: new Date().toISOString(),
            cancelled_by: 'admin',
            refund_handling_required: booking.status === 'confirmed' || booking.deposit_paid,
          }
        : {}),
    })
    .eq('id', id)
    .select(BOOKING_WITH_CUSTOMER_SELECT)
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
