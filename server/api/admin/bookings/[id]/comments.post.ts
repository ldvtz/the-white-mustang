import { serverSupabaseAdminClient } from '../../../../utils/supabaseAdmin'
import type { Database } from '@@/types/supabase'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing booking id' })

  const body = await readBody<{ message: string; visible_to_customer?: boolean }>(event)
  if (!body?.message?.trim()) {
    throw createError({ statusCode: 400, message: 'Message is required' })
  }
  if (body.message.length > 1200) {
    throw createError({ statusCode: 400, message: 'Message too long (max 1200 chars)' })
  }

  const supabase = serverSupabaseAdminClient<Database>(event)

  const { count, error: bookingError } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('id', id)

  if (bookingError) throw createError({ statusCode: 500, message: bookingError.message })
  if (!count) throw createError({ statusCode: 404, message: 'Booking not found' })

  const { data, error } = await supabase
    .from('booking_comments')
    .insert({
      booking_id: id,
      message: body.message.trim(),
      author_type: 'admin',
      visible_to_customer: body.visible_to_customer ?? false,
    })
    .select('id, author_type, message, visible_to_customer, created_at')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
