import { canCancelBooking, isValidPaymentMethod } from '@@/shared/booking'

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, message: 'Missing access token' })

  const { supabase, booking } = await getManagedBooking(event, token)
  const config = useRuntimeConfig(event)
  const cutoffDays = parseCutoffDays(config.bookingCancellationCutoffDays)
  if (!isValidPaymentMethod(booking.payment_method)) {
    throw createError({ statusCode: 500, message: 'Invalid booking payment method' })
  }

  const { data: comments, error: commentsError } = await supabase
    .from('booking_comments')
    .select('id, author_type, message, created_at')
    .eq('booking_id', booking.id)
    .eq('visible_to_customer', true)
    .order('created_at', { ascending: true })

  if (commentsError) throw createError({ statusCode: 500, message: commentsError.message })

  return {
    booking: {
      id: booking.id,
      startDate: booking.start_date,
      endDate: booking.end_date,
      status: booking.status,
      paymentMethod: booking.payment_method,
      totalPrice: booking.total_price,
      depositPaid: booking.deposit_paid,
      paymentReceivedAt: booking.payment_received_at,
      cancelledAt: booking.cancelled_at,
      cancellationNote: booking.cancellation_note,
      refundHandlingRequired: booking.refund_handling_required,
      customerName: booking.customers.name,
    },
    comments: comments ?? [],
    paymentInstructions: getPaymentInstructions(event, booking.payment_method),
    cancellation: {
      cutoffDays,
      canCancel: canCancelBooking(booking.status, booking.start_date, cutoffDays),
    },
  }
})
