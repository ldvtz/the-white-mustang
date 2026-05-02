import { canCancelBooking } from '@@/shared/booking'

const MAX_NOTE_LENGTH = 1200

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, message: 'Missing access token' })

  const body = await readBody<{ note?: unknown }>(event)
  const note = parseCancellationNote(body.note)
  const { supabase, booking } = await getManagedBooking(event, token)
  const config = useRuntimeConfig(event)
  const cutoffDays = parseCutoffDays(config.bookingCancellationCutoffDays)

  if (!canCancelBooking(booking.status, booking.start_date, cutoffDays)) {
    throw createError({ statusCode: 409, message: 'Booking can no longer be cancelled online' })
  }

  const refundHandlingRequired = booking.status === 'confirmed' || booking.deposit_paid
  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'customer',
      cancellation_note: note,
      refund_handling_required: refundHandlingRequired,
    })
    .eq('id', booking.id)
    .select('id, start_date, end_date, status, payment_method, total_price, deposit_paid, payment_received_at, cancelled_at, cancellation_note, refund_handling_required')
    .single()

  if (updateError) throw createError({ statusCode: 500, message: updateError.message })

  if (note) {
    const { error: commentError } = await supabase
      .from('booking_comments')
      .insert({
        booking_id: booking.id,
        author_type: 'customer',
        message: note,
      })

    if (commentError) throw createError({ statusCode: 500, message: commentError.message })
  }

  try {
    const customer = booking.customers as { name: string; email: string } | null
    const adminUrl = `${getRequestURL(event).origin}/admin/bookings/${booking.id}`
    await sendAdminCancellationNotification(
      booking.id,
      customer?.name ?? 'Unbekannt',
      customer?.email ?? '',
      booking.start_date,
      booking.end_date,
      booking.total_price,
      refundHandlingRequired,
      note,
      adminUrl,
    )
  } catch (error) {
    console.error('Failed to send admin cancellation notification', { bookingId: booking.id, error })
  }

  return {
    booking: {
      id: updated.id,
      startDate: updated.start_date,
      endDate: updated.end_date,
      status: updated.status,
      paymentMethod: updated.payment_method,
      totalPrice: updated.total_price,
      depositPaid: updated.deposit_paid,
      paymentReceivedAt: updated.payment_received_at,
      cancelledAt: updated.cancelled_at,
      cancellationNote: updated.cancellation_note,
      refundHandlingRequired: updated.refund_handling_required,
    },
    cancellation: {
      cutoffDays,
      canCancel: false,
    },
  }
})

function parseCancellationNote(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') throw createError({ statusCode: 400, message: 'Invalid note' })
  const trimmed = value.trim()
  if (trimmed.length > MAX_NOTE_LENGTH) throw createError({ statusCode: 400, message: 'Invalid note' })
  return trimmed || null
}
