import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '@@/types/supabase'
import type { BookingStatus } from '@@/types/booking'
import { calculateBookingPrice } from '@@/shared/booking'
import { assertDatesAvailable, parseBookingBody, type PublicBookingBody } from '../utils/publicBooking'

type PublicBookingResponse = {
  id: string
  startDate: string
  endDate: string
  totalPrice: number
  status: BookingStatus
  managementUrl: string
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
      total_price: price.total,
      locale: parsed.locale,
    })
    .select('id, start_date, end_date, total_price, status')
    .single()

  if (bookingError || !booking) {
    throw createError({ statusCode: 500, message: bookingError?.message ?? 'Booking could not be saved' })
  }

  const managementToken = createManagementToken()
  const { error: tokenError } = await supabase
    .from('booking_management_tokens')
    .insert({
      booking_id: booking.id,
      token_hash: hashManagementToken(managementToken),
      expires_at: managementTokenExpiry(),
    })

  if (tokenError) throw createError({ statusCode: 500, message: tokenError.message })

  if (parsed.comment) {
    await supabase
      .from('booking_comments')
      .insert({
        booking_id: booking.id,
        author_type: 'customer',
        message: parsed.comment,
        visible_to_customer: true,
      })
  }

  const managementUrl = getManagementUrl(event, managementToken)

  try {
    await sendBookingRequestReceived(
      parsed.email,
      parsed.name,
      booking.start_date,
      booking.end_date,
      booking.total_price,
      managementUrl,
      parsed.locale,
    )
  } catch (error) {
    console.error('Failed to send booking management email', { bookingId: booking.id, error })
  }

  return {
    id: booking.id,
    startDate: booking.start_date,
    endDate: booking.end_date,
    totalPrice: booking.total_price,
    status: booking.status,
    managementUrl,
  }
})
