import { serverSupabaseAdminClient } from '../../../../utils/supabaseAdmin'
import type { Database } from '@@/types/supabase'

const MAX_NOTE_LENGTH = 1200
const DECLINABLE_STATUSES = ['pending', 'awaiting_payment'] as const

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing booking id' })

  const body = await readBody<{ note?: unknown }>(event)
  const note = optionalNote(body.note)
  const now = new Date().toISOString()
  const supabase = serverSupabaseAdminClient<Database>(event)

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select(BOOKING_WITH_CUSTOMER_SELECT)
    .eq('id', id)
    .single()

  if (fetchError || !booking) throw createError({ statusCode: 404, message: 'Booking not found' })

  if (!isDeclinableStatus(booking.status)) {
    throw createError({
      statusCode: 409,
      message: `Cannot decline reservation with status ${booking.status}`,
    })
  }

  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'declined',
      cancelled_at: now,
      cancelled_by: 'admin',
      cancellation_note: note,
      refund_handling_required: booking.deposit_paid,
    })
    .eq('id', id)
    .select(BOOKING_WITH_CUSTOMER_SELECT)
    .single()

  if (updateError) throw createError({ statusCode: 500, message: updateError.message })

  if (note) {
    const { error: commentError } = await supabase.from('booking_comments').insert({
      booking_id: id,
      author_type: 'admin',
      message: note,
      visible_to_customer: true,
    })
    if (commentError) throw createError({ statusCode: 500, message: commentError.message })
  }

  try {
    await sendReservationDeclined(
      booking.customers.email,
      booking.customers.name,
      booking.start_date,
      booking.end_date,
      booking.locale,
      note,
    )
  } catch (error) {
    console.error('Failed to send reservation declined email', { bookingId: id, error })
  }

  return updated
})

function optionalNote(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') throw createError({ statusCode: 400, message: 'Invalid note' })
  const trimmed = value.trim()
  if (trimmed.length > MAX_NOTE_LENGTH) throw createError({ statusCode: 400, message: 'Note too long' })
  return trimmed || null
}

function isDeclinableStatus(status: string): status is (typeof DECLINABLE_STATUSES)[number] {
  return DECLINABLE_STATUSES.some((validStatus) => validStatus === status)
}
