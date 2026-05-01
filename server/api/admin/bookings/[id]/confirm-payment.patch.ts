import { serverSupabaseAdminClient } from '../../../../utils/supabaseAdmin'
import type { Database } from '@@/types/supabase'
import { isValidPaymentMethod } from '@@/shared/booking'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing booking id' })

  const body = await readBody<{ paymentMethod?: unknown; comment?: unknown }>(event)

  if (!isValidPaymentMethod(body.paymentMethod)) {
    throw createError({ statusCode: 400, message: 'Invalid payment method' })
  }
  const paymentMethod = body.paymentMethod
  const comment = typeof body.comment === 'string' && body.comment.trim() ? body.comment.trim() : null

  const supabase = serverSupabaseAdminClient<Database>(event)

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status, deposit_paid')
    .eq('id', id)
    .single()

  if (fetchError || !booking) throw createError({ statusCode: 404, message: 'Booking not found' })

  const payableStatuses = ['pending', 'awaiting_payment', 'confirmed'] as const
  if (!(payableStatuses as readonly string[]).includes(booking.status)) {
    throw createError({
      statusCode: 409,
      message: `Cannot confirm payment for booking with status ${booking.status}`,
    })
  }

  if (booking.deposit_paid) {
    throw createError({ statusCode: 409, message: 'Payment already confirmed' })
  }

  const now = new Date().toISOString()

  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({
      payment_method: paymentMethod,
      deposit_paid: true,
      payment_received_at: now,
      status: 'confirmed',
    })
    .eq('id', id)
    .select(BOOKING_WITH_CUSTOMER_SELECT)
    .single()

  if (updateError) throw createError({ statusCode: 500, message: updateError.message })

  if (comment) {
    await supabase.from('booking_comments').insert({
      booking_id: id,
      author_type: 'admin',
      message: comment,
      visible_to_customer: false,
    })
  }

  return updated
})
