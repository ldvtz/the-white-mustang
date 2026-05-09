import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '@@/types/supabase'
import {
  EMAIL_RE,
  isValidBookingUseCase,
  isValidPhone,
  listIsoDateRange,
  validateBookingDates,
} from '@@/shared/booking'

export type PublicBookingBody = {
  useCase?: unknown
  startDate?: unknown
  endDate?: unknown
  firstName?: unknown
  name?: unknown
  email?: unknown
  phone?: unknown
  nationality?: unknown
  age?: unknown
  comment?: unknown
  locale?: unknown
}

const MAX_TEXT_LENGTH = 160

export function parseBookingBody(body: PublicBookingBody) {
  const useCase = body.useCase
  const startDate = requireText(body.startDate, 'Missing start date')
  const endDate = requireText(body.endDate, 'Missing end date')
  const firstName = requireText(body.firstName, 'Missing first name')
  const name = requireText(body.name, 'Missing name')
  const email = requireText(body.email, 'Missing email').toLowerCase()
  const phone = requireText(body.phone, 'Missing phone')
  const nationality = optionalText(body.nationality)
  const age = optionalAge(body.age)
  const comment = optionalLongText(body.comment)
  const locale = parseLocale(body.locale)

  if (!isValidBookingUseCase(useCase)) {
    throw createError({ statusCode: 400, message: 'Invalid booking use case' })
  }

  if (!EMAIL_RE.test(email)) throw createError({ statusCode: 400, message: 'Invalid email' })
  if (!isValidPhone(phone)) throw createError({ statusCode: 400, message: 'Invalid phone' })

  return { useCase, startDate, endDate, firstName, name, email, phone, nationality, age, comment, locale }
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

function optionalLongText(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') throw createError({ statusCode: 400, message: 'Invalid text value' })
  const trimmed = value.trim()
  if (trimmed.length > 500) throw createError({ statusCode: 400, message: 'Comment is too long' })
  return trimmed || null
}

function optionalAge(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 18 || value > 99) {
    throw createError({ statusCode: 400, message: 'Invalid age' })
  }
  return value
}

function parseLocale(value: unknown): 'de' | 'en' {
  return value === 'en' ? 'en' : 'de'
}

async function fetchUnavailableDates(
  supabase: ReturnType<typeof serverSupabaseServiceRole<Database>>,
  startDate: string,
  endDate: string,
): Promise<Set<string>> {
  const [{ data: bookings, error: bookingsError }, { data: blockedDates, error: blockedError }] = await Promise.all([
    supabase
      .from('bookings')
      .select('start_date, end_date, status')
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
  for (const booking of (bookings ?? []).filter((booking) => booking.status !== 'cancelled' && booking.status !== 'declined')) {
    for (const date of listIsoDateRange(booking.start_date, booking.end_date)) {
      unavailableDates.add(date)
    }
  }
  for (const blockedDate of blockedDates ?? []) {
    unavailableDates.add(blockedDate.date)
  }

  return unavailableDates
}
