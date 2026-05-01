import { serverSupabaseAdminClient } from '../../../../utils/supabaseAdmin'
import type { Database } from '@@/types/supabase'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing booking id' })

  const supabase = serverSupabaseAdminClient<Database>(event)

  // Fetch booking with customer for email
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select(BOOKING_WITH_CUSTOMER_SELECT)
    .eq('id', id)
    .single()

  if (fetchError || !booking) throw createError({ statusCode: 404, message: 'Booking not found' })

  if (booking.status !== 'awaiting_payment') {
    throw createError({
      statusCode: 409,
      message: `Cannot mark payment received for booking with status ${booking.status}`,
    })
  }

  // Mark as confirmed
  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      deposit_paid: true,
      payment_received_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(BOOKING_WITH_CUSTOMER_SELECT)
    .single()

  if (updateError) throw createError({ statusCode: 500, message: updateError.message })

  try {
    await sendBookingConfirmation(
      booking.customers.email,
      booking.customers.name,
      booking.start_date,
      booking.end_date,
      booking.total_price,
      'de',
    )
  } catch (error) {
    console.error('Failed to send booking confirmation email', { bookingId: id, error })
  }

  return updated
})
