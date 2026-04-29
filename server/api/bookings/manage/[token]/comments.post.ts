const MAX_COMMENT_LENGTH = 1200

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, 'token')
  if (!token) throw createError({ statusCode: 400, message: 'Missing access token' })

  const body = await readBody<{ message?: unknown }>(event)
  if (typeof body.message !== 'string') throw createError({ statusCode: 400, message: 'Missing message' })

  const message = body.message.trim()
  if (!message || message.length > MAX_COMMENT_LENGTH) {
    throw createError({ statusCode: 400, message: 'Invalid message' })
  }

  const { supabase, booking } = await getManagedBooking(event, token)
  const { data, error } = await supabase
    .from('booking_comments')
    .insert({
      booking_id: booking.id,
      author_type: 'customer',
      message,
    })
    .select('id, author_type, message, created_at')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
