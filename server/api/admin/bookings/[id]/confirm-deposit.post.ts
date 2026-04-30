import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '@@/types/supabase'

export default defineEventHandler(async (event) => {
  await requireAdminUser(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing booking id' })

  const supabase = serverSupabaseServiceRole<Database>(event)

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status, payment_method, deposit_paid')
    .eq('id', id)
    .single()

  if (fetchError || !booking) {
    throw createError({ statusCode: 404, message: 'Booking not found' })
  }

  if (booking.payment_method !== 'cash') {
    throw createError({ statusCode: 400, message: 'Booking is not a cash payment' })
  }

  if (booking.deposit_paid) {
    throw createError({ statusCode: 409, message: 'Deposit already marked as paid' })
  }

  const now = new Date().toISOString()
  const updatePayload: Record<string, unknown> = {
    deposit_paid: true,
    payment_received_at: now,
  }

  if (booking.status === 'pending') {
    updatePayload.status = 'confirmed'
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updatePayload)
    .eq('id', id)
    .select(BOOKING_WITH_CUSTOMER_SELECT)
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  return data
})
