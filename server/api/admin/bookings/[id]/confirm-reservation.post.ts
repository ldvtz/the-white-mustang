import { serverSupabaseAdminClient } from '../../../../utils/supabaseAdmin'
import type { Database } from '@@/types/supabase'

const MAX_NOTE_LENGTH = 1200
const APPROVABLE_STATUSES = ['pending', 'awaiting_payment'] as const

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing booking id' })

  const body = await readBody<{ note?: unknown }>(event)
  const note = optionalNote(body.note)
  const supabase = serverSupabaseAdminClient<Database>(event)

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select(BOOKING_WITH_CUSTOMER_SELECT)
    .eq('id', id)
    .single()

  if (fetchError || !booking) throw createError({ statusCode: 404, message: 'Booking not found' })

  if (!isApprovableStatus(booking.status)) {
    throw createError({
      statusCode: 409,
      message: `Cannot confirm reservation with status ${booking.status}`,
    })
  }

  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', id)
    .select(BOOKING_WITH_CUSTOMER_SELECT)
    .single()

  if (updateError) throw createError({ statusCode: 500, message: updateError.message })

  if (note) {
    const { error: commentError } = await supabase.from('booking_comments').insert({
      booking_id: id,
      author_type: 'admin',
      message: note,
      visible_to_customer: false,
    })
    if (commentError) throw createError({ statusCode: 500, message: commentError.message })
  }

  try {
    await sendReservationConfirmation(
      booking.customers.email,
      booking.customers.name,
      booking.start_date,
      booking.end_date,
      booking.total_price,
      booking.locale,
    )
  } catch (error) {
    console.error('Failed to send reservation confirmation email', { bookingId: id, error })
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

function isApprovableStatus(status: string): status is (typeof APPROVABLE_STATUSES)[number] {
  return APPROVABLE_STATUSES.some((validStatus) => validStatus === status)
}
