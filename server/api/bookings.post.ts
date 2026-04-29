import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database, BookingStatus } from '@@/types/supabase'
import { calculateBookingPrice } from '@@/shared/booking'
import { assertDatesAvailable, parseBookingBody, type PublicBookingBody } from '../utils/publicBooking'

type PublicBookingResponse = {
  id: string
  startDate: string
  endDate: string
  totalPrice: number
  status: BookingStatus
}

export default defineEventHandler(async (event): Promise<PublicBookingResponse> => {
  const body = await readBody<PublicBookingBody>(event)
  const parsed = parseBookingBody(body)
  const supabase = serverSupabaseServiceRole<Database>(event)

  await assertDatesAvailable(supabase, parsed.startDate, parsed.endDate)
  const price = calculateBookingPrice(parsed.startDate, parsed.endDate, parsed.useCase)

  if (!price) throw createError({ statusCode: 400, message: 'Invalid booking dates' })

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .upsert({
      email: parsed.email,
      name: parsed.name,
      phone: parsed.phone,
      nationality: parsed.nationality,
      age: parsed.age,
    }, { onConflict: 'email' })
    .select('id')
    .single()

  if (customerError || !customer) {
    throw createError({ statusCode: 500, message: customerError?.message ?? 'Customer could not be saved' })
  }

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      customer_id: customer.id,
      start_date: parsed.startDate,
      end_date: parsed.endDate,
      payment_method: 'deferred',
      total_price: price.total,
      status: 'pending',
      deposit_paid: false,
    })
    .select('id, start_date, end_date, total_price, status')
    .single()

  if (bookingError || !booking) {
    throw createError({ statusCode: 500, message: bookingError?.message ?? 'Booking could not be saved' })
  }

  return {
    id: booking.id,
    startDate: booking.start_date,
    endDate: booking.end_date,
    totalPrice: booking.total_price,
    status: booking.status,
  }
})
