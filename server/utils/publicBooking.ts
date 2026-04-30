import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '@@/types/supabase'
import {
  isValidPaymentMethod,
  isValidBookingUseCase,
  listIsoDateRange,
  validateBookingDates,
} from '@@/shared/booking'

export type PublicBookingBody = {
  useCase?: unknown
  startDate?: unknown
  endDate?: unknown
  name?: unknown
  email?: unknown
  phone?: unknown
  nationality?: unknown
  age?: unknown
  paymentMethod?: unknown
  locale?: unknown
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_TEXT_LENGTH = 160

export function parseBookingBody(body: PublicBookingBody) {
  const useCase = body.useCase
  const paymentMethod = body.paymentMethod
  const startDate = requireText(body.startDate, 'Missing start date')
  const endDate = requireText(body.endDate, 'Missing end date')
  const name = requireText(body.name, 'Missing name')
  const email = requireText(body.email, 'Missing email').toLowerCase()
  const phone = requireText(body.phone, 'Missing phone')
  const nationality = optionalText(body.nationality)
  const age = optionalAge(body.age)

  if (!isValidBookingUseCase(useCase)) {
    throw createError({ statusCode: 400, message: 'Invalid booking use case' })
  }
  if (!isValidPaymentMethod(paymentMethod)) {
    throw createError({ statusCode: 400, message: 'Invalid payment method' })
  }

  if (!EMAIL_RE.test(email)) throw createError({ statusCode: 400, message: 'Invalid email' })
  if (phone.length < 7) throw createError({ statusCode: 400, message: 'Invalid phone' })

  return { useCase, paymentMethod, startDate, endDate, name, email, phone, nationality, age }
}

export async function assertDatesAvailable(
  supabase: ReturnType<typeof serverSupabaseServiceRole<Database>>,
  startDate: string,
  endDate: string,
): Promise<void> {
  const unavailableDates = await fetchUnavailableDates(supabase, startDate, endDate)
  const dateValidation = validateBookingDates(startDate, endDate, unavailableDates)

  if (!dateValidation.ok) {
    throw createError({ statusCode: 409, message: dateValidation.errorKey })
  }
}

function requireText(value: unknown, message: string): string {
  if (typeof value !== 'string') throw createError({ statusCode: 400, message })
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > MAX_TEXT_LENGTH) throw createError({ statusCode: 400, message })
  return trimmed
}

function optionalText(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') throw createError({ statusCode: 400, message: 'Invalid text value' })
  const trimmed = value.trim()
  if (trimmed.length > MAX_TEXT_LENGTH) throw createError({ statusCode: 400, message: 'Text value is too long' })
  return trimmed || null
}

function optionalAge(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 18 || value > 120) {
    throw createError({ statusCode: 400, message: 'Invalid age' })
  }
  return value
}

async function fetchUnavailableDates(
  supabase: ReturnType<typeof serverSupabaseServiceRole<Database>>,
  startDate: string,
  endDate: string,
): Promise<Set<string>> {
  const [{ data: bookings, error: bookingsError }, { data: blockedDates, error: blockedError }] = await Promise.all([
    supabase
      .from('bookings')
      .select('start_date, end_date')
      .neq('status', 'cancelled')
      .lte('start_date', endDate)
      .gte('end_date', startDate),
    supabase
      .from('blocked_dates')
      .select('date')
      .gte('date', startDate)
      .lte('date', endDate),
  ])

  if (bookingsError) throw createError({ statusCode: 500, message: bookingsError.message })
  if (blockedError) throw createError({ statusCode: 500, message: blockedError.message })

  const unavailableDates = new Set<string>()
  for (const booking of bookings ?? []) {
    for (const date of listIsoDateRange(booking.start_date, booking.end_date)) {
      unavailableDates.add(date)
    }
  }
  for (const blockedDate of blockedDates ?? []) {
    unavailableDates.add(blockedDate.date)
  }

  return unavailableDates
}
