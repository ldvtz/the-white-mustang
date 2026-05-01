const MAX_COMMENT_LENGTH = 1200

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, message: 'Missing access token' })

  const body = await readBody<{ message?: unknown }>(event)
  const message = parseCustomerComment(body.message)
  const { supabase, booking } = await getManagedBooking(event, token)

  const { data, error } = await supabase
    .from('booking_comments')
    .insert({
      booking_id: booking.id,
      author_type: 'customer',
      message,
      visible_to_customer: true,
    })
    .select('id, author_type, message, visible_to_customer, created_at')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})

function parseCustomerComment(value: unknown): string {
  if (typeof value !== 'string') {
    throw createError({ statusCode: 400, message: 'Message is required' })
  }

  const trimmed = value.trim()
  if (!trimmed) throw createError({ statusCode: 400, message: 'Message is required' })
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw createError({ statusCode: 400, message: 'Message too long (max 1200 chars)' })
  }

  return trimmed
}
